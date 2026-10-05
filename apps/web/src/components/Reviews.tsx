import { useEffect, useRef, useState } from 'react';
import { restaurant } from '../config';
import { ChevronIcon, StarIcon } from './icons';
import { Reveal } from './Reveal';

/**
 * Trechos de avaliações reais do Tripadvisor (copiados em out/2026).
 * Para trocar ou adicionar, copie do Tripadvisor sem alterar o texto.
 */
const reviews = [
  {
    name: 'Mota56',
    date: 'ago. 2026',
    rating: 5,
    title: 'Local agradável, pratos excelentes',
    text: 'Estacionamento no mesmo terreno do restaurante. Local muito agradável, poucas mesas tornando o ambiente mais aconchegante.',
  },
  {
    name: 'Claudia B',
    date: 'jun. 2025',
    rating: 5,
    title: 'Experiência encantadora',
    text: 'Local muito aconchegante e alegre. Chegamos num domingo já após às 15h e fomos muito bem recebidos! O atendimento é personalizado e parece que estamos almoçando na casa de amigos.',
  },
  {
    name: 'Jorge C',
    date: 'out. 2024',
    rating: 5,
    title: 'Tudo muito agradável e gostoso!',
    text: 'Local muito agradável com decoração simples e de bom gosto. Estacionamento amplo e seguro. O cardápio tem poucas opções mas atende a todos os gostos.',
  },
  {
    name: 'Tatiana N',
    date: 'fev. 2024',
    rating: 5,
    title: 'Melhor restaurante da região!',
    text: 'Meus sogros moram em Mury e nos convidaram para conhecer esse restaurante. Que experiência maravilhosa!',
  },
  {
    name: 'FernaoGondin',
    date: 'out. 2023',
    rating: 5,
    title: 'Uma excelente escolha',
    text: 'É um dos melhores restaurantes de Nova Friburgo. A Chef Gigi comanda a cozinha e usa todo o seu talento e arte pra produzir refeições divinas.',
  },
  {
    name: 'Sandra M',
    date: 'ago. 2023',
    rating: 5,
    title: 'Muito agradável!',
    text: 'Local acolhedor, comida excelente e bem servida, pessoal super simpático! Preços compatíveis com a qualidade e quantidade dos pratos servidos.',
  },
];

const avatarColors = ['bg-folha', 'bg-pessego', 'bg-madeira', 'bg-folha-escura'];

export function Reviews() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  function scroll(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10;
    if (direction === 1 && atEnd) track.scrollTo({ left: 0, behavior: 'smooth' });
    else track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
  }

  // Passa sozinho a cada 6 segundos; para quando o mouse está em cima ou se o sistema pede menos movimento.
  useEffect(() => {
    if (paused || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => scroll(1), 6000);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <section id="avaliacoes" className="scroll-mt-24 bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-serif text-4xl font-semibold sm:text-5xl">O que nossos clientes dizem</h2>
          <p className="mx-auto mt-4 max-w-2xl text-madeira/80">
            Avaliações reais de quem já passou por aqui. Nota <strong>5,0 de 5</strong> no Tripadvisor, com mais de 220
            avaliações.
          </p>
        </Reveal>

        <div
          className="relative mt-6"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div
            ref={trackRef}
            className="sem-barra flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pt-10 pb-4"
            aria-label="Avaliações de clientes"
          >
            {reviews.map((review, index) => (
              <article
                key={review.name}
                className="relative w-[85%] shrink-0 snap-start rounded-2xl bg-creme px-7 pt-12 pb-8 text-center sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
              >
                <span
                  aria-hidden="true"
                  className={`absolute -top-8 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full font-serif text-3xl font-semibold text-creme shadow-md ${
                    avatarColors[index % avatarColors.length]
                  }`}
                >
                  {review.name.charAt(0)}
                </span>
                <h3 className="font-semibold">{review.name}</h3>
                <p className="text-sm text-madeira/60">{review.date}</p>
                <p className="mt-2 flex justify-center gap-0.5 text-[#F5B400]" aria-label={`${review.rating} de 5 estrelas`}>
                  {Array.from({ length: 5 }, (_, star) => (
                    <StarIcon key={star} className={`h-5 w-5 ${star < review.rating ? '' : 'opacity-25'}`} />
                  ))}
                </p>
                <p className="mt-4 font-serif text-xl font-semibold">“{review.title}”</p>
                <p className="mt-2 text-sm leading-relaxed text-madeira/85">{review.text}</p>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Avaliações anteriores"
            className="absolute top-1/2 -left-3 hidden rounded-full bg-white p-2 shadow-md hover:bg-creme sm:block"
          >
            <ChevronIcon className="h-5 w-5 rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Próximas avaliações"
            className="absolute top-1/2 -right-3 hidden rounded-full bg-white p-2 shadow-md hover:bg-creme sm:block"
          >
            <ChevronIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-6 text-center">
          <a
            href={restaurant.tripadvisorUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-folha underline underline-offset-4 hover:text-folha-escura"
          >
            Ver todas as avaliações no Tripadvisor →
          </a>
        </p>
      </div>
    </section>
  );
}
