// js/producto.js
import { db } from '../firebase/firebase.js';
import { doc, getDoc } from 'firebase/firestore';

const container = document.getElementById('productDetailContainer');

// Obtener el ID del producto de la URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

if (!productId) {
  container.innerHTML = `
    <div style="text-align:center; padding:40px 0; color:var(--red);">
      <i class="fas fa-exclamation-triangle fa-2x"></i>
      <p>No se especificó ningún producto.</p>
      <a href="productos.html" class="add-btn" style="display:inline-block; width:auto; padding:12px 24px; margin-top:16px;">Ver productos</a>
    </div>
  `;
} else {
  cargarProducto(productId);
}

async function cargarProducto(id) {
  try {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px 0; color:var(--red);">
          <i class="fas fa-box-open fa-2x"></i>
          <p>Producto no encontrado.</p>
          <a href="productos.html" class="add-btn" style="display:inline-block; width:auto; padding:12px 24px; margin-top:16px;">Volver al catálogo</a>
        </div>
      `;
      return;
    }

    const producto = { id: docSnap.id, ...docSnap.data() };
    renderProducto(producto);

  } catch (error) {
    console.error('Error cargando producto:', error);
    container.innerHTML = `
      <div style="text-align:center; padding:40px 0; color:var(--red);">
        <i class="fas fa-exclamation-circle fa-2x"></i>
        <p>Error al cargar el producto.</p>
      </div>
    `;
  }
}

function renderProducto(producto) {
  const {
    name = 'Producto',
    category = 'General',
    price = 0,
    description = 'Sin descripción disponible.',
    images = ['../image/placeholder.png'],
    colors = ['#ffffff', '#000000', '#ff0000', '#0000ff'],
    sizes = ['S', 'M', 'L', 'XL'],
    characteristics = ['Material resistente', 'Diseño moderno', 'Garantía 1 año']
  } = producto;

  // Construir HTML
  let html = `
    <div class="product-detail">
      <!-- Galería -->
      <div class="product-gallery">
        <div class="main-image" id="mainImage">
          <img src="${images[0]}" alt="${name}" id="mainImageTag" />
        </div>
        <div class="thumbnails" id="thumbnails">
  `;

  // Miniaturas (usamos las mismas imágenes, pero podrían ser diferentes por color)
  images.forEach((img, index) => {
    html += `<img src="${img}" alt="Thumb ${index+1}" data-index="${index}" class="${index === 0 ? 'active' : ''}" />`;
  });

  html += `
        </div>
      </div>

      <!-- Información -->
      <div class="product-info">
        <div class="categoria">${category}</div>
        <h1>${name}</h1>
        <div class="precio">S/ ${price.toFixed(2)}</div>
        <div class="descripcion">${description}</div>

        <!-- Colores -->
        <div class="selector">
          <label>Color</label>
          <div class="options" id="colorOptions">
  `;

  colors.forEach((color, index) => {
    const isActive = index === 0 ? 'active' : '';
    html += `<button class="color-btn ${isActive}" data-color="${color}" style="background:${color};" title="${color}"></button>`;
  });

  html += `
          </div>
        </div>

        <!-- Tallas -->
        <div class="selector">
          <label>Talla</label>
          <div class="options" id="sizeOptions">
  `;

  sizes.forEach((size, index) => {
    const isActive = index === 0 ? 'active' : '';
    html += `<button class="${isActive}" data-size="${size}">${size}</button>`;
  });

  html += `
          </div>
        </div>

        <!-- Botones -->
        <button class="add-to-cart-btn" id="addToCartBtn">
          <i class="fas fa-shopping-cart"></i> Agregar al carrito
        </button>
        <button class="favorito-btn" id="favBtn">
          <i class="fas fa-heart"></i> Agregar a favoritos
        </button>

        <!-- Características -->
        <div class="caracteristicas">
          <h3><i class="fas fa-list-ul"></i> Características</h3>
          <ul>
  `;

  characteristics.forEach(char => {
    html += `<li><i class="fas fa-check-circle"></i> ${char}</li>`;
  });

  html += `
          </ul>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // ========== LOGICA DE INTERACCIÓN ==========

  // Cambiar imagen principal al hacer clic en miniatura
  const thumbnails = document.querySelectorAll('.thumbnails img');
  const mainImage = document.getElementById('mainImageTag');

  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbnails.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      mainImage.src = thumb.src;
    });
  });

  // Cambiar imagen al seleccionar color (si tienes imágenes por color, puedes mapearlas)
  // Aquí simulamos: al hacer clic en un color, cambiamos la imagen principal por una variante
  const colorBtns = document.querySelectorAll('#colorOptions .color-btn');
  colorBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      colorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Si hay imágenes para cada color, usar images[index % images.length]
      // Aquí usamos la misma imagen pero simulamos cambio con un efecto
      const imgIndex = index % images.length;
      mainImage.src = images[imgIndex];
      // Actualizar miniatura activa
      thumbnails.forEach((t, i) => {
        t.classList.toggle('active', i === imgIndex);
      });
    });
  });

  // Seleccionar talla
  const sizeBtns = document.querySelectorAll('#sizeOptions button');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Agregar al carrito (ejemplo)
  document.getElementById('addToCartBtn')?.addEventListener('click', () => {
    const colorSelected = document.querySelector('#colorOptions .active');
    const sizeSelected = document.querySelector('#sizeOptions .active');
    const color = colorSelected ? colorSelected.dataset.color : 'N/A';
    const size = sizeSelected ? sizeSelected.dataset.size : 'N/A';
    alert(`✅ Producto agregado al carrito\nColor: ${color}\nTalla: ${size}`);
    // Aquí deberías llamar a tu función de carrito.js
  });

  // Favoritos
  document.getElementById('favBtn')?.addEventListener('click', function() {
    this.classList.toggle('active');
    if (this.classList.contains('active')) {
      this.innerHTML = '<i class="fas fa-heart"></i> Quitar de favoritos';
      alert('❤️ Agregado a favoritos');
    } else {
      this.innerHTML = '<i class="fas fa-heart"></i> Agregar a favoritos';
      alert('💔 Eliminado de favoritos');
    }
  });
}