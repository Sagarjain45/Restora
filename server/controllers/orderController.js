import * as orderService from '../services/orderService.js';

/**
 * Controller for Restaurant Order Operations (Phase 9)
 */

export const getOrders = async (req, res, next) => {
  try {
    const { orders, summary } = await orderService.getOrders(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      count: orders.length,
      summary,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.tenantId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveOrderByTable = async (req, res, next) => {
  try {
    const order = await orderService.getActiveOrderByTable(req.tenantId, req.params.tableId);
    res.status(200).json({
      success: true,
      message: order ? 'Active table order retrieved' : 'No active order for this table',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.tenantId, req.body);
    res.status(201).json({
      success: true,
      message: `Order ${order.orderNumber} placed successfully`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const addItem = async (req, res, next) => {
  try {
    const order = await orderService.addItemToOrder(req.tenantId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Menu item added to order',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderItem(
      req.tenantId,
      req.params.id,
      req.params.itemId,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Order item updated',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const removeItem = async (req, res, next) => {
  try {
    const order = await orderService.removeOrderItem(
      req.tenantId,
      req.params.id,
      req.params.itemId
    );
    res.status(200).json({
      success: true,
      message: 'Item removed from order',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.tenantId, req.params.id, status);
    res.status(200).json({
      success: true,
      message: `Order status updated to ${order.status}`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDetails = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderDetails(req.tenantId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Order details updated',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
