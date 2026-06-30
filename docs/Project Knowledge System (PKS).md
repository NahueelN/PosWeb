# Project Knowledge System (PKS)

> El cerebro vivo de PosWeb.

\---

# Objetivo

El objetivo de este proyecto NO es escribir documentación.

El objetivo es construir una Base de Conocimiento viva capaz de preservar el conocimiento del proyecto a lo largo del tiempo.

Esta Base de Conocimiento será la fuente oficial de arquitectura, componentes, reglas de negocio, patrones y decisiones de diseño de PosWeb.

En el futuro deberá poder ser utilizada por:

* OpenCode
* ChatGPT
* Claude
* Cursor
* CLI propio
* MCP propio
* AI Project Architect
* cualquier herramienta futura

La documentación debe estar pensada tanto para personas como para herramientas automatizadas.

\---

# Idea fundamental

**El código representa la implementación.**

**El Project Knowledge System representa la intención.**

El código explica **cómo** funciona PosWeb.

El Project Knowledge System debe explicar:

* por qué está construido de esa manera;
* qué problema resuelve cada componente;
* cuándo debe reutilizarse;
* cuándo NO debe reutilizarse;
* qué decisiones arquitectónicas llevaron a esa implementación;
* qué reglas de negocio deben respetarse;
* qué patrones forman parte del estándar del proyecto.

Si algún día todo el código tuviera que reescribirse desde cero, el Project Knowledge System debería contener suficiente conocimiento como para reconstruir la misma arquitectura sin perder las decisiones que hicieron crecer al proyecto.

La implementación puede cambiar.

Las tecnologías pueden cambiar.

Los frameworks pueden cambiar.

Pero el conocimiento del proyecto debe permanecer.

Ese es el verdadero activo que queremos preservar.

Por ese motivo, el Project Knowledge System no pretende reemplazar al código.

Lo complementa.

El código responde:

> ¿Cómo funciona?

El Project Knowledge System responde:

> ¿Por qué funciona así?

> ¿Qué problema resuelve?

> ¿Qué no debo romper?

> ¿Qué debería reutilizar?

> ¿Qué decisión tomó el equipo y por qué?

Cuando exista una diferencia entre el código y la Base de Conocimiento, deberá considerarse una inconsistencia que debe revisarse.

El objetivo es mantener ambos sincronizados durante toda la vida del proyecto.

\---

# Filosofía

El conocimiento vale más que el código.

El código puede reescribirse.

Las decisiones arquitectónicas no.

Cada vez que el proyecto aprende algo importante, ese conocimiento debe poder preservarse.

No queremos depender de la memoria de los desarrolladores.

Queremos que el proyecto recuerde por sí mismo.

\---

# Objetivos del sistema

Construir una Base de Conocimiento que permita:

* entender el proyecto rápidamente;
* conocer la arquitectura;
* reutilizar componentes;
* reutilizar patrones;
* preservar reglas de negocio;
* registrar decisiones importantes;
* evitar reinventar soluciones;
* mantener consistencia entre módulos;
* ayudar a futuras IAs a comprender el proyecto.

\---

# Qué NO es

No es un conjunto de Markdown.

No es un manual.

No es documentación tradicional.

No reemplaza el código.

No pretende documentar absolutamente todo.

\---

# Qué SÍ es

Es una representación del conocimiento del proyecto.

Cada documento representa una pieza importante del conocimiento de PosWeb.

A ese documento lo llamaremos:

Knowledge Item.

\---

# Principios

## 1\.

Registrar solamente conocimiento importante.

No registrar código trivial.

\---

## 2\.

Registrar únicamente aquello que aporta contexto.

No repetir lo que ya explica claramente el código.

\---

## 3\.

La documentación debe evolucionar junto con el proyecto.

Nunca quedar desactualizada.

\---

## 4\.

Toda incorporación debe ser una decisión consciente.

Nunca registrar conocimiento automáticamente.

Siempre preguntar.

\---

## 5\.

La simplicidad tiene prioridad.

No agregar complejidad innecesaria.

\---

## 6\.

