import { whatsappLink } from '../config';
import { CarIcon, GlassesIcon, HouseIcon, MusicIcon, PawIcon, UtensilsIcon } from './icons';
import { Reveal } from './Reveal';

const features = [
  {
    icon: HouseIcon,
    title: 'Ambiente',
    text: 'Uma casa de madeira cercada de jardim, com salão aconchegante e varanda envidraçada.',
  },
  {
    icon: GlassesIcon,
    title: 'Grupos e festinhas',
    text: 'Recebemos grupos de amigos e família, aniversários e comemorações, com espumante para o brinde.',
  },
  {
    icon: MusicIcon,
    title: 'Música ao vivo',
    text: 'Em algumas datas, apresentações intimistas de voz e violão para deixar o almoço ainda melhor.',
  },
  {
    icon: UtensilsIcon,
    title: 'Gastronomia',
    text: 'A Chef Gigi comanda a cozinha: massas, peixes e sobremesas feitas na casa.',
  },
  {
    icon: PawIcon,
    title: 'Pet friendly',
    text: 'Seu cachorro é bem-vindo para almoçar com a família.',
  },
  {
    icon: CarIcon,
    title: 'Estacionamento',
    text: 'Estacionamento no próprio terreno do restaurante, para chegar com tranquilidade.',
  },
];

export function Events() {
  return (
    <section id="eventos" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6 md:py-20">
      <Reveal>
        <h2 className="max-w-md font-serif text-4xl leading-tight font-semibold sm:text-5xl">Comemore no Empório</h2>
        <p className="mt-4 max-w-2xl text-madeira/80">
          Aniversários, almoços de família e encontros entre amigos ficam ainda mais especiais num lugar que parece a
          casa da gente.
        </p>
      </Reveal>

      <div className="mt-8 grid grid-cols-2 gap-3 md:mt-10 md:gap-5 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 120}>
            <div className="h-full rounded-2xl bg-white p-4 text-center shadow-md transition-transform duration-300 hover:-translate-y-1 md:p-6">
              <feature.icon className="mx-auto mb-2 h-8 w-8 text-folha md:mb-3 md:h-10 md:w-10" />
              <h3 className="font-serif text-lg leading-tight font-semibold md:text-2xl">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-madeira/80 md:mt-3 md:text-sm">{feature.text}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-8">
        <div className="grid overflow-hidden rounded-2xl md:grid-cols-[2fr_3fr]">
          <div className="flex flex-col justify-center bg-palha p-8 sm:p-10">
            <h3 className="font-serif text-3xl font-semibold">Voz, violão e boa comida</h3>
            <p className="mt-3 text-madeira/80">
              Nos dias de música ao vivo, a casa fica ainda mais gostosa. Pergunte pelo WhatsApp qual é a próxima data.
            </p>
            <a
              href={whatsappLink('Olá! Qual é a próxima data com música ao vivo no Empório?')}
              target="_blank"
              rel="noreferrer"
              className="mt-6 self-start rounded-full border-2 border-madeira px-6 py-2 text-sm font-medium hover:bg-madeira hover:text-creme"
            >
              Ver programação
            </a>
          </div>
          <div className="relative flex min-h-72 items-center">
            <img
              src="/fotos/musica-violao.webp"
              alt="Músico tocando violão perto da janela"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-madeira-escura/60" />
            <div className="relative p-8 text-creme sm:p-10">
              <p className="font-serif text-3xl leading-snug font-semibold sm:text-4xl">
                Quer fazer seu aniversário no Empório? Fale com a gente e garanta sua data.
              </p>
              <a
                href={whatsappLink('Olá! Gostaria de comemorar meu aniversário no Empório.')}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-block rounded-full bg-folha px-7 py-3 text-sm font-medium tracking-wide uppercase hover:bg-folha-escura"
              >
                Reservar minha data
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
