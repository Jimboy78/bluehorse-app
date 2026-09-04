# ADR 0005 — La carga se guarda cruda y normalizada

**Estado**: aceptada · 2026-09-04

## Contexto
Blue Horse mezcla kilos, libras, pines de polea y estaciones de disco en la misma sala.

## Decisión
La unidad es propiedad de cada estación. `load_value` + `load_unit` guarda lo que dice la máquina y
es lo único que se le muestra al socio. `load_kg_normalized` se calcula aparte, solo para gráficos y
comparaciones, y vale `null` cuando la conversión no se puede hacer sin inventar un número: un pin
sin tabla de kilos, una banda elástica, peso corporal.

## Alternativa descartada
Convertir todo a kilos en el momento de cargar. El socio vuelve al día siguiente, lee 45 en el disco
y la app le muestra 20,4: pierde la confianza en el primer uso.

## Consecuencias
Toda función que compare cargas entre estaciones tiene que tolerar `null`. Las progresiones se
calculan en la unidad de la estación y se ajustan a su escalón real: en una máquina de pin se sube
un nivel, no un porcentaje.
