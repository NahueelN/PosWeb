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

export interface AyudaManualBloque {
  tipo: 'parrafo' | 'nota' | 'pasos' | 'lista' | 'tabla' | 'faq'
  /** parrafo / nota */
  texto?: string
  /** pasos (numerados) / lista (con viñetas) */
  items?: string[]
  /** tabla */
  columnas?: string[]
  filas?: string[][]
  /** faq */
  preguntas?: { pregunta: string; respuesta: string }[]
}

export interface AyudaManualSeccion {
  titulo: string
  bloques: AyudaManualBloque[]
}

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
  /** Manual detallado (secciones con párrafos, pasos, tablas y FAQ) */
  manual?: AyudaManualSeccion[]
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
  manual?: AyudaManualSeccion[]
  relacionados?: string[]
  /** Solapas y conceptos que pertenecen a este módulo */
  items: AyudaItem[]
}

export const AYUDA_MODULOS: AyudaModulo[] = [
  {
    key: 'modulo-primeros-pasos',
    titulo: 'Primeros pasos',
    definicion: 'Guía rápida para arrancar a vender con Vendeto: dar de alta tus productos, completar los datos del negocio, abrir la caja y hacer la primera venta.',
    relacionados: ['concepto-producto', 'concepto-caja', 'concepto-venta', 'concepto-cantidad-ideal', 'solapa-margenes', 'concepto-vincular-mp'],
    items: [],
    manual: [
      {
        titulo: 'Para arrancar a vender',
        bloques: [
          {
            tipo: 'parrafo',
            texto: 'Si recién instalaste el programa, seguí estos pasos en orden para hacer tu primera venta en pocos minutos.',
          },
          {
            tipo: 'pasos',
            items: [
              'Dará de alta tus productos: andá a Productos y cargá lo que vendés (nombre, código de barras, precio y costo). También podés importarlos desde un Excel.',
              'Completá los datos del negocio: en Configuración → Perfil cargá el nombre, la dirección y el teléfono, así salen correctamente en el ticket.',
              'Abrí la caja: en el módulo Caja cargá el monto inicial y tocá "Abrir caja".',
              'Vendé: andá a Ventas, buscá un producto por nombre o código de barras, armá el carrito, elegí el medio de pago y confirmá.',
            ],
          },
          {
            tipo: 'nota',
            texto: 'Con el plan Gratuito podés vender y manejar caja y stock de inmediato. Los demás módulos (compras, deudas, clientes, pedidos, etc.) los vas activando a medida que los necesites.',
          },
        ],
      },
      {
        titulo: 'Y después, ¿qué conviene configurar?',
        bloques: [
          {
            tipo: 'lista',
            items: [
              'Cantidad ideal de stock: para que el sistema te sugiera reposiciones cuando el stock baje.',
              'Márgenes por categoría: para que el precio de venta se calcule solo sobre el costo.',
              'Vincular MercadoPago: para cobrar con QR y por transferencia.',
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'modulo-inicio',
    titulo: 'Inicio',
    definicion: 'Pantalla principal del programa. Para los administradores (Admin/SuperAdmin) muestra un dashboard interactivo con la actividad del negocio; para los usuarios con rol "Usuario" muestra solo una imagen estática de Vendeto, sin datos.',
    relacionados: ['concepto-dashboard', 'concepto-inicio-usuario', 'concepto-atajos-teclado'],
    items: [
      {
        key: 'concepto-dashboard',
        titulo: 'Dashboard de Inicio',
        tipo: 'concepto',
        definicion: 'Pantalla de Inicio que ven los administradores: un tablero personalizable con la actividad del negocio (ventas del día, estado de caja, meta diaria, alertas, actividad reciente, rankings y gráficos).',
        necesitaImagen: true,
        relacionados: ['modulo-caja', 'modulo-ventas'],
        manual: [
          {
            titulo: 'Información sensible',
            bloques: [
              {
                tipo: 'nota',
                texto: 'El dashboard muestra dinero y métricas del negocio (ventas, facturación, caja, costos). Es información sensible: solo lo ven los administradores (Admin/SuperAdmin).',
              },
            ],
          },
          {
            titulo: 'Widgets disponibles',
            bloques: [
              {
                tipo: 'tabla',
                columnas: ['Tipo de widget', 'Qué muestra'],
                filas: [
                  ['KPI (indicador)', 'Ventas del día, estado de caja, meta diaria, ticket promedio y otros números con tendencia.'],
                  ['Alertas', 'Alertas urgentes priorizadas (por ejemplo, stock bajo).'],
                  ['Actividad reciente', 'Últimas ventas, compras, movimientos de caja y gastos registrados.'],
                  ['Rankings', 'Productos más vendidos (top productos).'],
                  ['Gráficos', 'Evolución de ventas en barras, líneas o torta.'],
                  ['Listas y tablas', 'Resúmenes y detalle de datos en listas o tablas.'],
                  ['Progreso y medidor', 'Cumplimiento de meta y otros indicadores visuales.'],
                ],
              },
            ],
          },
          {
            titulo: 'Personalizar el dashboard',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'Tocá el botón "+" para agregar un widget: elegí el módulo (Inicio, Ventas, Caja, etc.) y el widget que querés ver.',
                  'Mové y redimensioná los widgets arrastrándolos con el mouse.',
                  'Usá la edición de cada widget para ajustar sus opciones (colores, límites, período).',
                  'Con "Restablecer" volvés el dashboard a su estado original.',
                ],
              },
              {
                tipo: 'nota',
                texto: 'El orden y el tamaño de los widgets se guardan en la propia PC (no se sincronizan entre equipos) y se filtran por la sucursal activa.',
              },
            ],
          },
        ],
      },
      {
        key: 'concepto-inicio-usuario',
        titulo: 'Inicio para usuarios',
        tipo: 'concepto',
        definicion: 'Pantalla que ven los usuarios con rol "Usuario" (UsuarioComun) al entrar: una imagen estática de Vendeto, sin información del negocio. Las métricas y el dinero son solo para administradores.',
        relacionados: ['solapa-configuracion-usuarios'],
        manual: [
          {
            titulo: '¿Por qué no se ve el dashboard?',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'El dashboard muestra datos sensibles del negocio (ventas, dinero, métricas). Por privacidad, los usuarios con rol "Usuario" no acceden a esa información: al entrar a Inicio solo ven la imagen estática de Vendeto.',
              },
              {
                tipo: 'parrafo',
                texto: 'Si necesitás que un usuario vea las métricas, un administrador debe cambiarle el rol a Admin desde Configuración → Usuarios.',
              },
            ],
          },
        ],
      },
      {
        key: 'concepto-atajos-teclado',
        titulo: 'Atajos de teclado',
        tipo: 'concepto',
        definicion: 'Teclas que aceleran tareas frecuentes, disponibles en cualquier pantalla de Vendeto.',
        manual: [
          {
            titulo: 'Atajos disponibles',
            bloques: [
              {
                tipo: 'tabla',
                columnas: ['Tecla', 'Qué hace'],
                filas: [
                  ['F2', 'Abre la búsqueda rápida de productos desde cualquier pantalla.'],
                  ['Ctrl + Enter (o Cmd + Enter)', 'En la pantalla de venta, confirma la venta si hay un medio de pago elegido y productos en el carrito.'],
                  ['Escape', 'En el carrito de venta, vuelve el foco al buscador de productos.'],
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'modulo-ventas',
    titulo: 'Ventas',
    definicion: 'Registra las ventas del día: buscás productos, armás el carrito, elegís el medio de pago y confirmás. Al finalizar se puede imprimir el ticket.',
    relacionados: ['concepto-venta', 'concepto-multipago', 'concepto-vincular-mp', 'concepto-cobro-qr', 'concepto-transferencia-mp', 'concepto-venta-credito'],
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
        relacionados: ['concepto-venta', 'concepto-cobro-qr', 'concepto-transferencia-mp'],
      },
      {
        key: 'concepto-sucursal',
        titulo: 'Sucursal',
        tipo: 'concepto',
        definicion: 'Cada local del negocio. El stock y las cajas se manejan por sucursal, y las ventas se registran en la sucursal activa. Al operar se elige la sucursal sobre la que se trabaja.',
      },
      {
        key: 'concepto-venta-credito',
        titulo: 'Venta a crédito',
        tipo: 'concepto',
        definicion: 'Venta en la que el cliente no paga todo el monto en el momento: la diferencia queda registrada como deuda a su nombre (cuenta corriente) y se puede saldar después en el módulo Deudas.',
        necesitaImagen: true,
        relacionados: ['concepto-deuda', 'concepto-cliente', 'modulo-deudas'],
        manual: [
          {
            titulo: '¿Cómo funciona?',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'Al cobrar una venta, si el monto recibido es menor al total y no hay un cliente seleccionado, el sistema te pide elegir o crear un cliente: es obligatorio para poder registrar la parte no pagada como deuda.',
              },
              {
                tipo: 'pasos',
                items: [
                  'Armá el carrito y cargá el monto que el cliente paga (por ejemplo, una parte o un anticipo).',
                  'Elegí o creá el cliente que se lleva la venta a crédito.',
                  'Confirmá la venta: el saldo sin pagar queda como deuda a nombre del cliente.',
                  'Cuando el cliente venga a pagar, registrá el pago en Deudas → Clientes para saldar (o reducir) el saldo.',
                ],
              },
              {
                tipo: 'nota',
                texto: 'La deuda generada se ve y se administra en el módulo Deudas, pestaña Clientes. También se puede cobrar una cuenta de restaurante (mesa) a crédito eligiendo un cliente al momento de cobrar.',
              },
            ],
          },
        ],
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
        definicion: 'Lista de productos para reponer según la cantidad ideal de stock. Se puede armar, editar la cantidad y enviar al proveedor por WhatsApp o mail.',
        necesitaImagen: true,
        relacionados: ['concepto-cantidad-ideal'],
        manual: [
          {
            titulo: 'Sugerencias según la cantidad ideal',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'El pedido se apoya en la cantidad ideal de cada producto (configurada en Stock). Al armar un pedido, la pestaña "Alertas" muestra los productos que están por debajo del 20% de su cantidad ideal.',
              },
              {
                tipo: 'pasos',
                items: [
                  'En el módulo Pedidos, tocá "Nuevo pedido" y elegí el proveedor.',
                  'Abrí la pestaña "Alertas": cada producto alertado muestra cuántas unidades conviene reponer.',
                  'Tocá "+ Agregar X" sobre el producto: se agrega al pedido con la cantidad sugerida (cantidad ideal menos el stock actual).',
                ],
              },
              {
                tipo: 'nota',
                texto: 'Para que el sistema sugiera reposiciones, los productos deben tener definida su cantidad ideal. Más información en "Cantidad ideal".',
              },
            ],
          },
          {
            titulo: 'Armar y enviar el pedido',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'Agregá los productos que necesitás (desde la búsqueda o desde las alertas) y ajustá las cantidades.',
                  'Completá la fecha esperada y las observaciones si corresponde.',
                  'Enviá el pedido al proveedor por WhatsApp o por mail.',
                  'También podés guardarlo como pendiente para enviarlo o recibirlo después.',
                ],
              },
              {
                tipo: 'parrafo',
                texto: 'Si no tenés el proveedor cargado, podés usar "Proveedor ocasional" o crear uno nuevo en el momento. El pedido queda con estado Pendiente, y al completarse pasa a Completado.',
              },
            ],
          },
          {
            titulo: 'Recibir el pedido',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'Cuando llega la mercadería, abrís el pedido y marcás qué se recibió: podés indicar cantidades recibidas, faltantes y los precios reales. Al confirmar la recepción se actualiza el stock de los productos.',
              },
            ],
          },
        ],
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
        necesitaImagen: true,
        relacionados: ['concepto-cierre-caja'],
        manual: [
          {
            titulo: 'Abrir la caja',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'Andá al módulo Caja y elegí la sucursal sobre la que vas a operar.',
                  'Ingresá el monto inicial con el que arranca la caja (el efectivo que hay en el cajón al empezar).',
                  'Tocá "Abrir caja".',
                ],
              },
              {
                tipo: 'nota',
                texto: 'Si querés que la próxima jornada arranque con un saldo inicial fijo, podés dejar cargado el "saldo inicial del día siguiente": se ofrece automáticamente al abrir la caja del día siguiente.',
              },
            ],
          },
          {
            titulo: 'Mientras la caja está abierta',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'Con la caja abierta se muestra el avance del día: el total vendido por medio de pago, los gastos registrados y el efectivo esperado. Las ventas y los gastos se van sumando a la caja automáticamente.',
              },
            ],
          },
        ],
      },
      {
        key: 'concepto-cierre-caja',
        titulo: 'Cierre de caja',
        tipo: 'concepto',
        definicion: 'Proceso que finaliza la jornada de caja. Muestra el total vendido por medio de pago, los gastos, y compara el efectivo esperado contra el contado, informando la diferencia. Al cerrar se genera un ticket de cierre.',
        necesitaImagen: true,
        imagenes: [cierreCaja, cierreCajaResumen],
        relacionados: ['concepto-caja'],
        manual: [
          {
            titulo: 'Cerrar la caja',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'Con la caja abierta, en el módulo Caja completá el cierre.',
                  'Cargá el efectivo contado: el dinero que realmente hay en el cajón al contar.',
                  'Cargá el monto contado en tarjetas si corresponde.',
                  'Revisá las diferencias: el sistema compara lo contado contra lo esperado (según las ventas y los gastos) e informa si sobra o falta.',
                  'Confirmá el cierre: se genera el ticket de cierre y la jornada queda cerrada.',
                ],
              },
            ],
          },
          {
            titulo: 'Compartir el cierre',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'Tocá el cierre que querés compartir (el del día al cerrar, o cualquiera de los cierres anteriores del historial).',
                  'Se abre el detalle del cierre con el resumen financiero y el conteo de efectivo.',
                  'Usá "Compartir" para enviarlo por mail o WhatsApp, o "Imprimir" para sacar el ticket de cierre.',
                ],
              },
            ],
          },
          {
            titulo: 'Cierres anteriores',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'El módulo Caja muestra el historial de cierres: la fecha del cierre, el usuario, la apertura, el monto inicial, las ventas y la ganancia.',
              },
              {
                tipo: 'pasos',
                items: [
                  'En el módulo Caja, buscá en el historial de cierres (podés filtrar por rango de fechas y ordenar por fecha, usuario, inicial, ventas o ganancia).',
                  'Tocá un cierre para ver su detalle completo, sus movimientos y compartirlo.',
                ],
              },
            ],
          },
        ],
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
    definicion: 'Módulo de restaurante: administra mesas, comandas y cuentas. Permite abrir una mesa, cargar productos, unificar cuentas y cobrar. Solo está disponible si el tipo de negocio es Restaurante.',
    relacionados: ['concepto-mesa', 'concepto-comanda', 'solapa-mesas-cocina', 'concepto-tipo-negocio'],
    items: [
      {
        key: 'concepto-mesa',
        titulo: 'Mesa',
        tipo: 'concepto',
        definicion: 'Cada espacio del salón donde se atienden comensales. Una mesa puede abrirse, cargarse de productos (comanda) y cobrarse al final. El mapa de mesas permite ver el estado de todas a la vez.',
        necesitaImagen: true,
        imagenes: [mesas],
        relacionados: ['concepto-comanda'],
      },
      {
        key: 'solapa-mesas-cocina',
        titulo: 'Mesas → Cocina',
        tipo: 'solapa',
        definicion: 'Muestra todas las órdenes que están en cocina (Pendientes o EnCocina), ordenadas desde la más antigua, con el horario en que se enviaron a cocina y las mesas a las que pertenecen. Permite cambiar el estado de cada ítem (En cocina / Servido) e imprimir la comanda de nuevo.',
        imagenes: [mesasCocina],
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
        relacionados: ['modulo-pedidos', 'concepto-pedido'],
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
        key: 'solapa-productos-importacion',
        titulo: 'Productos → Importar',
        tipo: 'solapa',
        definicion: 'Carga masiva de productos desde un archivo Excel (.xls/.xlsx) con el formato de articulos.xls. Se crean solo los productos nuevos; los duplicados se omiten.',
        necesitaImagen: true,
        relacionados: ['concepto-producto'],
        manual: [
          {
            titulo: 'Formato del archivo',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'El archivo debe ser un Excel (.xls o .xlsx) con el formato de articulos.xls. Cada fila es un producto con sus columnas: código de barras, descripción, marca, rubro, precio, costo, stock y si controla stock.',
              },
              {
                tipo: 'nota',
                texto: 'También podés importar productos sin código de barras si está habilitada la opción "importar sin código".',
              },
            ],
          },
          {
            titulo: 'Cómo importar',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'En el módulo Productos, tocá "Importar".',
                  'Seleccioná el archivo Excel con los productos.',
                  'Al terminar se muestra el resultado: total de filas, productos creados y salteados.',
                ],
              },
            ],
          },
          {
            titulo: 'Duplicados y filas salteadas',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'Los productos cuyo código de barras ya existe (o está repetido dentro del archivo) se omiten automáticamente. Las filas con otros errores se muestran para corregirlas: editá los datos y tocá "Importar corregidos" para cargar solo esas filas.',
              },
            ],
          },
          {
            titulo: 'Límite del plan',
            bloques: [
              {
                tipo: 'nota',
                texto: 'Si la importación supera el máximo de productos activos de tu plan, se crean todos los productos y al final se desactivan los sobrantes hasta respetar el tope del plan.',
              },
            ],
          },
        ],
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
    relacionados: ['modulo-suscripcion', 'concepto-tipo-negocio'],
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
        necesitaImagen: true,
        manual: [
          {
            titulo: 'Qué es un respaldo',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'Un respaldo es una copia de todos los datos locales de Vendeto en un archivo con extensión .posweb-backup. Sirve para resguardar la información y para pasarla a otra PC.',
              },
              {
                tipo: 'nota',
                texto: 'La solapa Datos y respaldo solo está disponible para administradores en planes de pago (Básica o Máxima).',
              },
            ],
          },
          {
            titulo: 'Exportar (crear un respaldo)',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'Andá a Configuración → Datos y respaldo.',
                  'Tocá "Exportar respaldo".',
                  'Elegí dónde guardar el archivo .posweb-backup (o se descarga automáticamente).',
                ],
              },
              {
                tipo: 'nota',
                texto: 'Guardá los respaldos fuera de la PC (en un disco externo o en la nube) para no perderlos si el equipo falla.',
              },
            ],
          },
          {
            titulo: 'Importar (restaurar)',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'Andá a Configuración → Datos y respaldo.',
                  'Tocá "Seleccionar archivo" y elegí un archivo .posweb-backup.',
                  'Tocá "Restaurar y reemplazar datos": se validan los datos del respaldo (empresa, documento).',
                  'Confirmá la restauración. Al terminar, Vendeto se reinicia y hay que volver a ingresar con un usuario del respaldo.',
                ],
              },
              {
                tipo: 'nota',
                texto: 'Atención: restaurar reemplaza TODOS los datos locales actuales por los del respaldo. Verificá que sea el respaldo correcto antes de confirmar.',
              },
            ],
          },
        ],
      },
      {
        key: 'solapa-margenes',
        titulo: 'Configuración → Márgenes',
        tipo: 'solapa',
        definicion: 'Define el margen de ganancia sugerido por categoría. Ese porcentaje se usa para calcular el precio de venta de los productos de la categoría en base a su costo.',
        necesitaImagen: true,
        relacionados: ['concepto-categoria', 'concepto-producto'],
        manual: [
          {
            titulo: 'Qué es el margen',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'El margen es el porcentaje de ganancia que se asocia a cada categoría. Se usa como referencia para calcular el precio de venta de los productos de esa categoría.',
              },
              {
                tipo: 'parrafo',
                texto: 'Cómo se aplica al dar de alta un producto: cuando creás un producto y elegís una categoría que tiene margen definido, ese porcentaje se carga automáticamente en el campo margen del producto y el precio de venta se calcula en base al costo (costo × (1 + margen/100)). Siempre podés ajustar el margen manualmente en cada producto.',
              },
            ],
          },
          {
            titulo: 'Asignar un margen a una categoría',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'Andá a Configuración → Márgenes.',
                  'Buscá la categoría y tocá "Asignar" (o "Editar" si ya tiene margen).',
                  'Cargá el porcentaje y guardá. Se admite un valor entre 0 y 999.99.',
                  'Dejarlo vacío quita el margen de la categoría.',
                ],
              },
              {
                tipo: 'nota',
                texto: 'Para asignar márgenes primero tenés que crear categorías (pestaña Categorías en el módulo Productos).',
              },
            ],
          },
        ],
      },
      {
        key: 'concepto-tipo-negocio',
        titulo: 'Tipo de negocio',
        tipo: 'concepto',
        definicion: 'Clasificación del negocio como Tienda o Restaurante. La única diferencia entre ambas es que el tipo Restaurante tiene habilitado el módulo de Mesas.',
        relacionados: ['modulo-mesas'],
        manual: [
          {
            titulo: '¿Qué diferencia hay?',
            bloques: [
              {
                tipo: 'tabla',
                columnas: ['Tipo', 'Qué incluye'],
                filas: [
                  ['Tienda', 'Venta de mostrador sin mesas. El menú no muestra el módulo Mesas.'],
                  ['Restaurante', 'Habilita el módulo de Mesas: abrir mesas, cargar comandas, ver la cocina y cobrar cada cuenta. El resto funciona igual.'],
                ],
              },
              {
                tipo: 'parrafo',
                texto: 'Es la única diferencia: el tipo de negocio define si se puede operar con mesas o no. Todo lo demás (ventas, productos, caja, clientes, etc.) es igual en ambos tipos.',
              },
            ],
          },
          {
            titulo: 'Dónde se elige',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'Al registrarte elegís el tipo de negocio. Después se puede cambiar en Configuración → Perfil → "Tipo de negocio": al cambiarlo, el módulo Mesas aparece o desaparece del menú.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'modulo-complementos',
    titulo: 'Complementos',
    definicion: 'Aplicaciones externas que acompañan a Vendeto: se descargan desde vendeto.com.ar y se ejecutan sin instalar. Para que funcionen, Vendeto tiene que estar abierto; se abren en la bandeja de herramientas de Windows.',
    items: [
      {
        key: 'concepto-barcode-scanner',
        titulo: 'Barcode Scanner',
        tipo: 'concepto',
        definicion: 'Complemento que lee códigos de barras desde el celular (a través de la red WiFi local) y los envía a la PC como si vinieran de un lector físico. Se descarga desde vendeto.com.ar, se ejecuta sin instalar y queda en la bandeja de herramientas de Windows. Requiere que Vendeto esté abierto.',
        ejemplo: 'Escaneás el código de un producto con el celular y aparece directamente en el campo de búsqueda de Vendeto.',
        imagenes: [barcodeScanner],
        manual: [
          {
            titulo: '¿Qué es BarcodeToPC?',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'BarcodeToPC es un programa que convierte tu celular en un lector de códigos de barras inalámbrico para tu computadora. Instalás un único programa en la PC, lo dejás corriendo en segundo plano, y desde el celular escaneás productos que se van pegando automáticamente donde tengas el cursor: en un buscador, una planilla, un formulario, lo que sea.',
              },
              {
                tipo: 'parrafo',
                texto: 'El celular lee el código, lo envía por la red WiFi local, y la PC lo pega solo.',
              },
              {
                tipo: 'lista',
                items: [
                  'No requiere instalar ninguna aplicación en el celular: se usa desde el navegador.',
                  'Funciona con Android (Chrome) y con iPhone (Safari).',
                  'No necesita conexión a internet: todo funciona dentro de tu red WiFi local.',
                  'La PC solo recibe los códigos y los pega: no hace falta tocar el teclado.',
                  'Corre en segundo plano, con un ícono en la bandeja del sistema de Windows.',
                ],
              },
            ],
          },
          {
            titulo: 'Requisitos',
            bloques: [
              {
                tipo: 'lista',
                items: [
                  'Una PC con Windows.',
                  'Un celular (Android o iPhone) con cámara.',
                  'Que la PC y el celular estén conectados a la misma red WiFi.',
                ],
              },
              {
                tipo: 'nota',
                texto: 'No hace falta instalar Python ni ninguna otra herramienta: BarcodeToPC.exe funciona solo, en cualquier PC con Windows.',
              },
            ],
          },
          {
            titulo: 'Instalación',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'Copiá el archivo BarcodeToPC.exe a la PC donde lo vas a usar (por ejemplo, a una carpeta en el Escritorio).',
                  'Hacé doble clic sobre BarcodeToPC.exe para iniciarlo.',
                  'El programa arranca sin abrir ninguna ventana: vas a verlo como un ícono nuevo en la bandeja del sistema (junto al reloj, abajo a la derecha). Si no lo ves, hacé clic en la flechita "^" para mostrar los íconos ocultos.',
                ],
              },
              {
                tipo: 'nota',
                texto: 'Como es un programa nuevo y sin firma digital, es posible que Windows muestre el aviso "Windows protegió su PC". Es normal en programas caseros. Para continuar: hacé clic en "Más información" y después en "Ejecutar de todas formas".',
              },
            ],
          },
          {
            titulo: 'Conectar el celular (primera vez)',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'Hacé clic en el ícono de BarcodeToPC en la bandeja del sistema. Se va a abrir una imagen con un código QR.',
                  'Con la cámara del celular, escaneá ese código QR (con la app de cámara normal alcanza, no hace falta ninguna app especial). Se va a abrir la página de escaneo en el navegador.',
                  'La primera vez, el navegador va a mostrar una advertencia de seguridad ("la conexión no es privada" o similar). Esto es esperable: BarcodeToPC usa un certificado propio para funcionar solo dentro de tu red, no uno emitido por una autoridad pública. Para continuar, tocá "Avanzado" y después "Continuar al sitio" (el texto exacto varía según el navegador).',
                  'Cuando aparezca el aviso pidiendo permiso de cámara, tocá "Permitir". Sin este permiso la app no puede leer códigos.',
                ],
              },
              {
                tipo: 'nota',
                texto: 'Tip: agregá la página a la pantalla de inicio de tu celular (menú del navegador → "Agregar a pantalla de inicio") para abrirla como si fuera una app, sin tener que volver a escanear el QR cada vez.',
              },
            ],
          },
          {
            titulo: 'Uso diario',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'En la PC, hacé clic en el campo donde querés que aparezcan los códigos (un buscador, una celda, un formulario).',
                  'En el celular, abrí la página de BarcodeToPC (o el acceso directo si la agregaste a la pantalla de inicio).',
                  'Tocá "Iniciar escaneo" y apuntá la cámara al código de barras.',
                  'Apenas lo detecta, el código se envía solo a la PC y se pega en el campo activo.',
                ],
              },
              {
                tipo: 'parrafo',
                texto: 'Qué pasa en la PC al recibir un código: BarcodeToPC copia el código al portapapeles y simula pegarlo (Ctrl+V) en el campo que esté activo en ese momento, y por defecto también presiona Enter, así el código queda listo para usar sin tocar nada más. Esto se puede desactivar desde el menú de la bandeja.',
              },
              {
                tipo: 'parrafo',
                texto: 'Lectura confiable, sin repeticiones: para evitar que un mismo código se envíe varias veces por error (por ejemplo, por un reflejo o el ángulo de la cámara), BarcodeToPC exige leer el mismo código dos veces seguidas antes de enviarlo, y después de cada envío espera 3 segundos antes de aceptar una nueva lectura (vas a ver una cuenta regresiva en la pantalla del celular). Esto hace que el escaneo sea un poco más lento, pero mucho más preciso.',
              },
            ],
          },
          {
            titulo: 'Menú del ícono en la bandeja del sistema',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'Haciendo clic derecho sobre el ícono de BarcodeToPC se abre un menú con estas opciones:',
              },
              {
                tipo: 'tabla',
                columnas: ['Opción', 'Qué hace'],
                filas: [
                  ['Mostrar código QR para conectar', 'Abre el código QR para vincular el celular (clic izquierdo normal también lo abre).'],
                  ['Mostrar QR alternativo (por IP)', 'QR de respaldo por si el celular no logra resolver el nombre de red.'],
                  ['Pulsar Enter después de pegar', 'Activa o desactiva el Enter automático después de cada código pegado.'],
                  ['Iniciar con Windows', 'Hace que BarcodeToPC arranque solo cuando prendés la PC.'],
                  ['Calibrar clic de enfoque (5s)...', 'Configura el clic automático de reenfoque.'],
                  ['Usar clic de enfoque antes de pegar', 'Activa o desactiva el clic automático ya calibrado.'],
                  ['Salir', 'Cierra BarcodeToPC por completo.'],
                ],
              },
            ],
          },
          {
            titulo: 'Compatibilidad de celulares',
            bloques: [
              {
                tipo: 'tabla',
                columnas: ['Celular', 'Cómo lee los códigos'],
                filas: [
                  ['Android (Chrome)', 'Usa el lector nativo del navegador. Rápido y sin configuración adicional.'],
                  ['iPhone (Safari o cualquier navegador)', 'Usa una librería de lectura incluida en el propio programa (no necesita internet). Funciona igual, aunque puede ser un poco más lenta que en Android.'],
                ],
              },
            ],
          },
          {
            titulo: 'Solución de problemas',
            bloques: [
              {
                tipo: 'tabla',
                columnas: ['Problema', 'Solución'],
                filas: [
                  ['El navegador dice que el sitio no es seguro', 'Es normal. Tocá "Avanzado" → "Continuar al sitio".'],
                  ['El QR no conecta o la página no carga', 'Confirmá que el celular esté en la misma red WiFi que la PC. Si el nombre de red no resuelve, probá el "QR alternativo (por IP)" del menú de la bandeja.'],
                  ['Un código se pega en el campo equivocado', 'El programa de destino probablemente mueve el cursor solo después de cada producto. Usá la función de "clic de enfoque" (calibrala en el menú de la bandeja).'],
                  ['Lee el mismo código varias veces', 'Esperá la cuenta regresiva de 3 segundos entre lectura y lectura; es una protección contra lecturas duplicadas.'],
                  ['Cambié de red WiFi y dejó de andar', 'Volvé a escanear el código QR desde el ícono de la bandeja: la dirección puede haber cambiado.'],
                  ['No se pega nada en programas abiertos como administrador', 'Por seguridad de Windows, un programa normal no puede enviar texto a uno abierto como administrador. Ejecutá BarcodeToPC como administrador también.'],
                ],
              },
            ],
          },
          {
            titulo: 'Preguntas frecuentes',
            bloques: [
              {
                tipo: 'faq',
                preguntas: [
                  {
                    pregunta: '¿Necesito internet para usarlo?',
                    respuesta: 'No. BarcodeToPC funciona completamente dentro de tu red WiFi local, incluida la lectura de códigos en iPhone.',
                  },
                  {
                    pregunta: '¿Es seguro?',
                    respuesta: 'Sí. Todo el tráfico queda dentro de tu red local: no se envía nada a internet. La advertencia de "sitio no seguro" aparece porque el certificado es generado por el propio programa (autofirmado) y no por una autoridad externa, algo normal en herramientas de uso local.',
                  },
                  {
                    pregunta: '¿Puedo usarlo con varios celulares a la vez?',
                    respuesta: 'Sí, cualquier celular conectado a la misma red puede abrir la página y enviar códigos.',
                  },
                  {
                    pregunta: '¿Cómo lo cierro?',
                    respuesta: 'Clic derecho en el ícono de la bandeja del sistema → "Salir".',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        key: 'concepto-consulta-producto',
        titulo: 'Consulta Producto',
        tipo: 'concepto',
        definicion: 'Complemento que consulta el precio de un producto al escanear su código de barras desde el celular. Se descarga desde vendeto.com.ar, se ejecuta sin instalar y queda en la bandeja de herramientas de Windows. Requiere que Vendeto esté abierto para consultar los precios.',
        ejemplo: 'Un cliente te muestra el código de un producto; lo escaneás con el celular y ves su precio sin tener que buscarlo en la PC.',
        imagenes: [consultaProducto],
      },
    ],
  },
  {
    key: 'modulo-mercadopago',
    titulo: 'MercadoPago',
    definicion: 'Vincula la cuenta de MercadoPago del negocio para cobrar con QR y por transferencia, sin depender de un banco propio. La vinculación y el QR de mostrador se administran desde el panel lateral.',
    relacionados: ['concepto-vincular-mp', 'concepto-cobro-qr', 'concepto-transferencia-mp'],
    items: [
      {
        key: 'concepto-vincular-mp',
        titulo: 'Vincular MercadoPago',
        tipo: 'concepto',
        definicion: 'Conexión entre la cuenta de MercadoPago del negocio y Vendeto para cobrar con QR y por transferencia. Se realiza desde el panel lateral y se autoriza en el navegador.',
        relacionados: ['concepto-cobro-qr', 'concepto-transferencia-mp'],
        manual: [
          {
            titulo: '¿Para qué sirve?',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'Al vincular tu cuenta de MercadoPago, los cobros por QR y por transferencia se dirigen a esa cuenta, sin necesidad de tener un banco propio configurado. El cliente paga con MercadoPago y el dinero cae en la cuenta vinculada.',
              },
            ],
          },
          {
            titulo: 'Primera vinculación',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'En el panel lateral (menú de la izquierda), tocá "Vincular MP".',
                  'Se abre el navegador con la página de autorización de MercadoPago.',
                  'Ingresá a la cuenta de MercadoPago que querés usar y autorizá el acceso.',
                  'Al volver a Vendeto ya quedás vinculado: el titular de la cuenta aparece en los cobros por transferencia.',
                ],
              },
              {
                tipo: 'nota',
                texto: 'La vinculación se autoriza en el navegador donde esté logueada tu cuenta de MercadoPago. Si el navegador no abre solo, copiá el link que se genera al tocar "Vincular MP" y pegalo en el navegador.',
              },
            ],
          },
          {
            titulo: 'Cambiar de cuenta (segunda vinculación)',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'Cada nueva autorización reemplaza (pisa) a la anterior: solo queda activa la última cuenta que vinculaste. La cuenta reemplazada deja de recibir los cobros QR y las transferencias.',
              },
              {
                tipo: 'pasos',
                items: [
                  'Tocá "Vincular MP" en el panel lateral y esperá a que se abra el navegador con el link de autorización.',
                  'Copiá ese link (la URL de MercadoPago en la barra del navegador).',
                  'Abrí otro perfil de navegador (o una sesión distinta) donde esté logueada la cuenta de MercadoPago nueva.',
                  'Pegá el link, autorizá y volvé a Vendeto: el titular de QR y transferencias pasa a ser la nueva cuenta.',
                ],
              },
            ],
          },
          {
            titulo: 'Revinculación',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'Si en la venta o en el QR aparece el aviso "MercadoPago requiere volver a vincularse", la confirmación automática de los pagos puede fallar. Volvé a vincular desde el panel lateral (primera vinculación o cambio de cuenta) para que vuelva a funcionar.',
              },
            ],
          },
        ],
      },
      {
        key: 'concepto-cobro-qr',
        titulo: 'Cobro QR',
        tipo: 'concepto',
        definicion: 'Cobra mostrando un código QR que el cliente escanea con su app de MercadoPago. Hay dos QR: el fijo del mostrador (siempre el mismo, sin monto) y el QR de cada venta (con el monto puntual).',
        relacionados: ['concepto-vincular-mp', 'concepto-transferencia-mp', 'concepto-plan-maxima'],
        manual: [
          {
            titulo: 'QR de mostrador (fijo)',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'Es el QR permanente de tu negocio: no tiene monto y sirve para cobrar cualquier importe. Imprimilo y pegalo en el mostrador para que los clientes lo escaneen y paguen.',
              },
              {
                tipo: 'pasos',
                items: [
                  'En el panel lateral, tocá "Ver QR".',
                  'Se abre el QR de tu cuenta vinculada.',
                  'Imprimilo: es siempre el mismo, no cambia entre cobros.',
                ],
              },
              {
                tipo: 'nota',
                texto: 'El QR del mostrador depende de la cuenta vinculada: si cambiás de cuenta de MercadoPago, el QR fijo pasa a ser el de la nueva cuenta.',
              },
            ],
          },
          {
            titulo: 'Cobrar con QR en la venta',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'Armá el carrito y elegí "QR" como medio de pago.',
                  'Se abre la pantalla de cobro con un QR que incluye el monto de esa venta.',
                  'Mostrale el QR al cliente para que lo escanee con MercadoPago.',
                ],
              },
              {
                tipo: 'parrafo',
                texto: 'En el plan Máxima el pago se detecta automáticamente y la venta se confirma sola. En los demás planes, se confirma manualmente cuando el cliente te avisa que pagó.',
              },
              {
                tipo: 'nota',
                texto: 'No confundas el QR fijo del mostrador (sin monto, para imprimir) con el QR de la venta (con el monto puntual, que se muestra en pantalla).',
              },
            ],
          },
        ],
      },
      {
        key: 'concepto-transferencia-mp',
        titulo: 'Cobro por transferencia',
        tipo: 'concepto',
        definicion: 'Cobro en el que el cliente transfiere el monto a la cuenta de MercadoPago vinculada. El vendedor ve el titular y el importe, y confirma la venta cuando el cliente avisa que transfirió.',
        necesitaImagen: true,
        relacionados: ['concepto-vincular-mp', 'concepto-cobro-qr'],
        manual: [
          {
            titulo: 'Cobrar por transferencia',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'Armá el carrito y elegí "Transferencia" como medio de pago.',
                  'Se muestra la cuenta de MercadoPago vinculada (titular) y el monto a transferir.',
                  'Decile al cliente que transfiera ese monto a la cuenta que se muestra.',
                  'Cuando el cliente confirme que transfirió, tocá "Confirmar".',
                ],
              },
              {
                tipo: 'nota',
                texto: 'La transferencia no se verifica automáticamente: la venta se confirma manualmente cuando el cliente te avisa que hizo el pago. No se confirma sola.',
              },
            ],
          },
          {
            titulo: 'Tiempo de espera',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'La pantalla de espera de la transferencia vence a los 5 minutos. Si el tiempo se agota sin confirmar, la venta pendiente se cancela y hay que volver a armarla.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'modulo-suscripcion',
    titulo: 'Suscripción y planes',
    definicion: 'Modelo de planes de Vendeto (Gratuito, Básica y Máxima), la prueba gratuita de 7 días, y cómo se activa, renueva y vence la licencia de cada negocio.',
    relacionados: ['concepto-plan-gratuito', 'concepto-plan-basica', 'concepto-plan-maxima', 'concepto-prueba-gratuita', 'concepto-activar-licencia', 'concepto-vencimiento-renovacion'],
    items: [
      {
        key: 'concepto-plan-gratuito',
        titulo: 'Plan Gratuito',
        tipo: 'concepto',
        definicion: 'Plan sin costo para seguir operando después de la prueba. Incluye 1 usuario con acceso completo, hasta 500 productos activos y los módulos de ventas, caja y stock.',
        relacionados: ['concepto-prueba-gratuita'],
      },
      {
        key: 'concepto-plan-basica',
        titulo: 'Plan Básica',
        tipo: 'concepto',
        definicion: 'Plan de pago mensual ($32.500) con hasta 3 usuarios, hasta 1000 productos activos y todos los módulos habilitados.',
        relacionados: ['concepto-activar-licencia'],
      },
      {
        key: 'concepto-plan-maxima',
        titulo: 'Plan Máxima',
        tipo: 'concepto',
        definicion: 'Plan de pago mensual ($39.990) con usuarios ilimitados, hasta 10000 productos activos, verificación instantánea de pagos de MercadoPago y soporte prioritario.',
        relacionados: ['concepto-cobro-qr', 'concepto-activar-licencia'],
      },
      {
        key: 'concepto-prueba-gratuita',
        titulo: 'Prueba gratuita',
        tipo: 'concepto',
        definicion: 'Período de 7 días con plan Máxima que arranca al registrarte en la aplicación. Al vencer, el comercio pasa a plan Gratuito y sigue operando sin bloqueo, con el límite de 500 productos.',
        relacionados: ['concepto-plan-gratuito'],
      },
      {
        key: 'concepto-activar-licencia',
        titulo: 'Activar licencia',
        tipo: 'concepto',
        definicion: 'Proceso para dejar activada una licencia de pago en tu instalación: se compra en vendeto.com.ar con el mismo mail del registro y luego se activa con "Buscar licencia" en la aplicación.',
        relacionados: ['concepto-vencimiento-renovacion', 'modulo-suscripcion'],
        manual: [
          {
            titulo: 'Primer pago (contratar)',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'Entrá a vendeto.com.ar y elegí la suscripción (Básica o Máxima).',
                  'Completá el pago e ingresá el mismo mail con el que te registraste en la aplicación.',
                  'No es necesario que sea el mismo mail que la cuenta de MercadoPago con la que pagás: puede ser distinto.',
                ],
              },
            ],
          },
          {
            titulo: 'Activar en la aplicación',
            bloques: [
              {
                tipo: 'pasos',
                items: [
                  'Con el pago aprobado, en la aplicación tocá "Buscar licencia" (en la pantalla de login o en Configuración → Perfil).',
                  'Ingresá el mismo mail del registro.',
                  'La licencia se vincula a esa instalación y se activan los límites del plan.',
                ],
              },
            ],
          },
          {
            titulo: 'Renovar',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'La renovación se puede hacer de dos formas:',
              },
              {
                tipo: 'lista',
                items: [
                  'Desde vendeto.com.ar: volvé a pagar el plan con el mismo mail. Se extiende la misma licencia, no se crea una nueva.',
                  'Desde el banner del encabezado: el aviso de vencimiento de la prueba o licencia (aparece con 3 días o menos restantes) lleva directo a renovar.',
                ],
              },
            ],
          },
        ],
      },
      {
        key: 'concepto-vencimiento-renovacion',
        titulo: 'Vencimiento y renovación',
        tipo: 'concepto',
        definicion: 'Reglas de vencimiento de la licencia: cada pago extiende la licencia 30 días, hay 48 horas de gracia y, pasada la gracia, un plan pago vencido bloquea el acceso. El banner del encabezado avisa los días restantes.',
        relacionados: ['concepto-activar-licencia'],
        manual: [
          {
            titulo: 'Cómo funciona',
            bloques: [
              {
                tipo: 'tabla',
                columnas: ['Momento', 'Qué pasa'],
                filas: [
                  ['Pago aprobado', 'La licencia se extiende 30 días desde su vencimiento vigente (o desde hoy si ya estaba vencida).'],
                  ['Vence la licencia paga', 'Empieza un período de gracia de 48 horas en el que se sigue operando.'],
                  ['Pasada la gracia', 'El acceso se bloquea hasta renovar. La prueba gratuita no bloquea: al vencer pasa a plan Gratuito.'],
                ],
              },
            ],
          },
          {
            titulo: 'Aviso y renovación',
            bloques: [
              {
                tipo: 'parrafo',
                texto: 'Cuando faltan 3 días o menos, en el encabezado aparece un banner que indica los días restantes (o "prueba — vence en X días"). Ese banner lleva directo a renovar en vendeto.com.ar.',
              },
            ],
          },
        ],
      },
    ],
    manual: [
      {
        titulo: 'Los planes',
        bloques: [
          {
            tipo: 'tabla',
            columnas: ['Plan', 'Precio', 'Usuarios', 'Productos', 'Módulos'],
            filas: [
              ['Gratuito', '$0 / mes', '1 usuario con acceso completo', 'Hasta 500', 'Ventas, caja y stock.'],
              ['Básica', '$32.500 / mes', 'Hasta 3 usuarios', 'Hasta 1000', 'Todos los módulos.'],
              ['Máxima', '$39.990 / mes', 'Usuarios ilimitados', 'Hasta 10000', 'Todos los módulos + MercadoPago con verificación instantánea de pagos y soporte prioritario.'],
            ],
          },
        ],
      },
      {
        titulo: 'Qué pasa cuando vence cada plan',
        bloques: [
          {
            tipo: 'tabla',
            columnas: ['Situación', 'Qué pasa'],
            filas: [
              ['Vence la prueba gratuita (7 días)', 'Se pasa a plan Gratuito y se sigue operando sin bloqueo (ventas, caja y stock). Los productos se recortan a 500.'],
              ['Vence un plan pago (Básica o Máxima)', 'Primero hay 48 horas de gracia en las que se sigue operando. Pasada la gracia, el acceso se bloquea hasta renovar.'],
            ],
          },
        ],
      },
      {
        titulo: 'Preguntas frecuentes',
        bloques: [
          {
            tipo: 'faq',
            preguntas: [
              {
                pregunta: '¿Cómo empiezo?',
                respuesta: 'Al registrarte en la aplicación se inicia una prueba gratuita de 7 días con el plan Máxima.',
              },
              {
                pregunta: '¿Puedo seguir usando Vendeto sin pagar?',
                respuesta: 'Sí. Al vencer la prueba pasás a plan Gratuito: ventas, caja y stock, hasta 500 productos.',
              },
              {
                pregunta: '¿Qué pasa si no renuevo un plan pago?',
                respuesta: 'Tenés 48 horas de gracia y después el acceso se bloquea hasta que renueves.',
              },
            ],
          },
        ],
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
  manual?: AyudaManualSeccion[]
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
    manual: modulo.manual,
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
    manual: item.manual,
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