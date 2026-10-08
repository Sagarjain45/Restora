import QueueEntry from '../models/QueueEntry.js';
import Table from '../models/Table.js';
import { scopeFilter, assertTenantOwnership } from './tenantService.js';

/**
 * Re-indexes FIFO queue positions for active parties (WAITING and NOTIFIED)
 * in a given restaurant.
 */
const recalculatePositions = async (tenantId) => {
  const activeEntries = await QueueEntry.find({
    restaurantId: tenantId,
    status: { $in: ['WAITING', 'NOTIFIED'] },
  }).sort({ arrivalTime: 1, createdAt: 1 });

  const bulkOps = activeEntries.map((entry, index) => ({
    updateOne: {
      filter: { _id: entry._id },
      update: { $set: { position: index + 1 } },
    },
  }));

  if (bulkOps.length > 0) {
    await QueueEntry.bulkWrite(bulkOps);
  }
};

/**
 * Add a customer / party to the waiting queue.
 */
export const addToQueue = async (tenantId, queueData) => {
  const { customerName, customerPhone, guestCount, notes, customerId } = queueData;

  if (!customerName || !customerPhone || !guestCount) {
    const error = new Error('Customer name, phone number, and guest count are required.');
    error.statusCode = 400;
    throw error;
  }

  const parsedGuestCount = parseInt(guestCount, 10);
  if (isNaN(parsedGuestCount) || parsedGuestCount < 1) {
    const error = new Error('Guest count must be at least 1.');
    error.statusCode = 400;
    throw error;
  }

  // Count current waiting entries to establish initial FIFO position
  const activeCount = await QueueEntry.countDocuments({
    restaurantId: tenantId,
    status: { $in: ['WAITING', 'NOTIFIED'] },
  });

  const position = activeCount + 1;

  // Approximate wait time: ~10 minutes per party ahead
  const estimatedWaitMinutes = position * 10;

  const newEntry = new QueueEntry({
    restaurantId: tenantId,
    customerId: customerId || null,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    guestCount: parsedGuestCount,
    arrivalTime: new Date(),
    position,
    estimatedWaitMinutes,
    status: 'WAITING',
    notes: notes ? notes.trim() : '',
  });

  await newEntry.save();
  return newEntry;
};

/**
 * Get queue list with optional status filters and search.
 */
export const getQueue = async (tenantId, params = {}) => {
  const query = { restaurantId: tenantId };

  if (params.activeOnly === 'true' || params.activeOnly === true) {
    query.status = { $in: ['WAITING', 'NOTIFIED'] };
  } else if (params.status && params.status !== 'ALL') {
    query.status = params.status;
  }

  if (params.search) {
    const searchRegex = new RegExp(params.search.trim(), 'i');
    query.$or = [
      { customerName: searchRegex },
      { customerPhone: searchRegex },
      { notes: searchRegex },
    ];
  }

  const entries = await QueueEntry.find(query)
    .populate('assignedTableId', 'tableNumber capacity section status')
    .sort({
      // Active parties ordered by FIFO arrivalTime; historical ordered by most recent
      arrivalTime: query.status && ['SEATED', 'CANCELLED', 'NO_SHOW'].includes(query.status) ? -1 : 1,
      createdAt: 1,
    });

  return entries;
};

/**
 * Get a specific queue entry by ID.
 */
export const getQueueEntryById = async (tenantId, entryId) => {
  const entry = await QueueEntry.findOne({
    _id: entryId,
    restaurantId: tenantId,
  }).populate('assignedTableId', 'tableNumber capacity section status');

  if (!entry) {
    const error = new Error('Queue entry not found.');
    error.statusCode = 404;
    throw error;
  }

  return entry;
};

/**
 * Update general status for a queue entry (NOTIFIED, CANCELLED, NO_SHOW).
 */
export const updateQueueStatus = async (tenantId, entryId, newStatus, extraData = {}) => {
  const validStatuses = ['WAITING', 'NOTIFIED', 'CANCELLED', 'NO_SHOW'];
  if (!validStatuses.includes(newStatus)) {
    const error = new Error(`Invalid status transition to ${newStatus}. Use seatCustomer to seat.`);
    error.statusCode = 400;
    throw error;
  }

  const entry = await QueueEntry.findOne({
    _id: entryId,
    restaurantId: tenantId,
  });

  if (!entry) {
    const error = new Error('Queue entry not found.');
    error.statusCode = 404;
    throw error;
  }

  if (entry.status === 'SEATED') {
    const error = new Error('Cannot change status of an already seated customer.');
    error.statusCode = 400;
    throw error;
  }

  entry.status = newStatus;

  if (newStatus === 'NOTIFIED') {
    entry.notifiedAt = new Date();
  }

  if (extraData.notes) {
    entry.notes = extraData.notes;
  }

  await entry.save();

  // If entry transitioned out of active queue, re-index positions
  if (['CANCELLED', 'NO_SHOW'].includes(newStatus)) {
    await recalculatePositions(tenantId);
  }

  return entry;
};

