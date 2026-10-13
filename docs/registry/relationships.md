# Relationships

> Grafo de relaciones entre Knowledge Items.

## Tipos de relaciones

| Relación | Significado |
|----------|-------------|
| `USES` | El item fuente utiliza al item destino |
| `IMPLEMENTS` | El item fuente implementa el patrón o estándar definido por el destino |
| `DEPENDS_ON` | El item fuente requiere al item destino para funcionar |
| `RESPECTS` | El item fuente respeta la regla de negocio definida por el destino |
| `RELATED` | Relación conceptual sin dependencia técnica |
| `EXTENDS` | El item fuente extiende el concepto base con reglas adicionales |
| `REPLACES` | El item fuente reemplaza al item destino (obsoleto) |
| `DEPRECATED_BY` | El item fuente fue deprecado por el destino |

## Grafo

| Source ID | Relation | Target ID |
|-----------|----------|-----------|
| PAT-cart-flow | USES | HOOK-use-cart |
| PAT-cart-flow | USES | COMP-cart-host |
| PAT-cart-flow | RESPECTS | BUS-carrito |
| PAT-cart-flow | RESPECTS | BUS-venta |
| PAT-cart-flow | RESPECTS | BUS-compra |
| PAT-cart-flow | USES | PAT-display-raw |
| PAT-cart-flow | RELATED | ADR-cart-host |
| ADR-cart-host | RELATED | PAT-cart-flow |
| BUS-venta | EXTENDS | BUS-carrito |
| BUS-venta | RELATED | PAT-cart-flow |
| BUS-compra | EXTENDS | BUS-carrito |
| BUS-compra | RELATED | PAT-cart-flow |
| BUS-carrito | RELATED | PAT-cart-flow |
| LAYOUT-page-shell | RELATED | DS-design-tokens |
| ADR-ticket-resultado-landing | RELATED | PAT-usuario-preferencias |
| ADR-ticket-resultado-landing | USES | COMP-LabelPrintDialog |
| PAT-ticket-impresion-ancho | RESPECTS | PAT-usuario-preferencias |
| PAT-ticket-impresion-ancho | RELATED | ADR-ticket-resultado-landing |
| PAT-ticket-impresion-ancho | RELATED | COMP-LabelPrintDialog |
| PAT-mapa-responsive-popup | USES | HOOK-use-media-query |
| PAT-mapa-responsive-popup | RESPECTS | BUS-mesa-numero-titulo |
| HOOK-use-media-query | USES | PAT-mapa-responsive-popup |
| BUS-mesa-numero-titulo | RELATED | PAT-mapa-responsive-popup |
| BUS-mesa-numero-titulo | USES | HOOK-use-media-query |
| FLOW-suscripcion | RESPECTS | BUS-vencimiento-licencia |
| FLOW-suscripcion | RESPECTS | BUS-limites-planes |
| FLOW-suscripcion | USES | SERVICE-licensing-worker |
| FLOW-suscripcion | RESPECTS | ADR-suscripciones |
| SERVICE-licensing-worker | RESPECTS | ADR-suscripciones |
| SERVICE-licensing-worker | RESPECTS | BUS-vencimiento-licencia |
| SERVICE-licensing-worker | RESPECTS | BUS-limites-planes |
| BUS-vencimiento-licencia | RESPECTS | ADR-suscripciones |
| BUS-vencimiento-licencia | EXTENDS | BUS-limites-planes |
| BUS-limites-planes | RESPECTS | BUS-vencimiento-licencia |
| BUS-limites-planes | RESPECTS | ADR-suscripciones |
| ADR-suscripciones | RESPECTS | BUS-limites-planes |
| SERVICE-mailer-worker | RESPECTS | ADR-mailer-worker-dedicado |
| SERVICE-mailer-worker | RESPECTS | BUS-recuperacion-contrasena |
| SERVICE-mailer-worker | USES | FLOW-recuperacion-contrasena |
| FLOW-recuperacion-contrasena | RESPECTS | BUS-recuperacion-contrasena |
| FLOW-recuperacion-contrasena | USES | SERVICE-mailer-worker |
| FLOW-recuperacion-contrasena | RESPECTS | ADR-mailer-worker-dedicado |
| FLOW-recuperacion-contrasena | RELATED | FLOW-suscripcion |
| BUS-recuperacion-contrasena | RESPECTS | ADR-mailer-worker-dedicado |
| BUS-recuperacion-contrasena | USED_BY | FLOW-recuperacion-contrasena |
| BUS-recuperacion-contrasena | USES | SERVICE-mailer-worker |
| ADR-mailer-worker-dedicado | RELATED | SERVICE-licensing-worker |
| ADR-mailer-worker-dedicado | RELATED | ADR-db-hybrid |
| ADR-mailer-worker-dedicado | EXTENDS | SERVICE-mailer-worker |
| BUS-confirmacion-email | RELATED | BUS-recuperacion-contrasena |
| BUS-confirmacion-email | USED_BY | FLOW-confirmacion-email |
| BUS-confirmacion-email | RESPECTS | ADR-mailer-worker-dedicado |
| FLOW-confirmacion-email | RESPECTS | BUS-confirmacion-email |
| FLOW-confirmacion-email | RELATED | FLOW-recuperacion-contrasena |
| FLOW-confirmacion-email | USES | SERVICE-mailer-worker |
| FLOW-confirmacion-email | RESPECTS | ADR-mailer-worker-dedicado |
| BUS-recuperacion-contrasena | RELATED | BUS-confirmacion-email |
| BUS-mesa-cobro | RESPECTS | BUS-venta |
| BUS-mesa-cobro | RELATED | PAT-cart-flow |
| BUS-mesa-cobro | RELATED | SERVICE-restaurante |
| BUS-mesa-cobro | RELATED | BUS-mesa-numero-titulo |
| SERVICE-restaurante | USES | VentaService |
| SERVICE-restaurante | RESPECTS | BUS-mesa-cobro |
| SERVICE-restaurante | RESPECTS | BUS-mesa-numero-titulo |
| SERVICE-restaurante | RELATED | PAT-mapa-responsive-popup |
| SERVICE-mercadopago | RESPECTS | BUS-mp-verificacion |
| SERVICE-mercadopago | USES | VentaService |
| SERVICE-mercadopago | RESPECTS | BUS-vencimiento-licencia |
| BUS-mp-verificacion | RESPECTS | BUS-vencimiento-licencia |
| BUS-mp-verificacion | RELATED | SERVICE-mercadopago |
