import Reservation from '../models/Reservation.js';
import Table from '../models/Table.js';

/**
 * Converts "HH:mm" time string to minutes from midnight.
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

/**
 * Converts minutes from midnight to "HH:mm" format.
 */
export const minutesToTime = (totalMinutes) => {
  const normalized = Math.max(0, Math.min(1439, totalMinutes));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/**
 * Calculates a default end time 90 minutes after the start time.
 */
export const calculateDefaultEndTime = (startTimeStr, durationMinutes = 90) => {
  const startMins = timeToMinutes(startTimeStr);
  const endMins = Math.min(1439, startMins + durationMinutes);
  return minutesToTime(endMins);
};

/**
 * Checks if a proposed reservation time conflicts with an existing reservation
 * on the same table, on the same date, in the same restaurant.
 */
export const checkReservationConflict = async (
  tenantId,
  tableId,
  date,
  startTime,
  endTime,
  excludeReservationId = null
) => {
  if (!tableId) return { conflict: false };

  const query = {
    restaurantId: tenantId,
    tableId,
    date,
    status: { $in: ['PENDING', 'CONFIRMED', 'ARRIVED', 'SEATED'] },
  };

  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }

  const existingReservations = await Reservation.find(query);

  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime || calculateDefaultEndTime(startTime));

  for (const res of existingReservations) {
    const resStart = timeToMinutes(res.startTime);
    const resEnd = timeToMinutes(res.endTime || calculateDefaultEndTime(res.startTime));

    // Overlap condition: newStart < resEnd && resStart < newEnd
    if (newStart < resEnd && resStart < newEnd) {
      return {
        conflict: true,
        conflictingReservation: res,
      };
    }
  }

  return { conflict: false };
};

/**
 * Create a new table reservation with conflict detection.
 */
export const createReservation = async (tenantId, reservationData) => {
  const {
    customerName,
    customerPhone,
    customerEmail,
    customerId,
    guestCount,
    date,
    startTime,
    endTime,
    tableId,
    notes,
    status,
  } = reservationData;

  if (!customerName || !customerPhone || !guestCount || !date || !startTime) {
    const error = new Error('Customer name, phone, guest count, date, and start time are required.');
    error.statusCode = 400;
    throw error;
  }

  const parsedGuestCount = parseInt(guestCount, 10);
  if (isNaN(parsedGuestCount) || parsedGuestCount < 1) {
    const error = new Error('Guest count must be at least 1.');
    error.statusCode = 400;
    throw error;
  }

  const finalEndTime = endTime ? endTime.trim() : calculateDefaultEndTime(startTime);

  // If table is assigned, validate capacity & detect conflicts
  if (tableId) {
    const table = await Table.findOne({ _id: tableId, restaurantId: tenantId });
    if (!table) {
      const error = new Error('Assigned table was not found.');
      error.statusCode = 404;
      throw error;
    }

    if (!table.isActive) {
      const error = new Error(`Table ${table.tableNumber} is currently inactive.`);
      error.statusCode = 400;
      throw error;
    }

    if (table.capacity < parsedGuestCount) {
      const error = new Error(
        `Table ${table.tableNumber} capacity (${table.capacity}) is too small for ${parsedGuestCount} guests.`
      );
      error.statusCode = 400;
      throw error;
    }

    const conflictResult = await checkReservationConflict(
      tenantId,
      tableId,
      date,
      startTime,
      finalEndTime
    );

    if (conflictResult.conflict) {
      const error = new Error(
        `Time slot conflict: Table ${table.tableNumber} is already reserved between ${conflictResult.conflictingReservation.startTime} and ${conflictResult.conflictingReservation.endTime || 'end'}.`
      );
      error.statusCode = 409;
      error.details = conflictResult.conflictingReservation;
      throw error;
    }
  }

  const newReservation = new Reservation({
    restaurantId: tenantId,
    customerId: customerId || null,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : null,
    tableId: tableId || null,
    guestCount: parsedGuestCount,
    date: date.trim(),
    startTime: startTime.trim(),
    endTime: finalEndTime,
    status: status || 'CONFIRMED',
    notes: notes ? notes.trim() : '',
  });

  await newReservation.save();
  return newReservation;
};

