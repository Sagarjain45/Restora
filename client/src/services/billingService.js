/**
 * Billing Service Client (Phase 10: Billing & Payment Management)
 * Handles bill generation, payment settlement, invoice retrieval, and reporting.
 */

const BILLS_BASE = '/api/bills';

export const getBillsApi = async (token, params = {}) => {
  const query = new URLSearchParams();
  if (params.paymentStatus && params.paymentStatus !== 'ALL') {
    query.append('paymentStatus', params.paymentStatus);
  }
  if (params.orderId) query.append('orderId', params.orderId);
  if (params.search) query.append('search', params.search);

  const url = `${BILLS_BASE}${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve bills.');
  }
  return data;
};

export const getBillByIdApi = async (token, billId) => {
  const response = await fetch(`${BILLS_BASE}/${billId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve bill details.');
  }
  return data.data;
};

export const getBillByOrderApi = async (token, orderId) => {
  const response = await fetch(`${BILLS_BASE}/order/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve bill for order.');
  }
  return data.data;
};

export const generateBillApi = async (token, billData) => {
  const response = await fetch(`${BILLS_BASE}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(billData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to generate bill.');
  }
  return data.data;
};

export const recordPaymentApi = async (token, billId, paymentData) => {
  const response = await fetch(`${BILLS_BASE}/${billId}/pay`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(paymentData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to record payment.');
  }
  return data.data;
};

export const voidBillApi = async (token, billId, reason) => {
  const response = await fetch(`${BILLS_BASE}/${billId}/void`, {
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
    throw new Error(data.message || 'Failed to void bill.');
  }
  return data.data;
};

export const getPaymentsApi = async (token, params = {}) => {
  const query = new URLSearchParams();
  if (params.paymentMethod && params.paymentMethod !== 'ALL') {
    query.append('paymentMethod', params.paymentMethod);
  }
  if (params.paymentStatus && params.paymentStatus !== 'ALL') {
    query.append('paymentStatus', params.paymentStatus);
  }
  if (params.billId) query.append('billId', params.billId);
  if (params.orderId) query.append('orderId', params.orderId);

  const url = `${BILLS_BASE}/payments${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve payments.');
  }
  return data;
};
