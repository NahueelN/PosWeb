# Cerebro técnico — Vendeto Mobile

Documento vivo del módulo móvil dentro del instalador Vendeto. Registra decisiones, hallazgos y el estado real de la implementación. Se actualiza al cerrar cada unidad de trabajo.

Última actualización: escáner con cámara y respaldo ZXing.

---

## Qué es

Un cliente móvil que se sirve desde la propia PC del negocio y consume el backend .NET de PosWeb sin modificarlo. Se usa desde el celular en la misma red, entrando por `https://IP_DE_LA_PC:8543/`.

Forma parte del mismo repositorio e instalador que Vendeto: no hay aplicación ni ejecutable separado para el usuario.

---

## Arquitectura

```text
Celular (navegador)
    │ HTTPS
    ▼
vendeto-mobile.exe  (sidecar Python, 0.0.0.0:8543)
    │ HTTP
    ▼
posweb-backend.exe  (sidecar .NET, 127.0.0.1:5196)
```

- Tauri arranca ambos sidecars y los apaga al salir.
- Python sirve la interfaz, genera el certificado y actúa como adaptador restringido hacia PosWeb.
- El frontend vive dentro del sidecar; no hay build de Node para el móvil.

---

## Archivos clave

| Archivo | Rol |
|---|---|
| `mobile-client/server.py` | Servidor HTTPS, certificado autofirmado y proxy restringido a PosWeb. |
| `mobile-client/static/index.html` | Toda la interfaz móvil: login, navegación, Productos y escáner. |
| `mobile-client/static/assets/vendeto-wordmark.png` | Wordmark blanco recortado, para fondos oscuros. |
| `mobile-client/static/assets/vendeto-mark.png` | Isotipo blanco recortado. |
| `mobile-client/static/assets/zxing.js` | Respaldo de lectura de códigos (362 KB). |
| `mobile-client/static/assets/material-symbols-outlined.woff2` | Subset de Material Symbols Outlined con los 8 íconos usados (1,16 KB). |
| `mobile-client/build-sidecar.ps1` | Empaqueta el sidecar con PyInstaller. |
| `mobile-client/check-ids.ps1` | Verifica ids del DOM y que cada ícono usado tenga su codepoint CSS; rechaza ligatures. |
| `mobile-client/requirements.txt` | `aiohttp`, `cryptography`, `pyinstaller`. |
| `frontend/src-tauri/tauri.conf.json` | Declara `binaries/vendeto-mobile` en `externalBin`. |
| `frontend/src-tauri/capabilities/default.json` | Permiso de ejecución del sidecar. |
| `frontend/src-tauri/src/lib.rs` | Arranque y apagado de ambos sidecars. |
| `skills/vendeto-mobile/SKILL.md` | Reglas de trabajo del módulo. |

---

## Seguridad

- El proxy solo permite `sucursales`, `auth/login`, `productos`, `categorias`, `unidades-medida`, `medios-pago`, `cajas`, `ventas` y `stock`. Todo lo demás responde `404`.
- `auth/register` no está permitido: no existe alta de cuentas desde el móvil.
- Las rutas de Productos, Categorías y Unidades exigen JWT válido, comprobado contra `GET /api/auth/me` antes de reenviar.
- Sin token, esas rutas responden `401`.
- HTTPS usa certificado autofirmado generado en `%APPDATA%\VendetoMobile` con SAN para `localhost`, hostname, `hostname.local`, la IP LAN y `127.0.0.1`.
- Al cambiar la IP o el hostname se regenera el certificado automáticamente vía marcador.

---

## HTTPS y cámara

Los navegadores solo permiten `getUserMedia` en contexto seguro. Por eso el módulo sirve HTTPS.

- `http://localhost` cuenta como seguro, pero una IP LAN no.
- Con certificado autofirmado el celular muestra una advertencia la primera vez; al aceptarla, la cámara funciona.
- La solución sin advertencia (dominio + túnel con certificado válido) queda como etapa futura y no cambia los flujos.

---

## Escáner

Dos caminos, elegidos en runtime:

1. `BarcodeDetector` nativo, con `getUserMedia` propio y bucle por `requestAnimationFrame`.
2. Respaldo `ZXing.BrowserMultiFormatReader.decodeFromConstraints`, que gestiona la cámara.

