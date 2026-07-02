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
