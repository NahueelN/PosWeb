# Spec: Open Food Facts Integration

## Overview

El sistema debe consultar Open Food Facts para precargar datos de productos nuevos cuando se ingresa un código de barras que no existe localmente. La integración es opcional: si la API falla o no devuelve datos, se permite el alta manual.

---

## Req-1: Lookup endpoint híbrido

### R1.1 — Producto local encontrado

**Dado** un código de barras que existe en la DB local con `ACTIVO = true`
**Cuando** se llama a `GET /api/productos/openfoodfacts/{codigo}`
**Entonces** devuelve `{ local: true, producto: { ...ProductoDto } }`
**Y** NO consulta Open Food Facts

### R1.2 — Producto encontrado en Open Food Facts

**Dado** un código de barras que NO existe localmente  
**Y** Open Food Facts responde con `product.product_name` no nulo  
**Cuando** se llama a `GET /api/productos/openfoodfacts/{codigo}`  
**Entonces** devuelve `{ local: false, encontrado: true, datos: { ...OpenFoodFactsResultDto } }`  
**Y** `datos.descripcion` contiene `product_name`  
**Y** `datos.marca` contiene `brands` (si existe)  
**Y** `datos.contenido` contiene `product_quantity` parseado a decimal (si existe)  
**Y** `datos.unidad` contiene `product_quantity_unit` (si existe)  
**Y** `datos.presentacion` contiene `quantity` (si existe)  
**Y** `datos.imagen` contiene `image_url` (si existe)  
**Y** `datos.ingredientes` contiene `ingredients_text` (si existe)  
**Y** `datos.categoria` contiene `categories` (si existe)

### R1.3 — Producto no encontrado en Open Food Facts

**Dado** un código de barras que NO existe localmente  
**Y** Open Food Facts responde pero `product.product_name` es null/vacío  
**Cuando** se llama al endpoint  
**Entonces** devuelve `{ local: false, encontrado: false }`

### R1.4 — API de Open Food Facts falla

**Dado** un código de barras que NO existe localmente  
**Y** la llamada a Open Food Facts lanza excepción (timeout, 5xx, DNS)  
**Cuando** se llama al endpoint  
**Entonces** devuelve `{ local: false, encontrado: false }`  
**Y** NO lanza 500 ni excepción al frontend

### R1.5 — Timeout de la API

**Dado** una llamada a Open Food Facts  
**Cuando** la respuesta tarda más de 10 segundos  
**Entonces** se cancela la llamada  
**Y** se trata como fallo (R1.4)

---

## Req-2: Mapeo de campos

### R2.1 — Campos siempre presentes

**Dado** una respuesta exitosa de Open Food Facts  
**Cuando** se mapea a `OpenFoodFactsResultDto`  
**Entonces** `codigoBarras` siempre contiene el código consultado  
**Y** `descripcion` siempre contiene `product_name` (garantizado no-nulo por R1.2)

### R2.2 — Campos opcionales

**Dado** una respuesta de Open Food Facts donde algún campo es null  
**Cuando** se mapea el DTO  
**Entonces** los campos null se dejan como null en el DTO  
**Y** NO se lanza excepción  
**Y** el frontend muestra esos campos como vacíos

### R2.3 — Parseo de contenido numérico

**Dado** `product.product_quantity` es `"1750"`  
**Cuando** se mapea  
**Entonces** `datos.contenido` es `1750m`

**Dado** `product.product_quantity` es `null` o no es numérico  
**Cuando** se mapea  
**Entonces** `datos.contenido` es `null`

---

## Req-3: Alta de producto con campos enriquecidos

### R3.1 — Campos opcionales aceptados

**Dado** un `ProductoUpsertDto` con `marca`, `imagenUrl`, `ingredientes`, `contenido`, `categoriaId`, `unidadMedidaId`, `descAdicional` poblados  
**Cuando** se llama a `POST /api/productos`  
**Entonces** el producto se crea con todos esos campos guardados  
**Y** `ProductoDto` de respuesta incluye los nuevos campos

### R3.2 — Campos nuevos son opcionales

**Dado** un `ProductoUpsertDto` con solo `codigoBarras`, `nombre`, `precio`, `costo` (sin los nuevos campos)  
**Cuando** se llama a `POST /api/productos`  
**Entonces** el producto se crea normalmente  
**Y** los campos nuevos quedan null

### R3.3 — Código de barras duplicado

