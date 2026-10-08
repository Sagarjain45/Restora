import * as menuService from '../services/menuService.js';

/**
 * Controller for Restaurant Menu Operations (Phase 8)
 */

export const getMenuItems = async (req, res, next) => {
  try {
    const { items, summary } = await menuService.getMenuItems(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      message: 'Menu items retrieved successfully',
      count: items.length,
      summary,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const getMenuItem = async (req, res, next) => {
  try {
    const item = await menuService.getMenuItemById(req.tenantId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Menu item retrieved successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (req, res, next) => {
  try {
    const item = await menuService.createMenuItem(req.tenantId, req.body);
    res.status(201).json({
      success: true,
      message: `Menu item "${item.name}" created successfully`,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    const item = await menuService.updateMenuItem(req.tenantId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: `Menu item "${item.name}" updated successfully`,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAvailability = async (req, res, next) => {
  try {
    const item = await menuService.toggleAvailability(
      req.tenantId,
      req.params.id,
      req.body.isAvailable
    );
    res.status(200).json({
      success: true,
      message: `Menu item "${item.name}" is now ${item.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}`,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    const force = req.query.force === 'true';
    const result = await menuService.deleteMenuItem(req.tenantId, req.params.id, force);
    res.status(200).json({
      success: true,
      message: result.mode === 'hard' ? 'Menu item permanently removed' : 'Menu item deactivated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
