import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWhatsAppNotifier } from '../src/lib/notify.js';
import { createTestApp, testEnv, type TestContext } from './helpers.js';

// Quarta-feira, 07/10/2026, 09:00 em Brasília.
const NOW = new Date('2026-10-07T09:00:00-03:00');

const booking = {
  name: 'João Visitante',
  phone: '(11) 91234-5678',
  partySize: 4,
  startsAt: '2026-10-08T20:00:00-03:00',
  notes: 'Aniversário',
  acceptPrivacy: true,
};

let ctx: TestContext | undefined;
afterEach(async () => {
  await ctx?.close();
  ctx = undefined;
  vi.unstubAllGlobals();
});

describe('aviso de reserva nova no WhatsApp', () => {
  it('manda nome, pessoas, dia/hora local, telefone, observação e código', async () => {
    const sent: string[] = [];
    ctx = await createTestApp({ now: NOW, notify: async (text) => void sent.push(text) });

    const response = await ctx.app.inject({ method: 'POST', url: '/api/reservations', payload: booking });
    expect(response.statusCode).toBe(201);

    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain('Nome: João Visitante');
    expect(sent[0]).toContain('Pessoas: 4');
    expect(sent[0]).toMatch(/Quando: qui\.?, 08\/10,? 20:00/);
    expect(sent[0]).toContain('WhatsApp do cliente: https://wa.me/5511912345678');
    expect(sent[0]).toContain('Obs: Aniversário');
    expect(sent[0]).toContain(`Código: ${response.json().code}`);
  });

  it('a reserva vale mesmo se o aviso falhar', async () => {
    ctx = await createTestApp({ now: NOW, notify: async () => Promise.reject(new Error('fora do ar')) });
    const response = await ctx.app.inject({ method: 'POST', url: '/api/reservations', payload: booking });
    expect(response.statusCode).toBe(201);
  });

  it('não avisa quando a reserva é recusada', async () => {
    const sent: string[] = [];
    ctx = await createTestApp({ now: NOW, notify: async (text) => void sent.push(text) });
    await ctx.app.inject({ method: 'POST', url: '/api/reservations', payload: { ...booking, partySize: 99 } });
    expect(sent).toHaveLength(0);
  });
});

describe('CallMeBot', () => {
  it('sem telefone e chave configurados, não chama a internet', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await createWhatsAppNotifier(testEnv)('oi');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('monta a URL com telefone, texto e chave', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('ok'));
    vi.stubGlobal('fetch', fetchMock);
    const env = { ...testEnv, CALLMEBOT_PHONE: '+5522999999999', CALLMEBOT_APIKEY: '123' };

    await createWhatsAppNotifier(env)('Nova reserva\nNome: Ana');

    const url = new URL(fetchMock.mock.calls[0]![0] as URL);
    expect(url.origin + url.pathname).toBe('https://api.callmebot.com/whatsapp.php');
    expect(url.searchParams.get('phone')).toBe('+5522999999999');
    expect(url.searchParams.get('apikey')).toBe('123');
    expect(url.searchParams.get('text')).toBe('Nova reserva\nNome: Ana');
  });
});
