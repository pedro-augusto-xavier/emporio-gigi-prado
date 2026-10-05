import { Reveal } from './Reveal';

/** Pratos tirados do cardápio impresso e do quadro de sugestões (out/2026). */
const specialties = [
  {
    title: 'Massas',
    image: '/fotos/massa-prato.webp',
    alt: 'Prato de massa ao molho cremoso',
    dishes: [
      'Massa Empório com Camarões',
      'Massa Empório com Cogumelos',
      'Mignon grelhado com linguine de alho negro e ervas',
    ],
  },
  {
    title: 'Peixes',
    image: '/fotos/prato-peixe.webp',
    alt: 'Peixe grelhado com legumes',
    dishes: [
      'Peixe grelhado no azeite, com especiarias e legumes assados',
      'Truta grelhada com amêndoas e batatas gratinadas',
      'Truta ao molho de pinhão com cogumelos na manteiga de ervas',
    ],
  },
  {
    title: 'Sobremesas',
    image: '/fotos/sobremesa-chocolate.webp',
    alt: 'Doces de chocolate',
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

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {specialties.map((item, index) => (
            <Reveal key={item.title} delay={index * 150}>
              <article className="group h-full overflow-hidden rounded-2xl bg-madeira-escura shadow-xl">
                <div className="h-56 overflow-hidden">
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
      </div>
    </section>
  );
}