Pensar siempre en reutilización.

Todo componente reutilizable merece ser evaluado.

\---

# Organización

La Base de Conocimiento estará organizada de la siguiente forma.

```text
docs/

    README.md

    PROJECT\\\_KNOWLEDGE\\\_SYSTEM.md

    registry/

    items/

    templates/

    engram/

    glossary/
```

\---

# Registry

Contiene índices.

Permite localizar rápidamente el conocimiento disponible.

Debe ser la primera fuente consultada por cualquier IA.

\---

# Items

Contiene los Knowledge Items.

Cada archivo representa una única pieza importante del conocimiento del proyecto.

Ejemplos:

* COMP-cart-host.md
* PAT-shopping-cart.md
* BUS-ventas-compras.md
* ADR-cart-host.md
* FLOW-sale.md

\---

# Templates

Define la estructura oficial de cada tipo de Knowledge Item.

No debe haber documentos creados manualmente con formatos distintos.

\---

# Engram

Contiene memoria temporal del proyecto.

Ideas.

Contexto.

Conversaciones.

Investigaciones.

Información aún no consolidada.

No representa conocimiento oficial.

\---

# Glosario

Define términos oficiales utilizados dentro del proyecto.

Ejemplo:

* Venta
* Compra
* Combo
* Scanner
* Carrito
* Monto recibido

\---

# Tipos de Knowledge Item

El sistema soportará distintos tipos.

Ejemplos:

* Component
* Pattern
* Business Rule
* Architecture
* ADR
* Design System
* Layout
* Screen
* Flow
* Hook
* Utility
* Service
* Model
* Form
* Dialog
* Keyboard Flow

Si en el futuro aparece un nuevo tipo, podrá incorporarse.

\---

# Identificadores

Todo Knowledge Item deberá tener un identificador permanente.

Ejemplo:

* COMP-
* PAT-
* BUS-
* ADR-
* DS-
* FLOW-
* HOOK-
* UTIL-
* MODEL-
* SERVICE-
* LAYOUT-
* SCREEN-
* FORM-

No depender nunca del nombre del archivo.

\---

# Metadata

Todos los documentos compartirán una estructura común.

Ejemplo:

* Metadata
* ID
* Tipo
* Nombre
* Estado
* Creado
* Actualizado
* Descripción
* Problema
* Cuándo usar
* Cuándo NO usar
* Reglas
* Ejemplos
* Relaciones

\---

# Relaciones

Los Knowledge Items forman un grafo.

No son documentos aislados.

Relaciones posibles:

* USES
* IMPLEMENTS
* DEPENDS\_ON
* RELATED
* RESPECTS
* REPLACES
* DEPRECATED\_BY
* INSPIRED\_BY

Esto permitirá navegar toda la arquitectura.

\---

# Campos opcionales

No todos los documentos necesitarán toda la información.

Cuando aporte valor podrán agregarse campos como:

* Confidence
* Review Required
* Version
* Owner
* Tags
* Priority
* Stability
* Historial
* Roadmap
* Performance
* Compatibilidad
* Riesgos
* Diagramas

Nunca agregarlos automáticamente.

Siempre consultar.

\---

# Confidence

Permite indicar la madurez del conocimiento.

* High
* Medium
* Low

Es opcional.

\---

# Review Required

Indica si una IA debe consultar antes de reutilizar ese conocimiento.

Es opcional.

\---

# Stability

Estado técnico.

* Stable
* Experimental
* Legacy

\---

# Priority

Importancia dentro del proyecto.

* Critical
* High
* Medium
* Low

\---

# Tags

Clasificación temática.

Ejemplo:

* POS
* Scanner
* Keyboard
* Ventas
* Compras
* UX
* Offline

\---

# Owner

Área responsable.

* Core
* UX
* Business
* Shared
* Infrastructure

\---

# Evolución

La Base de Conocimiento deberá crecer junto con el proyecto.

Cada vez que aparezca:

* un componente reutilizable;
* un patrón;
* una regla de negocio;
* una decisión arquitectónica;
* un flujo;
* un servicio;
* un modelo;
* un cambio importante del Design System;

