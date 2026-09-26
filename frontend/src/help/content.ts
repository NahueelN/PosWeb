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
    relacionados: ['concepto-mesa', 'concepto-comanda', 'solapa-mesas-cocina'],
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