Reglas de lectura: se exigen 2 lecturas iguales y un cooldown de 2,5 s para evitar disparos repetidos. `stopScanner` corta el bucle, hace `zxingReader.reset()` y detiene los tracks.

---

## Productos

- Es la pantalla que se abre después del login.
- Alcance: listar, buscar, alta, modificación y baja lógica. Sin importación, ajustes masivos ni configuración.
- Se excluyen los productos de tipo bulto, igual que en PosWeb. Los pesables llevan la marca "por kg".
- Carga 20 resultados y suma más al llegar al final del scroll.
- La barra de búsqueda queda fija arriba mientras se recorre el listado, para que buscar o escanear siempre esté disponible.
- Búsqueda local por nombre, código de barras y código interno.
- Pegar un código o presionar Enter con un EAN de 8 a 14 dígitos ejecuta el lookup.
- Lookup: si el producto existe, se abre el editor; si el catálogo externo lo conoce, se abre el alta precargada; si no, se abre el alta con el código escaneado.
- Un solo formulario se reutiliza para alta y edición.
- En alta, el campo EAN incluye un botón de escáner que completa el código y reutiliza la validación de duplicados; en edición el botón no se muestra.
- La acción Nuevo producto es un botón flotante `+` abajo a la derecha; el encabezado conserva solo navegación y título.

### Estructura del editor

Sigue el diseño de PosWeb adaptado a móvil, en una sola tarjeta:

| Zona | Contenido |
|---|---|
| Nombre | Primero, ancho completo. |
| EAN / Código interno | Dos columnas, siempre editables; ya no existe la acción "Cambiar código". |
| Precio / Costo | Dos columnas. |
| Marca / Contenido | Dos columnas, ambos opcionales. |
| Categoría / Unidad | Dos columnas con selects cargados desde PosWeb. |
| Seguir stock | Casilla, activa por defecto en alta; el campo de stock de la sucursal está siempre visible y solo se deshabilita cuando la casilla está apagada. |
| Variantes avanzadas | Sección plegable con pesable, el seguimiento de vencimientos, la lista de fechas y el stock actual. La fila de carga de fecha se deshabilita cuando el seguimiento está apagado y desaparece al llegar al máximo de 3 fechas. |
| Acciones | Footer fijo: Cancelar, Borrar y Guardar en una sola fila, respetando el safe-area inferior. En alta, Borrar se oculta y quedan Cancelar y Guardar. |

El editor tiene header con título y footer fijo; **no** tiene botón Cerrar en el header: las únicas acciones son Cancelar, Borrar y Guardar del footer. Solo el cuerpo del formulario hace scroll (`#sheet .body`). La densidad del popup es compacta a propósito: el formulario debe entrar completo en una pantalla de celular, dejando visibles las variantes avanzadas al final.

Los tres datos principales de un producto son, en este orden: nombre, EAN y código interno.

### Validaciones reales del backend

| Campo | Regla |
|---|---|
| Nombre | Obligatorio. |
| Precio | Mayor a 0 para productos comunes. |
| Costo | No negativo; por defecto 0. |
| Código | Obligatorio código de barras o código interno propio. |
| Código de barras | Se normaliza a EAN-13 con ceros a la izquierda y no puede duplicarse entre activos. |

Marca, contenido, categoría, unidad y descripción son opcionales.

La baja es lógica: el producto queda inactivo y puede reactivarse desde PosWeb.

### Stock y vencimientos

- Los vencimientos viajan dentro del alta o la modificación del producto; el dominio admite hasta 3 fechas. Al registrar la tercera, la fila para agregar una cuarta desaparece; al quitar una, vuelve a mostrarse.
- El stock se ajusta por separado con `PUT /api/stock/ajustar`, enviando producto, sucursal y stock, solo cuando la casilla está activa y el valor cambió.
- Si el ajuste falla después de guardar el producto, se informa el error y el producto queda guardado igual.
- Ese endpoint exige rol Admin o SuperAdmin. Un usuario común recibe el rechazo del backend.

---

## Ventas