el sistema deberá detectarlo.

Nunca registrarlo automáticamente.

Siempre preguntar.

Ejemplo:

> Detecté un nuevo patrón.

> ¿Querés registrarlo?

\---

# Sincronización

Cuando un componente ya documentado cambie, deberá verificarse si su documentación sigue siendo correcta.

Si deja de representar la realidad del código deberá proponerse su actualización.

Nunca modificar automáticamente.

\---

# Filtro de registro

Antes de sugerir registrar un nuevo Knowledge Item deberá evaluarse si realmente vale la pena.

Registrar solamente cuando:

* sea reutilizable;
* represente una decisión arquitectónica;
* represente una regla de negocio;
* implemente un patrón;
* tenga lógica importante;
* sea utilizado por varios módulos;
* preserve conocimiento difícil de reconstruir.

\---

# Knowledge Score

Antes de sugerir registrar un nuevo elemento se calculará un puntaje.

Ese puntaje servirá únicamente para decidir si vale la pena preguntarme.

Nunca registrará automáticamente.

La decisión final siempre será humana.

\---

# Forma de trabajar

Cuando un desarrollo termine:

1. Analizar los cambios realizados.
2. Detectar conocimiento nuevo.
3. Evaluar si merece registrarse.
4. Preguntarme.
5. Si acepto, actualizar la Base de Conocimiento.

\---

# Roadmap

## Etapa 1

Construcción de la Base de Conocimiento.

## Etapa 2

Registro asistido.

## Etapa 3

Búsqueda inteligente.

## Etapa 4

CLI.

## Etapa 5

MCP.

## Etapa 6

AI Project Architect.

\---

# Visión

El objetivo final no es tener mejor documentación.

El objetivo final es construir un sistema capaz de entender PosWeb.

Un sistema que preserve las decisiones del proyecto.

Que conozca los componentes.

Que conozca la arquitectura.

Que conozca las reglas.

Que conozca los patrones.

Y que pueda ayudar a cualquier desarrollador o IA a trabajar exactamente igual que quienes construyeron el sistema desde el primer día.

El Project Knowledge System será la primera etapa de una visión mucho más grande.

## Evolución prevista

### Etapa 1

Construir una Base de Conocimiento estructurada y mantenida junto con el proyecto.

### Etapa 2

Permitir búsquedas inteligentes sobre esa Base de Conocimiento.

### Etapa 3

Crear un CLI capaz de consultar y mantener ese conocimiento.

### Etapa 4

Exponer ese conocimiento mediante un MCP.

### Etapa 5

Construir un AI Project Architect capaz de:

* comprender el proyecto antes de escribir código;
* detectar patrones existentes;
* reutilizar componentes;
* preservar la arquitectura;
* hacer preguntas cuando falte contexto;
* registrar nuevo conocimiento (siempre con aprobación humana);
* evitar duplicaciones;
* mantener la coherencia del proyecto a lo largo del tiempo.

El objetivo final nunca fue construir un MCP.

El MCP será solamente una forma de acceder al conocimiento.

El verdadero producto es el conocimiento acumulado del proyecto.

\---

# Manifiesto

No estamos construyendo documentación.

No estamos construyendo un MCP.

No estamos construyendo un CLI.

No estamos construyendo otra herramienta de IA.

Estamos construyendo la memoria permanente del proyecto.

Queremos capturar el conocimiento que normalmente vive únicamente en la cabeza de los desarrolladores.

Cada componente reutilizable.

Cada patrón.

Cada decisión arquitectónica.

Cada regla de negocio.

Cada estándar de UX.

Cada aprendizaje obtenido durante el desarrollo.

Todo aquello que hace que PosWeb sea PosWeb.

Nuestro objetivo es que, dentro de diez años, cualquier desarrollador o cualquier inteligencia artificial pueda entender el proyecto, respetar su arquitectura y continuar su evolución sin perder el conocimiento acumulado durante su construcción.

El código cambiará.

Las tecnologías cambiarán.

Los frameworks cambiarán.

Los modelos de IA cambiarán.

