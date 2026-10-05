import { z } from 'zod';

export const uuidParam = z.object({ id: z.uuid() });

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email('E-mail inválido'));

/** Aceita "(11) 98765-4321", "+55 11 98765-4321" etc. e guarda só os dígitos com DDD. */
export const phoneSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, ''))
  .pipe(z.string().regex(/^\d{10,11}$/, 'Telefone inválido, informe com DDD'));

export const passwordSchema = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres')
  .max(128, 'A senha pode ter no máximo 128 caracteres');

export const nameSchema = z.string().trim().min(2, 'Nome muito curto').max(100);
