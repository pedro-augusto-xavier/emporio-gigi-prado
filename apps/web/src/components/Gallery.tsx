import { Reveal } from './Reveal';

/** As duas primeiras fotos são do próprio Empório; as outras são ilustrativas (Unsplash). */
const photos = [
  { src: '/fotos/salao-principal.webp', alt: 'Salão do Empório com lustres e mesas com toalhas rendadas', title: 'Ambiente acolhedor' },
  { src: '/fotos/varanda.webp', alt: 'Varanda do Empório com janelas de vidro de frente para o jardim', title: 'Varanda para o jardim' },
  { src: '/fotos/massa-camarao.webp', alt: 'Massa com camarões e manjericão', title: 'Pratos da casa' },
  { src: '/fotos/sobremesa-chocolate.webp', alt: 'Vitrine com doces de chocolate', title: 'Sobremesas irresistíveis' },
  { src: '/fotos/cafe.webp', alt: 'Xícara de café com desenho de folha na espuma', title: 'Cafés e chás' },
  { src: '/fotos/bolo-festa.webp', alt: 'Bolo de chocolate decorado', title: 'Bolos por encomenda' },
];

export function Gallery() {
  return (
    <section id="galeria" className="scroll-mt-24 bg-palha/60 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <h2 className="text-center font-serif text-5xl font-semibold">Galeria</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {photos.map((photo, index) => (
            <Reveal key={photo.src} delay={(index % 3) * 120}>
              <figure className="group relative h-64 overflow-hidden rounded-2xl">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-madeira-escura/95 via-madeira-escura/60 to-transparent p-5 pt-16 font-serif text-2xl font-semibold text-creme">
                  {photo.title}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
