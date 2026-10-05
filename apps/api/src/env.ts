import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3333),
  /** postgres://... ou, só em desenvolvimento, pglite:./pasta (banco embutido). */
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter pelo menos 32 caracteres'),
  // Lista separada por vírgula, ex: "http://localhost:5173,https://gigi.com.br"
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  RUN_MIGRATIONS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
}).superRefine((env, ctx) => {
  if (env.NODE_ENV !== 'production') return;
  if (env.DATABASE_URL.startsWith('pglite:')) {
    ctx.addIssue({ code: 'custom', path: ['DATABASE_URL'], message: 'Em produção use um PostgreSQL de verdade' });
  }
  if (env.JWT_SECRET.startsWith('troque')) {
    ctx.addIssue({ code: 'custom', path: ['JWT_SECRET'], message: 'Troque o JWT_SECRET de exemplo antes de ir para produção' });
  }
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Variáveis de ambiente inválidas:\n${issues.join('\n')}`);
  }
  return parsed.data;
}
