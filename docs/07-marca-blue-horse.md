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

## Conflicto con la paleta ya cargada en el código — resuelto el 5 de septiembre de 2026

`apps/web/src/styles.css` definía:

```
--color-teal:   #2ec4b6
--color-amber:  #f0a03c
--color-orange: #f2622e
```

Ese turquesa y ese naranja **no salen de este ícono** — salieron de una descripción verbal que dio
un subagente sobre las fotos de la grilla de Instagram (equipamiento con luces LED, no el logo).
Nunca se verificaron por píxel. Este análisis sí es por píxel, y el logo real es monocromático:
negro, blanco, y un degradé de azules.

**Decisión tomada: opción 1** — alinear la app al logo real. El azul del ícono es el acento de
toda la UI, no solo del isotipo. Ámbar y naranja quedan como colores **semánticos** (alerta,
"provisorio"), que era la objeción de esa opción: la distinción no se pierde porque esos dos
siguen existiendo, solo dejan de competir con el acento.

Los tokens vigentes (`styles.css`), ya aplicados:

| Token | Hex | Rol |
|---|---|---|
| `--color-navy` | `#05070c` | Fondo, cerca del negro del logo |
| `--color-surface` / `-2` / `-3` | `#0c111b` / `#131b28` / `#1b2534` | Tres niveles de superficie sobre el fondo |
| `--color-line` / `--color-line-bright` | `#1e2836` / `#2f3d52` | Bordes |
| `--color-ink` / `--color-slate` / `--color-slate-dim` | `#eef3fb` / `#93a3bd` / `#5f6d85` | Texto |
| `--color-brand-deep` | `#3f7fc4` | Acento oscuro (bordes, estados apagados) |
| `--color-brand` | `#6fb4ef` | **Acento principal** |
| `--color-brand-soft` | `#82a9ec` | Medio del degradé del logo, tal cual |
| `--color-brand-bright` | `#abe6f8` | Brillo del degradé del logo, tal cual |
| `--color-amber` / `--color-orange` | `#f0a03c` / `#f2622e` | Semánticos: "provisorio", alerta |
| `--color-lime` | `#7fd88f` | Semántico: confirmación |

`--color-teal` y `--color-navy-soft` ya no existen: se renombraron a `--color-brand` y
`--color-surface` en todo `src`. Contraste WCAG AA verificado por script antes de aplicar.

## Dónde usarlo y dónde no

**Sirve, tal cual está, para:**
- Post/story de redes sociales anunciando la app (es exactamente ese formato).
- Splash screen de la PWA si el fondo de esa pantalla es negro — encaja sin procesar.

**No sirve, tal cual está, para:**
- Ícono de la PWA **sin procesar** — es un PNG rasterizado de 2048px con texto denso que se
  vuelve ilegible a 48px (tamaño real de un ícono de app). Los íconos que usá la app salen de este
  archivo pero pasados por el recorte y la cuantización de la sección siguiente.
- Cualquier fondo que no sea negro — no tiene transparencia.
- Modo claro de la app — es 100% para fondo oscuro, no existe versión clara.

## Íconos: generados el 5 de septiembre de 2026

Los cuatro pasos que faltaban están hechos. El PNG de 2048px no se usó directo — se procesó con
PIL y se cuantizó a 96 colores, porque el texto circular y el detalle fino del degradé se vuelven
ilegibles por debajo de ~64px.

| Archivo | Qué es |
|---|---|
| `apps/web/public/icon-192.png`, `icon-512.png` | Ícono de la PWA |
| `apps/web/public/icon-maskable-512.png` | Versión maskable: escudo al 76% para aguantar el recorte circular de Android |
| `apps/web/public/apple-touch-icon.png` | iOS |
| `apps/web/public/favicon.svg` | Redibujado (anillo + barra con discos), legible a 16px |
| `apps/web/public/brand/mascota.webp` | El mascota completo, para `/auth` y el splash |

Se borraron `icon.svg` e `icon-maskable.svg`: eran los placeholders vectoriales que hice al armar
el esqueleto y seguían con la paleta vieja (turquesa/naranja). `theme_color` y `background_color`
del manifest pasaron de `#0b1a2b` a `#05070c`, el negro del logo.

**Lo que sigue sin hacerse**: quitar el fondo negro con `rembg`/BiRefNet para tener el mascota con
transparencia real. No hizo falta — toda la app corre sobre fondo oscuro, que es donde el asset
encaja sin procesar. Si alguna vez hay modo claro, ahí sí.

