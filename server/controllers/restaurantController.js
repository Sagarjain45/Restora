import * as restaurantService from '../services/restaurantService.js';

/**
 * Controller handling restaurant tenant operations & dashboard data
 */

export const getMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.getRestaurantProfile(req.tenantId);
    res.status(200).json({
      success: true,
      message: 'Restaurant tenant profile retrieved',
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const updated = await restaurantService.updateRestaurantProfile(req.tenantId, req.body);
    res.status(200).json({
      success: true,
      message: 'Restaurant profile updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOpeningHours = async (req, res, next) => {
  try {
    const { openingHours } = req.body;
    const updated = await restaurantService.updateOpeningHours(req.tenantId, openingHours);
    res.status(200).json({
      success: true,
      message: 'Opening hours updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const updated = await restaurantService.updateRestaurantSettings(req.tenantId, req.body);
    res.status(200).json({
      success: true,
      message: 'Restaurant operational settings updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleOpenStatus = async (req, res, next) => {
  try {
    const { isOpenNow } = req.body;
    const result = await restaurantService.toggleOpenStatus(req.tenantId, isOpenNow);
    res.status(200).json({
      success: true,
      message: `Dining status updated: Restaurant is now ${result.isOpenNow ? 'OPEN' : 'CLOSED'}.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await restaurantService.getRestaurantDashboardMetrics(req.tenantId);
    res.status(200).json({
      success: true,
      message: 'Restaurant operational dashboard metrics retrieved',
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};
