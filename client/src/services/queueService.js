/**
 * Queue Service Client (Phase 11: Waiting Queue Management)
 * Handles customer waitlists, FIFO queue tracking, capacity matching, and seating.
 */

const QUEUE_BASE = '/api/queue';

export const getQueueApi = async (token, params = {}) => {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') {
    query.append('status', params.status);
  }
  if (params.activeOnly) query.append('activeOnly', 'true');
  if (params.search) query.append('search', params.search);

  const url = `${QUEUE_BASE}${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve queue.');
  }
  return data;
};

export const getQueueSummaryApi = async (token) => {
  const response = await fetch(`${QUEUE_BASE}/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve queue summary.');
  }
  return data.data;
};

export const getQueueEntryByIdApi = async (token, entryId) => {
  const response = await fetch(`${QUEUE_BASE}/${entryId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve queue entry.');
  }
  return data.data;
};

export const addToQueueApi = async (token, entryData) => {
  const response = await fetch(`${QUEUE_BASE}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(entryData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to add party to queue.');
  }
  return data.data;
};

export const updateQueueStatusApi = async (token, entryId, status, notes) => {
  const response = await fetch(`${QUEUE_BASE}/${entryId}/status`, {
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
    throw new Error(data.message || 'Failed to update queue status.');
  }
  return data.data;
};

export const seatCustomerApi = async (token, entryId, tableId) => {
  const response = await fetch(`${QUEUE_BASE}/${entryId}/seat`, {
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
    throw new Error(data.message || 'Failed to seat customer.');
  }
  return data.data;
};

export const notifyPartyApi = async (token, entryId) => {
  const response = await fetch(`${QUEUE_BASE}/${entryId}/notify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to notify party.');
  }
  return data.data;
};

export const cancelQueueEntryApi = async (token, entryId, notes) => {
  const response = await fetch(`${QUEUE_BASE}/${entryId}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ notes }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to cancel queue entry.');
  }
  return data.data;
};

export const markNoShowApi = async (token, entryId) => {
  const response = await fetch(`${QUEUE_BASE}/${entryId}/no-show`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to mark as no-show.');
  }
  return data.data;
};

export const getSuitableTablesApi = async (token, entryId) => {
  const response = await fetch(`${QUEUE_BASE}/suitable-tables/${entryId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to find suitable tables.');
  }
  return data.data;
};

export const suggestPartyForTableApi = async (token, tableId) => {
  const response = await fetch(`${QUEUE_BASE}/suggest-party/${tableId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to find party suggestion for table.');
  }
  return data.data;
};
