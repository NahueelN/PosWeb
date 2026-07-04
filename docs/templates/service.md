# Service Template

> Template para Knowledge Items de tipo `Service`.
> Prefijo: `SERVICE-`

---

## Metadata

```yaml
ID: SERVICE-{nombre}
Type: Service
Name: {nombre descriptivo}
Status: Draft | Active | Canonical | Deprecated
Priority: Critical | High | Medium | Low
Level: Core | Domain | Project
Sources:
  - path/to/service.ts
  - path/to/client.ts
Created: YYYY-MM-DD
Updated: YYYY-MM-DD
```

### Opcionales (agregar solo si aportan valor)

```yaml
Confidence: High | Medium | Low
Review Required: true | false
Owner: Core | UX | Business | Shared | Infrastructure
Deprecates: SERVICE-{otro-servicio}
Deprecated By: SERVICE-{reemplazo}
Tags:
  - tag-controlado-1
Version: 1.0.0
```

---

## Descripción

<!-- Qué es este servicio. Una o dos frases. -->

---

## Problema que resuelve

<!-- ¿Por qué existe? ¿Qué pasaría si no estuviera? -->

---

## Ubicación

```
{path relativo}
```

---

## API / Métodos

<!-- Métodos principales del servicio. Si es TypeScript, pegar las firmas. -->

```ts
{
  modulo: {
    metodo: (params) => Promise<T>
  }
}
```

---

## Cuándo usar

<!-- Escenarios donde este servicio debe utilizarse. -->

---

## Cuándo NO usar

<!-- Escenarios donde este servicio NO debe utilizarse. -->

---

## Dónde se usa actualmente

<!-- Lista de archivos o módulos que consumen este servicio. -->

---

## Errores y manejo

<!-- Cómo maneja errores el servicio. Códigos de estado, mensajes, side effects. -->

---

## Consideraciones técnicas

<!-- Detalles de implementación, decisiones de diseño, tradeoffs. -->

---

## Relaciones

```yaml
RELATIONS:
  - type: USES
    target: COMP-{otro}
  - type: IMPLEMENTS
    target: PAT-{patron}
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| YYYY-MM-DD | Creación |
