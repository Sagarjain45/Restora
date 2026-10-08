/**
 * Reservation Service Client (Phase 12: Table Reservation Management)
 * Handles table bookings, schedule lookups, time-slot conflict checks, and seating.
 */

const RESERVATIONS_BASE = '/api/reservations';

export const getReservationsApi = async (token, params = {}) => {
  const query = new URLSearchParams();
  if (params.date) query.append('date', params.date);
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.tableId) query.append('tableId', params.tableId);
  if (params.search) query.append('search', params.search);

  const url = `${RESERVATIONS_BASE}${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve reservations.');
  }
  return data;
};

export const getReservationSummaryApi = async (token, date = null) => {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const response = await fetch(`${RESERVATIONS_BASE}/summary${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve reservation summary.');
  }
  return data.data;
};

export const getReservationByIdApi = async (token, reservationId) => {
  const response = await fetch(`${RESERVATIONS_BASE}/${reservationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve reservation.');
  }
  return data.data;
};

export const createReservationApi = async (token, reservationData) => {
  const response = await fetch(`${RESERVATIONS_BASE}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(reservationData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create reservation.');
  }
  return data.data;
};

export const updateReservationApi = async (token, reservationId, updateData) => {
  const response = await fetch(`${RESERVATIONS_BASE}/${reservationId}`, {
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
    throw new Error(data.message || 'Failed to update reservation.');
  }
  return data.data;
};

export const updateReservationStatusApi = async (token, reservationId, status, notes) => {
  const response = await fetch(`${RESERVATIONS_BASE}/${reservationId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ status, notes }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update reservation status.');
  }
  return data.data;
};

export const seatReservationApi = async (token, reservationId, tableId = null) => {
  const response = await fetch(`${RESERVATIONS_BASE}/${reservationId}/seat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ tableId }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to seat reservation.');
  }
  return data.data;
};

export const checkAvailableTablesApi = async (token, params = {}) => {
  const query = new URLSearchParams();
  if (params.date) query.append('date', params.date);
  if (params.startTime) query.append('startTime', params.startTime);
  if (params.endTime) query.append('endTime', params.endTime);
  if (params.guestCount) query.append('guestCount', params.guestCount);

  const response = await fetch(`${RESERVATIONS_BASE}/available-tables?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to check table availability.');
  }
  return data.data;
};
