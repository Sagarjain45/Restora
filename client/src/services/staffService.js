/**
 * Staff Management Service Client (Phase 14: Staff Management)
 * Handles staff roster, credential provisioning, role assignments, and status toggling.
 */

const STAFF_BASE = '/api/staff';

export const STAFF_DESIGNATIONS = [
  'Server / Waitstaff',
  'Chef / Kitchen Staff',
  'Cashier / Billing',
  'Host / Reception',
  'Bartender',
  'Shift Supervisor',
  'Floor Staff',
];

export const getStaffApi = async (token, params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.designation && params.designation !== 'ALL') query.append('designation', params.designation);

  const url = `${STAFF_BASE}${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve staff roster.');
  }
  return data;
};

export const getStaffSummaryApi = async (token) => {
  const response = await fetch(`${STAFF_BASE}/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve staff summary metrics.');
  }
  return data.data;
};

export const getStaffByIdApi = async (token, staffId) => {
  const response = await fetch(`${STAFF_BASE}/${staffId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve staff member.');
  }
  return data.data;
};

export const createStaffApi = async (token, staffData) => {
  const response = await fetch(`${STAFF_BASE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify(staffData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to add staff member.');
  }
  return data.data;
};

export const updateStaffApi = async (token, staffId, staffData) => {
  const response = await fetch(`${STAFF_BASE}/${staffId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify(staffData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update staff member.');
  }
  return data.data;
};

export const toggleStaffStatusApi = async (token, staffId) => {
  const response = await fetch(`${STAFF_BASE}/${staffId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to toggle staff status.');
  }
  return data.data;
};
