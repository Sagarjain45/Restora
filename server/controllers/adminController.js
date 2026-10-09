import * as adminService from '../services/adminService.js';

/**
 * Controller handling Platform Admin REST API endpoints
 */

export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({
      success: true,
      message: 'Platform statistics retrieved',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplications = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const applications = await adminService.getApplications({ status, search });
    res.status(200).json({
      success: true,
      message: `Retrieved ${applications.length} restaurant applications`,
      data: {
        count: applications.length,
        applications,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (req, res, next) => {
  try {
    const application = await adminService.getApplicationById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Restaurant application details retrieved',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

export const submitApplication = async (req, res, next) => {
  try {
    const application = await adminService.submitApplication(req.body);
    res.status(201).json({
      success: true,
      message: 'Restaurant onboarding application submitted successfully. Pending platform admin review.',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationStatus = async (req, res, next) => {
  try {
    const { email, id } = req.query;
    const statusData = await adminService.getApplicationStatus({ email, applicationId: id });
    res.status(200).json({
      success: true,
      message: 'Application status retrieved successfully',
      data: statusData,
    });
  } catch (error) {
    next(error);
  }
};

export const approveApplication = async (req, res, next) => {
  try {
    const reviewerId = req.user.id;
    const { subscriptionPlan, temporaryPassword } = req.body;
    const result = await adminService.approveApplication(req.params.id, reviewerId, {
      subscriptionPlan,
      temporaryPassword,
    });

    res.status(200).json({
      success: true,
      message: `Application for "${result.restaurant.name}" has been approved. Tenant and Owner account are now active.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectApplication = async (req, res, next) => {
  try {
    const reviewerId = req.user.id;
    const { reason } = req.body;
    const application = await adminService.rejectApplication(req.params.id, reviewerId, reason);

    res.status(200).json({
      success: true,
      message: `Application has been marked as REJECTED.`,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

export const getRestaurants = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const restaurants = await adminService.getRestaurants({ status, search });

    res.status(200).json({
      success: true,
      message: `Retrieved ${restaurants.length} restaurants`,
      data: {
        count: restaurants.length,
        restaurants,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantDetails = async (req, res, next) => {
  try {
    const result = await adminService.getRestaurantDetails(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Restaurant tenant details and operational metrics retrieved',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRestaurantStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status field is required (ACTIVE, SUSPENDED, INACTIVE).',
        code: 'VALIDATION_ERROR',
      });
    }

    const updated = await adminService.updateRestaurantStatus(req.params.id, status);

    res.status(200).json({
      success: true,
      message: `Restaurant status updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const seedApplications = async (req, res, next) => {
  try {
    const result = await adminService.seedSampleApplications();
    res.status(200).json({
      success: true,
      message: 'Sample applications initialization status',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
