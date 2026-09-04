---
description: Convierte una idea suelta en una tarea con criterios de aceptación antes de escribir código.
argument-hint: [qué querés construir]
allowed-tools: Read, Grep, Glob, Bash
---

Tarea pedida: **$ARGUMENTS**

No escribas código todavía. Primero convertila en algo ejecutable, en este formato:

## Resultado
Qué tiene que poder hacer alguien cuando esto esté listo. Una oración, desde el lado del usuario.

## Contexto
Qué archivos toca, qué decisiones ya están tomadas en `docs/` que aplican acá, y qué NO entra en
esta tarea.

## Criterios de aceptación
Una lista verificable. Cada uno tiene que poder responderse con sí o no, sin opinión:
- comandos que tienen que pasar (`npm run check`)
- comportamiento observable, con datos concretos ("con RIR 4 dos sesiones seguidas, propone subir")
- qué se ve en pantalla, en qué estado (cargando, error, vacío)

## Riesgos
Qué regla dura de `CLAUDE.md` podría romperse acá, y qué se hace en su lugar.

Si algo del pedido admite dos lecturas que llevan a trabajo distinto, preguntá **antes** de escribir
el plan. Si no, asumí lo razonable y dejalo escrito en Contexto.
