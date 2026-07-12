// js/productos.js
import { db } from '../firebase/firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';

const productGrid = document.getElementById('productGrid');
const loading = document.getElementById('loading');
const filtros = document.querySelectorAll('.filtro-btn');
let todosProductos = [];

// Obtener productos desde Firebase
async function cargarProductos() {
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    todosProductos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    mostrarProductos(todosProductos);
    loading.style.display = 'none';
  } catch (error) {
    console.error('Error cargando productos:', error);
    loading.innerHTML = '<p style="color:var(--red);">Error al cargar productos. Intenta más tarde.</p>';
  }
}

// Mostrar productos en el grid
function mostrarProductos(productos) {
  if (productos.length === 0) {
    productGrid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:40px 0; color:var(--muted);">
        <i class="fas fa-box-open fa-2x"></i>
        <p>No se encontraron productos en esta categoría.</p>
      </div>
    `;
    return;
  }

  let html = '';
  productos.forEach(prod => {
    const precio = prod.price || 0;
    const imagen = prod.images && prod.images.length > 0 ? prod.images[0] : '../image/placeholder.png';
    const oferta = prod.discount > 0 ? `<span class="badge-oferta">-${prod.discount}%</span>` : '';
    const nuevo = prod.isNew ? `<span class="badge-nuevo">Nuevo</span>` : '';
    const badge = oferta || nuevo;

    html += `
      <div class="product-card" data-id="${prod.id}">
        <div class="product-card-img">
          <img src="${imagen}" alt="${prod.name}" loading="lazy" />
          ${badge}
        </div>
        <div class="product-card-body">
          <div class="categoria">${prod.category || 'General'}</div>
          <div class="nombre">${prod.name}</div>
          <div class="precio">S/ <span>${precio.toFixed(2)}</span></div>
        </div>
      </div>
    `;
  });

  productGrid.innerHTML = html;

  // Al hacer clic en una tarjeta, redirigir a producto.html con el ID
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      window.location.href = `producto.html?id=${id}`;
    });
  });
}

// Filtros por categoría
filtros.forEach(btn => {
  btn.addEventListener('click', () => {
    filtros.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    if (cat === 'all') {
      mostrarProductos(todosProductos);
    } else {
      const filtrados = todosProductos.filter(p => p.category === cat);
      mostrarProductos(filtrados);
    }
  });
});

// Búsqueda (si hay input)
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (term === '') {
      mostrarProductos(todosProductos);
      return;
    }
    const filtrados = todosProductos.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.category && p.category.toLowerCase().includes(term))
    );
    mostrarProductos(filtrados);
  });
}

// Inicializar
cargarProductos();