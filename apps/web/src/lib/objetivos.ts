import type { SecondaryGoal } from '@bh/domain';

/**
 * Lo que el socio quiere además del objetivo principal (`docs/research/68`).
 * Solo entra acá lo que el motor sabe usar: un objetivo que no mueve el plan
 * no se pregunta.
 */
export const SECUNDARIOS: readonly {
  readonly id: SecondaryGoal;
  readonly label: string;
  readonly hint: string;
}[] = [
  {
    id: 'fat_loss',
    label: 'Bajar grasa',
    hint: 'Suma cardio al final de cada sesión, con el tiempo que te sobre.',
  },
  {
    id: 'health',
    label: 'Cuidar la salud',
    hint: 'Suma cardio hasta lo que se recomienda por semana, con el tiempo que te sobre.',
  },
];

/**
 * Marca o desmarca uno. El orden es el de elección: el primero es el que más
 * le importa.
 */
export function alternarSecundario(
  lista: readonly SecondaryGoal[],
  id: SecondaryGoal,
): SecondaryGoal[] {
  return lista.includes(id) ? lista.filter((g) => g !== id) : [...lista, id];
}

/** Sin repetidos, en el orden en que llegaron. */
export function limpiarSecundarios(lista: readonly SecondaryGoal[] | undefined): SecondaryGoal[] {
  return [...new Set(lista ?? [])];
}
