/**
 * Order Service Client (Phase 9: Table-Based Order Management)
 * Handles table ordering, item modifications, status progression, and queries.
 */

const ORDERS_BASE = '/api/orders';

export const getOrdersApi = async (token, params = {}) => {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.tableId) query.append('tableId', params.tableId);
  if (params.activeOnly) query.append('activeOnly', 'true');
  if (params.paymentStatus && params.paymentStatus !== 'ALL') query.append('paymentStatus', params.paymentStatus);
  if (params.search) query.append('search', params.search);

  const url = `${ORDERS_BASE}${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve orders.');
  }
  return data;
};

export const getOrderByIdApi = async (token, orderId) => {
  const response = await fetch(`${ORDERS_BASE}/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve order.');
  }
  return data.data;
};

export const getActiveOrderByTableApi = async (token, tableId) => {
  const response = await fetch(`${ORDERS_BASE}/table/${tableId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve active order for table.');
  }
  return data.data;
};

export const createOrderApi = async (token, orderData) => {
  const response = await fetch(ORDERS_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create order.');
  }
  return data.data;
};

export const updateOrderStatusApi = async (token, orderId, status) => {
  const response = await fetch(`${ORDERS_BASE}/${orderId}/status`, {
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
    throw new Error(data.message || 'Failed to update order status.');
  }
  return data.data;
};

export const updateOrderDetailsApi = async (token, orderId, details) => {
  const response = await fetch(`${ORDERS_BASE}/${orderId}/details`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(details),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update order details.');
  }
  return data.data;
};

export const addItemToOrderApi = async (token, orderId, itemData) => {
  const response = await fetch(`${ORDERS_BASE}/${orderId}/items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(itemData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to add item to order.');
  }
  return data.data;
};

export const updateOrderItemApi = async (token, orderId, itemId, itemData) => {
  const response = await fetch(`${ORDERS_BASE}/${orderId}/items/${itemId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(itemData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update order item.');
  }
  return data.data;
};

export const removeOrderItemApi = async (token, orderId, itemId) => {
  const response = await fetch(`${ORDERS_BASE}/${orderId}/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to remove item from order.');
  }
  return data.data;
};
