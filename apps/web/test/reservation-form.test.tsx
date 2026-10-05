import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildReservationMessage, ReservationForm, weekdayOf } from '../src/components/ReservationForm';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function fill(date: string) {
  render(<ReservationForm />);
  fireEvent.change(screen.getByLabelText(/^nome/i), { target: { value: 'Ana Souza' } });
  fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '(22) 98888-7777' } });
  fireEvent.change(screen.getByLabelText(/^data/i), { target: { value: date } });
  fireEvent.change(screen.getByLabelText(/horário/i), { target: { value: '12:30' } });
  fireEvent.change(screen.getByLabelText(/quantas pessoas/i), { target: { value: '4' } });
}

describe('formulário de reserva', () => {
  it('monta a mensagem do WhatsApp com a data no formato brasileiro', () => {
    const message = buildReservationMessage({
      name: 'Ana Souza',
      phone: '(22) 98888-7777',
      date: '2026-10-10',
      time: '12:30',
      people: 4,
      notes: '  aniversário  ',
    });
    expect(message).toContain('Nome: Ana Souza');
    expect(message).toContain('Data: 10/10/2026');
    expect(message).toContain('Pessoas: 4');
    expect(message).toContain('Observações: aniversário');
  });

  it('não inclui observações vazias', () => {
    const message = buildReservationMessage({
      name: 'A',
      phone: '1',
      date: '2026-10-10',
      time: '12:00',
      people: 2,
      notes: '   ',
    });
    expect(message).not.toContain('Observações');
  });

  it('calcula o dia da semana sem depender do fuso', () => {
    expect(weekdayOf('2026-10-05')).toBe(1); // segunda
    expect(weekdayOf('2026-10-11')).toBe(0); // domingo
  });

  it('avisa e não abre o WhatsApp em dia fechado (segunda)', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    fill('2026-10-12');
    fireEvent.submit(screen.getByRole('form', { name: /pedido de reserva/i }));
    expect(screen.getByRole('alert').textContent).toMatch(/segundas e terças/);
    expect(open).not.toHaveBeenCalled();
  });

  it('abre o WhatsApp do restaurante com os dados da reserva', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    fill('2026-10-10');
    fireEvent.submit(screen.getByRole('form', { name: /pedido de reserva/i }));
    expect(open).toHaveBeenCalledOnce();
    const url = String(open.mock.calls[0]![0]);
    expect(url).toMatch(/^https:\/\/wa\.me\/5522992339210\?text=/);
    expect(decodeURIComponent(url.split('text=')[1]!)).toContain('Data: 10/10/2026');
  });
});