- Segunda solapa del menú lateral.
- Productos se cargan con `GET /api/productos?sucursalId=` para que el stock sea el de la sucursal.
- Dentro de Ventas hay una barra inferior fija con solo Productos y Carrito; no se incluye Clientes.
- Productos muestra el catálogo inicial y búsqueda/escáner; cada tarjeta agrega una unidad con `+`. Carrito muestra badge de cantidad, edición de cantidades, quitar o vaciar ítems y una franja/footer fijo integrada con Total y Continuar al cobro. `Vaciar` abre el popup centrado `#clearCartConfirm` con cantidad de productos y una confirmación destructiva; Cancelar o Back lo cierran sin modificar el carrito.
- Cobrar es una vista separada y reversible: total, medios de pago, monto, importes rápidos, resumen del pago y confirmación. `Confirmar venta` vive en `.checkout-footer`, fijo al pie como `Cobrar`; `#saleCheckoutPanel` reserva `calc(78px + safe-area)` para que el último control y los errores no queden debajo. Volver retorna al Carrito sin perder los ítems.
- Salir de Ventas y volver no refresca el borrador: `loadSales(true)` reanuda carrito, solapa, medio de pago y Cobrar si estaba abierto. El importe previo no se conserva: `presetCheckoutAmount()` carga siempre el total actual en `#montoRecibido` al entrar o reanudar Cobrar, para que un importe rápido no arrastre un monto viejo. La recarga real (`loadSales()`) se mantiene en el primer acceso y después de una venta confirmada para actualizar stock/caja/medios.
- Buscar o escanear agrega al carrito; no abre editor.
- Agregar muestra un toast `#cartToast` (ícono `i-check`, texto "Agregado" y `nombre ×cantidad`) fijo a 66px del piso, justo sobre la barra de tabs, que se cierra a los 2400ms. También se muestra al agregar por EAN/código: tras el escaneo se cierra la cámara, consume su entrada de historial y demora el toast 180ms para que no quede detrás de la capa nativa. Pertenece solo a Productos: `setSaleTab('cart')` lo cierra antes de mostrar el carrito. Vive dentro de `<section id="ventas">`, así que `setView('products')` lo oculta solo al ocultar la vista, y `pushLayer()` lo cierra cuando se abre cualquier capa (escáner, editor, ticket, popup de confirmación, menú) para que no quede flotando sobre un scrim. PosWeb no tiene este toast: es una adaptación propia, porque en el móvil el badge del carrito es poco visible.
- Carrito con cantidades editables, subtotal por renglón y total.
- Las tarjetas de Ventas usan dos filas: Productos muestra nombre+precio y marca/código; Carrito muestra nombre+subtotal, metadata compacta y controles de cantidad/quitar. Esto evita desperdiciar altura sin ocultar reglas de stock.
- Medios de pago desde `GET /api/medios-pago`. En Cobrar se muestran siempre como una grilla compacta de tres columnas: `min-height:48px`, texto de 11px y selección azul; ya no son tarjetas altas.
- El bloque `#efectivoBox` es un panel de detalle de pago **estable**: se ve siempre y no salta al seleccionar medios. Sin medio, el monto y los controles quedan visibles pero deshabilitados y el resumen muestra el saldo total. El input tiene dos botones externos: `#totalAmountRecibido` (`Total`, primario azul) que carga el total a cobrar con `moneyInput(total())` y `#clearMontoRecibido` (`Limpiar`, outline: borde propio y fondo transparente) para borrar el importe. Ambos se deshabilitan sin medio. `Limpiar` en táctil ejecuta el borrado durante `pointerdown`, antes de que el botón tome foco; **no enfoca el input** (no abre el teclado ni mueve el cursor). `click` conserva el mismo comportamiento para teclado y lectores de pantalla. El label `#montoRecibidoLabel` (`Monto recibido` / `Monto del pago`) y el helper `#efectivoAyuda` de abajo comparten tipografía exacta: 12px, `#c7d3e6`, peso 400 (regla `.payment-details > label, .payment-details > .helper`). `Sumar importe` usa `+$100`, `+$500`, `+$1.000`, `+$2.000`, `+$10.000` y `+$20.000`: cada botón incrementa el monto actual, no lo reemplaza. Con un medio, si el importe queda corto, el resumen ámbar dice `Falta` y muestra la diferencia (para efectivo y no efectivo); si alcanza y el medio paga vuelto, muestra `Vuelto`; si alcanza con otro medio, muestra `Pago completo`. Los incrementos sirven para cualquier medio porque un pago parcial está soportado si se asigna cliente.
- Efectivo acepta el formato monetario local que la interfaz muestra: `2200`, `2.200`, `2200,00`, `2.200,00` y decimales. `parseMoney()` normaliza miles y coma decimal antes de validar, y `roundMoney()` redondea a centavos para no rechazar montos iguales por precisión flotante.
- Confirmar envía `POST /api/ventas` con sucursal, items y pagos; el resultado se muestra en un ticket con número de venta, total y vuelto.
- Los errores del backend, como stock insuficiente, se muestran tal cual los devuelve PosWeb.

