import { whatsappLink } from '../config';
import { Reveal } from './Reveal';

const drinks = [
  { title: 'Espumantes', text: 'Para o brinde das comemorações, do aniversário ao "só porque sim".' },
  { title: 'Vinhos', text: 'Rótulos selecionados para acompanhar massas, peixes e carnes.' },
  { title: 'Cervejas artesanais', text: 'Opções especiais para quem gosta de descobrir sabores novos.' },
  { title: 'Caipirinhas', text: 'Feitas com frutas frescas, do jeito que tem que ser.' },
];

export function Drinks() {
  return (
    <section id="bebidas" className="scroll-mt-20 overflow-hidden py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <p className="text-sm tracking-[0.3em] text-folha uppercase">Bebidas</p>
          <h2 className="mt-3 font-serif text-4xl leading-tight font-semibold sm:text-5xl">Para brindar à vontade</h2>
          <p className="mt-4 max-w-lg text-madeira/80">
            Um bom almoço pede uma boa bebida. Na nossa carta você encontra:
          </p>

          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            {drinks.map((drink) => (
              <div key={drink.title} className="border-l-2 border-pessego pl-4">
                <dt className="font-serif text-2xl font-semibold">{drink.title}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-madeira/75">{drink.text}</dd>
              </div>
            ))}
          </dl>

          <a
            href={whatsappLink('Olá! Gostaria de saber quais vinhos, espumantes e cervejas vocês têm.')}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block rounded-full bg-madeira px-7 py-3 text-sm font-medium tracking-wide text-creme uppercase hover:bg-madeira-escura"
          >
            Consultar a carta
          </a>
          {/* Aviso recomendado em divulgação de bebida alcoólica. */}
          <p className="mt-4 text-xs text-madeira/55">Beba com moderação. Venda proibida para menores de 18 anos.</p>
        </Reveal>

        {/* Mosaico: uma foto alta à esquerda e duas empilhadas à direita. */}
        <div className="grid h-80 grid-cols-2 gap-3 sm:h-[34rem] sm:gap-4">
          <Reveal delay={100} className="h-full">
            <img
              src="/fotos/espumante.webp"
              alt="Taças de espumante enfileiradas"
              loading="lazy"
              className="h-full w-full rounded-2xl object-cover shadow-lg"
            />
          </Reveal>
          <div className="grid gap-4">
            <Reveal delay={250} className="h-full">
              <img
                src="/fotos/vinho.webp"
                alt="Garrafa e taça de vinho tinto"
                loading="lazy"
                className="h-full w-full rounded-2xl object-cover shadow-lg"
              />
            </Reveal>
            <Reveal delay={400} className="h-full">
              <img
                src="/fotos/cerveja-artesanal.webp"
                alt="Copos com diferentes cervejas artesanais"
                loading="lazy"
                className="h-full w-full rounded-2xl object-cover shadow-lg"
              />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
