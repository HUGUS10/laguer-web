// js/carrito.js
const CART_KEY = 'laguerCart';

// Obtener carrito
export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

// Guardar carrito
export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge(cart);
  return cart;
}

// Agregar producto
export function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart(cart);
  return cart;
}

// Eliminar producto
export function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== productId);
  saveCart(cart);
  return cart;
}

// Actualizar cantidad
export function updateQuantity(productId, newQuantity) {
  const cart = getCart();
  const item = cart.find(item => item.id === productId);
  if (item) {
    if (newQuantity <= 0) {
      return removeFromCart(productId);
    }
    item.quantity = newQuantity;
    saveCart(cart);
  }
  return cart;
}

// Actualizar badge en UI
export function updateCartBadge(cart) {
  const totalItems = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const elements = [
    document.getElementById('cartCount'),
    document.getElementById('bottomCartBadge')
  ];
  elements.forEach(el => {
    if (el) {
      el.textContent = totalItems;
      if (el.id === 'bottomCartBadge') {
        el.style.display = totalItems === 0 ? 'none' : 'flex';
      }
    }
  });
}