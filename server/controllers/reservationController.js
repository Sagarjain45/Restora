import * as reservationService from '../services/reservationService.js';

export const createReservation = async (req, res, next) => {
  try {
    const reservation = await reservationService.createReservation(req.tenantId, req.body);
    res.status(201).json({
      success: true,
      message: 'Reservation created successfully.',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};

export const getReservations = async (req, res, next) => {
  try {
    const reservations = await reservationService.getReservations(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
};

export const getReservation = async (req, res, next) => {
  try {
    const reservation = await reservationService.getReservationById(req.tenantId, req.params.id);
    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReservation = async (req, res, next) => {
  try {
    const updated = await reservationService.updateReservation(
      req.tenantId,
      req.params.id,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Reservation updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const updated = await reservationService.updateReservationStatus(
      req.tenantId,
      req.params.id,
      status,
      { notes }
    );
    res.status(200).json({
      success: true,
      message: `Reservation status updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const seatReservation = async (req, res, next) => {
  try {
    const { tableId } = req.body;
    const result = await reservationService.seatReservation(
      req.tenantId,
      req.params.id,
      tableId
    );
    res.status(200).json({
      success: true,
      message: 'Reservation guests seated at table successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const checkAvailableTables = async (req, res, next) => {
  try {
    const { date, startTime, endTime, guestCount } = req.query;
    const result = await reservationService.getAvailableTablesForSlot(
      req.tenantId,
      date,
      startTime,
      endTime,
      guestCount
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSummary = async (req, res, next) => {
  try {
    const { date } = req.query;
    const summary = await reservationService.getReservationSummary(req.tenantId, date);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
