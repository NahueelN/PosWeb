export type AyudaTipo = 'solapa' | 'concepto'

import pesableAlta from './screenshots/pesable-alta.png'
import pesableVenta from './screenshots/pesable-venta.png'
import bultoAlta from './screenshots/bulto-alta.png'
import bultoFuncionamiento from './screenshots/bulto-funcionamiento.png'
import cantidadIdealUbicacion from './screenshots/cantidad-ideal-ubicacion.png'
import cantidadIdealStock from './screenshots/cantidad-ideal-stock.png'
import cantidadIdealPedido from './screenshots/cantidad-ideal-pedido.png'
import cierreCaja from './screenshots/cierre-caja.png'
import cierreCajaResumen from './screenshots/cierre-caja-resumen.png'
import mesas from './screenshots/mesas.png'
import mesasCocina from './screenshots/mesas-cocina.png'
import consultaProducto from './screenshots/consulta-producto.png'
import barcodeScanner from './screenshots/barcode-scanner.png'

export interface AyudaItem {
  /** Clave única usada en la URL ?key= */
  key: string
  titulo: string
  tipo: AyudaTipo
  definicion: string
  ejemplo?: string
  /** true = la UI muestra la tarjeta "captura pendiente" hasta que exista la imagen */
  necesitaImagen?: boolean
  /** Capturas de pantalla, en orden de visualización */
  imagenes?: string[]
  relacionados?: string[]
}

export interface AyudaModulo {
  /** Clave única del módulo */
  key: string
  titulo: string
  definicion: string
  ejemplo?: string
  necesitaImagen?: boolean
  imagenes?: string[]
  relacionados?: string[]
  /** Solapas y conceptos que pertenecen a este módulo */
  items: AyudaItem[]
}

