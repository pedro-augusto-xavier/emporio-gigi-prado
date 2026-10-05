import type { ReactNode } from 'react';
import { openingHours, restaurant, whatsappLink } from '../config';
import { Reveal } from './Reveal';

// TODO: confirmar as respostas com a Gigi (algumas vieram das avaliações do Tripadvisor).
const questions: { question: string; answer: ReactNode }[] = [
  {
    question: 'É preciso fazer reserva?',
    answer:
      'Não é obrigatório, mas recomendamos: a casa tem poucas mesas, então nos fins de semana a reserva garante o seu lugar.',
  },
  {
    question: 'Qual é o horário de funcionamento?',
    answer: (
      <ul className="space-y-1">
        {openingHours.map((row) => (
          <li key={row.days}>
            <strong className="font-medium">{row.days}:</strong> {row.hours}
          </li>
        ))}
      </ul>
    ),
  },
  {
    question: 'Tem opções vegetarianas?',
    answer:
      'Sim! O cardápio tem Prato da Horta, Estrogonofe de Cogumelos, Rosti de Cogumelos e Massa Empório com Cogumelos.',
  },
  {
    question: 'Posso levar meu cachorro?',
    answer: 'Pode! Seu cachorro é bem-vindo para almoçar com a família.',
  },
  {
    question: 'Tem estacionamento?',
    answer: 'Sim, no próprio terreno do restaurante.',
  },
  {
    question: 'Vocês fazem encomendas?',
    answer: 'Fazemos! Pães artesanais, bolos, tortas, quiches, sopas e caldos. É só pedir pelo WhatsApp.',
  },
  {
    question: 'Tem música ao vivo?',
    answer: 'Em algumas datas, com apresentações de voz e violão. Pergunte pelo WhatsApp qual é a próxima.',
  },
  {
    question: 'Posso fazer minha festa no Empório?',
    answer:
      'Pode sim! Recebemos grupos, aniversários e festinhas, com espumantes, vinhos e cervejas artesanais para brindar. Fale com a gente para combinar os detalhes.',
  },
];

const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
  `${restaurant.name}, ${restaurant.address}`,
)}&output=embed`;

export function Faq() {
  return (
    <section id="duvidas" className="scroll-mt-20 bg-palha/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[2fr_3fr]">
        <Reveal>
          <h2 className="font-serif text-4xl leading-tight font-semibold sm:text-5xl">Tire suas dúvidas</h2>
          <p className="mt-5 text-lg text-madeira/80">
            Ficou com alguma dúvida ou quer saber mais? Fale com a gente no WhatsApp e receba todas as informações que
            precisa.
          </p>
          <a
            href={whatsappLink('Olá! Tenho uma dúvida sobre o Empório.')}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block rounded-full bg-folha px-7 py-3 font-medium text-creme hover:bg-folha-escura"
          >
            Chamar no WhatsApp
          </a>
        </Reveal>

        <Reveal delay={150}>
          <div className="divide-y divide-madeira/15 overflow-hidden rounded-2xl border border-madeira/15 bg-white">
            {questions.map((item, index) => (
              <details key={item.question} open={index === 0} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-4 px-6 py-5 font-medium hover:bg-creme [&::-webkit-details-marker]:hidden">
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-folha text-creme transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                  {item.question}
                </summary>
                <div className="px-6 pb-5 pl-16 text-madeira/80">{item.answer}</div>
              </details>
            ))}
          </div>
        </Reveal>
      </div>

      <iframe
        title={`Mapa: ${restaurant.name}`}
        src={mapSrc}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block h-[420px] w-full border-0"
      />
    </section>
  );
}