/**
 * Retrieve reservations with filters (date, status, table, search).
 */
export const getReservations = async (tenantId, params = {}) => {
  const query = { restaurantId: tenantId };

  if (params.date) {
    query.date = params.date;
  }

  if (params.status && params.status !== 'ALL') {
    query.status = params.status;
  }

  if (params.tableId) {
    query.tableId = params.tableId;
  }

  if (params.search) {
    const searchRegex = new RegExp(params.search.trim(), 'i');
    query.$or = [
      { customerName: searchRegex },
      { customerPhone: searchRegex },
      { customerEmail: searchRegex },
      { notes: searchRegex },
    ];
  }

  const reservations = await Reservation.find(query)
    .populate('tableId', 'tableNumber capacity section status')
    .sort({ date: 1, startTime: 1, createdAt: 1 });

  return reservations;
};

/**
 * Get a specific reservation by ID.
 */
export const getReservationById = async (tenantId, reservationId) => {
  const reservation = await Reservation.findOne({
    _id: reservationId,
    restaurantId: tenantId,
  }).populate('tableId', 'tableNumber capacity section status');

  if (!reservation) {
    const error = new Error('Reservation not found.');
    error.statusCode = 404;
    throw error;
  }

  return reservation;
};

/**
 * Edit an existing reservation with conflict check.
 */
export const updateReservation = async (tenantId, reservationId, updateData) => {
  const reservation = await Reservation.findOne({
    _id: reservationId,
    restaurantId: tenantId,
  });

  if (!reservation) {
    const error = new Error('Reservation not found.');
    error.statusCode = 404;
    throw error;
  }

  const targetTableId = updateData.tableId !== undefined ? updateData.tableId : reservation.tableId;
  const targetDate = updateData.date || reservation.date;
  const targetStart = updateData.startTime || reservation.startTime;
  const targetEnd = updateData.endTime || reservation.endTime || calculateDefaultEndTime(targetStart);
  const targetGuestCount = updateData.guestCount ? parseInt(updateData.guestCount, 10) : reservation.guestCount;

  // If table assignment or time window changed, re-validate
  if (targetTableId) {
    const table = await Table.findOne({ _id: targetTableId, restaurantId: tenantId });
    if (!table) {
      const error = new Error('Selected table not found.');
      error.statusCode = 404;
      throw error;
    }

    if (table.capacity < targetGuestCount) {
      const error = new Error(
        `Table ${table.tableNumber} capacity (${table.capacity}) is less than guest count (${targetGuestCount}).`
      );
      error.statusCode = 400;
      throw error;
    }

    const conflictResult = await checkReservationConflict(
      tenantId,
      targetTableId,
      targetDate,
      targetStart,
      targetEnd,
      reservationId
    );

    if (conflictResult.conflict) {
      const error = new Error(
        `Time conflict: Table ${table.tableNumber} is already booked between ${conflictResult.conflictingReservation.startTime} and ${conflictResult.conflictingReservation.endTime || 'end'}.`
      );
      error.statusCode = 409;
      throw error;
    }
  }

  if (updateData.customerName) reservation.customerName = updateData.customerName.trim();
  if (updateData.customerPhone) reservation.customerPhone = updateData.customerPhone.trim();
  if (updateData.customerEmail !== undefined) {
    reservation.customerEmail = updateData.customerEmail ? updateData.customerEmail.trim().toLowerCase() : null;
  }
  if (updateData.guestCount) reservation.guestCount = targetGuestCount;
  if (updateData.date) reservation.date = targetDate;
  if (updateData.startTime) reservation.startTime = targetStart;
  if (updateData.endTime !== undefined) reservation.endTime = targetEnd;
  if (updateData.tableId !== undefined) reservation.tableId = targetTableId;
  if (updateData.notes !== undefined) reservation.notes = updateData.notes.trim();

  await reservation.save();
  return reservation;
};

/**
 * Update reservation lifecycle status (CONFIRMED, ARRIVED, CANCELLED, NO_SHOW, COMPLETED).
 */
