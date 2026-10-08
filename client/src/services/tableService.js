/**
 * Table Service Client (Phase 7: Table Management)
 * Handles restaurant floor table CRUD, operational status changes, and filtering.
 */

const TABLES_BASE = '/api/tables';

export const getTablesApi = async (token, params = {}) => {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.section && params.section !== 'ALL') query.append('section', params.section);
  if (params.minCapacity) query.append('minCapacity', params.minCapacity);
  if (params.search) query.append('search', params.search);
  if (params.isActive !== undefined && params.isActive !== '') query.append('isActive', params.isActive);

  const url = `${TABLES_BASE}${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve tables.');
  }
  return data;
};

export const getTableByIdApi = async (token, tableId) => {
  const response = await fetch(`${TABLES_BASE}/${tableId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve table.');
  }
  return data.data;
};

export const createTableApi = async (token, tableData) => {
  const response = await fetch(TABLES_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(tableData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create table.');
  }
  return data.data;
};

export const updateTableApi = async (token, tableId, tableData) => {
  const response = await fetch(`${TABLES_BASE}/${tableId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(tableData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update table details.');
  }
  return data.data;
};

export const updateTableStatusApi = async (token, tableId, status) => {
  const response = await fetch(`${TABLES_BASE}/${tableId}/status`, {
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
    throw new Error(data.message || 'Failed to update table status.');
  }
  return data.data;
};

export const deleteTableApi = async (token, tableId, force = false) => {
  const url = `${TABLES_BASE}/${tableId}${force ? '?force=true' : ''}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete table.');
  }
  return data.data;
};
