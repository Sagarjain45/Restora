import * as billingService from '../services/billingService.js';

/**
 * Controller for Restaurant Billing and Payment Operations (Phase 10)
 */

export const generateBill = async (req, res, next) => {
  try {
    const bill = await billingService.generateBill(req.tenantId, req.body);
    res.status(201).json({
      success: true,
      message: `Bill ${bill.billNumber} generated successfully`,
      data: bill,
    });
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req, res, next) => {
  try {
    const result = await billingService.recordPayment(req.tenantId, {
      billId: req.params.id,
      ...req.body,
    });
    res.status(200).json({
      success: true,
      message: `Payment of ₹${result.payment.amount} recorded via ${result.payment.method}. Order completed & table released.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getBills = async (req, res, next) => {
  try {
    const { bills, summary } = await billingService.getBills(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      message: 'Bills retrieved successfully',
      count: bills.length,
      summary,
      data: bills,
    });
  } catch (error) {
    next(error);
  }
};

export const getBill = async (req, res, next) => {
  try {
    const { bill, restaurant } = await billingService.getBillById(req.tenantId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Bill retrieved successfully',
      data: {
        bill,
        restaurant,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBillByOrder = async (req, res, next) => {
  try {
    const bill = await billingService.getBillByOrder(req.tenantId, req.params.orderId);
    res.status(200).json({
      success: true,
      message: bill ? 'Bill found for order' : 'No bill generated yet for this order',
      data: bill,
    });
  } catch (error) {
    next(error);
  }
};

export const voidBill = async (req, res, next) => {
  try {
    const bill = await billingService.voidBill(req.tenantId, req.params.id, req.body.reason);
    res.status(200).json({
      success: true,
      message: 'Bill voided successfully',
      data: bill,
    });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const payments = await billingService.getPayments(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      message: 'Payment logs retrieved successfully',
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};