Las herramientas cambiarán.

Pero el conocimiento del proyecto debe permanecer.

El Project Knowledge System será la fuente oficial de ese conocimiento.

\---

# Principio rector

**El código representa la implementación.**

**El Project Knowledge System representa la intención.**

El código responde:

* ¿Cómo funciona?

El Project Knowledge System responde:

* ¿Por qué funciona así?
* ¿Qué problema resuelve?
* ¿Qué decisiones llevaron a esta solución?
* ¿Qué no debo romper?
* ¿Qué debería reutilizar?

Si algún día todo el código tuviera que reescribirse desde cero, el Project Knowledge System debería contener suficiente conocimiento como para reconstruir la misma arquitectura sin perder la experiencia acumulada durante años de desarrollo.

Ese es el verdadero objetivo del proyecto.



\---



\# Estado del proyecto



El Project Knowledge System evolucionará por etapas.



Cada etapa deberá demostrar valor antes de avanzar a la siguiente.



Estado actual:



\- \[x] Base de Conocimiento

\- \[ ] Templates

\- \[ ] Registry

\- \[ ] Knowledge Items

\- \[ ] Knowledge Curator

\- \[ ] Knowledge Score

\- \[ ] Knowledge Quality Gate

\- \[ ] CLI

\- \[ ] MCP

\- \[ ] AI Project Architect



Ninguna etapa deberá comenzar hasta que la anterior esté suficientemente validada mediante uso real dentro del proyecto.



\---



\# AI Workflow



Toda Inteligencia Artificial que participe del desarrollo deberá seguir el siguiente flujo.



\## Antes de desarrollar



1\. Leer PROJECT\_KNOWLEDGE\_SYSTEM.md.

2\. Consultar el Registry.

3\. Identificar los Knowledge Items relacionados con la tarea.

4\. Revisar componentes reutilizables.

5\. Revisar patrones existentes.

6\. Revisar reglas de negocio.

7\. Revisar ADR relevantes.

8\. Analizar el código actual.



Recién después podrá proponer una implementación.



Nunca deberá asumir que la mejor solución es crear un componente nuevo.



Primero deberá verificar si ya existe una solución equivalente dentro del proyecto.



\---



\## Durante el desarrollo



La IA deberá detectar automáticamente:



\- nuevos componentes;

\- nuevos patrones;

\- nuevas reglas de negocio;

\- nuevas decisiones arquitectónicas;

\- cambios importantes en componentes existentes;

\- posibles reutilizaciones.



Durante esta etapa nunca modificará el PKS.



Únicamente recopilará información.



\---



\## Al finalizar



Una vez terminado el desarrollo deberá:



1\. Analizar el diff.

2\. Detectar conocimiento nuevo.

3\. Calcular un Knowledge Score.

4\. Determinar si el PKS debería actualizarse.

5\. Proponer los cambios al usuario.



La actualización del PKS siempre requerirá aprobación humana.



\---



\# Principio de mínimo mantenimiento



El costo de mantener el Project Knowledge System debe tender a cero.



El usuario nunca debería escribir documentación manualmente.



El sistema deberá detectar automáticamente:



\- nuevos componentes;

\- nuevos patrones;

\- nuevas reglas;

\- nuevas decisiones;

\- cambios arquitectónicos.



El usuario únicamente validará, corregirá o ampliará la información cuando sea necesario.



Si mantener el PKS requiere trabajo repetitivo, entonces el sistema está mal diseñado.



El objetivo no es automatizar la documentación.



El objetivo es automatizar la captura del conocimiento.



\---



\# Niveles de conocimiento



Todo el conocimiento del sistema pertenecerá a uno de tres niveles.



\## Core



Conocimiento reutilizable por cualquier proyecto de software.



Ejemplos:



\- Component

\- Pattern

\- ADR

\- Knowledge Item

\- Registry

\- Template



\---



\## Domain



Conocimiento reutilizable dentro de un dominio específico.



Ejemplos:



POS



ERP



CRM



Healthcare



E-commerce



Warehouse



Accounting



\---



\## Project



