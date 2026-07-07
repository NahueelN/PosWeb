# PROJECT_COMPANION_PROPOSALS.md — Propuestas congeladas

> Todas las ideas de expansión de Project Companion que no son necesarias para el objetivo actual: acompañar una tarea de desarrollo desde que se recibe hasta que se implementa.
>
> Se congelan, no se descartan. Si en el futuro aparece suficiente evidencia de que una propuesta reduce fricción en tareas reales, se reactiva.

---

## Propuesta 1 — Context Builder

**Descripción:** Componente conceptual que, dada una tarea, responde "¿qué contexto mínimo necesito para resolverla?" y carga únicamente ese contexto, evitando que la IA cargue todo el proyecto o toda la conversación.

**Por qué se congela:** El problema que resuelve es real (PASS-001 cargó ~90% de contexto innecesario), pero su diseño requiere entender primero en qué se diferencia el contexto necesario para una tarea pequeña (agregar columna) vs una grande (crear módulo). Hasta que hagamos decenas de tareas reales de tamaños variados, no tenemos datos suficientes para diseñarlo bien. Toda propuesta actual sería teoría.

**Evidencia para reactivar:** Cuando tengamos 5+ PASS de distintas complejidades, podremos analizar patrones de contexto efectivamente utilizado y diseñar el Context Builder con evidencia empírica, no especulativa.

> Relacionado con: Propuesta 2 (KIs como índices), Propuesta 3 (Arquitectura completa de contexto), Propuesta 7 (Carga mínima — esta última está parcialmente implementada como principio estructural en PROJECT_COMPANION.md)

---

## Propuesta 2 — Knowledge Items como índices semánticos

**Descripción:** Extender el formato de los KI para que funcionen también como nodos de navegación, respondiendo "¿qué artefacto documenta?" y "¿qué conceptos cubre?" para permitir descubrimiento automático del conocimiento relevante sin que un humano se acuerde manualmente del KI.

**Por qué se congela:** La hipótesis H-KI-NAV-001 quedó registrada en PASS-001, validada en una sola pasada (análisis de LAYOUT-page-shell). Necesita al menos 2-3 PASS más de tipos distintos de cambio para verificar que el formato propuesto realmente mejora el descubrimiento. Sin esa evidencia, cambiar el template del PKS sería teoría disfrazada de evolución.

**Evidencia para reactivar:** Cuando en una tarea real un KI con el nuevo formato sea descubierto automáticamente sin que el desarrollador sepa que existe. Si ocurre en 2 casos distintos, se reactiva.

> Originado en: PASS-001, sección "Hipótesis experimental H-KI-NAV-001"

---

## Propuesta 3 — Arquitectura completa de contexto (3 niveles de memoria)

**Descripción:** Modelo formal de tres capas de memoria — Metodología (PROJECT_COMPANION.md), Conocimiento permanente (PKS), Memoria de trabajo (PASS) — con reglas de referencia y archivo.

**Por qué se congela:** El principio de los 3 niveles ya está implícito en cómo trabajamos (Project Companion sabe que existe metodología + PKS + Pass separados). Formalizarlo como arquitectura antes de tener varias PASS exitosas sería adelantar estructura sin entender las necesidades reales de consulta entre niveles.

**Evidencia para reactivar:** Cuando una PASS necesite consultar a otra PASS o a un KI antiguo y no pueda hacerlo eficientemente, esa fricción concreta guiará la arquitectura. Hasta entonces, la separación actual (docs/ + PKS + conversational continuity) alcanza.

---

## Propuesta 4 — Heurística de scoring para selección de cambio

**Descripción:** Fórmula cuantitativa (alineación ×2 + valor ×2 + aprendizaje ×2 + costo invertido + riesgo invertido) para elegir entre múltiples candidatos de mejora detectados durante Comprender.

**Por qué se congela:** Se aplicó una sola vez en PASS-001 para seleccionar C6 entre 8 candidatos. Funcionó, pero no es evidencia suficiente. Una heurística de scoring tiene sentido cuando hay ~5+ candidatos evaluables, lo cual no es común en tareas pequeñas. Sobreingeniería para el MVP de "acompañar una tarea".

**Evidencia para reactivar:** Si en una tarea aparecen naturalmente 3+ candidatos y la intuición no alcanza para elegir, recién ahí la heurística aporta valor. Si no aparece ese caso en 10 tareas, descartar la propuesta.

