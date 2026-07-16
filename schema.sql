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
-- Única tabla nueva que necesita el bot de WhatsApp.
-- Los pedidos y productos se guardan directamente en tus tablas
-- existentes "pedidos" y "productos", no se duplica nada.

CREATE TABLE IF NOT EXISTS conversaciones (
  telefono TEXT PRIMARY KEY,
  historial TEXT NOT NULL DEFAULT '[]',
  actualizado DATETIME DEFAULT CURRENT_TIMESTAMP
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
-- DATOS INICIALES (ORIGINALES)
-- ============================================================
INSERT OR IGNORE INTO users (nombre, email, password, rol)
VALUES ('Administrador', 'admin@laguer.pe', 'Admin2026!', 'admin');

-- Productos de ejemplo (Originales)
INSERT OR IGNORE INTO productos (nombre, categoria, precio, stock, imagen, descripcion) VALUES
('Smartwatch Pro', 'tecnologia', 199, 12, '/image/productos/smartwatch-pro.jpg', 'Smartwatch con pantalla AMOLED y GPS'),
('Audífonos BT', 'audio', 89, 8, '/image/productos/audifonos-bt.jfif', 'Audífonos Bluetooth con cancelación de ruido'),
('Lámpara LED', 'hogar', 45, 18, '/image/productos/lampara-led.jfif', 'Lámpara LED inteligente controlada por app'),
('Mochila Deportiva', 'deportes', 120, 10, '/image/productos/mochila-deportiva.jfif', 'Mochila impermeable para laptop'),
('Cargador Rápido', 'accesorios', 35, 25, '/image/productos/cargador-rapido.jfif', 'Cargador USB-C de 20W');

-- ============================================================
-- MÁS DATOS AGREGADOS PARA EL PANEL (SIN TOCAR LO ANTERIOR)
-- ============================================================

-- Más Productos (Para llenar el catálogo e inventario)
INSERT OR IGNORE INTO productos (nombre, categoria, precio, stock, imagen, descripcion, descuento) VALUES
('Teclado Mecánico RGB', 'gaming', 150, 5, 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500', 'Teclado mecánico con switches blue y luz RGB', 15),
('Mouse Gamer 12000 DPI', 'gaming', 65, 3, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500', 'Mouse de alta precisión para juegos FPS', 0),
('Monitor Curvo 24"', 'tecnologia', 450, 4, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500', 'Monitor curvo Full HD 144Hz', 10),
('Silla Ergonómica', 'hogar', 320, 7, 'https://images.unsplash.com/photo-1580480045273-5b4c3e1a8c2b?w=500', 'Silla de oficina con soporte lumbar', 0),
('Proyector Portátil', 'tecnologia', 280, 2, 'https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=500', 'Proyector mini LED 1080p', 5),
('Bicicleta Plegable', 'deportes', 590, 2, 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=500', 'Bicicleta plegable 20" 7 velocidades', 0),
('Altavoz Bluetooth', 'audio', 110, 15, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', 'Altavoz resistente al agua 20W', 0),
('Webcam Full HD', 'accesorios', 85, 20, 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500', 'Cámara web 1080p con micrófono', 0);

-- Más Usuarios (Clientes)
INSERT OR IGNORE INTO users (nombre, email, password, rol, telefono, direccion) VALUES
('Carlos Pérez', 'carlos@gmail.com', '123456', 'user', '987654321', 'Av. Lima 123, Miraflores'),
('María García', 'maria@yahoo.com', '654321', 'user', '987123456', 'Jr. Cusco 456, Cercado'),
('Tienda Comercial SA', 'ventas@tiendacom.com', 'admin123', 'user', '987111222', 'Av. Industrial 789, Ate');

-- Pedidos (Órdenes de compra para el panel)
INSERT OR IGNORE INTO pedidos (cliente_id, cliente_nombre, cliente_email, total, estado, items, direccion, telefono) VALUES
(2, 'Carlos Pérez', 'carlos@gmail.com', 288.00, 'completed', '[{"id":1,"nombre":"Smartwatch Pro","precio":199,"cantidad":1},{"id":7,"nombre":"Altavoz Bluetooth","precio":110,"cantidad":1}]', 'Av. Lima 123, Miraflores', '987654321'),
(3, 'María García', 'maria@yahoo.com', 150.00, 'pending', '[{"id":6,"nombre":"Teclado Mecánico RGB","precio":150,"cantidad":1}]', 'Jr. Cusco 456, Cercado', '987123456'),
(2, 'Carlos Pérez', 'carlos@gmail.com', 65.00, 'cancelled', '[{"id":7,"nombre":"Mouse Gamer 12000 DPI","precio":65,"cantidad":1}]', 'Av. Lima 123, Miraflores', '987654321'),
(4, 'Tienda Comercial SA', 'ventas@tiendacom.com', 450.00, 'completed', '[{"id":8,"nombre":"Monitor Curvo 24\"","precio":450,"cantidad":1}]', 'Av. Industrial 789, Ate', '987111222');

-- Actividad del sistema (Para el Dashboard)
INSERT OR IGNORE INTO registro_actividad (usuario, accion, detalles) VALUES
('Carlos Pérez', 'Nueva orden creada', 'Orden #1 completada por S/ 288.00'),
('María García', 'Registro de usuario', 'Nuevo cliente registrado desde la web'),
('Administrador', 'Stock actualizado', 'Inventario de Teclado Mecánico RGB modificado'),
('Carlos Pérez', 'Inicio de sesión', 'Inicio de sesión exitoso desde Chrome'),
('Tienda Comercial SA', 'Nueva orden creada', 'Orden #4 completada por S/ 450.00');

-- Movimientos de Inventario (Para el historial)
INSERT OR IGNORE INTO inventario_movimientos (producto_id, tipo, cantidad, motivo, stock_resultante) VALUES
(1, 'entrada', 20, 'Compra inicial a proveedor', 12),
(1, 'salida', 1, 'Venta - Orden #1', 11),
(6, 'entrada', 10, 'Reposición de stock', 5),
(6, 'salida', 1, 'Venta - Orden #2', 4);

-- Reclamos (Libro de reclamaciones)
INSERT OR IGNORE INTO reclamos (codigo, tipo_doc, num_doc, nombres, apellidos, email, telefono, motivo, descripcion, monto, estado) VALUES
('REC-001', 'DNI', '12345678', 'Carlos', 'Pérez', 'carlos@gmail.com', '987654321', 'Producto defectuoso', 'El smartwatch no enciende al recibirlo', 199.00, 'pendiente'),
('REC-002', 'RUC', '20555888222', 'Tienda Comercial', 'SA', 'ventas@tiendacom.com', '987111222', 'Envío retrasado', 'El pedido #4 tardó más de lo prometido', 0.00, 'en_proceso');