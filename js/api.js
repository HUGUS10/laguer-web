// ============================================================
// js/api.js - Cliente API para LAGUER
// ============================================================

const API_BASE = '/api';

async function apiFetch(endpoint, options = {}) {
  const resp = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  if (!resp.ok) {
    const error = await resp.json();
    throw new Error(error.error || `Error ${resp.status}`);
  }
  return resp.json();
}

// ============================================================
// AUTH
// ============================================================

export async function login(email, password) {
  return apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function register(nombre, email, password, telefono = '', dni = '') {
  return apiFetch('/register', {
    method: 'POST',
    body: JSON.stringify({ nombre, email, password, telefono, dni })
  });
}

export async function getUser(id) {
  return apiFetch(`/user/${id}`);
}

export async function updateUser(id, data) {
  return apiFetch(`/user/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// ============================================================
// PRODUCTOS
// ============================================================

export async function getProducts(search = '', category = '') {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  return apiFetch(`/products?${params}`);
}

export async function getProduct(id) {
  return apiFetch(`/products/${id}`);
}

export async function createProduct(data) {
  return apiFetch('/products', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateProduct(id, data) {
  return apiFetch(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteProduct(id) {
  return apiFetch(`/products/${id}`, {
    method: 'DELETE'
  });
}

// ============================================================
// PEDIDOS
// ============================================================

export async function getOrders(estado = '') {
  const params = new URLSearchParams();
  if (estado) params.set('estado', estado);
  return apiFetch(`/orders?${params}`);
}

export async function getOrder(id) {
  return apiFetch(`/orders/${id}`);
}

export async function createOrder(data) {
  return apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateOrder(id, estado) {
  return apiFetch(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ estado })
  });
}

export async function deleteOrder(id) {
  return apiFetch(`/orders/${id}`, {
    method: 'DELETE'
  });
}

// ============================================================
// CARRITO
// ============================================================

export async function getCart(userId) {
  return apiFetch(`/cart/${userId}`);
}

export async function addToCart(user_id, producto_id, cantidad = 1) {
  return apiFetch('/cart', {
    method: 'POST',
    body: JSON.stringify({ user_id, producto_id, cantidad })
  });
}

export async function removeFromCart(id) {
  return apiFetch(`/cart/${id}`, {
    method: 'DELETE'
  });
}

export async function clearCart(userId) {
  return apiFetch(`/cart/clear/${userId}`, {
    method: 'DELETE'
  });
}

// ============================================================
// FAVORITOS
// ============================================================

export async function getFavorites(userId) {
  return apiFetch(`/favorites/${userId}`);
}

export async function addFavorite(user_id, producto_id) {
  return apiFetch('/favorites', {
    method: 'POST',
    body: JSON.stringify({ user_id, producto_id })
  });
}

export async function removeFavorite(id) {
  return apiFetch(`/favorites/${id}`, {
    method: 'DELETE'
  });
}

// ============================================================
// USUARIOS (admin)
// ============================================================

export async function getUsers() {
  return apiFetch('/users');
}

export async function createUser(data) {
  return apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function deleteUser(id) {
  return apiFetch(`/users/${id}`, {
    method: 'DELETE'
  });
}

// ============================================================
// RECLAMOS
// ============================================================

export async function createReclamo(data) {
  return apiFetch('/reclamos', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// ============================================================
// DASHBOARD
// ============================================================

export async function getDashboard() {
  return apiFetch('/dashboard');
}

// ============================================================
// INVENTARIO
// ============================================================

export async function getMovements() {
  return apiFetch('/inventory/movements');
}

export async function createMovement(data) {
  return apiFetch('/inventory/movement', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// ============================================================
// MENSAJES
// ============================================================

export async function getMessages() {
  return apiFetch('/messages');
}

export async function createMessage(data) {
  return apiFetch('/messages', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function markMessageRead(id) {
  return apiFetch(`/messages/${id}`, {
    method: 'PUT'
  });
}

export async function deleteMessage(id) {
  return apiFetch(`/messages/${id}`, {
    method: 'DELETE'
  });
}

// ============================================================
// ACTIVIDAD
// ============================================================

export async function getActivities() {
  return apiFetch('/activity');
}

// ============================================================
// MIGRACIÓN (desde localStorage a D1)
// ============================================================

export async function migrateToD1() {
  const data = {
    products: JSON.parse(localStorage.getItem('laguerProducts') || '[]'),
    orders: JSON.parse(localStorage.getItem('laguerOrders') || '[]'),
    users: JSON.parse(localStorage.getItem('laguerUsers') || '[]'),
    cart: JSON.parse(localStorage.getItem('laguerCart') || '[]'),
    favs: JSON.parse(localStorage.getItem('laguerFavs') || '[]')
  };
  return apiFetch('/migrate', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}