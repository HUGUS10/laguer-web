(function() {
  'use strict';

  // =====================================================================
  // 1. TEMA OSCURO/CLARO
  // =====================================================================
  const themeToggle = document.getElementById('themeToggle');
  const currentTheme = localStorage.getItem('laguer_theme') || 'dark';

  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
      if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      document.body.classList.remove('light-mode');
      if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    localStorage.setItem('laguer_theme', theme);
  }
  applyTheme(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const isLight = document.body.classList.contains('light-mode');
      applyTheme(isLight ? 'dark' : 'light');
    });
  }

  // =====================================================================
  // 2. IDIOMA (ES/EN)
  // =====================================================================
  const translations = {
    es: {
      'topbar_envios': 'Envíos a todo el Perú',
      'topbar_rastrear': 'Rastrea tu pedido',
      'menu_tecnologia': 'Tecnología',
      'menu_hogar': 'Hogar',
      'menu_deportes': 'Deportes',
      'menu_accesorios': 'Accesorios',
      'menu_ofertas': 'Ofertas',
      'buscar': 'Buscar productos…',
      'cookies_texto': 'Usamos cookies para mejorar tu experiencia. Al continuar, aceptas nuestra',
      'politica_privacidad': 'política de privacidad',
      'rechazar': 'Rechazar',
      'configurar': 'Configurar',
      'aceptar': 'Aceptar',
      'footer_desc': 'Tecnología, estilo y calidad en un solo lugar.',
      'siguenos': 'Síguenos:',
      'categorias': 'Categorías',
      'ayuda': 'Ayuda',
      'nosotros': 'Nosotros',
      'rastrear': 'Rastrear pedido',
      'cambios': 'Cambios y devoluciones',
      'medios_pago': 'Medios de pago',
      'preguntas': 'Preguntas frecuentes',
      'sobre': 'Sobre LAGUER',
      'contacto': 'Contacto',
      'terminos': 'Términos',
      'privacidad': 'Privacidad',
      'inicio': 'Inicio',
      'productos': 'Productos',
      'carrito': 'Carrito',
      'perfil': 'Perfil',
      'hecho_con': 'Hecho con ♥ para todo el Perú',
      'ver_todas': 'Ver todas',
      // Página contacto
      'contacto_titulo': 'Contáctanos',
      'contacto_sub': 'Estamos aquí para ayudarte',
      'contacto_nombre': 'Nombre completo',
      'contacto_email': 'Correo electrónico',
      'contacto_mensaje': 'Mensaje',
      'contacto_enviar': 'Enviar mensaje',
      // Página nosotros
      'nosotros_titulo': 'Sobre LAGUER',
      'nosotros_sub': 'Conoce nuestra historia',
      // Página términos
      'terminos_titulo': 'Términos y condiciones',
      'terminos_sub': 'Lee nuestros términos de uso',
      // Página privacidad
      'privacidad_titulo': 'Política de privacidad',
      'privacidad_sub': 'Cómo protegemos tus datos'
    },
    en: {
      'topbar_envios': 'Shipping to all Peru',
      'topbar_rastrear': 'Track your order',
      'menu_tecnologia': 'Technology',
      'menu_hogar': 'Home',
      'menu_deportes': 'Sports',
      'menu_accesorios': 'Accessories',
      'menu_ofertas': 'Offers',
      'buscar': 'Search products…',
      'cookies_texto': 'We use cookies to improve your experience. By continuing, you accept our',
      'politica_privacidad': 'privacy policy',
      'rechazar': 'Reject',
      'configurar': 'Settings',
      'aceptar': 'Accept',
      'footer_desc': 'Technology, style and quality in one place.',
      'siguenos': 'Follow us:',
      'categorias': 'Categories',
      'ayuda': 'Help',
      'nosotros': 'About',
      'rastrear': 'Track order',
      'cambios': 'Returns & exchanges',
      'medios_pago': 'Payment methods',
      'preguntas': 'FAQ',
      'sobre': 'About LAGUER',
      'contacto': 'Contact',
      'terminos': 'Terms',
      'privacidad': 'Privacy',
      'inicio': 'Home',
      'productos': 'Products',
      'carrito': 'Cart',
      'perfil': 'Profile',
      'hecho_con': 'Made with ♥ for all Peru',
      'ver_todas': 'View all',
      'contacto_titulo': 'Contact us',
      'contacto_sub': 'We are here to help you',
      'contacto_nombre': 'Full name',
      'contacto_email': 'Email address',
      'contacto_mensaje': 'Message',
      'contacto_enviar': 'Send message',
      'nosotros_titulo': 'About LAGUER',
      'nosotros_sub': 'Know our story',
      'terminos_titulo': 'Terms and conditions',
      'terminos_sub': 'Read our terms of use',
      'privacidad_titulo': 'Privacy policy',
      'privacidad_sub': 'How we protect your data'
    }
  };

  const langSelector = document.getElementById('languageSelector');
  let currentLang = localStorage.getItem('laguer_lang') || 'es';

  function applyTranslations(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = translations[lang]?.[key] || translations.es[key] || key;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      el.placeholder = translations[lang]?.[key] || translations.es[key] || key;
    });
    if (langSelector) langSelector.value = lang;
    localStorage.setItem('laguer_lang', lang);
  }

  if (langSelector) {
    langSelector.addEventListener('change', function() {
      currentLang = this.value;
      applyTranslations(currentLang);
    });
  }

  applyTranslations(currentLang);

  // =====================================================================
  // 3. CARRITO Y FAVORITOS (global)
  // =====================================================================
  const CART_KEY = 'laguerCart';
  const FAV_KEY = 'laguerFavs';
  let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  let favs = JSON.parse(localStorage.getItem(FAV_KEY)) || [];

  function updateCartUI() {
    const totalItems = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
    document.querySelectorAll('.cart-count, #cartCount').forEach(el => el.textContent = totalItems);
    const bottomBadge = document.getElementById('bottomCartBadge');
    if (bottomBadge) {
      bottomBadge.textContent = totalItems;
      bottomBadge.style.display = totalItems === 0 ? 'none' : 'flex';
    }
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function updateFavUI() {
    const count = favs.length;
    document.querySelectorAll('.fav-count, #favCount').forEach(el => el.textContent = count);
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  }

  // =====================================================================
  // 4. TOASTS
  // =====================================================================
  function showToast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = `<span class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // =====================================================================
  // 5. COOKIES
  // =====================================================================
  (function() {
    const COOKIE_KEY = 'laguer_cookie_consent';
    const banner = document.getElementById('cookieBanner');
    if (!banner) return;
    function getCookieConsent() { return localStorage.getItem(COOKIE_KEY); }
    function setCookieConsent(value) {
      localStorage.setItem(COOKIE_KEY, value);
      banner.classList.remove('show');
    }
    if (!getCookieConsent()) {
      setTimeout(() => banner.classList.add('show'), 500);
    }
    document.getElementById('cookieAccept')?.addEventListener('click', function() {
      setCookieConsent('accepted');
      showToast('🍪 Cookies aceptadas.', 'success');
    });
    document.getElementById('cookieReject')?.addEventListener('click', function() {
      setCookieConsent('rejected');
      showToast('🍪 Cookies rechazadas.', 'info');
    });
    document.getElementById('cookieSettings')?.addEventListener('click', function() {
      showToast('⚙️ Configuración de cookies.', 'info');
    });
  })();

  // =====================================================================
  // 6. INICIALIZAR AL CARGAR
  // =====================================================================
  document.addEventListener('DOMContentLoaded', function() {
    updateCartUI();
    updateFavUI();
    // Marcar enlace activo en bottom nav
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.bottom-nav a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === currentPath || (currentPath === 'index.html' && href === 'index.html')) {
        a.classList.add('active');
      }
    });
  });

  // Exponer funciones globales
  window.addToCart = function(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) existing.quantity = (existing.quantity || 1) + 1;
    else cart.push({ ...product, quantity: 1 });
    updateCartUI();
    showToast(`✅ "${product.name}" agregado.`, 'success');
  };

  window.toggleFav = function(productId, btnElement) {
    const index = favs.findIndex(p => p.id === productId);
    if (index === -1) {
      // Buscar el producto en los datos disponibles (se pasa desde la página)
      const prod = window.productData?.find(p => p.id === productId);
      if (prod) {
        favs.push({ ...prod });
        if (btnElement) {
          btnElement.textContent = '♥';
          btnElement.style.color = 'var(--red)';
          btnElement.classList.add('active');
        }
        showToast('❤️ Agregado a favoritos.', 'info');
      }
    } else {
      favs.splice(index, 1);
      if (btnElement) {
        btnElement.textContent = '♡';
        btnElement.style.color = 'var(--white)';
        btnElement.classList.remove('active');
      }
      showToast('💔 Eliminado de favoritos.', 'info');
    }
    updateFavUI();
  };

  window.showToast = showToast;
  console.log('🌐 LAGUER Global JS cargado – tema, idioma, carrito, favoritos, toasts, cookies');
})();