Conocimiento exclusivo del proyecto.



Ejemplos:



CartHost



PaymentFooter



MontoInput



BUS-001



PosWeb Design System



\---



El conocimiento siempre comenzará como Project.



Sólo será promovido cuando exista evidencia suficiente de reutilización.



\---



\# Principio de generalización



Nunca se generalizará una solución de forma anticipada.



Toda abstracción deberá surgir como consecuencia del uso.



Cuando un patrón sea reutilizado en distintos proyectos podrá promoverse de Project a Domain.



Cuando un patrón sea independiente del dominio podrá promoverse de Domain a Core.



El sistema nunca deberá crear abstracciones por anticipación.



Las abstracciones deberán descubrirse.



No inventarse.



\---



\# Knowledge Quality Gate



En el futuro el Project Knowledge System podrá integrarse al pipeline de desarrollo.



Su función será verificar la calidad del conocimiento del proyecto.



Ejemplos de verificaciones:



\- componentes duplicados;

\- patrones similares;

\- reglas de negocio potencialmente incumplidas;

\- documentación desactualizada;

\- componentes reutilizables no registrados;

\- cambios arquitectónicos sin documentar.



El objetivo no será bloquear el desarrollo.



El objetivo será preservar el conocimiento del proyecto.



\---



\# Knowledge Curator



El Knowledge Curator será el responsable de mantener viva la Base de Conocimiento.



Su función será:



\- analizar cambios;

\- detectar conocimiento nuevo;

\- identificar patrones;

\- detectar reutilización;

\- sugerir actualizaciones;

\- mantener sincronizado el PKS.



Nunca tomará decisiones automáticamente.



Siempre propondrá.



El usuario tendrá la decisión final.



\---



\# Regla de oro



Toda IA deberá seguir el siguiente orden antes de escribir código.



1\. Comprender el proyecto.

2\. Consultar el PKS.

3\. Consultar el Registry.

4\. Buscar patrones existentes.

5\. Buscar componentes reutilizables.

6\. Buscar reglas de negocio.

7\. Analizar el código.

8\. Proponer una solución.

9\. Implementar.

10\. Analizar si el conocimiento del proyecto cambió.



El Project Knowledge System deberá ser siempre la primera fuente de conocimiento del proyecto.



El código será la segunda.



\---



\# Principio fundamental



No estamos construyendo una herramienta de documentación.



No estamos construyendo un MCP.



No estamos construyendo un asistente de IA.



Estamos construyendo un sistema capaz de preservar el conocimiento del proyecto durante toda su vida útil.



Cada funcionalidad nueva deberá fortalecer esa Base de Conocimiento.



Cada decisión importante deberá poder recuperarse años después.



El conocimiento será tratado como un activo del proyecto.



Nunca como un activo de las personas.



Esa es la razón de existir del Project Knowledge System.

---



\# Canonical Patterns



Además de documentar el conocimiento existente, el Project Knowledge System podrá definir Patrones Canónicos.



Un Patrón Canónico representa la forma oficial de construir un determinado tipo de funcionalidad dentro del proyecto.



Su objetivo no es describir cómo está implementado el proyecto hoy.



Su objetivo es establecer el estándar para todas las implementaciones futuras.



Cuando una Inteligencia Artificial deba crear una nueva funcionalidad deberá consultar primero si existe un Patrón Canónico compatible.



Si existe, deberá utilizarlo como punto de partida.



Sólo podrá proponer una implementación diferente cuando:



\- no exista un Patrón Canónico aplicable;

\- exista una justificación técnica suficiente;

\- el usuario apruebe una nueva dirección arquitectónica.



Los Patrones Canónicos representan el estándar oficial del proyecto.



No documentan únicamente el pasado.



Definen el futuro.



\---



\# Evolución de los patrones



Todo patrón nace describiendo una implementación existente.



Cuando una solución demuestra ser reutilizable y consistente en distintos contextos podrá promoverse a Patrón Canónico.



La promoción siempre requerirá aprobación humana.



No todos los patrones deberán convertirse en canónicos.