export const AYUDA_MODULOS: AyudaModulo[] = [
  {
    key: 'modulo-inicio',
    titulo: 'Inicio',
    definicion: 'Pantalla principal del programa. Para los administradores muestra un dashboard con la actividad del negocio; para el resto, una pantalla de bienvenida.',
    items: [],
  },
  {
    key: 'modulo-ventas',
    titulo: 'Ventas',
    definicion: 'Registra las ventas del día: buscás productos, armás el carrito, elegís el medio de pago y confirmás. Al finalizar se puede imprimir el ticket.',
    relacionados: ['concepto-venta', 'concepto-multipago'],
    items: [
      {
        key: 'concepto-venta',
        titulo: 'Venta',
        tipo: 'concepto',
        definicion: 'Operación en la que se entregan productos a un cliente a cambio de un pago. Puede ser por unidad, por peso (pesable) o por bulto, y puede combinarse con varios medios de pago.',
        relacionados: ['concepto-multipago'],
      },
      {
        key: 'concepto-multipago',
        titulo: 'Venta con multipago',
        tipo: 'concepto',
        definicion: 'Una misma venta se puede cobrar con más de un medio de pago. Por ejemplo: $3.000 en efectivo y el resto con tarjeta. El sistema reparte el total entre los medios elegidos.',
        ejemplo: 'Total $5.000 → $2.000 en efectivo y $3.000 con tarjeta de débito.',
        necesitaImagen: true,
        relacionados: ['concepto-venta'],
      },
      {
        key: 'concepto-sucursal',
        titulo: 'Sucursal',
        tipo: 'concepto',
        definicion: 'Cada local del negocio. El stock y las cajas se manejan por sucursal, y las ventas se registran en la sucursal activa. Al operar se elige la sucursal sobre la que se trabaja.',
      },
    ],
  },
  {
    key: 'modulo-compras',
    titulo: 'Compras',
    definicion: 'Registra las compras a proveedores. Al confirmar una compra se actualiza el stock de los productos cargados.',
    relacionados: ['concepto-compra', 'modulo-proveedores'],
    items: [
      {
        key: 'concepto-compra',
        titulo: 'Compra',
        tipo: 'concepto',
        definicion: 'Operación en la que se reciben productos de un proveedor. Al confirmarla se actualiza el stock y, si corresponde, se registra una deuda con el proveedor.',
      },
    ],
  },
  {
    key: 'modulo-gastos',
    titulo: 'Gastos',
    definicion: 'Registra los gastos del negocio (alquiler, servicios, sueldos, etc.). Se descuentan del balance de caja.',
    relacionados: ['modulo-caja'],
    items: [],
  },
  {
    key: 'modulo-deudas',
    titulo: 'Deudas',
    definicion: 'Administra las deudas pendientes con clientes y proveedores. Permite registrar pagos a cuenta y consultar el saldo de cada contacto.',
    relacionados: ['concepto-deuda', 'modulo-clientes', 'modulo-proveedores'],
    items: [
      {
        key: 'concepto-deuda',
        titulo: 'Deuda',
        tipo: 'concepto',
        definicion: 'Saldo pendiente de un cliente o proveedor. Las deudas de clientes surgen de ventas no pagadas en su totalidad; las de proveedores, de compras no pagadas. Se registran pagos a cuenta hasta saldar el saldo.',
      },
    ],
  },
  {
    key: 'modulo-pedidos',
    titulo: 'Pedidos',
    definicion: 'Sugiere qué productos reponer según la cantidad ideal de stock. Armás un pedido con los productos sugeridos y lo enviás por WhatsApp o mail.',
    relacionados: ['concepto-cantidad-ideal', 'concepto-pedido'],
    items: [
      {
        key: 'concepto-pedido',
        titulo: 'Pedido',
        tipo: 'concepto',
        definicion: 'Lista de productos sugeridos para reponer según la cantidad ideal de stock. Se puede armar, editar la cantidad y enviar al proveedor por WhatsApp o mail.',
        relacionados: ['concepto-cantidad-ideal'],
      },
    ],
  },
  {
    key: 'modulo-caja',
    titulo: 'Caja',
    definicion: 'Controla la apertura y el cierre de caja del día. Muestra el total vendido, los medios de pago y permite cerrar la caja con el conteo de efectivo.',
    relacionados: ['concepto-caja', 'concepto-cierre-caja'],
    items: [
      {
        key: 'concepto-caja',
        titulo: 'Caja',
        tipo: 'concepto',
        definicion: 'Registro del dinero en efectivo del negocio durante el día. Se abre al empezar a operar (con un monto inicial) y se cierra al terminar, comparando lo esperado contra el dinero contado.',
        relacionados: ['concepto-cierre-caja'],
      },
      {
        key: 'concepto-cierre-caja',
        titulo: 'Cierre de caja',
        tipo: 'concepto',
        definicion: 'Proceso que finaliza la jornada de caja. Muestra el total vendido por medio de pago, los gastos, y compara el efectivo esperado contra el contado, informando la diferencia. Al cerrar se genera un ticket de cierre.',
        necesitaImagen: true,
        imagenes: [cierreCaja, cierreCajaResumen],
        relacionados: ['concepto-caja'],
      },
      {
        key: 'solapa-caja-configuracion',
        titulo: 'Caja → Configuración',
        tipo: 'solapa',
        definicion: 'Configura el comportamiento de la caja, como qué medios de pago se muestran y cómo se manejan los vuelto.',
      },
    ],
  },
  {
    key: 'modulo-mesas',
    titulo: 'Mesas',
    definicion: 'Módulo de restaurante: administra mesas, comandas y cuentas. Permite abrir una mesa, cargar productos, unificar cuentas y cobrar.',
    relacionados: ['concepto-mesa', 'concepto-comanda'],
    items: [
      {
        key: 'concepto-mesa',
        titulo: 'Mesa',
        tipo: 'concepto',
        definicion: 'Cada espacio del salón donde se atienden comensales. Una mesa puede abrirse, cargarse de productos (comanda) y cobrarse al final. El mapa de mesas permite ver el estado de todas a la vez.',
        necesitaImagen: true,
        imagenes: [mesas, mesasCocina],
        relacionados: ['concepto-comanda'],
      },
      {
        key: 'concepto-comanda',
        titulo: 'Comanda',
        tipo: 'concepto',
        definicion: 'Registro de los productos pedidos en una mesa. Se imprime para la cocina y puede editarse (agregar o quitar ítems) hasta el momento de cobrar la cuenta.',
        relacionados: ['concepto-mesa'],
      },
    ],
  },
  {
    key: 'modulo-productos',
    titulo: 'Productos',
    definicion: 'Administra el catálogo de productos: alta, edición, importación masiva, categorías y unidades de medida. Cada producto puede ser por unidad, pesable o bulto.',
    relacionados: ['concepto-producto', 'concepto-pesable', 'concepto-bulto'],
    items: [
      {
        key: 'concepto-producto',
        titulo: 'Producto',
        tipo: 'concepto',
        definicion: 'Cualquier artículo que se vende en el negocio. Tiene código de barras, nombre, precio, costo y stock. Puede ser de tres tipos: por unidad, pesable o bulto.',
        relacionados: ['concepto-pesable', 'concepto-bulto'],
      },
      {
        key: 'concepto-pesable',
        titulo: 'Producto pesable',
        tipo: 'concepto',
        definicion: 'Producto que se vende por peso (kg), como fiambres, verduras o carnes. Al momento de la venta se carga la cantidad en kilogramos y el sistema calcula el total. Su unidad de medida queda fijada en KG.',
        ejemplo: 'Vendés 0,750 kg de jamón a $12.000 el kg → el total es $9.000.',
        necesitaImagen: true,
        imagenes: [pesableAlta, pesableVenta],
        relacionados: ['concepto-producto'],
      },
      {
        key: 'concepto-bulto',
        titulo: 'Producto bulto',
        tipo: 'concepto',
        definicion: 'Producto que representa un empaque o agrupación (ej: una caja de 6 gaseosas), sin stock, costo ni precio propios. Se asocia a un producto unidad: al vender o recibir un bulto, se actualiza el stock del producto unidad multiplicado por la cantidad que contiene.',
        ejemplo: 'La caja de 6 gaseosas está asociada a la gaseosa unidad. Recibís 2 cajas → se suman 12 unidades al stock.',
        necesitaImagen: true,
        imagenes: [bultoAlta, bultoFuncionamiento],
        relacionados: ['concepto-producto'],
      },
      {
        key: 'concepto-cantidad-ideal',
        titulo: 'Cantidad ideal',
        tipo: 'concepto',
        definicion: 'Nivel de stock que el negocio considera óptimo para un producto. Se configura en Configuración → Stock → control individual por producto. Cuando el stock está por debajo de la cantidad ideal, el módulo de Pedidos sugiere reponerlo; también alerta cuando cae por debajo del 20% del ideal.',
        ejemplo: 'Si un producto tiene cantidad ideal de 50 y el stock actual es 12, el módulo de Pedidos sugiere comprar 38 unidades.',
        necesitaImagen: true,
        imagenes: [cantidadIdealUbicacion, cantidadIdealStock, cantidadIdealPedido],
        relacionados: ['modulo-pedidos'],
      },
      {
        key: 'concepto-categoria',
        titulo: 'Categoría',
        tipo: 'concepto',
        definicion: 'Agrupación para organizar los productos (ej: Bebidas, Snacks, Fiambres). Puede tener un margen de ganancia sugerido que se aplica a los productos de esa categoría.',
      },
      {
        key: 'concepto-unidad-medida',
        titulo: 'Unidad de medida',
        tipo: 'concepto',
        definicion: 'Define la unidad en la que se vende o se cuenta un producto (Unidad, KG, Litro, etc.).',
      },
      {
        key: 'solapa-productos-configuracion',
        titulo: 'Productos → Configuración',
        tipo: 'solapa',
        definicion: 'Configura categorías y unidades de medida que se usan para organizar el catálogo y asignar márgenes sugeridos.',
      },
      {
        key: 'solapa-productos-actualizacion',
        titulo: 'Productos → Actualización masiva',
        tipo: 'solapa',
        definicion: 'Permite actualizar el precio o el costo de varios productos a la vez aplicando un porcentaje de ajuste.',
      },
      {
        key: 'solapa-stock',
        titulo: 'Stock (Configuración)',
        tipo: 'solapa',
        definicion: 'Control de inventario por producto. Permite habilitar el seguimiento de stock y definir la cantidad ideal por producto.',
        relacionados: ['concepto-cantidad-ideal'],
      },
    ],
  },
  {
    key: 'modulo-vencimientos',
    titulo: 'Vencimientos',
    definicion: 'Controla las fechas de vencimiento de los productos que lo requieren (alimentos, bebidas). Alerta con anticipación qué productos están por vencer.',
    relacionados: ['concepto-vencimiento'],
    items: [
      {
        key: 'concepto-vencimiento',
        titulo: 'Vencimiento',
        tipo: 'concepto',
        definicion: 'Fecha límite de un producto perecedero (alimento, bebida). El módulo de Vencimientos permite cargar varias fechas por producto y alerta con anticipación los que están por vencer.',
        relacionados: ['modulo-vencimientos'],
      },
    ],
  },
  {
    key: 'modulo-ofertas',
    titulo: 'Ofertas',
    definicion: 'Crea combos y ofertas: agrupás varios productos en un paquete con precio especial para incentivar la venta.',
    relacionados: ['concepto-combo'],
    items: [
      {
        key: 'concepto-combo',
        titulo: 'Combo / Oferta',
        tipo: 'concepto',
        definicion: 'Agrupación de productos que se venden juntos a un precio especial, menor a la suma de los precios individuales.',
        ejemplo: 'Hamburguesa + papas + gaseosa = $10.000 en lugar de $12.500 por separado.',
      },
    ],
  },
  {
    key: 'modulo-historial',
    titulo: 'Historial',
    definicion: 'Consulta el historial de ventas y compras por rango de fechas. Permite reimprimir tickets y ver el detalle de cada operación.',
    items: [
      {
        key: 'solapa-historial-compras',
        titulo: 'Historial → Compras',
        tipo: 'solapa',
        definicion: 'Consulta el historial de compras a proveedores. Solo visible para administradores.',
      },
    ],
  },
  {
    key: 'modulo-clientes',
    titulo: 'Clientes',
    definicion: 'Administra la agenda de clientes. Un cliente puede tener deudas asociadas.',
    relacionados: ['modulo-deudas'],
    items: [
      {
        key: 'concepto-cliente',
        titulo: 'Cliente',
        tipo: 'concepto',
        definicion: 'Persona o entidad que compra en el negocio. Puede tener deudas asociadas.',
        relacionados: ['modulo-deudas'],
      },
    ],
  },
  {
    key: 'modulo-proveedores',
    titulo: 'Proveedores',
    definicion: 'Administra la agenda de proveedores, a quienes se les registran compras y deudas.',
    relacionados: ['modulo-compras', 'modulo-deudas'],
    items: [
      {
        key: 'concepto-proveedor',
        titulo: 'Proveedor',
        tipo: 'concepto',
        definicion: 'Persona o entidad que vende productos al negocio. Se le registran compras y, si no se pagan al momento, deudas.',
        relacionados: ['modulo-compras', 'modulo-deudas'],
      },
    ],
  },
  {
    key: 'modulo-configuracion',
    titulo: 'Configuración',
    definicion: 'Configuración general del programa: perfil del usuario, alta de usuarios, compartir datos y respaldos.',
    items: [
      {
        key: 'solapa-configuracion-usuarios',
        titulo: 'Configuración → Usuarios',
        tipo: 'solapa',
        definicion: 'Alta y administración de usuarios del sistema, con sus roles y permisos.',
      },
      {
        key: 'solapa-configuracion-compartir',
        titulo: 'Configuración → Compartir',
        tipo: 'solapa',
        definicion: 'Comparte información del negocio por WhatsApp o mail (por ejemplo, resúmenes o listados).',
      },
      {
        key: 'solapa-configuracion-respaldo',
        titulo: 'Configuración → Respaldo',
        tipo: 'solapa',
        definicion: 'Crea respaldos de la base de datos local y restaura copias previas.',
      },
    ],
  },
  {
    key: 'modulo-complementos',
    titulo: 'Complementos',
    definicion: 'Aplicaciones externas que acompañan a PosWeb: se descargan desde vendeto.com.ar y se ejecutan sin instalar. Para que funcionen, PosWeb tiene que estar abierto; se abren en la bandeja de herramientas de Windows.',
    items: [
      {
        key: 'concepto-barcode-scanner',
        titulo: 'Barcode Scanner',
        tipo: 'concepto',
        definicion: 'Complemento que lee códigos de barras desde el celular (a través de la red WiFi local) y los envía a la PC como si vinieran de un lector físico. Se descarga desde vendeto.com.ar, se ejecuta sin instalar y queda en la bandeja de herramientas de Windows. Requiere que PosWeb esté abierto.',
        ejemplo: 'Escaneás el código de un producto con el celular y aparece directamente en el campo de búsqueda de PosWeb.',
        imagenes: [barcodeScanner],
      },
      {
        key: 'concepto-consulta-producto',
        titulo: 'Consulta Producto',
        tipo: 'concepto',
        definicion: 'Complemento que consulta el precio de un producto al escanear su código de barras desde el celular. Se descarga desde vendeto.com.ar, se ejecuta sin instalar y queda en la bandeja de herramientas de Windows. Requiere que PosWeb esté abierto para consultar los precios.',
        ejemplo: 'Un cliente te muestra el código de un producto; lo escaneás con el celular y ves su precio sin tener que buscarlo en la PC.',
        imagenes: [consultaProducto],
      },
    ],
  },
]

