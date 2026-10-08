import * as reportService from '../services/reportService.js';

/**
 * Controller for Order History & Reports (Phase 15: Order History and Reports)
 */

export const getOrderHistory = async (req, res, next) => {
  try {
    const result = await reportService.getOrderHistory(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
      summary: result.summary,
    });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantReports = async (req, res, next) => {
  try {
    const reports = await reportService.getRestaurantReports(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

export const getPlatformReports = async (req, res, next) => {
  try {
    const reports = await reportService.getPlatformReports(req.query);
    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};
