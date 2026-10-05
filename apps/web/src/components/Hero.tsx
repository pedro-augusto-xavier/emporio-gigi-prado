import { restaurant, whatsappLink } from '../config';

export function Hero() {
  return (
    <section id="inicio" className="relative flex min-h-[92svh] items-end overflow-hidden text-creme">
      <img
        src="/fotos/prato-carne.webp"
        alt="Filé mignon grelhado com legumes servido à mesa"
        className="animate-aproxima absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      {/* Escurece a foto para o texto ficar legível. */}
      <div className="absolute inset-0 bg-linear-to-t from-madeira-escura/90 via-madeira-escura/45 to-madeira-escura/40" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
        <p className="animate-sobe mb-4 text-sm tracking-[0.3em] text-palha uppercase">
          {restaurant.openDays} · Mury, Nova Friburgo
        </p>
        <h1
          className="animate-sobe max-w-2xl font-serif text-5xl leading-[1.05] font-semibold sm:text-7xl"
          style={{ animationDelay: '150ms' }}
        >
          Um cantinho no meio do verde
        </h1>
        <p className="animate-sobe mt-6 max-w-xl text-lg text-creme/90" style={{ animationDelay: '300ms' }}>
          Pratos da casa, sobremesas e as delícias do empório, servidos com carinho numa casa de madeira cercada de
          jardim.
        </p>
        <div className="animate-sobe mt-8 flex flex-wrap gap-3" style={{ animationDelay: '450ms' }}>
          <a href="#reservar" className="rounded-full bg-folha px-7 py-3 font-medium hover:bg-folha-escura">
            Reservar mesa
          </a>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-creme/70 px-7 py-3 font-medium hover:bg-creme/10"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
