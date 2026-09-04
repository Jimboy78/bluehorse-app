# ADR 0001 — PWA instalable en vez de app nativa

**Estado**: aceptada · 2026-09-04

## Contexto
El reparto en el MVP es por QR en la recepción de Blue Horse. A futuro puede hacer falta presencia
en tiendas para vender a otros gimnasios.

## Decisión
PWA instalable con React + TypeScript + Vite. Si más adelante hacen falta las tiendas, se envuelve
este mismo build con Capacitor.

## Alternativa descartada
React Native / Expo: pierde el reparto por link, exige revisión de tienda desde el primer día y no
permite poner un QR en recepción esta semana. Migrar de PWA a Capacitor es barato; de React Native a
web es reescribir la UI.

## Consecuencias
En iOS, las notificaciones push y el almacenamiento persistente solo funcionan si el usuario agrega
la app a la pantalla de inicio (16.4+). El QR tiene que llevar primero a una pantalla que enseñe a
instalarla.
