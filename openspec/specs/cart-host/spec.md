# CartHost Specification

## Purpose

Componente de alto nivel que compone `useCart` + `CartPanel` + `PaymentFooter` + `MontoInput` en un layout estándar de dos columnas (product grid izquierda, carrito derecha) para flujos tipo venta/compra.

## Requirements

### Requirement: Two-Column Layout

`CartHost` renderiza un layout flex con panel izquierdo (`children`) y panel derecho (`CartPanel`). El panel derecho ocupa 1/3 del viewport en desktop (`lg:mr-[33.333vw]`).

#### Scenario: Children render in left panel
- GIVEN `<CartHost><SearchBar /></CartHost>`
- THEN SearchBar aparece en el panel izquierdo

#### Scenario: CartPanel renders in right panel
- GIVEN CartHost montado con items
- THEN CartPanel visible en el tercio derecho, fixed

### Requirement: Cart Integration

CartHost recibe el resultado de `useCart` y lo pasa a `CartPanel`.

#### Scenario: Items flow to CartPanel
- GIVEN useCart tiene 3 ítems
- WHEN CartHost renderiza
- THEN CartPanel muestra 3 ítems con cantidades y subtotales

### Requirement: Payment Footer Integration

CartHost renderiza `PaymentFooter` dentro del `footer` prop de `CartPanel`, con `MontoInput` y medios de pago como children configurables vía `paymentSlot`.

#### Scenario: Payment controls render
- GIVEN `paymentSlot` contiene medios de pago
- WHEN CartHost renderiza
- THEN los medios de pago aparecen dentro de PaymentFooter

### Requirement: Configurable Slots

CartHost acepta props para personalizar comportamiento:
- `title`: título del panel
- `confirmLabel`: texto del botón confirmar
- `onConfirm`: handler de confirmación
- `paymentSlot`: ReactNode con controles de pago específicos
- `headerExtra`: ReactNode extra en header del CartPanel
- `showVerify`: toggle para checkbox de verificación
- `emptyState`: ReactNode para estado vacío del carrito

#### Scenario: Custom payment slot renders
- GIVEN `paymentSlot={<FuentePagoSelector />}`
- THEN FuentePagoSelector aparece en PaymentFooter

### Requirement: PageShell Wrapper

CartHost PUEDE wrappear su contenido con `PageShell` si se pasa `pageShell` prop.

#### Scenario: PageShell renders when configured
- GIVEN `pageShell={{ title: "Ventas", subtitle: "..." }}`
- THEN PageShell envuelve el panel izquierdo
