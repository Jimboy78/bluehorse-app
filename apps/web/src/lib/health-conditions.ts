import type { HealthCondition, Sex } from '@bh/domain';
import { ocultaElPulso } from '@bh/engine';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
import { activeRuleset } from './engine.ts';
import { requireSupabase } from './supabase.ts';

/**
 * CONDICIONES DE SALUD
 *
 * Lo que el socio marca detrás de la puerta "¿tenés algún problema de salud o
 * tomás medicación?" (`docs/research/43`). No decide si puede entrenar —eso es
 * el cribado—, sino cómo: el motor las recibe en `UserSnapshot.conditions` y
 * cada una que tiene entrada en el ruleset cambia el plan
 * (`docs/research/44`). Se aplican en el próximo plan que se arme.
 */

export interface GrupoDeCondiciones {
  readonly titulo: string;
  readonly opciones: readonly { readonly id: HealthCondition; readonly texto: string }[];
  /** Si el grupo no se le muestra a este sexo. */
  readonly ocultoPara?: readonly Sex[];
}

/** La lista agrupada, como la armó `docs/research/43`. Cada condición en un solo grupo. */
export const GRUPOS_DE_CONDICIONES: readonly GrupoDeCondiciones[] = [
  {
    titulo: 'Corazón y presión',
    opciones: [
      { id: 'hypertension', texto: 'Presión alta' },
      { id: 'heart_disease', texto: 'Un problema del corazón' },
      { id: 'beta_blockers', texto: 'Tomo betabloqueantes (atenolol, bisoprolol, carvedilol…)' },
      { id: 'anticoagulants', texto: 'Tomo anticoagulantes' },
    ],
  },
  { titulo: 'Metabolismo', opciones: [{ id: 'diabetes', texto: 'Diabetes' }] },
  {
    titulo: 'Respiración',
    opciones: [
      { id: 'asthma', texto: 'Asma' },
      { id: 'copd', texto: 'EPOC' },
    ],
  },
  {
    titulo: 'Huesos y articulaciones',
    opciones: [
      { id: 'osteoarthritis', texto: 'Artrosis' },
      { id: 'osteoporosis', texto: 'Osteoporosis' },
      { id: 'back_problem', texto: 'Un problema de columna' },
    ],
  },
  {
    titulo: 'Abdomen y pelvis',
    opciones: [
      { id: 'abdominal_hernia', texto: 'Hernia abdominal o inguinal' },
      { id: 'pelvic_floor', texto: 'Pérdidas de orina o un problema de suelo pélvico' },
    ],
  },
  {
    titulo: 'Vista y equilibrio',
    opciones: [
      { id: 'glaucoma_retina', texto: 'Glaucoma o un problema de retina' },
      { id: 'epilepsy_vertigo', texto: 'Epilepsia o vértigo' },
    ],
  },
  {
    titulo: 'Embarazo',
    opciones: [
      { id: 'pregnancy', texto: 'Estoy embarazada' },
      { id: 'postpartum', texto: 'Tuve un bebé hace poco' },
    ],
    ocultoPara: ['male'],
  },
];

/** Los grupos que se le muestran a este socio. */
export function gruposPara(sex: Sex | null): readonly GrupoDeCondiciones[] {
  return GRUPOS_DE_CONDICIONES.filter((g) => !sex || !g.ocultoPara?.includes(sex));
}

/** Qué filas agregar y cuáles borrar para pasar de lo guardado a lo elegido. */
export function diffCondiciones(
  guardadas: readonly HealthCondition[],
  elegidas: readonly HealthCondition[],
): { readonly agregar: HealthCondition[]; readonly sacar: HealthCondition[] } {
  return {
    agregar: [...new Set(elegidas)].filter((c) => !guardadas.includes(c)),
    sacar: [...new Set(guardadas)].filter((c) => !elegidas.includes(c)),
  };
}

/**
 * Si la tarjeta de cardio muestra el % de frecuencia cardíaca máxima. Con
 * betabloqueantes no: el pulso no llega y ese número empuja a exigirse de más
 * (`docs/research/44`). Mientras no se leyeron sus condiciones, tampoco: la
 * sensación de cada zona alcanza, y un número de más no se puede retirar.
 */
export function muestraElPulso(conditions: readonly HealthCondition[] | undefined): boolean {
  return conditions !== undefined && !ocultaElPulso(activeRuleset, conditions);
}

type Cliente = ReturnType<typeof requireSupabase>;

async function leerCondiciones(client: Cliente, userId: string): Promise<HealthCondition[]> {
  const { data, error } = await client
    .from('user_health_conditions')
    .select('condition')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.condition);
}

async function sacarCondiciones(client: Cliente, userId: string, sacar: HealthCondition[]) {
  if (sacar.length === 0) return;
  const { error } = await client
    .from('user_health_conditions')
    .delete()
    .eq('user_id', userId)
    .in('condition', sacar);
  if (error) throw error;
}

async function agregarCondiciones(client: Cliente, userId: string, agregar: HealthCondition[]) {
  if (agregar.length === 0) return;
  const { data: perfil, error: errPerfil } = await client
    .from('profiles')
    .select('gym_id')
    .eq('id', userId)
    .single();
  if (errPerfil) throw errPerfil;
  const { error } = await client
    .from('user_health_conditions')
    .insert(agregar.map((condition) => ({ user_id: userId, gym_id: perfil.gym_id, condition })));
  if (error) throw error;
}

export function useHealthConditions() {
  const { user, status } = useAuth();

  return useQuery<HealthCondition[]>({
    queryKey: ['health-conditions', user?.id],
    enabled: status === 'signed-in' && !!user,
    queryFn: () => leerCondiciones(requireSupabase(), user?.id as string),
  });
}

export function useSaveHealthConditions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (elegidas: readonly HealthCondition[]) => {
      if (!user) throw new Error('No hay sesión activa.');
      const client = requireSupabase();
      // Se compara contra lo que hay en la base, no contra la caché: con dos
      // pestañas abiertas, la caché de una puede estar vieja.
      const { agregar, sacar } = diffCondiciones(await leerCondiciones(client, user.id), elegidas);
      await sacarCondiciones(client, user.id, sacar);
      await agregarCondiciones(client, user.id, agregar);
      return [...new Set(elegidas)];
    },
    onSuccess: (guardadas) => {
      queryClient.setQueryData<HealthCondition[]>(['health-conditions', user?.id], guardadas);
    },
  });
}
