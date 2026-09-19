import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Exercise, MovementPattern, MuscleGroup } from '@bh/domain';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ManualItemForm } from './ManualItemForm.tsx';

/**
 * EL BUSCADOR DEL PLAN A MANO, CONTRA EL CATÁLOGO DE VERDAD
 *
 * Este campo era un `name.toLowerCase().includes(q)`. Medido contra las 58
 * estaciones reales, **14 de 15 consultas que un socio escribe en el celular
 * devolvían cero resultados**, y la pantalla contestaba "Ninguno con ese
 * nombre": en la práctica, "el gimnasio no tiene nada de bíceps".
 *
 * Por eso los tests van contra `supabase/catalog/blue-horse.json` y no contra un
 * fixture: con tres ejercicios inventados sin tilde, el bug no existe. La tilde
 * era el bug. 19 de los 58 nombres la llevan.
 */

afterEach(cleanup);

/** El catálogo, buscado hacia arriba desde donde se haya corrido vitest. */
function rutaDelCatalogo(): string {
  let dir = resolve(process.cwd());
  for (let i = 0; i < 6; i += 1) {
    const candidato = join(dir, 'supabase', 'catalog', 'blue-horse.json');
    if (existsSync(candidato)) return candidato;
    dir = dirname(dir);
  }
  throw new Error(`no se encontró supabase/catalog/blue-horse.json desde ${process.cwd()}`);
}

const EJERCICIOS: readonly Exercise[] = (
  JSON.parse(readFileSync(rutaDelCatalogo(), 'utf-8')) as {
    exercises: readonly {
      name: string;
      pattern: MovementPattern;
      primaryMuscles: readonly MuscleGroup[];
    }[];
  }
).exercises.map((fila, i) => ({
  id: `ex-${i}`,
  gymId: 'gym',
  name: fila.name,
  pattern: fila.pattern,
  primaryMuscles: fila.primaryMuscles,
  secondaryMuscles: [],
  modality: 'reps_weight',
  isCompound: true,
  isUnilateral: false,
  isExplosive: false,
  loadsSpinalFlexion: false,
  skillLevel: 'beginner',
  cues: null,
  equipmentIds: [],
  isActive: true,
}));

function montar() {
  render(
    <ManualItemForm
      exercises={EJERCICIOS}
      equipment={[]}
      onAdd={() => {}}
      onCancel={() => {}}
      pending={false}
      error={false}
    />,
  );
  return screen.getByLabelText('Ejercicio');
}

/** Lo que el socio ve como opciones después de escribir. */
function chips(): string[] {
  return screen
    .getAllByRole('button')
    .map((b) => b.textContent ?? '')
    .filter((t) => EJERCICIOS.some((e) => e.name === t));
}

describe('buscar un ejercicio para el plan a mano', () => {
  it('el catálogo de prueba tiene nombres con tilde, que es donde estaba el bug', () => {
    // Verde y vacío no sirve: sin nombres acentuados estos tests no prueban nada.
    const conTilde = EJERCICIOS.filter((e) => /[áéíóúüñ]/i.test(e.name));
    expect(conTilde.length).toBeGreaterThan(10);
  });

  it('encuentra "Curl de bíceps" escribiendo "biceps", sin tilde', () => {
    const input = montar();
    fireEvent.change(input, { target: { value: 'biceps' } });
    expect(chips()).toContain('Curl de bíceps');
  });

  it('las consultas sin tilde que antes daban cero ahora dan algo', () => {
    const input = montar();
    // Las mismas que se midieron: antes las 6 devolvían una lista vacía.
    for (const [consulta, esperado] of [
      ['cuadriceps', 'Extensión de cuádriceps'],
      ['triceps', 'Extensión de tríceps con mancuerna'],
      ['salto al cajon', 'Salto al cajón'],
      ['sentadilla bulgara', 'Sentadilla búlgara'],
      ['eliptico', 'Elíptico'],
      ['abdominales en maquina', 'Abdominales en máquina'],
    ] as const) {
      fireEvent.change(input, { target: { value: consulta } });
      expect(chips(), consulta).toContain(esperado);
    }
  });

  it('entiende como le dice la gente, no solo como lo escribimos nosotros', () => {
    const input = montar();
    for (const [consulta, esperado] of [
      ['patada de burro', 'Patada de glúteo en máquina'],
      ['lagartijas', 'Flexiones de brazos'],
      ['jalon al pecho', 'Dorsalera al pecho'],
      ['pesa rusa', 'Swing con kettlebell'],
    ] as const) {
      fireEvent.change(input, { target: { value: consulta } });
      expect(chips(), consulta).toContain(esperado);
    }
  });

  it('cuando la coincidencia no es por el nombre, dice por qué', () => {
    // `Coincidencia.detalle` y `motivo` existían declarando que eran "para poder
    // decirlo en pantalla", y ninguna pantalla los decía. Alguien que escribe
    // "patada de burro" y recibe otro nombre tiene que saber que la app entendió.
    const input = montar();
    fireEvent.change(input, { target: { value: 'patada de burro' } });
    expect(screen.getByText(/lo mismo que pediste/i)).toBeDefined();
  });

  it('no explica nada cuando el resultado coincide con el nombre', () => {
    // Repetir "esto contiene lo que escribiste" abajo del chip que lo muestra
    // sería ruido. Es regla dura 4 llevada a la búsqueda: se avisa lo accionable.
    const input = montar();
    fireEvent.change(input, { target: { value: 'sentadilla' } });
    expect(screen.queryByText(/lo mismo que pediste/i)).toBeNull();
    expect(screen.queryByText(/se escriben parecido/i)).toBeNull();
  });

  it('con el campo vacío muestra una lista para empezar a tocar', () => {
    montar();
    expect(chips().length).toBeGreaterThan(5);
  });

  it('cuando de verdad no hay nada, lo dice y sugiere por dónde seguir', () => {
    const input = montar();
    fireEvent.change(input, { target: { value: 'zzzqqq' } });
    expect(chips()).toEqual([]);
    expect(screen.getByText(/No encontramos nada así/i)).toBeDefined();
  });
});
