import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/lib/password.js';

describe('password', () => {
  it('gera hash diferente a cada vez e valida a senha correta', async () => {
    const a = await hashPassword('minha-senha');
    const b = await hashPassword('minha-senha');
    expect(a).not.toBe(b);
    expect(a).not.toContain('minha-senha');
    expect(await verifyPassword('minha-senha', a)).toBe(true);
  });

  it('rejeita senha errada e hash malformado', async () => {
    const hash = await hashPassword('minha-senha');
    expect(await verifyPassword('outra-senha', hash)).toBe(false);
    expect(await verifyPassword('minha-senha', '!')).toBe(false);
    expect(await verifyPassword('minha-senha', 'md5$abc')).toBe(false);
  });
});
