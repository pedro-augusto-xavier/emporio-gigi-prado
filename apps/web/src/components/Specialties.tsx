import { Link } from 'react-router';
import { Reveal } from './Reveal';

/** Pratos tirados do cardápio impresso e do quadro de sugestões (out/2026). */
const specialties = [
  {
    title: 'Massas',
    image: '/fotos/casa-massa-camarao.webp',
    alt: 'Massa com camarões ao molho de tomate',
    dishes: [
      'Massa Empório com Camarões',
      'Massa Empório com Cogumelos',
      'Mignon grelhado com linguine de alho negro e ervas',
    ],
  },
  {
    title: 'Peixes',
    image: '/fotos/casa-truta-amendoas.webp',
    alt: 'Truta grelhada com amêndoas e batatas gratinadas',
    dishes: [
      'Peixe grelhado no azeite, com especiarias e legumes assados',
      'Truta grelhada com amêndoas e batatas gratinadas',
      'Truta ao molho de pinhão com cogumelos na manteiga de ervas',
    ],
  },
  {
    title: 'Sobremesas',
    image: '/fotos/casa-bolo-decorado.webp',
    alt: 'Bolo decorado com flores, feito no Empório',
    dishes: [
      'Profiteroles com sorvete e calda quente de chocolate',
      'Morango Empório: massa choux, creme especial e calda de morango',
      'Mousse Três Chocolates',
      'Rabanada da Casa',
    ],
  },
];

export function Specialties() {
  return (
    <section id="especialidades" className="scroll-mt-24 bg-madeira py-20 text-creme">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="text-sm tracking-[0.3em] text-palha uppercase">Feito na casa</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">Especialidades da Chef Gigi</h2>
          <p className="mx-auto mt-4 max-w-2xl text-creme/80">
            Massas, peixes e sobremesas são o coração da nossa cozinha. Alguns dos pratos que você encontra por aqui:
          </p>
        </Reveal>

        <div className="mt-10 sem-barra -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 md:mx-0 md:grid md:snap-none md:overflow-visible md:px-0 md:pb-0 md:grid-cols-3 md:gap-6">
          {specialties.map((item, index) => (
            <Reveal key={item.title} delay={index * 150} className="w-[82%] shrink-0 snap-start md:w-auto">
              <article className="group h-full overflow-hidden rounded-2xl bg-madeira-escura shadow-xl">
                <div className="h-48 overflow-hidden md:h-56">
                  <img
                    src={item.image}
                    alt={item.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="p-7">
                  <h3 className="font-serif text-3xl font-semibold">{item.title}</h3>
                  <ul className="mt-4 space-y-3">
                    {item.dishes.map((dish) => (
                      <li key={dish} className="flex gap-3 text-sm leading-relaxed text-creme/85">
                        <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pessego" />
                        {dish}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <p aria-hidden="true" className="mt-3 text-center text-xs tracking-wide opacity-60 md:hidden">Arraste para o lado →</p>

        <Reveal className="mt-10 text-center md:mt-12">
          <Link
            to="/cardapio"
            className="inline-block rounded-full bg-creme px-8 py-3 font-medium tracking-wide text-madeira uppercase hover:bg-palha"
          >
            Ver cardápio completo
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
