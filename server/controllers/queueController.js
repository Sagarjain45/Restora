import * as queueService from '../services/queueService.js';

export const addToQueue = async (req, res, next) => {
  try {
    const queueEntry = await queueService.addToQueue(req.tenantId, req.body);
    res.status(201).json({
      success: true,
      message: 'Party added to waiting queue successfully.',
      data: queueEntry,
    });
  } catch (error) {
    next(error);
  }
};

export const getQueue = async (req, res, next) => {
  try {
    const queue = await queueService.getQueue(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      count: queue.length,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
};

export const getQueueEntry = async (req, res, next) => {
  try {
    const queueEntry = await queueService.getQueueEntryById(req.tenantId, req.params.id);
    res.status(200).json({
      success: true,
      data: queueEntry,
    });
  } catch (error) {
    next(error);
  }
};

export const updateQueueStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const updated = await queueService.updateQueueStatus(
      req.tenantId,
      req.params.id,
      status,
      { notes }
    );
    res.status(200).json({
      success: true,
      message: `Queue entry status updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const seatCustomer = async (req, res, next) => {
  try {
    const { tableId } = req.body;
    const result = await queueService.seatCustomer(req.tenantId, req.params.id, tableId);
    res.status(200).json({
      success: true,
      message: 'Customer seated successfully at table.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const notifyParty = async (req, res, next) => {
  try {
    const updated = await queueService.updateQueueStatus(
      req.tenantId,
      req.params.id,
      'NOTIFIED',
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Party notified for table availability.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelQueueEntry = async (req, res, next) => {
  try {
    const updated = await queueService.updateQueueStatus(
      req.tenantId,
      req.params.id,
      'CANCELLED',
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Party removed from queue (cancelled).',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const markNoShow = async (req, res, next) => {
  try {
    const updated = await queueService.updateQueueStatus(
      req.tenantId,
      req.params.id,
      'NO_SHOW',
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Party marked as no-show.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getSuitableTables = async (req, res, next) => {
  try {
    const suggestions = await queueService.getSuitableTablesForParty(req.tenantId, req.params.id);
    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};

export const suggestPartyForTable = async (req, res, next) => {
  try {
    const suggestion = await queueService.suggestQueuePartyForTable(
      req.tenantId,
      req.params.tableId
    );
    res.status(200).json({
      success: true,
      data: suggestion,
    });
  } catch (error) {
    next(error);
  }
};

export const getSummary = async (req, res, next) => {
  try {
    const summary = await queueService.getQueueSummary(req.tenantId);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
