---
name: cargar-catalogo
description: Cómo cargar el equipamiento y los ejercicios de Blue Horse desde el relevamiento con fotos. Usar al importar la planilla de máquinas, al mapear ejercicios a estaciones o al definir sustituciones.
---

# Cargar el catálogo del gimnasio

El catálogo es el cuello de botella real del proyecto: sin él, el motor no puede armar ni una
sesión. La planilla y las columnas están en `docs/06-relevamiento-catalogo.md`.

## El orden importa

1. **Equipamiento** (`equipment`): una fila por estación física.
2. **Ejercicios** (`exercises`): ya hay una base de canónicos globales en `supabase/seed.sql`.
3. **Mapeo** (`exercise_equipment`): qué ejercicio se puede hacer en qué estación. Sin esto el
   motor considera que el gimnasio está vacío.
4. **Sustituciones** (`exercise_substitutions`): solo las que quieras curar a mano. El resto las
   calcula el motor por patrón y músculos.

## Lo que más se equivoca al cargar

- **`load_unit` mal puesta.** Es lo que dice *esa* máquina, no lo que preferís vos. Blue Horse
  mezcla kg, lb, pines y discos: mirá la máquina, no adivines.
- **`load_increment` en cero o vacío.** Sin escalón, el motor propone 63,7 kg en una prensa que sube
  de a 5.
- **`stack_kg` vacío en una estación de pin.** Es válido, pero entonces esa estación no aparece en
  ningún gráfico comparativo: la carga no se puede normalizar. Si la máquina tiene los kg escritos
  al costado, cargalos.
- **`base_weight_kg` olvidado** en estaciones de disco: sin el peso de la barra o el carro, el
  total queda mal.
- **Una fila por mancuerna.** Las mancuernas son *una* fila con `load_min`, `load_max` e
  `increment`, no veinte filas.
- **`quantity`.** Si hay tres bancos planos, `quantity: 3`. De eso depende que el flujo de "máquina
  ocupada" no ofrezca un reemplazo que también está ocupado.

## Fotos

Van a Supabase Storage, no al repositorio. La foto es de la estación completa y reconocible desde
donde uno la busca, no del cartel con el nombre. Las fotos crudas del celular quedan fuera del repo
(están en `.gitignore`).

## Antes de dar por cargado el catálogo

Generá un plan de prueba para cada objetivo y revisá los `warnings` del blueprint. Si aparece
"No hay ningún ejercicio disponible para el patrón X", falta equipamiento o falta mapeo.