/** Clave de cada módulo del menú para el botón ? de páginas sin solapas. */
export const HELP_KEYS = {
  inicio: 'modulo-inicio',
  ventas: 'modulo-ventas',
  compras: 'modulo-compras',
  gastos: 'modulo-gastos',
  deudas: 'modulo-deudas',
  pedidos: 'modulo-pedidos',
  caja: 'modulo-caja',
  mesas: 'modulo-mesas',
  productos: 'modulo-productos',
  vencimientos: 'modulo-vencimientos',
  ofertas: 'modulo-ofertas',
  historial: 'modulo-historial',
  clientes: 'modulo-clientes',
  proveedores: 'modulo-proveedores',
  configuracion: 'modulo-configuracion',
  complementos: 'modulo-complementos',
} as const

export interface AyudaEntrada {
  key: string
  titulo: string
  tipo: 'modulo' | 'solapa' | 'concepto'
  modulo: string
  definicion: string
  ejemplo?: string
  necesitaImagen?: boolean
  imagenes?: string[]
  relacionados?: string[]
}

/** Lista plana de todas las entradas (módulos + sus solapas y conceptos). */
export const AYUDA_ITEMS: AyudaEntrada[] = AYUDA_MODULOS.flatMap(modulo => [
  {
    key: modulo.key,
    titulo: modulo.titulo,
    tipo: 'modulo',
    modulo: modulo.titulo,
    definicion: modulo.definicion,
    ejemplo: modulo.ejemplo,
    necesitaImagen: modulo.necesitaImagen,
    imagenes: modulo.imagenes,
    relacionados: modulo.relacionados,
  },
  ...modulo.items.map(item => ({
    key: item.key,
    titulo: item.titulo,
    tipo: item.tipo,
    modulo: modulo.titulo,
    definicion: item.definicion,
    ejemplo: item.ejemplo,
    necesitaImagen: item.necesitaImagen,
    imagenes: item.imagenes,
    relacionados: item.relacionados,
  })),
])

export function getAyudaItem(key: string | null | undefined): AyudaEntrada | undefined {
  if (!key) return undefined
  return AYUDA_ITEMS.find(i => i.key === key)
}

export function getAyudaModulo(key: string): AyudaModulo | undefined {
  return AYUDA_MODULOS.find(m => m.key === key)
}