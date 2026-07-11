// js/producto-detalle.js
// Simulación de datos del producto (puedes reemplazar con Firebase)
const productData = {
  id: 'polo-001',
  name: 'Polo Deportivo LAGUER',
  price: 89.90,
  oldPrice: 129.90,
  description: 'Polo deportivo de alta calidad, confeccionado en tejido Dry-Fit que absorbe la humedad. Ideal para entrenamiento y uso diario. Disponible en varios colores.',
  features: [
    'Tejido Dry-Fit',
    'Cuello redondo',
    'Costuras reforzadas',
    'Lavable a máquina'
  ],
  images: {
    'rojo': {
      main: '../image/productos/polo-rojo.jpg',
      thumbnails: [
        '../image/productos/polo-rojo-1.jpg',
        '../image/productos/polo-rojo-2.jpg',
        '../image/productos/polo-rojo-3.jpg'
      ]
    },
    'negro': {
      main: '../image/productos/polo-negro.jpg',
      thumbnails: [
        '../image/productos/polo-negro-1.jpg',
        '../image/productos/polo-negro-2.jpg',
        '../image/productos/polo-negro-3.jpg'
      ]
    },
    'azul': {
      main: '../image/productos/polo-azul.jpg',
      thumbnails: [
        '../image/productos/polo-azul-1.jpg',
        '../image/productos/polo-azul-2.jpg',
        '../image/productos/polo-azul-3.jpg'
      ]
    },
    'blanco': {
      main: '../image/productos/polo-blanco.jpg',
      thumbnails: [
        '../image/productos/polo-blanco-1.jpg',
        '../image/productos/polo-blanco-2.jpg',
        '../image/productos/polo-blanco-3.jpg'
      ]
    }
  },
  colors: [
    { name: 'Rojo', hex: '#E63946' },
    { name: 'Negro', hex: '#1D1D1D' },
    { name: 'Azul', hex: '#1D4ED8' },
    { name: 'Blanco', hex: '#F5F5F5' }
  ],
  sizes: ['S', 'M', 'L', 'XL']
};

// Estado actual
let selectedColor = 'rojo'; // clave del color
let selectedSize = 'M';
let currentImages = productData.images[selectedColor];

// Elementos DOM
const mainImage = document.getElementById('mainImageSrc');
const thumbnailRow = document.getElementById('thumbnailRow');
const productName = document.getElementById('productName');
const productPrice = document.getElementById('productPrice');
const oldPrice = document.getElementById('oldPrice');
const productDescription = document.getElementById('productDescription');
const featuresList = document.getElementById('featuresList');
const colorOptions = document.getElementById('colorOptions');
const sizeOptions = document.getElementById('sizeOptions');
const addToCartBtn = document.getElementById('addToCartBtn');
const favoriteBtn = document.getElementById('favoriteBtn');
const toast = document.getElementById('toast');

// === 1. Cargar datos del producto ===
function loadProductData() {
  productName.textContent = productData.name;
  productPrice.textContent = `S/ ${productData.price.toFixed(2)}`;
  oldPrice.textContent = `S/ ${productData.oldPrice.toFixed(2)}`;
  productDescription.textContent = productData.description;
  
  // Características
  featuresList.innerHTML = productData.features.map(f => 
    `<li><i class="fas fa-check-circle"></i> ${f}</li>`
  ).join('');
}

// === 2. Renderizar miniaturas ===
function renderThumbnails(images) {
  thumbnailRow.innerHTML = images.map((img, index) => `
    <img src="${img}" alt="Miniatura ${index+1}" data-index="${index}" class="${index === 0 ? 'active' : ''}" />
  `).join('');

  // Evento clic en miniatura
  document.querySelectorAll('.thumbnail-row img').forEach(img => {
    img.addEventListener('click', function() {
      document.querySelectorAll('.thumbnail-row img').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      mainImage.src = this.src;
    });
  });
}

// === 3. Renderizar colores ===
function renderColors(colors, selectedKey) {
  colorOptions.innerHTML = colors.map(color => {
    const isActive = selectedKey === color.name.toLowerCase();
    return `
      <button 
        style="background: ${color.hex}; border-color: ${isActive ? '#fff' : 'transparent'};" 
        data-color="${color.name.toLowerCase()}" 
        class="${isActive ? 'active' : ''}"
      >
        <span class="color-label">${color.name}</span>
      </button>
    `;
  }).join('');

  // Evento clic en color
  document.querySelectorAll('.color-options button').forEach(btn => {
    btn.addEventListener('click', function() {
      const colorKey = this.dataset.color;
      changeColor(colorKey);
    });
  });
}

// === 4. Cambiar color ===
function changeColor(colorKey) {
  if (!productData.images[colorKey]) return;
  
  selectedColor = colorKey;
  currentImages = productData.images[colorKey];
  
  // Actualizar imagen principal
  mainImage.src = currentImages.main;
  
  // Actualizar miniaturas
  renderThumbnails(currentImages.thumbnails);
  
  // Actualizar estado activo de colores
  document.querySelectorAll('.color-options button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === colorKey);
    btn.style.borderColor = btn.dataset.color === colorKey ? '#fff' : 'transparent';
  });
}

// === 5. Renderizar tallas ===
function renderSizes(sizes, selectedSize) {
  sizeOptions.innerHTML = sizes.map(size => `
    <button data-size="${size}" class="${size === selectedSize ? 'active' : ''}">${size}</button>
  `).join('');

  document.querySelectorAll('.size-options button').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.size-options button').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectedSize = this.dataset.size;
    });
  });
}

// === 6. Agregar al carrito ===
addToCartBtn.addEventListener('click', function() {
  // Simular agregado
  showToast('Producto agregado al carrito');
  
  // Cambiar texto temporalmente
  const originalText = this.innerHTML;
  this.innerHTML = '<i class="fas fa-check"></i> Agregado';
  setTimeout(() => {
    this.innerHTML = originalText;
  }, 2000);
});

// === 7. Favoritos ===
favoriteBtn.addEventListener('click', function() {
  const icon = this.querySelector('i');
  if (icon.classList.contains('far')) {
    icon.classList.replace('far', 'fas');
    this.style.color = 'var(--red)';
    showToast('Agregado a favoritos ❤️');
  } else {
    icon.classList.replace('fas', 'far');
    this.style.color = '';
    showToast('Eliminado de favoritos');
  }
});

// === 8. Toast ===
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// === 9. Inicializar ===
function init() {
  loadProductData();
  
  // Si no hay imágenes, usar un placeholder
  if (!productData.images || Object.keys(productData.images).length === 0) {
    mainImage.src = '../image/productos/default.jpg';
    thumbnailRow.innerHTML = '<p style="color:var(--muted);">Sin imágenes</p>';
  } else {
    // Seleccionar el primer color disponible
    const firstColor = Object.keys(productData.images)[0];
    selectedColor = firstColor;
    currentImages = productData.images[firstColor];
    mainImage.src = currentImages.main;
    renderThumbnails(currentImages.thumbnails);
    renderColors(productData.colors, selectedColor);
  }
  
  renderSizes(productData.sizes, selectedSize);
}

init();

// === 10. (Opcional) Cargar datos desde Firebase ===
// Si quieres obtener el producto desde Firestore, descomenta esto:
/*
import { db } from '../firebase/firebase.js';
import { doc, getDoc } from 'firebase/firestore';

const productId = new URLSearchParams(window.location.search).get('id');
if (productId) {
  const productRef = doc(db, 'products', productId);
  const docSnap = await getDoc(productRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    // Actualizar productData con los datos de Firebase
    // ...
  }
}
*/