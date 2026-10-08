import Table from '../models/Table.js';
import mongoose from 'mongoose';

/**
 * Service for Restaurant Table Management (Phase 7)
 * Handles multi-tenant scoped table CRUD, capacity checks,
 * duplicate tableNumber enforcement, and valid status transitions.
 */

export const ALLOWED_TABLE_STATUSES = [
  'AVAILABLE',
  'OCCUPIED',
  'RESERVED',
  'BILLING',
  'OUT_OF_SERVICE',
  'CLEANING',
  'UNAVAILABLE',
];

/**
 * Valid state transitions mapping per PRD state diagram:
 * AVAILABLE -> OCCUPIED, RESERVED, OUT_OF_SERVICE, CLEANING
 * OCCUPIED -> BILLING, AVAILABLE
 * RESERVED -> OCCUPIED, AVAILABLE
 * BILLING -> AVAILABLE, CLEANING
 * OUT_OF_SERVICE -> AVAILABLE
 * CLEANING -> AVAILABLE
 */
export const ALLOWED_TRANSITIONS = {
  AVAILABLE: ['OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE', 'CLEANING', 'UNAVAILABLE'],
  OCCUPIED: ['BILLING', 'AVAILABLE'],
  RESERVED: ['OCCUPIED', 'AVAILABLE'],
  BILLING: ['AVAILABLE', 'CLEANING'],
  OUT_OF_SERVICE: ['AVAILABLE'],
  CLEANING: ['AVAILABLE'],
  UNAVAILABLE: ['AVAILABLE'],
};

/**
 * Validates if a transition from currentStatus to nextStatus is allowed
 */
export const isValidStatusTransition = (currentStatus, nextStatus, userRole = null) => {
  if (currentStatus === nextStatus) return true;
  // RESTAURANT_OWNER has administrative override capability if explicitly required
  if (userRole === 'RESTAURANT_OWNER' || userRole === 'PLATFORM_ADMIN') return true;

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowedNext) return false;
  return allowedNext.includes(nextStatus);
};

/**
 * Retrieve all tables for the restaurant tenant with optional filters
 */
export const getTables = async (restaurantId, query = {}) => {
  const filter = { restaurantId };

  if (query.status && query.status !== 'ALL') {
    filter.status = query.status.toUpperCase();
  }

  if (query.section && query.section !== 'ALL') {
    filter.section = query.section;
  }

  if (query.minCapacity) {
    const minCap = parseInt(query.minCapacity, 10);
    if (!isNaN(minCap) && minCap > 0) {
      filter.capacity = { $gte: minCap };
    }
  }

  if (query.isActive !== undefined && query.isActive !== '') {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.search) {
    const cleanSearch = String(query.search).trim();
    if (cleanSearch) {
      filter.tableNumber = { $regex: cleanSearch, $options: 'i' };
    }
  }

  const tables = await Table.find(filter)
    .populate('currentOrderId', 'orderNumber status total')
    .sort({ section: 1, tableNumber: 1 });

  // Calculate high-level status breakdown summary
  const summary = {
    total: tables.length,
    available: tables.filter((t) => t.status === 'AVAILABLE' && t.isActive).length,
    occupied: tables.filter((t) => t.status === 'OCCUPIED' && t.isActive).length,
    reserved: tables.filter((t) => t.status === 'RESERVED' && t.isActive).length,
    billing: tables.filter((t) => t.status === 'BILLING' && t.isActive).length,
    outOfService: tables.filter((t) => (t.status === 'OUT_OF_SERVICE' || t.status === 'UNAVAILABLE') && t.isActive).length,
    deactivated: tables.filter((t) => !t.isActive).length,
  };

  return { tables, summary };
};

/**
 * Retrieve single table by ID with tenant security check
 */
export const getTableById = async (restaurantId, tableId) => {
  if (!mongoose.Types.ObjectId.isValid(tableId)) {
    const error = new Error('Invalid table identifier');
    error.statusCode = 400;
    throw error;
  }

  const table = await Table.findOne({ _id: tableId, restaurantId })
    .populate('currentOrderId', 'orderNumber status total');

  if (!table) {
    const error = new Error('Table not found or belongs to another tenant');
    error.statusCode = 404;
    throw error;
  }

  return table;
};

/**
 * Create a new table for the restaurant tenant
 */
