import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import type { requireSupabase } from './supabase.ts';

/**
 * El esquema **como lo ve el cliente**, no leído del archivo generado. Si
 * alguien saca el `<Database>` de `supabase.ts`, `Esquema` cae en `never` y
 * todo lo de abajo cambia de significado. Es la diferencia entre verificar
 * que el archivo de tipos existe y verificar que está enchufado.
 */
type Cliente = ReturnType<typeof requireSupabase>;
type Esquema = Cliente extends SupabaseClient<infer D> ? D : never;

/**
 * EL CLIENTE CONOCE EL ESQUEMA
 *
 * `database.types.ts` se genera con `npm run db:types` desde la base real, y
 * durante meses no lo importó nadie: el cliente se creaba como
 * `SupabaseClient` a secas, así que `.from()` aceptaba cualquier string y
 * `.select()` devolvía filas sin forma. Medido antes de arreglarlo: este
 * archivo compilaba limpio.
 *
 *     requireSupabase().from('tabla_que_no_existe').select('columna_inventada')
 *
 * Un typo en un nombre de columna no se veía hasta que la consulta volvía
 * vacía en producción — y como Supabase no falla por pedir una columna que no
 * está, volvía vacía en silencio.
 *
 * Los `@ts-expect-error` de abajo son el guardián: si alguien vuelve a sacar
 * el genérico `<Database>`, esos errores dejan de existir y **el propio
 * `@ts-expect-error` pasa a estar de más**, que es un error de compilación.
 * Es decir: esta prueba se rompe en `npm run typecheck`, no acá.
 */
describe('el cliente de Supabase está tipado contra el esquema', () => {
  it('conoce las tablas que existen', () => {
    type Tablas = keyof Esquema['public']['Tables'];
    const reales: Tablas[] = ['set_logs', 'workout_logs', 'plans', 'profiles'];
    expect(reales).toHaveLength(4);

    // @ts-expect-error — una tabla inventada no es asignable.
    const inventada: Tablas = 'tabla_que_no_existe';
    expect(inventada).toBe('tabla_que_no_existe');
  });

  it('conoce las columnas de cada tabla', () => {
    type SetLog = Esquema['public']['Tables']['set_logs']['Row'];
    const reps: SetLog['reps'] = 8;
    expect(reps).toBe(8);

    // @ts-expect-error — `repeticiones` no existe: la columna es `reps`.
    const enCastellano: SetLog['repeticiones'] = 8;
    expect(enCastellano).toBe(8);
  });
});
