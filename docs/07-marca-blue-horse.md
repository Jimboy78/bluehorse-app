# Marca: el ícono de Blue Horse

Análisis del asset `blue_horse_icon.png` que sacaste del Instagram del gimnasio. Paleta extraída
por frecuencia real de píxeles (Python/PIL), no a ojo — un análisis visual de un logo con degradé
subestima o inventa tonos con facilidad.

## El archivo

- **2048×2048 px, RGB, sin canal alfa.** El fondo negro está "horneado" en la imagen: no es
  transparente. Para usarlo sobre cualquier fondo que no sea negro puro hay que quitarlo primero
  (ver "Qué falta generar" más abajo).
- Contenido: un mascota — cabeza de caballo fusionada con un brazo humano flexionando el bícep —
  dentro de una insignia circular con "BLUE HORSE" arriba, "GYM" abajo, una barra con discos
  cruzando el centro, y dos pares de líneas horizontales a los costados (motivo tipo mira/target).
- Es arte de mascota para redes o merchandising, no necesariamente el ícono que hay que usar en la
  PWA. Ver "Dónde usarlo y dónde no".

## Paleta real (extraída, no estimada)

| Rol en el logo | Hex | RGB | Nota |
|---|---|---|---|
| Fondo | `#08090b` | 8, 9, 11 | Negro casi puro, domina el 60%+ del lienzo |
| Texto y barra | `#ffffff` | 255, 255, 255 | Blanco puro |
| Sombra del degradé azul | `#7594a6` | 117, 148, 166 | Percentil 10 de luminosidad entre los tonos de color |
| Medio del degradé azul | `#82a9ec` | 130, 169, 236 | Azul periwinkle/índigo — es el tono predominante del caballo |
| Brillo del degradé azul | `#abe6f8` | 171, 230, 248 | Celeste pálido, en los bordes iluminados |

**No hay turquesa ni naranja en ningún punto de la imagen.** Es relevante porque no es lo que
asumí antes.

## Conflicto con la paleta ya cargada en el código — hay que decidir

`apps/web/src/styles.css` define hoy:

```
--color-teal:   #2ec4b6
--color-amber:  #f0a03c
--color-orange: #f2622e
```

Ese turquesa y ese naranja **no salen de este ícono** — salieron de una descripción verbal que dio
un subagente sobre las fotos de la grilla de Instagram (equipamiento con luces LED, no el logo).
Nunca se verificaron por píxel. Este análisis sí es por píxel, y el logo real es monocromático:
negro, blanco, y un degradé de azules.

Dos caminos, y prefiero que la decisión sea tuya porque es de marca, no técnica:

1. **Alinear la app al logo real**: reemplazar teal/naranja por el degradé de azules
   (`#7594a6` → `#82a9ec` → `#abe6f8`) como único acento, con blanco para texto sobre negro. Más
   fiel a la identidad real de Blue Horse, pero pierde el contraste de "color semántico" que hoy
   separa, por ejemplo, "provisorio" (ámbar) de "acento" (teal) en la UI — con todo en azul hay que
   resolver esa distinción de otra forma (¿con forma/ícono en vez de color?).
2. **Mantener teal/naranja como paleta funcional de la app** y usar el degradé azul del logo *solo*
   en el ícono/isotipo, tratándolo como un elemento de marca puntual y no como el sistema de color
   de toda la interfaz. Es lo que hacen muchas apps: el logo tiene su propio color y la UI tiene la
   suya, mientras el logo aparezca en algún lado reconocible (splash, header).

No cambié `styles.css` todavía — es una decisión de diseño, no la tomo por vos.

## Dónde usarlo y dónde no

**Sirve, tal cual está, para:**
- Post/story de redes sociales anunciando la app (es exactamente ese formato).
- Splash screen de la PWA si el fondo de esa pantalla es negro — encaja sin procesar.

**No sirve, tal cual está, para:**
- Ícono de la PWA (`apps/web/public/icon.svg`, `favicon.svg`, `icon-maskable.svg`) — esos son SVG
  vectoriales simplificados que hice yo como placeholder; este es un PNG rasterizado de 2048px con
  texto denso que se vuelve ilegible a 48px (tamaño real de un ícono de app). Ver siguiente sección.
- Cualquier fondo que no sea negro — no tiene transparencia.
- Modo claro de la app — es 100% para fondo oscuro, no existe versión clara.

## Qué falta generar antes de reemplazar los íconos actuales

El ícono placeholder que hice (`apps/web/public/icon.svg`) es un SVG simple: sirve como marcador
de posición pero no es la marca real. Para reemplazarlo con este asset hace falta procesarlo, no
usarlo directo:

1. **Quitar el fondo negro** (`rembg`/BiRefNet — mismo pipeline que se sugirió para las fotos del
   catálogo, corre local en la RTX 3060) para tener el mascota con transparencia real.
2. **Versión simplificada para tamaño chico.** El logo actual tiene texto circular y detalle fino
   que se pierde por debajo de ~64px. Un ícono de PWA se ve a 16–48px en la mayoría de los
   contextos (pestaña del navegador, pantalla de inicio). Hace falta una versión reducida — solo
   la cabeza de caballo, sin el texto circular ni las líneas laterales — para esos tamaños.
3. **Versión maskable** (con zona de seguridad circular, para Android) a partir de la simplificada.
4. **Versión monocromática** para el favicon de pestaña (algunos navegadores lo muestran muy chico
   y sin color).

Ninguno de estos cuatro pasos está hecho todavía. Los archivos actuales en `apps/web/public/`
siguen siendo el placeholder simple que generé al armar el esqueleto.

## Decisión pendiente tuya

Elegir entre las dos opciones de la sección de conflicto de paleta, y confirmar si querés que
arranque el procesamiento del ícono (los 4 pasos de arriba) para tenerlo listo para producción.
