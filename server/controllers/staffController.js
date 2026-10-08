import * as staffService from '../services/staffService.js';

export const addStaff = async (req, res, next) => {
  try {
    const staff = await staffService.addStaff(req.tenantId, req.body);
    res.status(201).json({
      success: true,
      message: 'Staff member added successfully.',
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

export const getStaff = async (req, res, next) => {
  try {
    const staffList = await staffService.getStaff(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      count: staffList.length,
      data: staffList,
    });
  } catch (error) {
    next(error);
  }
};

export const getStaffMember = async (req, res, next) => {
  try {
    const staff = await staffService.getStaffById(req.tenantId, req.params.id);
    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStaff = async (req, res, next) => {
  try {
    const updated = await staffService.updateStaff(
      req.tenantId,
      req.params.id,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Staff details updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleStatus = async (req, res, next) => {
  try {
    const updated = await staffService.toggleStaffStatus(
      req.tenantId,
      req.params.id,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: `Staff member is now ${updated.status}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getSummary = async (req, res, next) => {
  try {
    const summary = await staffService.getStaffSummary(req.tenantId);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
