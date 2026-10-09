/**
 * Admin Service Client
 * Handles Platform Admin operations: Stats, Applications, Restaurants, Lifecycle
 */

const ADMIN_BASE = '/api/admin';

export const getDashboardStatsApi = async (token) => {
  const response = await fetch(`${ADMIN_BASE}/dashboard-stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch dashboard statistics.');
  }
  return data.data;
};

export const getApplicationsApi = async (token, { status = 'ALL', search = '' } = {}) => {
  const query = new URLSearchParams();
  if (status && status !== 'ALL') query.set('status', status);
  if (search) query.set('search', search);

  const url = `${ADMIN_BASE}/applications${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch restaurant applications.');
  }
  return data.data;
};

export const getApplicationDetailsApi = async (token, id) => {
  const response = await fetch(`${ADMIN_BASE}/applications/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch application details.');
  }
  return data.data;
};

export const approveApplicationApi = async (token, id, { subscriptionPlan = 'BASIC', temporaryPassword = '' } = {}) => {
  const response = await fetch(`${ADMIN_BASE}/applications/${id}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ subscriptionPlan, temporaryPassword }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to approve application.');
  }
  return data;
};

export const rejectApplicationApi = async (token, id, reason) => {
  const response = await fetch(`${ADMIN_BASE}/applications/${id}/reject`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to reject application.');
  }
  return data;
};

export const getRestaurantsApi = async (token, { status = 'ALL', search = '' } = {}) => {
  const query = new URLSearchParams();
  if (status && status !== 'ALL') query.set('status', status);
  if (search) query.set('search', search);

  const url = `${ADMIN_BASE}/restaurants${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch restaurants.');
  }
  return data.data;
};

export const getRestaurantDetailsApi = async (token, id) => {
  const response = await fetch(`${ADMIN_BASE}/restaurants/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch restaurant details.');
  }
  return data.data;
};

export const updateRestaurantStatusApi = async (token, id, status) => {
  const response = await fetch(`${ADMIN_BASE}/restaurants/${id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update restaurant status.');
  }
  return data;
};

export const submitApplicationApi = async (formData) => {
  const response = await fetch(`${ADMIN_BASE}/applications/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(formData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to submit onboarding application.');
  }
  return data;
};

export const checkApplicationStatusApi = async ({ email = '', id = '' } = {}) => {
  const query = new URLSearchParams();
  if (email) query.set('email', email);
  if (id) query.set('id', id);

  const response = await fetch(`${ADMIN_BASE}/applications/status?${query.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve application status.');
  }
  return data.data;
};

export const seedSampleApplicationsApi = async () => {
  const response = await fetch(`${ADMIN_BASE}/seed-applications`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to seed sample applications.');
  }
  return data;
};
