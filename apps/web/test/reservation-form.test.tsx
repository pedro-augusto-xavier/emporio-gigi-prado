import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildNotifyMessage, ReservationForm, weekdayOf } from '../src/components/ReservationForm';

// 15:00 UTC = 12:00 em Brasília.
const SLOTS = [
  { startsAt: '2026-10-10T15:00:00.000Z', available: true },
  { startsAt: '2026-10-10T15:30:00.000Z', available: false },
];
const CONFIRMED = { code: 'ABCD2345', name: 'Ana Souza', partySize: 4, startsAt: SLOTS[0]!.startsAt, status: 'confirmed' };

type Handler = (url: string, init?: RequestInit) => { status: number; body: unknown };

function mockApi(handler: Handler) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const { status, body } = handler(String(input), init);
    return { ok: status < 400, status, json: async () => body } as Response;
  });
}

const happyApi: Handler = (url, init) =>
  init?.method === 'POST' ? { status: 201, body: CONFIRMED } : { status: 200, body: { slots: SLOTS } };

function renderForm() {
  render(
    <MemoryRouter>
      <ReservationForm />
    </MemoryRouter>,
  );
}

function chooseDay(date: string, people = '4') {
  fireEvent.change(screen.getByLabelText(/quantas pessoas/i), { target: { value: people } });
  fireEvent.change(screen.getByLabelText(/^dia/i), { target: { value: date } });
}

function fillContact() {
  fireEvent.change(screen.getByLabelText(/^nome/i), { target: { value: 'Ana Souza' } });
  fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '(22) 98888-7777' } });
}

const submit = () => fireEvent.submit(screen.getByRole('form', { name: /reserva de mesa/i }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('mensagens', () => {
  it('aviso para o WhatsApp tem código, dia, horário de Brasília e pessoas', () => {
    const message = buildNotifyMessage(CONFIRMED);
    expect(message).toContain('Código: ABCD2345');
    expect(message).toContain('às 12:00');
    expect(message).toContain('10/10');
    expect(message).toContain('Pessoas: 4');
  });

  it('calcula o dia da semana sem depender do fuso', () => {
    expect(weekdayOf('2026-10-05')).toBe(1); // segunda
    expect(weekdayOf('2026-10-11')).toBe(0); // domingo
  });
});

describe('formulário de reserva', () => {
  it('reserva do começo ao fim e oferece avisar o restaurante', async () => {
    const fetchSpy = mockApi(happyApi);
    renderForm();
    chooseDay('2026-10-10');

    const free = await screen.findByRole('button', { name: '12:00' });
    expect(screen.getByRole('button', { name: '12:30' }).hasAttribute('disabled')).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith('/api/reservations/availability?date=2026-10-10&partySize=4', expect.anything());

    fireEvent.click(free);
    expect(free.getAttribute('aria-pressed')).toBe('true');
    fillContact();
    fireEvent.click(screen.getByRole('checkbox'));
    submit();

    expect(await screen.findByText('Reserva confirmada!')).toBeTruthy();
    expect(screen.getByText('ABCD2345')).toBeTruthy();

    const post = fetchSpy.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(JSON.parse(String(post[1]!.body))).toEqual({
      name: 'Ana Souza',
      phone: '(22) 98888-7777',
      partySize: 4,
      startsAt: SLOTS[0]!.startsAt,
      acceptPrivacy: true,
    });

    const notify = screen.getByRole('link', { name: /avisar o restaurante/i }).getAttribute('href')!;
    expect(notify).toMatch(/^https:\/\/wa\.me\/5522992339210/);
    expect(decodeURIComponent(notify)).toContain('ABCD2345');
  });

  it('não envia sem aceitar a política de privacidade', async () => {
    const fetchSpy = mockApi(happyApi);
    renderForm();
    chooseDay('2026-10-10');
    fireEvent.click(await screen.findByRole('button', { name: '12:00' }));
    fillContact();
    submit();

    expect(screen.getByRole('alert').textContent).toMatch(/Política de Privacidade/);
    expect(fetchSpy.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('pede para escolher um horário antes de enviar', async () => {
    mockApi(happyApi);
    renderForm();
    chooseDay('2026-10-10');
    await screen.findByRole('button', { name: '12:00' });
    submit();
    expect(screen.getByRole('alert').textContent).toMatch(/Escolha um horário/);
  });

  it('avisa que fecha às segundas sem nem consultar a API', () => {
    const fetchSpy = mockApi(happyApi);
    renderForm();
    chooseDay('2026-10-12');
    expect(screen.getByText(/Não abrimos às segundas e terças/)).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('grupo com mais de 8 pessoas vai para o WhatsApp', () => {
    mockApi(happyApi);
    renderForm();
    chooseDay('2026-10-10', '9');
    expect(screen.getByRole('link', { name: /falar pelo whatsapp/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /confirmar reserva/i })).toBeNull();
  });

  it('se lotar enquanto a pessoa preenchia, mostra o aviso e atualiza os horários', async () => {
    let availabilityCalls = 0;
    mockApi((url, init) => {
      if (init?.method === 'POST') {
        return { status: 409, body: { error: 'NO_AVAILABILITY', message: 'Esse horário está lotado.' } };
      }
      availabilityCalls += 1;
      return { status: 200, body: { slots: SLOTS } };
    });
    renderForm();
    chooseDay('2026-10-10');
    fireEvent.click(await screen.findByRole('button', { name: '12:00' }));
    fillContact();
    fireEvent.click(screen.getByRole('checkbox'));
    submit();

    expect((await screen.findByRole('alert')).textContent).toMatch(/lotado/);
    await waitFor(() => expect(availabilityCalls).toBe(2));
  });

  it('mostra a explicação da API quando um dado está errado', async () => {
    mockApi((url, init) =>
      init?.method === 'POST'
        ? {
            status: 400,
            body: {
              error: 'VALIDATION_ERROR',
              message: 'Dados inválidos',
              issues: [{ path: 'phone', message: 'Telefone inválido, informe com DDD' }],
            },
          }
        : { status: 200, body: { slots: SLOTS } },
    );
    renderForm();
    chooseDay('2026-10-10');
    fireEvent.click(await screen.findByRole('button', { name: '12:00' }));
    fillContact();
    fireEvent.click(screen.getByRole('checkbox'));
    submit();
    expect((await screen.findByRole('alert')).textContent).toBe('Telefone inválido, informe com DDD');
  });
});