### Validaciones de venta (réplica de PosWeb)

El flujo de confirmación replica el orden de `VentaService` y `VentasPage` para que el móvil falle igual que la web:

1. **Caja**: se re-verifica con `GET /api/cajas/activa?sucursalId=` justo antes de confirmar, no solo al entrar a Ventas. Si no hay caja abierta se muestra `No hay caja abierta. Abrila en Vendeto para poder registrar la venta.` y no se envía nada.
2. **Stock**: `stockConflictItems()` busca ítems con `seguirStock !== false` y `cantidad > stock`. Si hay, abre el popup centrado `#stockConfirm` con el detalle (`Disponible` / `Pedís n`) y **no** envía la venta. El usuario elige `Cancelar` (cierra sin enviar) o `Vender igual` (que activa `pendingAllowSinStock` y reintenta). El backend además devuelve el conflicto si lo hubo y se muestra tal cual.
3. **Medio de pago**: obligatorio en cualquier caso, igual que PosWeb.
4. **Monto**: `parseMoney()` del campo, con tolerancia `recibido + 0.005 < total`. Si el medio no paga vuelto se usa el total.
5. **Pago parcial**: si `recibido < total`, el aviso aparece **recién al presionar Confirmar venta**, igual que el conflicto de stock; no mientras se escribe el monto. Abre el popup centrado `#debtConfirm`, informa `Cobrás $X de $Y / Quedan $Z pendientes`, carga clientes con `GET /api/clientes?pageSize=50` y exige uno antes de `Registrar deuda`. Recién esa confirmación habilita `clienteId` para el envío; el backend genera la deuda y el ticket muestra la fila `Deuda` con importe y nombre.
6. **Payload**: `{ sucursalId, items, pagos:[{ medioPagoId, monto: min(recibido, total), conCambio }], clienteId?, allowSinStock }`. `conCambio` solo se envía cuando `pagaVuelto && recibido > total`, con el billete completo, igual que `ejecutarVenta` de PosWeb.

Estados del stock: `pendingAllowSinStock` se pone en `false` al abrir el cobro y en `renderVenta()` ante cualquier cambio del carrito, de modo que cada cambio de ítems vuelve a exigir confirmación explícita.

`loadDebtClients()` es una máquina de estados (`idle | loading | done | error`) para no disparar múltiples peticiones al abrir el popup; `error` reintenta cuando el selector recibe foco. `pendingDebtApproval` es permiso de un solo intento: se reinicia al cambiar carrito, medio o monto, y en el `finally` del envío.

El proxy publica `/clientes` dentro de `AUTHENTICATED_API_PREFIXES`; `ClientesController` exige rol Admin/SuperAdmin, así que usuarios menores reciben `403` y el selector informa que no se pudieron cargar.

## Estados, foco y sesión

- El botón atrás del celular deshace la última acción en lugar de salir de la app: cierra escáner, editor, ticket, popup de confirmación o menú, y desde Ventas vuelve a Productos. En el nivel raíz no hace nada.
- Se implementa con `popstate`: cada retroceso ejecuta `undoLastAction()` y solo repone una entrada cuando no había nada que deshacer, para que la app no se cierre.
- Cada capa que se abre —escáner, editor, ticket, popup de confirmación y menú— agrega su propia entrada al historial con `pushLayer()`. Sin eso, los retrocesos consumen las entradas de reserva y a partir del tercero el navegador ya no tiene a dónde volver.
- Los cierres desde la interfaz llaman a `history.back()` para que la entrada se consuma y el historial quede balanceado; el cierre real del DOM ocurre en `popstate`.
- `consumeLayer()` marca `ignoreNextPop` antes del `history.back()` para cuando el cierre va seguido de otra acción: `Vender igual` cierra el popup de stock y arranca `confirmarVenta()` en el mismo gesto, y el `popstate` posterior no debe reventar nada.
- Al navegar entre Productos y Ventas, la entrada que dejó el menú pasa a representar la vista destino, así el retroceso vuelve a la vista anterior.

