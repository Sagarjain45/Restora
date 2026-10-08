import * as tableService from '../services/tableService.js';

/**
 * Controller for Restaurant Table Operations (Phase 7)
 */

export const getTables = async (req, res, next) => {
  try {
    const { tables, summary } = await tableService.getTables(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      message: 'Tables retrieved successfully',
      count: tables.length,
      summary,
      data: tables,
    });
  } catch (error) {
    next(error);
  }
};

export const getTable = async (req, res, next) => {
  try {
    const table = await tableService.getTableById(req.tenantId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Table retrieved successfully',
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

export const createTable = async (req, res, next) => {
  try {
    const table = await tableService.createTable(req.tenantId, req.body);
    res.status(201).json({
      success: true,
      message: `Table ${table.tableNumber} created successfully`,
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTable = async (req, res, next) => {
  try {
    const table = await tableService.updateTable(req.tenantId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: `Table ${table.tableNumber} updated successfully`,
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTableStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const table = await tableService.updateTableStatus(
      req.tenantId,
      req.params.id,
      status,
      req.user?.role
    );
    res.status(200).json({
      success: true,
      message: `Table ${table.tableNumber} status updated to ${table.status}`,
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTable = async (req, res, next) => {
  try {
    const force = req.query.force === 'true';
    const result = await tableService.deleteTable(req.tenantId, req.params.id, force);
    res.status(200).json({
      success: true,
      message: result.mode === 'hard' ? 'Table permanently removed' : 'Table deactivated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