Sólo aquellos que representen la mejor forma conocida de resolver un problema recurrente.



Ejemplos futuros:



\- PAT-ABM

\- PAT-Cart

\- PAT-Wizard

\- PAT-Dashboard

\- PAT-Report

\- PAT-Lookup

\- PAT-Settings

\- PAT-ConfirmationDialog



Cada nuevo módulo del sistema deberá evaluar primero si implementa alguno de estos patrones antes de crear uno nuevo.



\---



\# Principio de estandarización



Cuando un mismo tipo de funcionalidad aparezca repetidamente dentro del proyecto deberá evaluarse la creación de un Patrón Canónico.



El objetivo es que todas las implementaciones futuras compartan:



\- arquitectura;

\- estructura visual;

\- componentes reutilizados;

\- comportamiento;

\- navegación;

\- accesibilidad;

\- flujo de teclado;

\- diseño visual;

\- reglas de negocio relacionadas.



El conocimiento deberá evolucionar hacia estándares cada vez más consistentes.



\---



\# Reglas de reutilización



Antes de crear cualquier pantalla, componente, diálogo o flujo nuevo, toda IA deberá responder las siguientes preguntas.



1\. ¿Existe un Patrón Canónico aplicable?

2\. ¿Existe un componente reutilizable?

3\. ¿Existe una regla de negocio relacionada?

4\. ¿Existe una decisión arquitectónica relacionada?

5\. ¿Existe una implementación similar que deba respetarse?



Sólo cuando todas las respuestas sean negativas podrá proponerse una nueva solución.



El objetivo es evitar reinventar soluciones que ya forman parte del estándar del proyecto.



\---



\# Canonical Pattern Checklist



Todo Patrón Canónico deberá definir, cuando corresponda:



\- objetivo;

\- problema que resuelve;

\- cuándo utilizarlo;

\- cuándo NO utilizarlo;

\- estructura recomendada;

\- componentes obligatorios;

\- componentes opcionales;

\- flujo de navegación;

\- flujo de teclado;

\- reglas de negocio relacionadas;

\- Design System aplicable;

\- accesibilidad;

\- ejemplos reales;

\- implementaciones existentes;

\- buenas prácticas;

\- errores comunes.



El nivel de detalle dependerá del tipo de patrón.



No todos los campos serán obligatorios.



\---



\# AI Decision Flow



Antes de implementar cualquier funcionalidad nueva, toda IA deberá seguir el siguiente flujo.



Solicitud del usuario



↓



Consultar el PKS



↓



Buscar Patrones Canónicos



↓



Buscar componentes reutilizables



↓



Buscar reglas de negocio



↓



Buscar decisiones arquitectónicas



↓



Analizar el código actual



↓



Proponer una implementación consistente con el estándar del proyecto



↓



Implementar



↓



Analizar el conocimiento generado



↓



Proponer actualizar el PKS



El Project Knowledge System deberá ser utilizado como guía de diseño antes de escribir código.



No únicamente como documentación después del desarrollo.



\---



\# Ejemplo



Usuario:



"Hacé la pantalla de Rubros."



La IA no debería comenzar diseñando la pantalla desde cero.



Primero debería identificar que se trata de un ABM.



Luego consultar el Patrón Canónico correspondiente.



Después reutilizar:



\- PageShell;

\- Toolbar;

\- Buscador;

\- Tabla;

\- DialogContainer;

\- Formularios;

\- Button;

\- AlertBanner;

\- Keyboard Flow;

\- Design System.



Sólo después debería implementar la lógica específica de Rubros.



El objetivo es que todas las pantallas equivalentes compartan la misma arquitectura y la misma experiencia de usuario.



\---



\# Principio de consistencia



Toda nueva funcionalidad deberá parecer una evolución natural del proyecto.



Nunca una excepción.



El usuario debe percibir que todas las pantallas pertenecen al mismo sistema.



La reutilización no es únicamente una optimización técnica.



Es parte de la identidad visual, funcional y arquitectónica del proyecto.



Cada Patrón Canónico fortalece esa identidad.



El Project Knowledge System será el responsable de preservarla.

