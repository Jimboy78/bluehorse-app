import { EQUIPMENT_CATEGORIES, LOAD_UNITS } from '@bh/domain';
import { z } from 'zod';

/**
 * Validación del alta de equipamiento en el panel admin. Espeja `equipment`
 * (supabase/schemas/03_catalog.sql), no las entidades de dominio: acá se
 * valida lo que tipea alguien en un formulario, con sus strings vacíos y
 * checkboxes, antes de convertirlo a lo que la tabla espera.
 */

const numericField = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : Number(v)))
  .refine((v) => v === null || Number.isFinite(v), 'Ingresá un número válido.');

export const equipmentFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Ingresá un nombre.').max(120),
    category: z.enum(EQUIPMENT_CATEGORIES, { message: 'Elegí una categoría.' }),
    loadUnit: z.enum(LOAD_UNITS, { message: 'Elegí una unidad de carga.' }),
    loadMin: numericField,
    loadMax: numericField,
    loadIncrement: numericField,
    /** Coma-separado, de menor a mayor: "5,10,15,20". Solo para stack_level. */
    stackKgRaw: z.string().trim(),
    baseWeightKg: numericField,
    quantity: z.coerce.number().int().min(1).max(50),
    locationNote: z.string().trim().max(200),
    setupNotes: z.string().trim().max(400),
  })
  .refine((v) => v.loadUnit !== 'stack_level' || v.stackKgRaw.length > 0, {
    message:
      'Una estación de pin necesita la tabla de kg por nivel, o los gráficos no van a poder usarla.',
    path: ['stackKgRaw'],
  });

export type EquipmentFormInput = z.infer<typeof equipmentFormSchema>;

/** "5, 10 ,15" -> [5, 10, 15]. Tira si algún término no es un número. */
export function parseStackKg(raw: string): number[] | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(',').map((p) => Number(p.trim()));
  if (parts.some((n) => !Number.isFinite(n))) return null;
  return parts;
}