- Productos y Ventas muestran "Cargando…" mientras esperan datos.
- Al entrar a Productos no se fuerza foco en el buscador, para no abrir el teclado del celular automáticamente.
- Confirmar venta y el ingreso de login cambian su texto mientras trabajan y se deshabilitan para evitar dobles envíos.
- Al ingresar, si la sucursal todavía no se resolvió, el login la vuelve a pedir antes de fallar, para tolerar arranques lentos o transitorios.
- Si el proxy responde `401`, se borra el token y la app vuelve al login.
- Al crear, si el código de barras ya existe, el formulario lo avisa al salir del campo; el backend sigue siendo la autoridad final.
- Al cerrar el editor, el foco vuelve al buscador de la pantalla visible, no siempre al de Productos.
- El stock se muestra **solo en las tarjetas del carrito**: `precio c/u · Stock: N` (solo si `seguirStock`). No hay stock en las tarjetas de catálogo (`card()`) ni en las de Productos de Ventas (`sale-product-meta`). Cuando la cantidad supera el stock, la metadata se marca en ámbar con `.stock-warning` pero el texto sigue siendo `Stock: N`; no existe el texto `Supera stock (N)`.

## Login

- Mismo criterio que PosWeb: usuario o email más contraseña.
- No se expone registro ni PIN.
- La sucursal no se elige: la app resuelve internamente la sucursal cuyo nombre contiene "central" y cae a la primera si no existe.
- El JWT se guarda en `localStorage` y se envía como `Bearer` en cada consulta de Productos.

---

## Interfaz

- Tema oscuro con azul Vendeto reservado para navegación activa, escáner y acción principal.
- Sistema visual propio, sin librería UI: `Primary`, `Secondary`, `Destructive`, `Ghost` e `Icon button` comparten tokens, foco visible y estados táctiles. Inputs, selects, checkbox, medios de pago y controles de cantidad usan la misma escala de bordes y superficies.
- Íconos con **Material Symbols Outlined**, incrustados como subset propio en `static/assets`. No se enlaza a Google Fonts: la app debe funcionar en la red local sin Internet. El tacho de Borrar es un SVG inline para conservar una silueta legible a tamaño pequeño.
- Se usa `<span class="msi i-nombre"></span>` con un codepoint PUA definido en CSS; los íconos son menú, escáner de códigos, Productos, Ventas, cerrar sesión y quitar fecha. No se usan emojis ni ligatures de texto.
- Los íconos decorativos van con `aria-hidden` implícito por no aportar texto; los botones que solo muestran ícono llevan `aria-label`.
- Navegación lateral tipo PosWeb, reducida a Productos, Ventas y cerrar sesión, con ícono en cada solapa.
- Sin imágenes de producto: las tarjetas son tipográficas.

### Densidad de pantalla

La interfaz está calibrada para mostrar más contenido por pantalla sin perder el táctil. Los valores son deliberados y no deben crecer sin motivo:

| Zona | Valores actuales |
|---|---|
| `.shell` | `padding:12px 14px 24px` |
| `.top` (encabezado) | `margin:-12px -14px 0`, `padding:8px 14px`, `h1` 19px, logo 30px |
| `.search` (sticky) | `padding:7px 14px 8px`, input con `min-height:44px` |
| `.product` (tarjeta) | `margin:6px 0`, `padding:11px 12px`, `border-radius:13px` |
| `.sale-result` (catálogo de Ventas) | dos filas, `min-height:64px`, padding `9px 52px 9px 12px`; el espacio derecho reserva el `+` |
| `#carrito .item` | dos filas, `padding:9px 11px`, `margin:5px 0`; nombre+subtotal arriba, metadata y acciones abajo |
| `.sale-tabs` (barra) | `padding:5px 14px`, tab `min-height:50px` → 60px totales |
| `.sale-summary` (pie de carrito) | `padding:8px 14px`, botón `min-height:44px`, `bottom:calc(60px + safe-area)` |
| Reserva inferior del carrito | `#saleCartPanel { padding-bottom:176px }` = 104px resumen + 60px tabs + 12px de aire |
| Reserva inferior de Ventas | `#ventas { padding-bottom:72px }` = 60px tabs + 12px de aire |
| Reserva inferior de Productos | `#products { padding-bottom:74px }` = FAB de 52px + 14px de offset + 8px de aire |

