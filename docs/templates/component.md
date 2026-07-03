# Component Template

> Template para Knowledge Items de tipo `Component`.
> Prefijo: `COMP-`

---

## Metadata

```yaml
ID: COMP-{nombre}
Type: Component
Name: {nombre descriptivo}
Status: Draft | Active | Canonical | Deprecated
Priority: Critical | High | Medium | Low
Level: Core | Domain | Project
Sources:
  - path/to/file.tsx
  - path/to/other-file.ts
Created: YYYY-MM-DD
Updated: YYYY-MM-DD
```

### Opcionales (agregar solo si aportan valor)

```yaml
Confidence: High | Medium | Low
Review Required: true | false
Owner: Core | UX | Business | Shared | Infrastructure
Deprecates: COMP-{otro-componente}
Deprecated By: COMP-{reemplazo}
Tags:
  - tag-controlado-1
  - tag-controlado-2
Version: 1.0.0
```

---

## Descripción

<!-- Qué es este componente. Una o dos frases. -->

---

## Problema que resuelve

<!-- ¿Por qué existe? ¿Qué pasaría si no estuviera? -->

---

## Ubicación

```
{path relativo al componente}
```

---

## Props

<!-- Interfaz completa de props. Si es TypeScript, pegar la interfaz. -->

```ts
interface ExampleProps {
  // ...
}
```

---

## Cuándo usar

<!-- Escenarios donde este componente debe utilizarse. -->

---

## Cuándo NO usar

<!-- Escenarios donde este componente NO debe utilizarse. -->

---

## Dónde se usa actualmente

<!-- Lista de archivos o módulos que consumen este componente. -->

- `pages/EjemploPage.tsx`
- `components/hosts/EjemploHost.tsx`

---

## Ejemplo de uso

```tsx
// Ejemplo mínimo funcional
```

---

## Variantes / Estados

<!-- Si el componente tiene variantes visuales o de comportamiento, documentarlas. -->

| Variante | Descripción |
|----------|-------------|
| `variant="primary"` | ... |

---

## Consideraciones técnicas

<!-- Detalles de implementación, decisiones de diseño, tradeoffs. -->

---

## Relaciones

<!-- Lista de Knowledge Items relacionados. -->

```yaml
RELATIONS:
  - type: USES
    target: COMP-{otro}
  - type: IMPLEMENTS
    target: PAT-{patron}
```

---

## Historial

<!-- Registro de cambios significativos. -->

| Fecha | Cambio |
|-------|--------|
| YYYY-MM-DD | Creación |
