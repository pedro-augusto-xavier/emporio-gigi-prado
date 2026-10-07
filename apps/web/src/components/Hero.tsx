import { Link } from 'react-router';
import { restaurant } from '../config';

export function Hero() {
  return (
    <section id="inicio" className="relative flex min-h-[92svh] items-end overflow-hidden text-creme">
      {/* As fotos da casa são "em pé": no celular cabe uma; no computador, três lado a lado. */}
      <div className="animate-aproxima absolute inset-0 grid md:grid-cols-3">
        <img
          src="/fotos/casa-mignon-cogumelos.webp"
          alt="Filé mignon ao molho com cogumelos e batatas gratinadas, na mesa de madeira do Empório"
          className="h-full w-full object-cover"
          fetchPriority="high"
        />
        <img
          src="/fotos/casa-massa-camarao.webp"
          alt="Massa com camarões ao molho de tomate"
          className="hidden h-full w-full object-cover md:block"
        />
        <img
          src="/fotos/casa-camarao-baroa.webp"
          alt="Camarão grelhado com creme de baroa"
          className="hidden h-full w-full object-cover md:block"
        />
      </div>
      {/* Escurece as fotos (mais à esquerda e embaixo, onde fica o texto). */}
      <div className="absolute inset-0 bg-linear-to-t from-madeira-escura/90 via-madeira-escura/45 to-madeira-escura/40" />
      <div className="absolute inset-0 hidden bg-linear-to-r from-madeira-escura/70 via-madeira-escura/20 to-transparent md:block" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
        <p className="animate-sobe mb-4 text-sm tracking-[0.3em] text-palha uppercase">
          {restaurant.openDays}
          <span className="hidden sm:inline"> · </span>
          <br className="sm:hidden" />
          Mury, Nova Friburgo
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
          <Link
            to="/cardapio"
            className="rounded-full border border-creme/70 px-7 py-3 font-medium hover:bg-creme/10"
          >
            Ver cardápio
          </Link>
        </div>
      </div>
    </section>
  );
}