Reglas para no romper el cálculo:

- Si se agranda `.sale-tab`, hay que subir `#saleCartPanel` y `#ventas` en la misma proporción; si no, el último ítem del carrito queda tapado por el pie.
- Búsqueda, navegación y acciones principales conservan `min-height:44px`. Los controles compactos de cantidad o quitar pueden usar 34–38px solo dentro de una tarjeta con texto y `aria-label` explícito.
- `.btns` está definida una sola vez, al inicio de la hoja de estilos. Una segunda definición más abajo pisa silenciosamente a la primera y revertía el margen del footer del editor.

---

## Operación

Compilar y levantar el sidecar:

```powershell
.\mobile-client\build-sidecar.ps1
Start-Process .\frontend\src-tauri\binaries\vendeto-mobile-x86_64-pc-windows-msvc.exe
```

Verificar sin navegador:

```powershell
curl.exe -k -s -o NUL -w "%{http_code}`n" https://127.0.0.1:8543/
curl.exe -k -s -o NUL -w "%{http_code}`n" https://127.0.0.1:8543/api/productos
```

Esperado: `200` para la página y `401` para Productos sin token.

`npm run dev` solo levanta Vite para el frontend de PosWeb; no inicia el sidecar móvil.

---

## Hallazgos que conviene no repetir

- Los PNG de `C:\Dev\PosWeb2\Logos` son de 4167×4167 con márgenes transparentes enormes: hay que recortarlos al contenido real antes de usarlos.
- El wordmark de color es azul marino y desaparece sobre fondo oscuro; corresponde la variante blanca.
- Un sidecar viejo puede quedar ocupando el puerto y responder `404` en `/`; conviene matar el proceso del puerto antes de reiniciar.
- Un `$('id')` sin elemento lanza un error al inicializar y deja sin funcionamiento todos los botones enlazados después. Ejecutar `mobile-client\check-ids.ps1` antes de compilar.
- El HTML se sirve con `Cache-Control: no-store` para que el celular no quede con una versión vieja de la interfaz tras cada recompilación.
- **Nunca** reescribir el HTML con `Get-Content`/`Set-Content` de PowerShell: relee UTF-8 como ANSI y corrompe acentos y glifos en todo el archivo. Para revisar o editar usar las herramientas de edición, o `[System.IO.File]` con `UTF8Encoding($false)`.
- Los íconos son un subset de Material Symbols Outlined generado desde la fuente variable oficial con codepoints verificados. El subset no depende de GSUB/liga: cada clase `.i-nombre::before` emite su PUA. El único ícono inline es el tacho SVG de Borrar, para evitar un glifo ambiguo. Si se agrega un ícono, regenerar el subset o incorporar SVG local y mantener `check-ids.ps1` en verde.
- PowerShell 5.1 falla al validar TLS contra el certificado autofirmado; para verificar HTTPS usar `curl.exe -k`.
- `element.hidden = true` no basta si la hoja de estilos le asigna `display`: la regla de autoridad gana sobre la `[hidden]` del UA y el elemento sigue visible. Pasaba con `.sale-tabs` (seguía visible durante el cobro), `.cash-shortcuts` (siempre visible) y `.sale-summary`. Por eso el archivo declara `[hidden] { display:none !important }` al inicio; quitarlo reintroduce esos tres errores en silencio.
- `build-sidecar.ps1` imprime `OK` pero `Move-Item` falla siempre con `No se puede crear un archivo que ya existe.` (el exe destino está bloqueado por el proceso corriendo). El build no sirve hasta matar `vendeto-mobile-x86_64-pc-windows-msvc` y copiar a mano el intermedio sobre el `-x86_64-pc-windows-msvc.exe`.
- `curl.exe` por PowerShell devuelve un array de líneas; comparar HTML con `-eq`/`-match` contra un string largo da falso negativo. Unir con `(curl.exe ...) -join "\`n"` antes de comparar.
- `cargo check` falla si el binario declarado en `externalBin` todavía no fue generado.

---

## Pendiente

- Probar el alta, la modificación, la baja y una venta completa con credenciales reales contra PosWeb.
- Dominio y túnel para acceso sin advertencia de certificado y desde fuera de la WiFi.