/**
 * Seat customer at a specific table:
 * - Checks table capacity against customer party size.
 * - Transitions table status to OCCUPIED.
 * - Updates queue entry status to SEATED and records assignedTableId & seatedAt.
 * - Recalculates remaining queue positions.
 */
export const seatCustomer = async (tenantId, entryId, tableId) => {
  if (!tableId) {
    const error = new Error('A table ID must be selected to seat the customer.');
    error.statusCode = 400;
    throw error;
  }

  const [entry, table] = await Promise.all([
    QueueEntry.findOne({ _id: entryId, restaurantId: tenantId }),
    Table.findOne({ _id: tableId, restaurantId: tenantId }),
  ]);

  if (!entry) {
    const error = new Error('Queue entry not found.');
    error.statusCode = 404;
    throw error;
  }

  if (entry.status === 'SEATED') {
    const error = new Error('Customer is already marked as seated.');
    error.statusCode = 400;
    throw error;
  }

  if (['CANCELLED', 'NO_SHOW'].includes(entry.status)) {
    const error = new Error(`Cannot seat a customer whose queue status is ${entry.status}.`);
    error.statusCode = 400;
    throw error;
  }

  if (!table) {
    const error = new Error('Table not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!table.isActive) {
    const error = new Error(`Table ${table.tableNumber} is currently inactive.`);
    error.statusCode = 400;
    throw error;
  }

  // Capacity check: Table capacity must accommodate guest count
  if (table.capacity < entry.guestCount) {
    const error = new Error(
      `Table ${table.tableNumber} capacity (${table.capacity}) is less than party size (${entry.guestCount}).`
    );
    error.statusCode = 400;
    throw error;
  }

  // Assign table and seat customer
  table.status = 'OCCUPIED';
  await table.save();

  entry.status = 'SEATED';
  entry.assignedTableId = table._id;
  entry.seatedAt = new Date();
  await entry.save();

  // Recalculate FIFO positions for remaining active parties
  await recalculatePositions(tenantId);

  return {
    queueEntry: entry,
    table,
  };
};

/**
 * Find suitable tables for a given waiting party based on capacity and status.
 */
export const getSuitableTablesForParty = async (tenantId, entryId) => {
  const entry = await QueueEntry.findOne({ _id: entryId, restaurantId: tenantId });
  if (!entry) {
    const error = new Error('Queue entry not found.');
    error.statusCode = 404;
    throw error;
  }

  // Find all active tables with capacity >= party size
  const tables = await Table.find({
    restaurantId: tenantId,
    isActive: true,
    capacity: { $gte: entry.guestCount },
  }).sort({ capacity: 1, tableNumber: 1 });

  // Categorize by available vs currently occupied
  const availableTables = tables.filter((t) => t.status === 'AVAILABLE');
  const occupiedTables = tables.filter((t) => t.status !== 'AVAILABLE');

  return {
    party: {
      id: entry._id,
      customerName: entry.customerName,
      guestCount: entry.guestCount,
      position: entry.position,
      arrivalTime: entry.arrivalTime,
    },
    suitableTables: tables,
    availableTables,
    occupiedTables,
  };
};

/**
 * When a table is or becomes available, find the best matching waiting party (FIFO).
 */
export const suggestQueuePartyForTable = async (tenantId, tableId) => {
  const table = await Table.findOne({ _id: tableId, restaurantId: tenantId });
  if (!table) {
    const error = new Error('Table not found.');
    error.statusCode = 404;
    throw error;
  }

  // Find active waiting parties whose guestCount fits within table capacity
  const matchingParties = await QueueEntry.find({
    restaurantId: tenantId,
    status: { $in: ['WAITING', 'NOTIFIED'] },
    guestCount: { $lte: table.capacity },
  }).sort({ arrivalTime: 1, createdAt: 1 });

  const bestMatch = matchingParties.length > 0 ? matchingParties[0] : null;

  return {
    table: {
      id: table._id,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      section: table.section,
      status: table.status,
    },
    bestMatch,
    totalEligibleParties: matchingParties.length,
    eligibleParties: matchingParties,
  };
};

/**
 * Get waiting queue summary & metrics for dashboard.
 */
export const getQueueSummary = async (tenantId) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [waitingCount, notifiedCount, seatedTodayCount, totalWaitingGuests] = await Promise.all([
    QueueEntry.countDocuments({ restaurantId: tenantId, status: 'WAITING' }),
    QueueEntry.countDocuments({ restaurantId: tenantId, status: 'NOTIFIED' }),
    QueueEntry.countDocuments({
      restaurantId: tenantId,
      status: 'SEATED',
      seatedAt: { $gte: todayStart },
    }),
    QueueEntry.aggregate([
      { $match: { restaurantId: tenantId, status: { $in: ['WAITING', 'NOTIFIED'] } } },
      { $group: { _id: null, totalGuests: { $sum: '$guestCount' } } },
    ]),
  ]);

  return {
    waitingParties: waitingCount,
    notifiedParties: notifiedCount,
    activeTotal: waitingCount + notifiedCount,
    seatedToday: seatedTodayCount,
    totalWaitingGuests: totalWaitingGuests[0]?.totalGuests || 0,
  };
};
