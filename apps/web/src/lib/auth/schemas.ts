import { z } from 'zod';

/**
 * Validación del formulario de acceso. Vive acá y no en @bh/domain porque
 * credenciales no es un concepto del dominio de entrenamiento — es un borde
 * de la app web.
 */
export const emailSchema = z.email('Ingresá un email válido.');

export const passwordSchema = z.string().min(8, 'La contraseña necesita al menos 8 caracteres.');

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Ingresá tu contraseña.'),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(2, 'Ingresá tu nombre.').max(60),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
