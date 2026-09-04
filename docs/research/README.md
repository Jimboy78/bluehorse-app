# Investigaciones de contenido

Fuente de la que sale el contenido real de entrenamiento. **Es prosa**: hay un paso de curación
humana entre estos documentos y el JSON del ruleset. Ver `docs/03-contrato-motor.md` y la skill
`activar-ruleset`.

| Archivo | Llena en el ruleset |
|---|---|
| `01-fuerza-hipertrofia-potencia.md` | `prescription.strength`, `.hypertrophy`, `.power` |
| `02-cardio-resistencia-recomposicion.md` | `prescription.cardio`, `.endurance`, `.recomposition` |
| `03-variables-individuales.md` | los bloques `byLevel` y modificadores por edad, sexo y deporte |
| `04-arquitectura-generacion-adaptativa.md` | nada del ruleset: se cruza contra `docs/01-arquitectura.md` |

Nada de esto está aplicado todavía. El ruleset activo sigue siendo `v0-placeholder`.
