/**
 * Central API Client for Restora
 */

const API_BASE = '/api';

export const checkSystemHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Unable to connect to backend server',
    };
  }
};
