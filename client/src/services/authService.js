/**
 * Frontend Authentication Service
 */

const AUTH_BASE = '/api/auth';

export const loginApi = async (email, password) => {
  const response = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed. Please check your credentials.');
  }
  return data.data;
};

export const getMeApi = async (token) => {
  const response = await fetch(`${AUTH_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch user profile.');
  }
  return data.data;
};

export const registerApi = async (userData) => {
  const response = await fetch(`${AUTH_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed.');
  }
  return data.data;
};

export const seedDemoApi = async () => {
  const response = await fetch(`${AUTH_BASE}/seed-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return await response.json();
};
