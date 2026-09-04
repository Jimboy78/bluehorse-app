**Esquema JSON propuesto para sesiones de cardio:** Un objeto por sesión con campos clave: tipo de sesión (`session_type`: “steady” o “interval”), modo (`mode`: p.ej. “running”), frecuencia semanal (`frequency_per_week`), duración (`duration_min`) o distancia (`distance_km`), zona de intensidad (`intensity_zone`), RPE y/o %FCmax opcional, y en caso de intervalos los periodos de trabajo/descanso (`work_interval_min`, `rest_interval_min`, `reps`). Por ejemplo: 

```json
[
  {
    "objective": "cardio",
    "mode": "cycling",
    "session_type": "interval",
    "frequency_per_week": 3,
    "work_interval_min": 4,
    "rest_interval_min": 2,
    "reps": 5,
    "intensity_zone": 4,
    "RPE": 7,
    "HR_percentage_max": 90
  },
  {
    "objective": "endurance",
    "mode": "running",
    "session_type": "steady",
    "frequency_per_week": 4,
    "duration_min": 60,
    "distance_km": 10,
    "intensity_zone": 2,
    "RPE": 5,
    "HR_percentage_max": 70
  },
  {
    "objective": "recomposition",
    "mode": "running",
    "session_type": "steady",
    "frequency_per_week": 2,
    "duration_min": 30,
    "distance_km": 5,
    "intensity_zone": 3,
    "RPE": 6,
    "HR_percentage_max": 80
  }
]
``` 

| Parámetro                                  | Rango según evidencia (valor por defecto)            | Confianza  | Fuentes                                               |
|---------------------------------------------|-----------------------------------------------------|------------|-------------------------------------------------------|
| **Zonas de intensidad (%)**: definición operativa (zonas 1–5). Ej. según Seiler: Zona1 “muy fácil” ≈55–72% FCmax (RPE ~6–11); Zona2 “cómoda” ≈67–82% FCmax (RPE ~12); Zona3 “incómoda” ≈82–87%; Zona4 “exigente” ≈87–92%; Zona5 “máxima” ≈92–100%. (Otro modelo simple: Zona1 <LT1, Zona2 1º-2º umbral, Zona3 >2º umbral.) El valor por defecto para la app podría ser modelo de 5 zonas (Seiler) con Zona2 <72%FCmax (RPE≤11). Adaptaciones: Zonas bajas (1–2) favorecen capacidad aeróbica básica (mitocondrias, capilares) y resistencia; zonas altas (3–5) desarrollan umbral anaeróbico, VO₂max y potencia. | Mediano | Seiler (2010) citado en Sitko et al. 2025; Sitko et al. 2025. |
| **Distribución de intensidad semanal**: proporción trabajo suave vs. intenso. Para salud general: 150–300 min moderado o 75–150 min vigoroso/sem (guías WHO). Para rendimiento: el modelo polarizado (~80% volumen en zonas bajas (<LT1) y ~20% en alta intensidad) es frecuente. Valor por defecto: ~80% volumen baja intensidad (Zona1–2), 20% alta (Zona4–5). | Mediano | WHO 2020; Sitko et al. 2025 (cita Seiler). |
| **Intervalos (salud cardiometabólica)**: protocolos con respaldo clínico. Ejemplo: 3–4 veces/sem de 4×4 min al 85–95% FCmáx (HRR) con 3–4 min de recuperación al ~65% FCmáx. También son efectivos ≥30 min continuos al 60–80% FCmáx (moderado). Valor por defecto: 3×/sem de 4×4 min al 90% FCmáx con 4 min rest (o 30–45 min moderado). | Mediano | Ramírez-Vélez et al. 2017 (RCT). |
| **Intervalos (rendimiento aeróbico)**: protocolos para VO₂max/umbral. Se suelen usar esfuerzos de 3–5 min al 90–95% FCmáx con descansos 2–4 min (p.ej. 4×4 min). Valor por defecto: 4×4 min al 90% FCmáx, 3 min rest. | Mediano/Bajo | Basado en Ramírez-Vélez et al. 2017 (aplicable a mejora VO₂max). |
| **Intervalos (pérdida de grasa)**: SIN EVIDENCIA SUFICIENTE para protocolos específicos de HIIT vs. continuo en grasa. En práctica: combinar moderado y HIIT. Valor por defecto: 30–60 min moderado (Zona2) o 4×4 min al 90% FCmáx. (No hay consenso claro de superioridad de uno sobre otro.) | Bajo | Keating et al. 2014 (RCT) (mejora grasa visceral con continuo). |
| **Interferencia cardio-fuerza**: el efecto existe pero es “dependiente del contexto”. Mayor volumen/intensidad de cardio, especialmente correr intenso, limita ganancia de fuerza/híper (15–25% menor). Reglas: priorizar fuerza (hacerla primero o en días distintos); espaciar sesiones intensas (ej. ≥6–24 h separación); limitar cardio intenso cerca del entrenamiento de fuerza. Valor por defecto: evitar cardio HIIT intenso el mismo día de piernas; si no, hacer fuerza primero y >6 h luego. | Mediano | Lessa et al. 2026 (revisión). |
| **Recomposición corporal (ganar músculo + perder grasa)**: posible en novatos, personas con sobrepeso/obesidad o sin experiencia previa. En sujetos no entrenados puede haber ganancia muscular (>0.5–1% de peso corporal/mes) mientras se pierde grasa. En individuos experimentados o delgados, la recomposición es mínima; lo usual es al menos **mantener** músculo. Valor defecto: asumir 0.5% peso/mes de músculo ganado para novatos con déficit moderado; en avanzados, hipotesis “fat loss” sin ganancia (mantener masa). | Mediano | Bonilla et al. 2024 (Editorial). |
| **Dosis mínima actividad aeróbica (salud)**: Adultos sanos ≥150 min/sem moderado o 75 min vigoroso (o equivalente). Además, ≥2 sesiones/sem de fuerza (ACSM). Valor defecto: 150 min moderado/sem (5×30 min) más 2 sesiones fuerza. | Alto    | WHO 2020. |

**Fuentes:** Bull et al. 2020 (WHO guidelines, Br J Sports Med, DOI:10.1136/bjsports-2020-102955); Sitko et al. 2025 (IJ Sports Physiol Perf, DOI:10.1123/ijspp.2024-0303); Ramírez-Vélez et al. 2017 (J Transl Med, DOI:10.1186/s12967-017-1216-6); Lessa et al. 2026 (Sport Sci Health, DOI:10.1007/s11332-026-01884-6); Bonilla et al. 2024 (Front. Nutr., DOI:10.3389/fnut.2024.1467406).