> Nota: la heurística ya fue separada de la metodología oficial. Queda como experimento en PASS-001.

---

## Propuesta 5 — Navegación semántica cruzada KI ↔ código

**Descripción:** Sistema de relaciones entre KI y archivos de código que permita navegar de "concepto → KI → archivos → más KI" sin necesidad de grep manual.

**Por qué se congela:** Es un subconjunto del Context Builder (Propuesta 1) y de KI como índices (Propuesta 2). Ambas están congeladas por la misma razón. La navegación semántica sin un Context Builder que la active no es más que una base de datos relacional sin query — estructura sin motor.

**Evidencia para reactivar:** Depende de Propuesta 1 y 2. Si se reactivan, esta viene con ellas.

---

## Propuesta 6 — Comprensión / generación de sistemas completos

**Descripción:** Escalar Project Companion para comprender o generar un proyecto entero (ERP, POS, CRM) sin intervención humana.

**Por qué se congela:** Es exactamente lo opuesto al MVP actual. El MVP es "recibir una tarea concreta y acompañar al desarrollador hasta implementarla". Comprender un sistema completo es un objetivo de largo plazo que primero requiere que el flujo de tareas individuales sea extremadamente fluido. No tiene sentido diseñar el techo sin construir los cimientos.

**Evidencia para reactivar:** Cuando hayamos completado 20+ tareas individuales con el flujo actual y la fricción predominante sea "no tengo visión del sistema completo" en lugar de "esta tarea específica fue difícil".

---

## Propuesta 7 — Optimización de sesiones y cierre de contexto

**Descripción:** Protocolo formal para cerrar una sesión de trabajo donde toda la conversación se condensa en la PASS, el Knowledge Filter se aplica, y el contexto se descarta para que la próxima sesión arranque con carga mínima.

**Por qué se congela:** Es una solución a un problema que tenemos (contexto crece en la conversación) pero que hoy manejamos con delegaciones y uso manual de PASS. Antes de diseñar un protocolo de cierre, necesitamos saber cuánto contexto efectivamente descartamos y cuánto necesitamos retener. Eso requiere varias sesiones de trabajo real midiendo el punto exacto donde el contexto de la conversación se vuelve ruido.

**Evidencia para reactivar:** Cuando al retomar una PASS después de una semana no podamos hacerlo solo con el Nivel 1 de la PASS. Si el Nivel 1 es suficiente, el protocolo de cierre no agrega valor.

---

## Propuesta 8 — Principio de Carga Mínima (aplicación completa)

**Descripción:** El principio está incorporado en `PROJECT_COMPANION.md` como principio estructural. Falta aplicarlo al propio `PROJECT_COMPANION.md`, a los KI del PKS, y a los ADR. Cada artefacto debe tener resumen canónico (carga por defecto) + detalle expandible (consulta bajo demanda).

**Por qué se congela:** El principio ya está aceptado (sección "Principio: Carga mínima" en PROJECT_COMPANION.md). Aplicarlo a los documentos existentes es trabajo de refactor que no aporta valor hasta que el consumo de contexto sea una fricción comprobada al retomar PASS. No hacerlo por adelanto.

**Evidencia para reactivar:** Cuando al retomar una PASS el Nivel 1 sea insuficiente para decidir si cargar el Nivel 2. Si el Nivel 1 es suficiente, el resto del documento no necesita refactor.

> Estado: parcialmente implementado (principio en methodology, PASS-001 con dos niveles). Pendiente de aplicación a PROJECT_COMPANION.md, KI del PKS, y ADR.

---

## Nota sobre el ciclo de vida

Toda propuesta en este documento puede ser:

- **ReactiTradada** cuando aparezca evidencia de que un problema real necesita la propuesta para ser resuelto.
- **DesCartada** si después de un tiempo se demuestra que la propuesta no reduce fricción o introduce complejidad innecesaria.

Ninguna propuesta es permanente. todas están sujetas al mismo criterio que la metodología: lo que no demuestra valor en tareas reales, no pertenece.

---

## Historial

| Fecha | Cambio |
|---|---|
| 2026-07-03 | Congelación inicial. Todas las propuestas trasladadas desde conversación / PASS-001. |
