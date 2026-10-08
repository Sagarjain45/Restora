import User from '../models/User.js';
import { hashPassword } from '../utils/password.js';

export const STAFF_DESIGNATIONS = [
  'Server / Waitstaff',
  'Chef / Kitchen Staff',
  'Cashier / Billing',
  'Host / Reception',
  'Bartender',
  'Shift Supervisor',
  'Floor Staff',
];

/**
 * Add a new staff member to the restaurant.
 * Enforces strict tenant isolation: staff is bound to tenantId.
 */
export const addStaff = async (tenantId, staffData) => {
  const { name, email, password, phone, designation, role } = staffData;

  if (!name || !email || !password) {
    const error = new Error('Name, email, and password are required to add staff.');
    error.statusCode = 400;
    throw error;
  }

  const cleanEmail = email.trim().toLowerCase();

  // Check uniqueness of email across the system
  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    const error = new Error('A user with this email address already exists in the system.');
    error.statusCode = 409;
    error.code = 'EMAIL_EXISTS';
    throw error;
  }

  const passwordHash = await hashPassword(password);

  const newStaff = new User({
    restaurantId: tenantId,
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
    role: role === 'RESTAURANT_OWNER' ? 'RESTAURANT_OWNER' : 'RESTAURANT_STAFF',
    phone: phone ? phone.trim() : null,
    designation: designation ? designation.trim() : 'Floor Staff',
    status: 'ACTIVE',
  });

  await newStaff.save();

  const userObj = newStaff.toObject();
  delete userObj.passwordHash;
  return userObj;
};

/**
 * Get all staff members for the restaurant tenant.
 */
export const getStaff = async (tenantId, params = {}) => {
  const query = { restaurantId: tenantId };

  if (params.status && params.status !== 'ALL') {
    query.status = params.status;
  }

  if (params.search) {
    const searchRegex = new RegExp(params.search.trim(), 'i');
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { designation: searchRegex },
    ];
  }

  const staffMembers = await User.find(query)
    .select('-passwordHash')
    .sort({ createdAt: -1 });

  return staffMembers;
};

/**
 * Get a single staff member by ID scoped to tenant.
 */
export const getStaffById = async (tenantId, staffId) => {
  const staff = await User.findOne({
    _id: staffId,
    restaurantId: tenantId,
  }).select('-passwordHash');

  if (!staff) {
    const error = new Error('Staff member not found.');
    error.statusCode = 404;
    throw error;
  }

  return staff;
};

/**
 * Update staff details (name, phone, designation, status, optional password reset).
 */
export const updateStaff = async (tenantId, staffId, updateData) => {
  const staff = await User.findOne({
    _id: staffId,
    restaurantId: tenantId,
  });

  if (!staff) {
    const error = new Error('Staff member not found.');
    error.statusCode = 404;
    throw error;
  }

  if (updateData.name) staff.name = updateData.name.trim();
  if (updateData.phone !== undefined) {
    staff.phone = updateData.phone ? updateData.phone.trim() : null;
  }
  if (updateData.designation) {
    staff.designation = updateData.designation.trim();
  }
  if (updateData.status) {
    staff.status = updateData.status;
  }
  if (updateData.role) {
    staff.role = updateData.role;
  }
  if (updateData.password && updateData.password.trim()) {
    staff.passwordHash = await hashPassword(updateData.password.trim());
  }

  await staff.save();

  const userObj = staff.toObject();
  delete userObj.passwordHash;
  return userObj;
};

/**
 * Toggle staff active/inactive state (deactivation / reactivation).
 */
export const toggleStaffStatus = async (tenantId, staffId, currentUserId) => {
  if (staffId.toString() === currentUserId.toString()) {
    const error = new Error('You cannot deactivate your own account.');
    error.statusCode = 400;
    throw error;
  }

  const staff = await User.findOne({
    _id: staffId,
    restaurantId: tenantId,
  });

  if (!staff) {
    const error = new Error('Staff member not found.');
    error.statusCode = 404;
    throw error;
  }

  staff.status = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  await staff.save();

  const userObj = staff.toObject();
  delete userObj.passwordHash;
  return userObj;
};

/**
 * Summary metrics of restaurant staff roster.
 */
export const getStaffSummary = async (tenantId) => {
  const [totalCount, activeCount, inactiveCount] = await Promise.all([
    User.countDocuments({ restaurantId: tenantId }),
    User.countDocuments({ restaurantId: tenantId, status: 'ACTIVE' }),
    User.countDocuments({ restaurantId: tenantId, status: 'INACTIVE' }),
  ]);

  return {
    totalStaff: totalCount,
    activeStaff: activeCount,
    inactiveStaff: inactiveCount,
  };
};
