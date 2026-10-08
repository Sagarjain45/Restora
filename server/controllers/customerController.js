import * as customerService from '../services/customerService.js';

export const createCustomer = async (req, res, next) => {
  try {
    const result = await customerService.createCustomer(req.tenantId, req.body);
    res.status(result.isExisting ? 200 : 201).json({
      success: true,
      message: result.isExisting
        ? 'Existing customer profile recognized and updated.'
        : 'New customer profile registered successfully.',
      data: result.customer,
      isExisting: result.isExisting,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (req, res, next) => {
  try {
    const customers = await customerService.getCustomers(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomer = async (req, res, next) => {
  try {
    const profile = await customerService.getCustomerById(req.tenantId, req.params.id);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const updated = await customerService.updateCustomer(
      req.tenantId,
      req.params.id,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Customer profile updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const recordVisit = async (req, res, next) => {
  try {
    const updated = await customerService.recordCustomerVisit(
      req.tenantId,
      req.params.id,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Customer visit recorded successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getSummary = async (req, res, next) => {
  try {
    const summary = await customerService.getCustomerSummary(req.tenantId);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
