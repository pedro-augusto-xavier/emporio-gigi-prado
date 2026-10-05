import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { whatsappLink } from '../config';
import { Reveal } from './Reveal';

interface CardProps {
  image: string;
  alt: string;
  label: string;
  title: string;
  text: string;
  href: string;
}

/** Cartão com foto de fundo e texto por cima (inspirado no site de referência). */
/** Link para outra página do site, seção desta página (#) ou site externo. */
function CardLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (href.startsWith('/')) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    );
  }
  const external = href.startsWith('http');
  return (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className={className}>
      {children}
    </a>
  );
}

function PhotoCard({ image, alt, label, title, text, href }: CardProps) {
  return (
    <CardLink href={href} className="group relative flex h-full min-h-72 items-end overflow-hidden rounded-2xl text-creme sm:min-h-80">
      <img
        src={image}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-madeira-escura/95 via-madeira-escura/60 to-madeira-escura/10" />
      <div className="relative p-6 sm:p-8">
        <span className="text-xs tracking-[0.25em] uppercase underline underline-offset-4">{label}</span>
        <h3 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">{title}</h3>
        <p className="mt-2 max-w-lg text-sm text-creme/90 sm:text-base">{text}</p>
      </div>
    </CardLink>
  );
}

export function Highlights() {
  return (
    <section id="destaques" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Reveal>
          <PhotoCard
            image="/fotos/prato-peixe.webp"
            alt="Peixe grelhado servido com legumes"
            label="Cozinha"
            title="Sugestões do Chef"
            text="Pratos especiais escritos à mão no quadro, que mudam de tempos em tempos. Veja no cardápio."
            href="/cardapio"
          />
        </Reveal>
        <Reveal delay={150}>
          <PhotoCard
            image="/fotos/paes.webp"
            alt="Pães artesanais em cestos de vime"
            label="Empório"
            title="Encomendas"
            text="Pães artesanais, bolos, tortas, quiches, sopas e caldos para levar para casa."
            href={whatsappLink('Olá! Gostaria de fazer uma encomenda.')}
          />
        </Reveal>
        <Reveal>
          <PhotoCard
            image="/fotos/brinde-grupo.webp"
            alt="Grupo de amigos brindando com taças de espumante"
            label="Eventos"
            title="Vai comemorar?"
            text="Faça sua festa conosco: grupos, aniversários e encontros de família e amigos, com espumante para o brinde."
            href="#eventos"
          />
        </Reveal>
        <Reveal delay={150}>
          <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-2xl border-2 border-madeira/80 p-10 text-center">
            <p className="font-serif text-3xl font-semibold">
              Já sabe a data?
              <br />
              Reserve com a gente!
            </p>
            <a
              href="#reservar"
              className="mt-6 rounded-full bg-madeira px-7 py-3 text-sm font-medium tracking-wide text-creme uppercase hover:bg-madeira-escura"
            >
              Saiba mais
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
