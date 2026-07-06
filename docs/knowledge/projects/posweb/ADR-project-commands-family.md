# ADR-project-commands-family — Project Commands as a Conceptual Family (CMD-*)

## Metadata

```yaml
ID: ADR-project-commands-family
Type: ADR
Name: Project Commands as a Conceptual Family (CMD-*)
Status: Active
Priority: Medium
Level: Project
Sources:
  - docs/PKS_PROPOSALS.md
Created: 2026-07-05
Updated: 2026-07-05
Tags:
  - Methodology
```

---

## Context

El Project Companion comenzó como un conjunto de prompts ejecutados por el orquestador de Gentle AI. Con la incorporación del PKS y la creación del primer Standard del proyecto (STAND-pr-narrative), surge la necesidad de que el Companion evolucione hacia un sistema de comandos estructurado.

El proyecto ya identifica una familia completa de comandos planificados:

| Comando | Propósito |
|---------|-----------|
| `project init` | Inicializar la sesión del Companion cargando contexto del proyecto |
| `project sync` | Sincronizar rama. Quick mode (default): Assessment mínimo, merge rápido. `--full`: análisis completo de conocimiento. |
| `project pass` | Administrar una PASS |
| `project review` | Auditar una implementación |
| `project audit` | Comprender un módulo o funcionalidad |
| `project preserve` | Determinar qué conocimiento incorporar al PKS |
| `project learn` | Extraer conocimiento desde una branch, PR o funcionalidad |
| `project status` | Estado del proyecto, PASS activas, reglas nuevas, pendientes |
| `project help` | Listar todos los comandos disponibles |

De estos, `project sync`, `project init` y `project help` tienen especificación funcional detallada en `PKS_PROPOSALS.md`. El resto existe conceptualmente como visión.

Surge la pregunta: ¿cómo se clasifican estos comandos dentro del PKS?

### Opciones consideradas

**Opción 1 — STAND-***: Documentar los comandos como Standards del proyecto.

**Opción 2 — CMD-***: Crear un nuevo tipo de Knowledge Item para comandos.

---

## Decisión

Los comandos del Project Companion constituyen una **nueva familia conceptual** del PKS, distinta de los Standards.

**Fundamento**: un Standard define una **regla** que el proyecto debe cumplir. Un Command define una **capacidad** que el Project Companion puede ejecutar. Son naturalezas distintas. Mezclarlas en STAND-* perjudica la claridad de ambos conceptos.

**Criterio de implementación diferida**:

1. La dirección arquitectónica queda registrada desde ahora: los comandos son CMD-*, no STAND-*.
2. La infraestructura formal (registry, metadata, template, convenciones) **no se crea todavía**.
3. Las propuestas de comando vivirán en `PKS_PROPOSALS.md` mientras el sistema madura.
4. Cuando el **segundo o tercer comando** sea promovido, se crea la infraestructura CMD-* completa.

Este criterio evita crear infraestructura por especulación, pero también evita que los comandos nazcan como Standards cuando conceptualmente no lo son.

---

## Consecuencias

**Positivas**:
- La dirección arquitectónica queda explícita desde el inicio, evitando tener que reclasificar comandos después.
- No se introduce infraestructura innecesaria hasta que haya evidencia de uso real.
- Las propuestas de comando pueden evolucionar libremente en PKS_PROPOSALS.md sin restricciones de template.
- La familia CMD-* queda claramente diferenciada de STAND-* para cuando se materialice.

**Negativas**:
- Mientras no exista infraestructura formal, los comandos en PKS_PROPOSALS.md no tendrán metadata unificada ni registry.
- Podría generar ambigüedad temporal si alguien busca "dónde están los comandos del Companion".

**Neutrales**:
- El primer comando (`project sync`) se promueve como Propuesta Activa sin tipo asignado, dejando explícito que migrará a CMD-* cuando la infraestructura exista.

---

## Estado

Active. La decisión está tomada aunque la infraestructura esté diferida.

---

## Relaciones

```yaml
RELATIONS:
  - type: RELATED
    target: STAND-pr-narrative
  - type: RELATED
    target: PKS_PROPOSALS.md
```
