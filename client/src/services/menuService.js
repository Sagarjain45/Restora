/**
 * Menu Service Client (Phase 8: Menu Management)
 * Handles restaurant menu catalog CRUD, dietary flags, categories, and item availability.
 */

const MENU_BASE = '/api/menu';

export const getMenuItemsApi = async (token, params = {}) => {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'ALL') query.append('category', params.category);
  if (params.isVegetarian !== undefined && params.isVegetarian !== '' && params.isVegetarian !== 'ALL') {
    query.append('isVegetarian', params.isVegetarian);
  }
  if (params.isAvailable !== undefined && params.isAvailable !== '' && params.isAvailable !== 'ALL') {
    query.append('isAvailable', params.isAvailable);
  }
  if (params.isActive !== undefined && params.isActive !== '') query.append('isActive', params.isActive);
  if (params.search) query.append('search', params.search);
  if (params.minPrice) query.append('minPrice', params.minPrice);
  if (params.maxPrice) query.append('maxPrice', params.maxPrice);

  const url = `${MENU_BASE}${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve menu items.');
  }
  return data;
};

export const getMenuItemByIdApi = async (token, itemId) => {
  const response = await fetch(`${MENU_BASE}/${itemId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve menu item.');
  }
  return data.data;
};

export const createMenuItemApi = async (token, itemData) => {
  const response = await fetch(MENU_BASE, {
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
    throw new Error(data.message || 'Failed to create menu item.');
  }
  return data.data;
};

export const updateMenuItemApi = async (token, itemId, itemData) => {
  const response = await fetch(`${MENU_BASE}/${itemId}`, {
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
    throw new Error(data.message || 'Failed to update menu item.');
  }
  return data.data;
};

export const toggleMenuItemAvailabilityApi = async (token, itemId, isAvailable) => {
  const response = await fetch(`${MENU_BASE}/${itemId}/availability`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ isAvailable }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to toggle availability.');
  }
  return data.data;
};

export const deleteMenuItemApi = async (token, itemId, force = false) => {
  const url = `${MENU_BASE}/${itemId}${force ? '?force=true' : ''}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete menu item.');
  }
  return data.data;
};
