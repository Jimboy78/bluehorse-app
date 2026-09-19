# Hombro en los deportes de brazo arriba

**Fecha:** 19/09/2026. **Tanda:** T5c del plan de variables. Cierra la prevención por deporte que
empezó en `62` (isquios) y `63` (rodilla).

## La pregunta

¿Tiene que sumar el plan un bloque de hombro para quien juega handball, vóley, béisbol, tenis o
pádel, como suma el nórdico o los aterrizajes?

## Lo que dice la evidencia

Los resúmenes se leyeron en Europe PMC.

- **Andersson et al. 2017**, *Br J Sports Med*, ensayo aleatorizado por equipos: 45 equipos de
  handball de élite, 660 jugadores, una temporada de 7 meses.
  - El programa de hombro del OSTRC lo daban entrenadores y capitanes **3 veces por semana**, en la
    entrada en calor. Trabaja la rotación interna, la fuerza de rotación externa, la fuerza de la
    escápula, la cadena cinética y la movilidad torácica.
  - Los **problemas de hombro** bajaron un 28 % (OR 0,72; 0,52-0,98; p 0,038).
  - Los **problemas importantes** bajaron un 22 %, pero **no de forma significativa** (OR 0,78;
    0,53-1,16).
  - DOI 10.1136/bjsports-2016-096226.
- **Fredriksen et al. 2020**, *Scand J Med Sci Sports*, ensayo con 57 jugadores juveniles: el mismo
  programa **no cambió** los dos factores de riesgo que dice atacar, la fuerza de rotación externa
  y la rotación interna. Los autores concluyen que el efecto "tiene que deberse a otros factores".
  DOI 10.1111/sms.13674.
- **Wright et al. 2021**, *Phys Ther Sport*, revisión sistemática de 7 estudios en deportistas de
  brazo arriba: solo tres muestran efecto, y **uno solo** tiene bajo riesgo de sesgo. Concluye que
  hoy **no se pueden sacar conclusiones** sobre la efectividad de estos programas. DOI
  10.1016/j.ptsp.2021.09.004.
- **Sakata et al. 2019**, *Am J Sports Med*, ensayo en 237 chicos de béisbol de 9 a 11 años: un
  programa de entrada en calor bajó las lesiones de hombro y codo (HR 1,94 del control contra la
  intervención). Casi todo el programa es estiramiento, movilidad y equilibrio, y la población son
  chicos. DOI 10.1177/0363546519861378.
- **Moiroux-Sahraoui et al. 2024**, *Diagnostics*, revisión de 8 estudios: asocia la cadena
  cinética (piernas, tronco) con menos lesión de hombro en lanzadores. Son asociaciones, no ensayos
  de prevención. DOI 10.3390/diagnostics14212415.

### Qué quiere decir

Un bloque de hombro en el plan se apoyaría en un solo ensayo, en handball de élite, con efecto
moderado sobre los problemas leves y ninguno demostrado sobre los importantes. Además, el
mecanismo que el programa dice atacar no se movió. Extenderlo a vóley, béisbol, tenis y pádel
sería extrapolar. Por la regla 4, lo que no está bien sostenido no se agrega al plan.

## Lo que decidió el dueño (19/09/2026)

- **Sin bloque de hombro.**
- **Un aviso solo en handball**, que es la población donde se midió: si el equipo no hace
  ejercicios de hombro en la entrada en calor, que los proponga. Es algo que el socio puede hacer.
- **La "Rotación externa con banda" sigue entrando por un slot**, como aislado de deltoides
  posterior. El tenis y el pádel ya priorizan ese músculo en el desempate (`07`), sin convertirla
  en bloque.

## Lo que hace el motor

Nada nuevo en el código. `sports.prevention.notes` suma una nota con `sports: ['handball']`.
Handball recibe así dos avisos: la entrada en calor con saltos (`63`) y la de hombro.

## Cómo se prueba

- El test del contexto que recorre todas las notas y todos los deportes cubre la nota nueva: sale en
  handball y en ningún otro.
- **Falsificado:** filtrar las notas por el primer deporte de cada una deja a handball sin la nota
  de rodilla, y el test da rojo.

## Lo que queda

- Si aparece un ensayo de prevención de hombro en vóley, tenis o pádel, o un metaanálisis que
  sostenga el efecto, se revisa. Hoy no hay.
