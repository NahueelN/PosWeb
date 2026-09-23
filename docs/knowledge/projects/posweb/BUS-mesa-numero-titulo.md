# BUS-mesa-numero-titulo — Mesa: número y título

## Metadata

```yaml
ID: BUS-mesa-numero-titulo
Type: Business Rule
Name: Mesa: número numérico obligatorio + título opcional
Status: Active
Priority: High
Level: Project
Sources:
  - PosWeb.Domain/Mesa.cs
  - PosWeb/Application/Restaurante/RestauranteService.cs
  - frontend/src/pages/MesasPage.tsx
Template: business-rule-v1
Created: 2026-09-21
Updated: 2026-09-21
Tags:
  - POS
```

---

## Overview

Define cómo se identifica una mesa en el módulo restaurante: el **número** es el identificador funcional (numérico, obligatorio, único por sucursal y salón) que se muestra en el mapa; el **título** es un texto libre opcional (acepta letras) que da contexto pero no se muestra en la tarjeta.

---

## Rules

1. **El número de mesa es obligatorio y solo numérico.** El campo `numero` (columna `NUMERO_MESA`) debe contener únicamente dígitos. Se valida en la entidad `Mesa.CambiarNumero` con `int.TryParse` y en el frontend con `^\d+$`. Se rechaza cualquier valor con letras o símbolos.

2. **La validación numérica del número solo aplica cuando el número cambia.** En `ActualizarMesa`, si el número enviado es igual al actual (`req.Numero.Trim() == mesa.NUMERO_MESA`) no se revalida. Esto permite arrastrar/editar mesas legacy (creadas antes de la regla con números alfanuméricos como "A-3") sin que fallen por su número histórico.

3. **El título es opcional y acepta letras.** El campo `descripcion` (columna `DESCRIPCION`) actúa como título de la mesa. Si está vacío se guarda como `null`. No se muestra en la tarjeta del mapa, solo como subtítulo en el panel/popup de la mesa.

4. **La tarjeta del mapa muestra solo el número.** El frente de la tarjeta identifica la mesa únicamente con su número; el título nunca reemplaza al número en el mapa.

---

## Relations

```yaml
RELATIONS:
  - type: RELATED
    target: PAT-mapa-responsive-popup
  - type: USES
    target: HOOK-use-media-query
```