export const updateReservationStatus = async (tenantId, reservationId, newStatus, extraData = {}) => {
  const validStatuses = ['PENDING', 'CONFIRMED', 'ARRIVED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  if (!validStatuses.includes(newStatus)) {
    const error = new Error(`Invalid reservation status: ${newStatus}`);
    error.statusCode = 400;
    throw error;
  }

  const reservation = await Reservation.findOne({
    _id: reservationId,
    restaurantId: tenantId,
  });

  if (!reservation) {
    const error = new Error('Reservation not found.');
    error.statusCode = 404;
    throw error;
  }

  reservation.status = newStatus;

  if (newStatus === 'ARRIVED') {
    reservation.arrivedAt = new Date();
  } else if (newStatus === 'SEATED') {
    reservation.seatedAt = new Date();
  } else if (newStatus === 'COMPLETED') {
    reservation.completedAt = new Date();
  }

  if (extraData.notes) {
    reservation.notes = extraData.notes;
  }

  await reservation.save();
  return reservation;
};

/**
 * Seat reservation guest and occupy assigned table.
 */
export const seatReservation = async (tenantId, reservationId, tableIdToAssign = null) => {
  const reservation = await Reservation.findOne({
    _id: reservationId,
    restaurantId: tenantId,
  });

  if (!reservation) {
    const error = new Error('Reservation not found.');
    error.statusCode = 404;
    throw error;
  }

  const effectiveTableId = tableIdToAssign || reservation.tableId;
  if (!effectiveTableId) {
    const error = new Error('A table must be assigned to seat this reservation.');
    error.statusCode = 400;
    throw error;
  }

  const table = await Table.findOne({ _id: effectiveTableId, restaurantId: tenantId });
  if (!table) {
    const error = new Error('Table not found.');
    error.statusCode = 404;
    throw error;
  }

  if (table.capacity < reservation.guestCount) {
    const error = new Error(
      `Table ${table.tableNumber} capacity (${table.capacity}) is too small for ${reservation.guestCount} guests.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Update table to OCCUPIED
  table.status = 'OCCUPIED';
  await table.save();

  reservation.tableId = table._id;
  reservation.status = 'SEATED';
  reservation.seatedAt = new Date();
  await reservation.save();

  return {
    reservation,
    table,
  };
};

/**
 * Query available tables for a prospective reservation time slot.
 */
export const getAvailableTablesForSlot = async (tenantId, date, startTime, endTime, guestCount) => {
  if (!date || !startTime) {
    const error = new Error('Date and start time are required to check table availability.');
    error.statusCode = 400;
    throw error;
  }

  const count = parseInt(guestCount || 1, 10);
  const end = endTime || calculateDefaultEndTime(startTime);

  // Find all active tables suitable for capacity
  const tables = await Table.find({
    restaurantId: tenantId,
    isActive: true,
    capacity: { $gte: count },
  }).sort({ capacity: 1, tableNumber: 1 });

  const available = [];
  const booked = [];

  for (const tbl of tables) {
    const conflict = await checkReservationConflict(tenantId, tbl._id, date, startTime, end);
    if (conflict.conflict) {
      booked.push({
        table: tbl,
        conflictWith: conflict.conflictingReservation,
      });
    } else {
      available.push(tbl);
    }
  }

  return {
    date,
    startTime,
    endTime: end,
    guestCount: count,
    availableTables: available,
    bookedTables: booked,
  };
};

/**
 * Reservation summary for dashboard & header metrics.
 */
export const getReservationSummary = async (tenantId, dateFilter = null) => {
  const query = { restaurantId: tenantId };
  if (dateFilter) {
    query.date = dateFilter;
  }

  const [totalCount, confirmedCount, arrivedCount, seatedCount, pendingCount] = await Promise.all([
    Reservation.countDocuments(query),
    Reservation.countDocuments({ ...query, status: 'CONFIRMED' }),
    Reservation.countDocuments({ ...query, status: 'ARRIVED' }),
    Reservation.countDocuments({ ...query, status: 'SEATED' }),
    Reservation.countDocuments({ ...query, status: 'PENDING' }),
  ]);

  return {
    total: totalCount,
    confirmed: confirmedCount,
    arrived: arrivedCount,
    seated: seatedCount,
    pending: pendingCount,
    date: dateFilter || 'All',
  };
};
