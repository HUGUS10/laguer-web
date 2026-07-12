// js/tema.js
(function() {
  'use strict';

  const THEME_KEY = 'laguer_theme';
  const toggleBtn = document.getElementById('themeToggle');

  // Aplicar tema guardado
  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
      if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      document.body.classList.remove('light-mode');
      if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
  }

  // Obtener tema guardado
  function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
  }

  // Guardar tema y aplicar
  function setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  }

  // Inicializar tema
  const savedTheme = getSavedTheme();
  applyTheme(savedTheme);

  // Evento del botón (si existe)
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      const isLight = document.body.classList.contains('light-mode');
      setTheme(isLight ? 'dark' : 'light');
    });
  }

  // Exponer funciones globalmente (por si necesitas usarlas desde otro script)
  window.themeUtils = {
    applyTheme,
    getSavedTheme,
    setTheme
  };

  console.log('🌓 Tema LAGUER listo (oscuro/claro)');
})();