export const createTable = async (restaurantId, data) => {
  const tableNumber = String(data.tableNumber || '').trim();
  const capacity = parseInt(data.capacity, 10);
  const section = String(data.section || 'Main Dining').trim() || 'Main Dining';
  const initialStatus = (data.status || 'AVAILABLE').toUpperCase();

  if (!tableNumber) {
    const error = new Error('Table number or label is required');
    error.statusCode = 400;
    throw error;
  }

  if (isNaN(capacity) || capacity < 1) {
    const error = new Error('Table capacity must be a positive number of at least 1 seat');
    error.statusCode = 400;
    throw error;
  }

  if (!ALLOWED_TABLE_STATUSES.includes(initialStatus)) {
    const error = new Error(`Invalid table status. Allowed: ${ALLOWED_TABLE_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  // Check unique table number within this restaurant
  const existing = await Table.findOne({
    restaurantId,
    tableNumber: { $regex: new RegExp(`^${tableNumber}$`, 'i') },
  });

  if (existing) {
    const error = new Error(`Table "${tableNumber}" already exists in this restaurant`);
    error.statusCode = 409;
    throw error;
  }

  const newTable = await Table.create({
    restaurantId,
    tableNumber,
    capacity,
    section,
    status: initialStatus,
    isActive: data.isActive !== false,
  });

  return newTable;
};

/**
 * Update table specifications (tableNumber, capacity, section, isActive)
 */
export const updateTable = async (restaurantId, tableId, updateData) => {
  const table = await getTableById(restaurantId, tableId);

  // If table number is changing, verify unique constraint in tenant
  if (updateData.tableNumber) {
    const newTableNumber = String(updateData.tableNumber).trim();
    if (!newTableNumber) {
      const error = new Error('Table number cannot be empty');
      error.statusCode = 400;
      throw error;
    }

    if (newTableNumber.toLowerCase() !== table.tableNumber.toLowerCase()) {
      const existing = await Table.findOne({
        restaurantId,
        _id: { $ne: tableId },
        tableNumber: { $regex: new RegExp(`^${newTableNumber}$`, 'i') },
      });
      if (existing) {
        const error = new Error(`Table "${newTableNumber}" already exists in this restaurant`);
        error.statusCode = 409;
        throw error;
      }
      table.tableNumber = newTableNumber;
    }
  }

  if (updateData.capacity !== undefined) {
    const cap = parseInt(updateData.capacity, 10);
    if (isNaN(cap) || cap < 1) {
      const error = new Error('Table capacity must be at least 1 seat');
      error.statusCode = 400;
      throw error;
    }
    table.capacity = cap;
  }

  if (updateData.section !== undefined) {
    table.section = String(updateData.section).trim() || 'Main Dining';
  }

  if (updateData.isActive !== undefined) {
    const nextIsActive = updateData.isActive === true || updateData.isActive === 'true';
    if (!nextIsActive && (table.status === 'OCCUPIED' || table.status === 'BILLING')) {
      const error = new Error(`Cannot deactivate table ${table.tableNumber} while it is ${table.status}`);
      error.statusCode = 400;
      throw error;
    }
    table.isActive = nextIsActive;
  }

  if (updateData.status) {
    const targetStatus = String(updateData.status).toUpperCase();
    if (!ALLOWED_TABLE_STATUSES.includes(targetStatus)) {
      const error = new Error(`Invalid status: ${targetStatus}`);
      error.statusCode = 400;
      throw error;
    }
    table.status = targetStatus;
  }

  await table.save();
  return table;
};

/**
 * Update table operational status with transition validation
 */
export const updateTableStatus = async (restaurantId, tableId, newStatus, userRole = null) => {
  const table = await getTableById(restaurantId, tableId);
  const normalizedStatus = String(newStatus || '').toUpperCase();

  if (!ALLOWED_TABLE_STATUSES.includes(normalizedStatus)) {
    const error = new Error(
      `Status "${newStatus}" is invalid. Allowed: ${ALLOWED_TABLE_STATUSES.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  // Validate state transitions
  const validTransition = isValidStatusTransition(table.status, normalizedStatus, userRole);
  if (!validTransition) {
    const allowed = ALLOWED_TRANSITIONS[table.status] || [];
    const error = new Error(
      `Invalid state transition: Cannot change table ${table.tableNumber} from ${table.status} to ${normalizedStatus}. Allowed next states: ${allowed.join(', ') || 'None'}`
    );
    error.statusCode = 400;
    throw error;
  }

  table.status = normalizedStatus;
  if (normalizedStatus === 'AVAILABLE') {
    table.currentOrderId = null;
  }

  await table.save();
  return table;
};

/**
 * Delete or deactivate table
 */
export const deleteTable = async (restaurantId, tableId, forceHardDelete = false) => {
  const table = await getTableById(restaurantId, tableId);

  if (table.status === 'OCCUPIED' || table.status === 'BILLING') {
    const error = new Error(`Cannot remove table ${table.tableNumber} while active customers are seated or billing`);
    error.statusCode = 400;
    throw error;
  }

  if (forceHardDelete) {
    await Table.deleteOne({ _id: tableId, restaurantId });
    return { deleted: true, tableId, mode: 'hard' };
  }

  // Deactivate table (soft delete)
  table.isActive = false;
  table.status = 'OUT_OF_SERVICE';
  await table.save();

  return { deleted: true, tableId, mode: 'soft', table };
};
