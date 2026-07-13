-- ============================================================
-- TABLAS PRINCIPALES
-- ============================================================

-- Usuarios
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  rol TEXT DEFAULT 'user',
  telefono TEXT,
  dni TEXT,
  direccion TEXT,
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Productos
CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  categoria TEXT,
  precio REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  imagen TEXT,
  descripcion TEXT,
  en_oferta INTEGER DEFAULT 0,
  descuento INTEGER DEFAULT 0,
  sku TEXT UNIQUE,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER,
  cliente_nombre TEXT NOT NULL,
  cliente_email TEXT,
  total REAL NOT NULL,
  estado TEXT DEFAULT 'pending',
  items TEXT NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  direccion TEXT,
  telefono TEXT,
  FOREIGN KEY (cliente_id) REFERENCES users(id)
);

-- Carrito
CREATE TABLE IF NOT EXISTS carrito (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  cantidad INTEGER DEFAULT 1,
  fecha_agregado DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  UNIQUE(user_id, producto_id)
);

-- Favoritos
CREATE TABLE IF NOT EXISTS favoritos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  fecha_agregado DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  UNIQUE(user_id, producto_id)
);

-- Mensajes internos
CREATE TABLE IF NOT EXISTS mensajes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  contenido TEXT,
  tipo TEXT DEFAULT 'nota',
  autor TEXT,
  leido INTEGER DEFAULT 0,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Movimientos de inventario
CREATE TABLE IF NOT EXISTS inventario_movimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  motivo TEXT,
  stock_resultante INTEGER NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Reclamos
CREATE TABLE IF NOT EXISTS reclamos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE,
  tipo_doc TEXT,
  num_doc TEXT,
  nombres TEXT,
  apellidos TEXT,
  email TEXT,
  telefono TEXT,
  pedido TEXT,
  motivo TEXT,
  descripcion TEXT,
  monto REAL,
  estado TEXT DEFAULT 'pendiente',
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Actividad del sistema
CREATE TABLE IF NOT EXISTS registro_actividad (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT,
  accion TEXT,
  detalles TEXT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_carrito_user ON carrito(user_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_user ON favoritos(user_id);

-- ============================================================
-- DATOS INICIALES
-- ============================================================
INSERT OR IGNORE INTO users (nombre, email, password, rol)
VALUES ('Administrador', 'admin@laguer.pe', 'Admin2026!', 'admin');

-- Productos de ejemplo
INSERT OR IGNORE INTO productos (nombre, categoria, precio, stock, imagen, descripcion) VALUES
('Smartwatch Pro', 'tecnologia', 199, 12, '/image/productos/smartwatch-pro.jpg', 'Smartwatch con pantalla AMOLED y GPS'),
('Audífonos BT', 'audio', 89, 8, '/image/productos/audifonos-bt.jfif', 'Audífonos Bluetooth con cancelación de ruido'),
('Lámpara LED', 'hogar', 45, 18, '/image/productos/lampara-led.jfif', 'Lámpara LED inteligente controlada por app'),
('Mochila Deportiva', 'deportes', 120, 10, '/image/productos/mochila-deportiva.jfif', 'Mochila impermeable para laptop'),
('Cargador Rápido', 'accesorios', 35, 25, '/image/productos/cargador-rapido.jfif', 'Cargador USB-C de 20W');