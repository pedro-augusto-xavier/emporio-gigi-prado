import { useState, type FormEvent } from 'react';
import { closedWeekdays, whatsappLink } from '../config';
import { Reveal } from './Reveal';

export interface ReservationRequest {
  name: string;
  phone: string;
  date: string; // AAAA-MM-DD
  time: string; // HH:MM
  people: number;
  notes: string;
}

export function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

/** Dia da semana de uma data AAAA-MM-DD sem depender do fuso do navegador. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function buildReservationMessage(request: ReservationRequest): string {
  const lines = [
    'Olá! Gostaria de reservar uma mesa no Empório.',
    '',
    `Nome: ${request.name}`,
    `Telefone: ${request.phone}`,
    `Data: ${formatDate(request.date)}`,
    `Horário: ${request.time}`,
    `Pessoas: ${request.people}`,
  ];
  if (request.notes.trim()) lines.push(`Observações: ${request.notes.trim()}`);
  return lines.join('\n');
}

function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

const inputClass =
  'mt-1 w-full rounded-lg border border-madeira/20 bg-white px-4 py-3 text-madeira outline-none focus:border-folha focus:ring-2 focus:ring-folha/30';

/**
 * Por enquanto a reserva é enviada pelo WhatsApp e o restaurante confirma por lá.
 * Na parte 3 este formulário passa a gravar a reserva direto no sistema.
 */
export function ReservationForm() {
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const request: ReservationRequest = {
      name: String(data.get('name') ?? '').trim(),
      phone: String(data.get('phone') ?? '').trim(),
      date: String(data.get('date') ?? ''),
      time: String(data.get('time') ?? ''),
      people: Number(data.get('people') ?? 2),
      notes: String(data.get('notes') ?? ''),
    };

    if (closedWeekdays.includes(weekdayOf(request.date))) {
      setError('Não abrimos às segundas e terças. Escolha outro dia, por favor.');
      return;
    }
    setError('');
    window.open(whatsappLink(buildReservationMessage(request)), '_blank', 'noopener');
  }

  return (
    <section id="reservar" className="relative scroll-mt-20 overflow-hidden py-20">
      <img
        src="/fotos/massa-fettuccine.webp"
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-madeira-escura/70" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal className="text-creme">
          <h2 className="font-serif text-4xl leading-tight font-semibold sm:text-5xl">
            Reserve sua mesa e venha almoçar com a gente
          </h2>
          <p className="mt-5 max-w-lg text-lg text-creme/85">
            Preencha os dados e envie pelo WhatsApp. A gente responde para confirmar sua reserva.
          </p>
          <a
            href={whatsappLink('Olá! Gostaria de falar sobre uma encomenda.')}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block text-palha underline underline-offset-4 hover:text-creme"
          >
            Quer fazer uma encomenda? Fale com a gente →
          </a>
        </Reveal>

        <Reveal delay={150}>
          <form
            onSubmit={handleSubmit}
            aria-label="Pedido de reserva"
            className="rounded-2xl bg-creme/95 p-6 shadow-2xl backdrop-blur sm:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-medium">Nome *</span>
                <input name="name" required minLength={2} autoComplete="name" className={inputClass} />
              </label>
              <label className="sm:col-span-2">
                <span className="text-sm font-medium">Telefone / WhatsApp *</span>
                <input
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="(22) 99999-9999"
                  className={inputClass}
                />
              </label>
              <label>
                <span className="text-sm font-medium">Data *</span>
                <input name="date" type="date" required min={todayIso()} className={inputClass} />
              </label>
              <label>
                <span className="text-sm font-medium">Horário *</span>
                <input name="time" type="time" required min="10:00" max="18:00" className={inputClass} />
              </label>
              <label className="sm:col-span-2">
                <span className="text-sm font-medium">Quantas pessoas? *</span>
                <select name="people" defaultValue="2" className={inputClass}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'pessoa' : 'pessoas'}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="text-sm font-medium">Observações</span>
                <textarea
                  name="notes"
                  rows={2}
                  maxLength={300}
                  placeholder="Aniversário, cadeirinha para criança..."
                  className={inputClass}
                />
              </label>
            </div>

            {error && (
              <p role="alert" className="mt-4 rounded-lg bg-pessego/20 px-4 py-3 text-sm font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-folha py-3 font-medium tracking-wide text-creme uppercase hover:bg-folha-escura"
            >
              Enviar pelo WhatsApp
            </button>
            <p className="mt-3 text-center text-xs text-madeira/60">
              Seus dados vão apenas para a conversa com o restaurante no WhatsApp.
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
