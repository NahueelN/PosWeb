# PASS Specification

**Versión:** 1.0
**Estado:** Stable
**Validado por:** PASS-001

**Capacidades experimentales:**
- Múltiples PASS activas simultáneas
- Integración con Project Sync
- Ownership
- Related (PASS relacionadas)
- Scope
- Status avanzado (Draft, Blocked, transiciones completas)

---

## Definición

PASS es una **unidad de trabajo** del Project Companion.

Representa un objetivo específico y acompaña la unidad de trabajo durante todo su ciclo de vida, proveyendo el contexto temporal necesario para ejecutarlo, preservar el aprendizaje generado y exponer conocimiento que pueda ser extraído como artefacto permanente cuando demuestre valor.

PASS no depende de herramientas, ramas, módulos ni sesiones. Su identidad la define exclusivamente su objetivo.

---

## Principios

### Principio de Objetivo Único

Una PASS debe tener un único objetivo principal. Puede modificar múltiples archivos, módulos y decisiones, pero todo debe converger a una misma respuesta: "¿Qué intentábamos lograr?" Si durante el trabajo aparecen dos objetivos independientes, corresponden a dos PASS distintas. Los hallazgos secundarios se registran como candidatos para futuras PASS, no se incorporan a la PASS actual.

### Principio de Transparencia

PASS acompaña una unidad de trabajo. No reemplaza documentación permanente. Si una PASS crece hasta comportarse como un ADR, un Standard o un documento del PKS, el conocimiento correspondiente debe extraerse y formalizarse por separado. PASS debe seguir siendo una unidad de trabajo.

---

## Propiedades

| Propiedad | ¿Obligatorio? | Motivo | Quién lo usa | Cuándo se completa |
|-----------|--------------|--------|-------------|-------------------|
| ID | ✅ | Identidad única en el ecosistema | Project Companion, búsquedas, referencias | Al crear la PASS |
| Title | ✅ | Qué es, de un vistazo | Cualquier desarrollador | Al crear la PASS |
| Trigger | ✅ | Por qué existe (Bug, Feature, Refactor, Research, Audit, Sync, etc.) | Project Companion (filtrado de relevancia) | Al crear la PASS |
| Status | ✅ | ¿Está activa? ¿Bloqueada? ¿Completada? | Project Companion, otros desarrolladores | Se actualiza durante todo el ciclo |
| Objective | ✅ | ¿Qué intentamos lograr? | Quien retoma el trabajo | Al crear la PASS |
| Owner | 🟡 Opcional | Trazabilidad, no restrictivo | Para saber a quién preguntar si está bloqueada | Al crear la PASS |
| Scope | 🟡 Opcional | Para filtrar búsquedas entre múltiples PASS | Búsquedas, comandos CMD-* | Al crear la PASS |

---

## Estructura

### Resumen

Para quien retome el trabajo o para que el ecosistema determine relevancia. Debe ser suficiente para decidir si se necesita leer el Detalle.

- ID, Title, Trigger, Status
- Objective
- Next Step

### Detalle

Expandible bajo demanda. Contiene el contexto detallado que respalda el Resumen.

- Context
- Open Decisions
- Pending Items
- Related (opcional)
- Artifacts (opcional)

---

## Ciclo de vida de Status

```
Draft → Active ⇄ Blocked → Completed → Archived
```

| Status | Significado | ¿Utilizable por Project Sync? |
|--------|------------|-----------------------------|
| Draft | En creación, aún no es útil | ❌ Ignorar |
| Active | Trabajo en progreso | ✅ Leer contexto |
| Blocked | Esperando algo externo | ✅ Evaluar riesgo |
| Completed | Trabajo terminado, pendiente de extracción de conocimiento | ✅ Evaluar extracción |
| Archived | Finalizado, conocimiento extraído | ❌ Ignorar |

---

## Preguntas obligatorias

Toda PASS debe responder:

1. **¿Qué contexto necesita quien retome este trabajo?**
2. **¿Qué decisiones siguen abiertas?**
3. **¿Qué quedó pendiente?**
4. **¿Cuál es el próximo paso recomendado y por qué?**

---

## Nota sobre escalabilidad (V1)

PASS se limita a representar una unidad de trabajo. No incorpora lógica de búsqueda, indexación o descubrimiento. La responsabilidad de localizar PASS relevantes pertenece al Project Companion, no a PASS. PASS únicamente expone los metadatos mínimos (ID, trigger, status, objective) para que el Companion pueda filtrarlas. La estrategia de indexación se definirá cuando exista evidencia suficiente de que el volumen de PASS lo requiere.

---

## Relación con otros artefactos

| Artefacto | Relación |
|-----------|----------|
| **PKS** | PASS expone conocimiento que, si demuestra valor, se extrae y formaliza como Knowledge Items permanentes |
| **ADR** | PASS puede contener exploraciones arquitectónicas que se cristalicen como ADR |
| **Standards** | PASS puede descubrir reglas que luego se formalicen como Standards |
| **Narrativas (STAND-pr-narrative)** | La narrativa preserva la historia de un cambio; PASS preserva el contexto de la unidad de trabajo. Granularidad distinta |
| **CMD-project-sync** | Sync lee PASS activas para contexto, actualiza PASS durante la ejecución, y puede crear una PASS cuando el sync constituye una unidad de trabajo significativa |
| **PROJECT_COMPANION.md** | Define el ciclo de trabajo (Trigger → Comprender → Diseñar → Construir → Aprender → Preservar → Retrospectiva). PASS implementa la estructura de dos niveles definida por el Principio de Carga Mínima |
