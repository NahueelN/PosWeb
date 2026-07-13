# STAND-pr-narrative — Preservación de Narrativa de Desarrollo

## Metadata

```yaml
ID: STAND-pr-narrative
Type: Standard
Name: Preservación de Narrativa de Desarrollo
Status: Active
Priority: High
Level: Project
Sources:
  - docs/PKS_PROPOSALS.md
Created: 2026-07-05
Updated: 2026-07-05
Tags:
  - Methodology
  - PR
```

---

## Descripción

Este Standard establece que todo cambio relevante del proyecto debe dejar trazabilidad escrita del razonamiento que lo originó. No alcanza con que el código funcione. El proyecto necesita preservar el **por qué**, el **cómo se llegó** y el **qué se aprendió** durante el desarrollo.

El Pull Request es el vehículo natural donde esa narrativa queda registrada, pero el objetivo no es mejorar descripciones de PRs. El objetivo es que cualquier desarrollador —persona o IA— pueda reconstruir el contexto completo de un cambio meses después sin depender del autor, de conversaciones, ni del historial de Git.

---

## Problema

El código responde **qué** cambió. Git responde **cuándo** y **quién**. Pero ninguna herramienta actual preserva de forma confiable **por qué** se tomó una decisión, **qué alternativas se evaluaron**, **qué se descartó**, o **qué conocimiento nuevo generó ese cambio**.

Sin esta narrativa:

- Las decisiones de arquitectura y producto se pierden cuando el autor se va del proyecto.
- El mismo problema se analiza y resuelve múltiples veces porque no queda registro de lo que ya se discutió.
- Las IAs y herramientas del Project Companion no tienen contexto para operar sobre el cambio.
- El PKS se queda sin la materia prima que necesita para evolucionar.

---

## Reglas

### Regla 1 — La narrativa es obligatoria

Un PR no se considera funcionalmente terminado hasta que su narrativa esté completa. No es un detalle opcional ni una mejora estética. Es una regla metodológica del proyecto.

### Regla 2 — Contenido mínimo de la narrativa

Todo PR debe documentar como mínimo:

| Sección | Qué debe contener |
|---------|-------------------|
| **Problema u oportunidad** | ¿Qué problema existía? ¿Qué fricción tenía el operador o el sistema? ¿Qué motivó este cambio? |
| **Análisis realizado** | ¿Cómo se llegó a la solución? ¿Qué se investigó? ¿Qué evidencia se usó para decidir? |
| **Alternativas consideradas** | ¿Qué otros caminos se evaluaron? ¿Qué hipótesis fueron descartadas y por qué? |
| **Decisión tomada** | ¿Qué solución quedó implementada? ¿Qué criterios justifican esa elección? |
| **Alcance real del cambio** | ¿Qué capacidad nueva se incorporó? ¿Qué comportamiento cambió? ¿Qué procesos fueron afectados? Archivos modificados. |
| **Conocimiento generado** | ¿Qué aprendió el proyecto con este cambio? Referenciar los artefactos del PKS que correspondan. |
| **Trabajo pendiente** | ¿Qué quedó deliberadamente fuera del alcance? ¿Qué mejoras futuras fueron identificadas? ¿Qué decisiones quedaron abiertas? |

No todas las secciones requieren párrafos largos. Una sección puede tener una línea si no hay contenido sustancial. Lo importante es que cada cambio deje constancia de lo que se consideró, lo que se decidió y lo que se aprendió.

El nivel de detalle debe ser proporcional a la complejidad e impacto del cambio.

### Regla 3 — La narrativa no reemplaza al PKS

La narrativa pertenece al PR. El PKS pertenece al proyecto. Son conceptos separados que se relacionan de la siguiente manera:

- La narrativa es el **registro inmediato** del razonamiento del cambio.
- El PKS es la **memoria permanente** del proyecto.

La narrativa **puede producir conocimiento nuevo**. Ese conocimiento, si demuestra valor, debe proponerse como Knowledge Item, ADR, Standard, Product Rule, Pattern, Proposal, Architectural Gap, o cualquier artefacto del PKS que corresponda.

Pero la narrativa nunca reemplaza al PKS. Un PR cerrado no debe ser la única fuente del conocimiento generado.

### Regla 4 — Formato legible por personas y por IA

La narrativa debe escribirse en Markdown estructurado dentro del body del PR, con las siguientes características:

- **Secciones con `##`** (H2) que correspondan al contenido mínimo de la Regla 2. Esto permite parseo automático por herramientas.
- **Listas con `-` o `1.`** para alternativas, decisiones y pendientes.
- **Código o comandos** entre `` `backticks` `` o bloques ` ``` ` cuando corresponda.
- **Referencias explícitas**: nombres de archivos, IDs de Knowledge Items (`BUS-carrito`, `ADR-cart-host`), números de issue, commits relacionados.

Este formato permite que tanto personas como IAs y futuros comandos del Project Companion (`project sync`, `project review`, `project release`, `project audit`) puedan interpretar el contenido sin depender de lenguaje natural no estructurado.

---

## Relación con futuros comandos del Project Companion

Esta narrativa está diseñada para alimentar comandos automatizados del Project Companion:

| Comando | Cómo consume esta narrativa |
|---------|----------------------------|
| `project sync` | Lee el conocimiento generado para actualizar el PKS. |
| `project review` | Reconstruye el contexto de los cambios pendientes de revisión. |
| `project release` | Agrupa la narrativa de todos los PRs incluidos en la release. |
| `project audit` | Rastrea decisiones, alternativas y conocimiento generado a lo largo del tiempo. |

Por eso la Regla 4 no es un detalle cosmético. El formato estructurado es lo que permite que estas herramientas operen sin intervención humana.

---

## Ejemplo

```markdown
## Problema

CompraPage obligaba al operador a abandonar la compra para crear un proveedor nuevo.

## Análisis

Se auditó Clientes, Proveedores, Ventas y Compras. Se detectó una asimetría funcional:
Clientes permitía alta cruzada desde Ventas, pero Proveedores no desde Compras.

## Alternativas consideradas

1. Agregar un botón "+" en el selector de proveedores (elegido).
2. Abrir ProveedoresPage en una pestaña aparte (descartado: rompe el flujo).
3. Crear un modal genérico de alta (descartado: sobreingeniería para este caso).

## Decisión

Se agrega un botón "+ Proveedor" en el selector de CompraPage que abre un modal
con el formulario de creación. Al guardar, selecciona automáticamente el nuevo proveedor
y continúa la compra.

## Alcance

- `frontend/src/pages/CompraPage.tsx`: +30 líneas (selector + modal)
- `frontend/src/components/proveedores/AltaProveedorModal.tsx`: nuevo componente

## Conocimiento generado

Se identificó un patrón de Alta Cruzada que aplica a múltiples entidades.
Referencias PKS: BUS-compra, BUS-venta, PRD-alta-cruzada, PAT-alta-cruzada.

## Trabajo pendiente

- Clientes también necesita alta cruzada desde Ventas (backlog).
- Evaluar si esto justifica un Lookup genérico reutilizable.
```

---

## Vigencia

Este Standard entra en vigencia a partir de su fecha de creación. Aplica a todo PR creado desde esa fecha en adelante. No requiere migrar PRs anteriores.
