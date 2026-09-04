# Relevamiento del gimnasio

Sin catálogo no hay app. Este es el trabajo manual que hay que hacer una vez, y es lo que más va a
mover la fecha de la demo.

## Qué relevar

Una fila por **estación física**. Plantilla en `docs/plantillas/relevamiento-equipamiento.csv`.

| Columna | Qué poner | Cuidado |
|---|---|---|
| `id_interno` | Código corto tuyo: `PR-01`, `POL-03` | Solo para ordenarte durante la carga |
| `nombre` | Como la llaman en el gimnasio | El socio la va a buscar por ese nombre |
| `categoria` | `selectorized`, `plate_loaded`, `free_weight`, `rack`, `cardio`, `bodyweight`, `accessory` | |
| `marca` / `modelo` | Si están escritos en la máquina | Opcional |
| `unidad_carga` | `kg`, `lb`, `stack_level`, `plates_kg`, `plates_lb`, `band`, `bodyweight`, `none` | **Lo que dice ESA máquina.** Blue Horse mezcla |
| `carga_min` / `carga_max` | Rango físico | En pines: 1 y la cantidad de niveles |
| `incremento` | Salto mínimo real | Sin esto el motor propone cargas imposibles |
| `valores_stack` | Kilos de cada nivel, separados por `;` | Solo para pines, y solo si están escritos |
| `peso_base_kg` | Peso de la barra, carro o plataforma | Solo para estaciones con discos |
| `cantidad` | Cuántas unidades idénticas hay | 3 bancos planos = `3`, no tres filas |
| `sector` | Dónde está, en castellano | "fondo a la derecha, al lado de las poleas" |
| `notas_setup` | Ajustes de la estación | "asiento 5 posiciones, respaldo regulable" |
| `foto` | Nombre del archivo | Estación completa, no el cartelito |

## Fotos

- Una foto por estación, de la máquina completa y reconocible **desde donde uno la busca**.
- Nombre del archivo igual al `id_interno`: `PR-01.jpg`.
- Van a Supabase Storage, no al repositorio. Las crudas del celular están en `.gitignore`.

## Los seis errores que más se cometen

1. Poner la unidad que preferís vos en vez de la que dice la máquina.
2. Dejar `incremento` vacío.
3. Una fila por mancuerna. Las mancuernas son **una** fila con rango e incremento.
4. Olvidar `peso_base_kg` en estaciones de disco: el total queda mal.
5. Poner `cantidad: 1` cuando hay tres: el flujo de "máquina ocupada" ofrece reemplazos que también
   están ocupados.
6. Fotografiar el cartel del ejercicio en vez de la estación.

## Después del equipamiento: los ejercicios

Hacen falta entre 40 y 60 ejercicios canónicos con su patrón, músculos y modalidad. Hay una base en
`supabase/seed.sql` para arrancar.

Lo que **no** se puede saltear es el mapeo `exercise_equipment`: qué ejercicio se puede hacer en qué
estación. Sin eso, el motor considera que el gimnasio está vacío y no arma ninguna sesión.

## Cómo saber que terminaste

Generá un plan de prueba para cada uno de los seis objetivos y mirá los `warnings` del blueprint.
Si aparece "No hay ningún ejercicio disponible para el patrón X", falta equipamiento o falta mapeo.

Para el procedimiento de carga, ver la skill `cargar-catalogo`.