**Dado** un código de barras que ya existe localmente  
**Cuando** se llama a `POST /api/productos`  
**Entonces** devuelve 409 Conflict con `ProductoCodigoDuplicadoException`  
*(comportamiento existente, no se modifica)*

---

## Req-4: Frontend — lookup y formulario enriquecido

### R4.1 — BarcodeLookup component

**Dado** el componente `BarcodeLookup` en pantalla  
**Cuando** el usuario ingresa un código y presiona Enter o clickea "Buscar"  
**Entonces** llama a `GET /api/productos/openfoodfacts/{codigo}`

### R4.2 — Producto local encontrado (frontend)

**Dado** la respuesta tiene `local: true`  
**Cuando** el frontend la recibe  
**Entonces** muestra los datos del producto existente  
**Y** ofrece navegar al detalle/edición del producto

### R4.3 — Datos de Open Food Facts precargados

**Dado** la respuesta tiene `encontrado: true` con `datos` poblados  
**Cuando** el frontend la recibe  
**Entonces** abre el formulario de alta con los campos precargados:  
- Código de barras: `datos.codigoBarras` (readonly)  
- Nombre: `datos.descripcion`  
- Marca: `datos.marca`  
- Presentación: `datos.presentacion` (campo "Tamaño")  
- Contenido: `datos.contenido`  
- Imagen: `datos.imagen` (mostrar preview)  
- Ingredientes: `datos.ingredientes` (campo expandible)  
- Categoría sugerida: texto de `datos.categoria` como hint  
**Y** los campos Precio y Costo quedan vacíos para que el usuario los complete  
**Y** la unidad de medida se preselecciona si `datos.unidad` coincide con una existente

### R4.4 — Producto no encontrado

**Dado** la respuesta tiene `encontrado: false`  
**Cuando** el frontend la recibe  
**Entonces** muestra mensaje "Producto no encontrado"  
**Y** ofrece abrir el formulario de alta manual vacío

### R4.5 — Error de red o timeout

**Dado** la llamada al lookup falla (error de red, backend caído)  
**Cuando** el frontend captura el error  
**Entonces** muestra mensaje de error  
**Y** ofrece alta manual

### R4.6 — Formulario enriquecido

**Dado** el formulario de alta abierto (precargado o vacío)  
**Cuando** el usuario completa los campos obligatorios (precio, costo) y opcionales  
**Y** hace click en "Crear producto"  
**Entonces** llama a `POST /api/productos` con el `ProductoUpsertDto` completo  
**Y** al crearse exitosamente, cierra el formulario y refresca la lista de productos

---

## Req-5: Migración de base de datos

### R5.1 — Nuevas columnas

**Dado** que se ejecuta `dotnet ef database update`  
**Cuando** se aplica la migración  
**Entonces** la tabla `PRODUCTOS` tiene las columnas:  
- `MARCA` (VARCHAR(200), nullable)  
- `IMAGEN_URL` (VARCHAR(500), nullable)  
- `INGREDIENTES` (TEXT, nullable)  
**Y** los productos existentes tienen estas columnas en null

### R5.2 — Producto entity actualizado

**Dado** la entidad `Producto`  
**Cuando** se inspecciona  
**Entonces** tiene propiedades: `MARCA`, `IMAGEN_URL`, `INGREDIENTES`  
**Y** el constructor acepta estos parámetros  
**Y** existen mutators `CambiarMarca`, `CambiarImagenUrl`, `CambiarIngredientes`

---

## Req-6: OpenFoodFactsService

### R6.1 — Inyección de dependencias

**Dado** `OpenFoodFactsService` registrado en el container  
**Cuando** se resuelve  
**Entonces** recibe un `HttpClient` configurado con:  
- BaseAddress: `https://world.openfoodfacts.org/`  
- User-Agent: `PosWeb/1.0`  
- Timeout: 10 segundos

### R6.2 — Método Consultar

**Dado** un código de barras válido  
**Cuando** se llama a `ConsultarAsync(codigo)`  
**Entonces** hace `GET /api/v2/product/{codigo}.json`  
**Y** deserializa la respuesta  
**Y** devuelve un `OpenFoodFactsResultDto` con los campos mapeados  
**O** devuelve null si `product_name` es null/vacío  
**O** devuelve null si la llamada HTTP falla

### R6.3 — La integración es opcional

**Dado** que `OpenFoodFactsService` lanza excepción o devuelve null  
**Cuando** el controller recibe el resultado  
**Entonces** NO propaga la excepción al cliente  
**Y** devuelve `{ local: false, encontrado: false }`
