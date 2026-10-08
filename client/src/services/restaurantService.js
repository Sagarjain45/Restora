/**
 * Restaurant Service Client
 * Handles restaurant operational metrics, profile editing, opening hours, and settings
 */

const RESTAURANT_BASE = '/api/restaurant';

export const getRestaurantProfileApi = async (token) => {
  const response = await fetch(`${RESTAURANT_BASE}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch restaurant profile.');
  }
  return data.data;
};

export const updateRestaurantProfileApi = async (token, updateData) => {
  const response = await fetch(`${RESTAURANT_BASE}/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update restaurant profile.');
  }
  return data.data;
};

export const updateOpeningHoursApi = async (token, openingHours) => {
  const response = await fetch(`${RESTAURANT_BASE}/opening-hours`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ openingHours }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update opening hours.');
  }
  return data.data;
};

export const updateRestaurantSettingsApi = async (token, settings) => {
  const response = await fetch(`${RESTAURANT_BASE}/settings`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(settings),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update settings.');
  }
  return data.data;
};

export const toggleOpenStatusApi = async (token, isOpenNow) => {
  const response = await fetch(`${RESTAURANT_BASE}/toggle-open`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ isOpenNow }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update open status.');
  }
  return data.data;
};

export const getRestaurantDashboardMetricsApi = async (token) => {
  const response = await fetch(`${RESTAURANT_BASE}/dashboard-metrics`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch restaurant dashboard metrics.');
  }
  return data.data;
};
