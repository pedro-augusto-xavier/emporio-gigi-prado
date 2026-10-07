import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import {
  ApiError,
  createReservation,
  fetchAvailability,
  formatDay,
  formatTime,
  type Reservation,
  type Slot,
} from '../api';
import { closedWeekdays, maxAdvanceDays, onlineMaxParty, whatsappLink } from '../config';
import { Reveal } from './Reveal';

/** Dia da semana de uma data AAAA-MM-DD sem depender do fuso do navegador. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** Mensagem que o cliente manda para o WhatsApp da Gigi depois de reservar. */
export function buildNotifyMessage(reservation: Reservation): string {
  return [
    'Olá! Acabei de fazer uma reserva pelo site.',
    '',
    `Código: ${reservation.code}`,
    `Nome: ${reservation.name}`,
    `Dia: ${formatDay(reservation.startsAt)}, às ${formatTime(reservation.startsAt)}`,
    `Pessoas: ${reservation.partySize}`,
  ].join('\n');
}

function isoDate(offsetDays = 0): string {
  const now = new Date(Date.now() + offsetDays * 86_400_000);
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

type SlotsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; slots: Slot[] };

const inputClass =
  'mt-1 w-full rounded-lg border border-madeira/20 bg-white px-4 py-3 text-madeira outline-none focus:border-folha focus:ring-2 focus:ring-folha/30';

const TOO_BIG = String(onlineMaxParty + 1);

