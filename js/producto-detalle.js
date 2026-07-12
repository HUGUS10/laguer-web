// js/productos-data.js
export const sampleProducts = {
  'p1': {
    id: 'p1',
    name: 'Smartwatch Pro',
    category: 'tecnologia',
    price: 199,
    discount: 30,
    stock: 12,
    description: 'Smartwatch con pantalla AMOLED 1.4", GPS, monitoreo de frecuencia cardíaca, resistencia al agua 5ATM y batería de 7 días.',
    images: [
      'image/productos/smartwatch-pro.jpg',
      'image/productos/smartwatch-pro-1.jpg',
      'image/productos/smartwatch-pro-2.jpg',
      'image/productos/smartwatch-pro-3.jpg'
    ],
    colors: ['#1a1a1a', '#ffffff', '#ff4444'],
    sizes: ['Único'],
    characteristics: ['Pantalla AMOLED', 'GPS integrado', 'Monitoreo cardíaco', 'Resistente al agua 5ATM']
  },
  'p2': {
    id: 'p2',
    name: 'Audífonos BT',
    category: 'audio',
    price: 89,
    discount: 20,
    stock: 8,
    description: 'Audífonos inalámbricos con cancelación de ruido, 20 horas de batería, carga rápida y diseño ergonómico.',
    images: [
      'image/productos/audifonos-bt.jfif',
      'image/productos/audifonos-bt-1.jfif',
      'image/productos/audifonos-bt-2.jfif'
    ],
    colors: ['#000000', '#ffffff'],
    sizes: ['Único'],
    characteristics: ['Bluetooth 5.0', 'Cancelación de ruido', '20h batería', 'Carga rápida']
  },
  'p3': {
    id: 'p3',
    name: 'Lámpara LED',
    category: 'hogar',
    price: 45,
    discount: 0,
    stock: 22,
    description: 'Lámpara LED inteligente, control por app, 16 millones de colores, compatible con Alexa y Google Home.',
    images: ['image/productos/lampara-led.jfif'],
    colors: ['#ffffff'],
    sizes: ['Único'],
    characteristics: ['Control por app', '16M colores', 'Compatible con Alexa', 'Eficiencia energética']
  },
  'p4': {
    id: 'p4',
    name: 'Mochila Deportiva',
    category: 'deportes',
    price: 120,
    discount: 10,
    stock: 5,
    description: 'Mochila impermeable con compartimento para laptop, bolsillos laterales y correas acolchadas.',
    images: [
      'image/productos/mochila-deportiva.jfif',
      'image/productos/mochila-deportiva-1.jfif'
    ],
    colors: ['#1a1a1a', '#2e86de'],
    sizes: ['Único'],
    characteristics: ['Impermeable', 'Compartimento laptop', 'Correas acolchadas', 'Bolsillos laterales']
  },
  'p5': {
    id: 'p5',
    name: 'Cargador Rápido',
    category: 'accesorios',
    price: 35,
    discount: 0,
    stock: 30,
    description: 'Cargador USB-C de 20W con carga rápida, compatible con todos los dispositivos.',
    images: [
      'image/productos/cargador-rapido.jfif',
      'image/productos/cargador-rapido-1.jfif'
    ],
    colors: ['#ffffff'],
    sizes: ['Único'],
    characteristics: ['20W', 'USB-C', 'Carga rápida', 'Compatible universal']
  },
  'p6': {
    id: 'p6',
    name: 'Teclado Gaming',
    category: 'gaming',
    price: 150,
    discount: 15,
    stock: 7,
    description: 'Teclado mecánico con retroiluminación RGB, switches intercambiables y reposamuñecas ergonómico.',
    images: [
      'image/productos/teclado-gaming.jfif',
      'image/productos/teclado-gaming-1.jfif'
    ],
    colors: ['#1a1a1a'],
    sizes: ['Único'],
    characteristics: ['Mecánico', 'RGB', 'Switches intercambiables', 'Reposamuñecas']
  },
  'p7': {
    id: 'p7',
    name: 'Polo Deportivo',
    category: 'deportes',
    price: 89,
    discount: 25,
    stock: 15,
    description: 'Polo de algodón transpirable, ideal para entrenar o uso diario. Cuello redondo y estampado resistente.',
    images: [
      'image/productos/polo-deportivo.jfif',
      'image/productos/polo-deportivo-1.jfif',
      'image/productos/polo-deportivo-2.jfif'
    ],
    colors: ['#1a73e8', '#ea4335', '#000000'],
    sizes: ['S', 'M', 'L', 'XL'],
    characteristics: ['100% algodón', 'Cuello redondo', 'Doble costura', 'Estampado resistente']
  },
  'p8': {
    id: 'p8',
    name: 'Set Organizadores',
    category: 'hogar',
    price: 60,
    discount: 0,
    stock: 10,
    description: 'Set de 5 organizadores de escritorio, ideales para mantener tu espacio ordenado y limpio.',
    images: [
      'image/productos/set-organizadores.jfif',
      'image/productos/set-organizadores-1.jfif'
    ],
    colors: ['#ffffff'],
    sizes: ['Único'],
    characteristics: ['5 piezas', 'Material resistente', 'Diseño moderno', 'Fácil limpieza']
  }
};

export function getProductsArray() {
  return Object.values(sampleProducts);
}

export function getProductById(id) {
  return sampleProducts[id] || null;
}