export function ReservationForm() {
  const [date, setDate] = useState('');
  const [people, setPeople] = useState('2');
  const [slotsState, setSlotsState] = useState<SlotsState>({ status: 'idle' });
  const [selected, setSelected] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Reservation | null>(null);

  const tooBig = people === TOO_BIG;
  const closedDay = date !== '' && closedWeekdays.includes(weekdayOf(date));

  // Escolheu dia e pessoas: busca os horários livres na API.
  useEffect(() => {
    setSelected(null);
    if (!date || tooBig || closedDay) {
      setSlotsState({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    setSlotsState({ status: 'loading' });
    fetchAvailability(date, Number(people), controller.signal)
      .then((slots) => setSlotsState({ status: 'ready', slots }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setSlotsState({ status: 'error', message: err instanceof ApiError ? err.message : 'Erro ao buscar horários' });
      });
    return () => controller.abort();
  }, [date, people, tooBig, closedDay, reload]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!selected) {
      setError('Escolha um horário.');
      return;
    }
    if (data.get('privacy') !== 'on') {
      setError('Para reservar, é preciso aceitar a Política de Privacidade.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const email = String(data.get('email') ?? '').trim();
      const notes = String(data.get('notes') ?? '').trim();
      const reservation = await createReservation({
        name: String(data.get('name') ?? '').trim(),
        phone: String(data.get('phone') ?? ''),
        ...(email ? { email } : {}),
        ...(notes ? { notes } : {}),
        partySize: Number(people),
        startsAt: selected,
        acceptPrivacy: true,
      });
      setConfirmed(reservation);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível reservar. Tente de novo.');
      // Alguém pegou o último lugar antes: atualiza os horários.
      if (err instanceof ApiError && err.code === 'NO_AVAILABILITY') setReload((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setConfirmed(null);
    setSelected(null);
    setDate('');
    setReload((n) => n + 1);
  }

  return (
    <section id="reservar" className="relative scroll-mt-20 overflow-hidden py-20">
      <img src="/fotos/casa-massa-camarao-molho.webp" alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-madeira-escura/70" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal className="text-creme">
          <h2 className="font-serif text-4xl leading-tight font-semibold sm:text-5xl">
            Reserve sua mesa e venha almoçar com a gente
          </h2>
          <p className="mt-5 max-w-lg text-lg text-creme/85">
            Escolha o dia, quantas pessoas e o horário. A confirmação sai na hora.
          </p>
          <p className="mt-3 max-w-lg text-creme/70">
            Grupos com mais de {onlineMaxParty} pessoas ou festinhas: combine direto com a gente pelo WhatsApp.
          </p>
        </Reveal>

        <Reveal delay={150}>
          <div className="rounded-2xl bg-creme/95 p-6 shadow-2xl backdrop-blur sm:p-8">
            {confirmed ? (
              <div role="status" className="text-center">
                <span
                  aria-hidden="true"
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-folha text-3xl text-creme"
                >
                  ✓
                </span>
                <h3 className="mt-4 font-serif text-3xl font-semibold">Reserva confirmada!</h3>
                <p className="mt-4 text-madeira/70">Seu código de reserva:</p>
                <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-folha">{confirmed.code}</p>
                <p className="mt-4 text-lg first-letter:uppercase">
                  {formatDay(confirmed.startsAt)}, às {formatTime(confirmed.startsAt)}
                </p>
                <p className="text-madeira/70">
                  {confirmed.partySize} {confirmed.partySize === 1 ? 'pessoa' : 'pessoas'}
                </p>
                <a
                  href={whatsappLink(buildNotifyMessage(confirmed))}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 block rounded-full bg-[#25D366] py-3 font-medium text-white hover:brightness-95"
                >
                  Avisar o restaurante pelo WhatsApp
                </a>
                <p className="mt-4 text-sm text-madeira/60">
                  Guarde o código. Precisa mudar ou cancelar? Fale com a gente pelo WhatsApp informando o código.
                </p>
                <button type="button" onClick={startOver} className="mt-4 text-sm text-folha underline">
                  Fazer outra reserva
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} aria-label="Reserva de mesa" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="text-sm font-medium">Dia *</span>
                    <input
                      name="date"
                      type="date"
                      required
                      min={isoDate()}
                      max={isoDate(maxAdvanceDays)}
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className="text-sm font-medium">Quantas pessoas? *</span>
                    <select
                      name="people"
                      value={people}
                      onChange={(event) => setPeople(event.target.value)}
                      className={inputClass}
                    >
                      {Array.from({ length: onlineMaxParty }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'pessoa' : 'pessoas'}
                        </option>
                      ))}
                      <option value={TOO_BIG}>Mais de {onlineMaxParty}</option>
                    </select>
                  </label>
                </div>

                {tooBig ? (
                  <div className="mt-5 rounded-xl bg-palha p-5 text-center">
                    <p className="font-medium">Para grupos maiores, a gente combina tudo direitinho com você.</p>
                    <a
                      href={whatsappLink('Olá! Gostaria de reservar para um grupo com mais de 8 pessoas.')}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-block rounded-full bg-[#25D366] px-6 py-3 font-medium text-white hover:brightness-95"
                    >
                      Falar pelo WhatsApp
                    </a>
                  </div>
                ) : (
                  <>
                    <fieldset className="mt-5">
                      <legend className="text-sm font-medium">Horário *</legend>
                      <SlotPicker
                        date={date}
                        closedDay={closedDay}
                        state={slotsState}
                        selected={selected}
                        onSelect={setSelected}
                        onRetry={() => setReload((n) => n + 1)}
                      />
                    </fieldset>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <label className="sm:col-span-2">
                        <span className="text-sm font-medium">Nome *</span>
                        <input name="name" required minLength={2} autoComplete="name" className={inputClass} />
                      </label>
                      <label>
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
                        <span className="text-sm font-medium">E-mail (opcional)</span>
                        <input name="email" type="email" autoComplete="email" className={inputClass} />
                      </label>
                      <label className="sm:col-span-2">
                        <span className="text-sm font-medium">Observações</span>
                        <textarea
                          name="notes"
                          rows={2}
                          maxLength={300}
                          placeholder="Aniversário, cadeirinha para criança, vem com cachorro..."
                          className={inputClass}
                        />
                      </label>
                    </div>

                    <label className="mt-4 flex items-start gap-3 text-sm">
                      <input name="privacy" type="checkbox" className="mt-1 h-4 w-4 accent-folha" />
                      <span>
                        Li e aceito a{' '}
                        <Link to="/privacidade" target="_blank" className="text-folha underline">
                          Política de Privacidade
                        </Link>
                        . Meus dados serão usados só para cuidar da minha reserva.
                      </span>
                    </label>

                    {error && (
                      <p role="alert" className="mt-4 rounded-lg bg-pessego/25 px-4 py-3 text-sm font-medium">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-6 w-full rounded-full bg-folha py-3 font-medium tracking-wide text-creme uppercase hover:bg-folha-escura disabled:opacity-60"
                    >
                      {submitting ? 'Reservando...' : 'Confirmar reserva'}
                    </button>
                  </>
                )}
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

interface SlotPickerProps {
  date: string;
  closedDay: boolean;
  state: SlotsState;
  selected: string | null;
  onSelect: (startsAt: string) => void;
  onRetry: () => void;
}

function SlotPicker({ date, closedDay, state, selected, onSelect, onRetry }: SlotPickerProps) {
  const hint = 'mt-2 rounded-lg bg-white/70 px-4 py-3 text-sm text-madeira/70';

  if (!date) return <p className={hint}>Escolha o dia para ver os horários livres.</p>;
  if (closedDay) return <p className={hint}>Não abrimos às segundas e terças. Escolha outro dia, por favor.</p>;
  if (state.status === 'loading' || state.status === 'idle') return <p className={hint}>Buscando horários...</p>;
  if (state.status === 'error') {
    return (
      <p className={hint}>
        {state.message}{' '}
        <button type="button" onClick={onRetry} className="text-folha underline">
          Tentar de novo
        </button>
      </p>
    );
  }
  if (state.slots.length === 0) return <p className={hint}>Não há mais horários para este dia. Escolha outro dia.</p>;
  if (!state.slots.some((slot) => slot.available)) {
    return <p className={hint}>Este dia já está lotado. Que tal outro dia?</p>;
  }

  return (
    <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
      {state.slots.map((slot) => {
        const active = selected === slot.startsAt;
        return (
          <button
            key={slot.startsAt}
            type="button"
            disabled={!slot.available}
            aria-pressed={active}
            onClick={() => onSelect(slot.startsAt)}
            title={slot.available ? undefined : 'Lotado'}
            className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
              active
                ? 'border-folha bg-folha text-creme'
                : 'border-madeira/20 bg-white hover:border-folha disabled:cursor-not-allowed disabled:bg-transparent disabled:text-madeira/30 disabled:line-through'
            }`}
          >
            {formatTime(slot.startsAt)}
          </button>
        );
      })}
    </div>
  );
}
