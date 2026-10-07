import { Reveal } from './Reveal';

/** Fotos do próprio Empório. */
const photos = [
  { src: '/fotos/casa-fachada-dia.webp', alt: 'Fachada de madeira do Empório entre árvores', title: 'Nossa casa' },
  { src: '/fotos/salao-principal.webp', alt: 'Salão com lustres e mesas com toalhas rendadas', title: 'Ambiente acolhedor' },
  { src: '/fotos/varanda.webp', alt: 'Varanda com janelas de vidro de frente para o jardim', title: 'Varanda para o jardim' },
  { src: '/fotos/casa-fachada-noite.webp', alt: 'Fachada do Empório iluminada à noite', title: 'À noite' },
  { src: '/fotos/casa-truta-cogumelos.webp', alt: 'Truta com cogumelos e batatinhas', title: 'Truta com cogumelos' },
  { src: '/fotos/casa-entradinha.webp', alt: 'Entradinha da casa com pastas e patês', title: 'Entradinha da casa' },
];

export function Gallery() {
  return (
    <section id="galeria" className="scroll-mt-24 bg-palha/60 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <h2 className="text-center font-serif text-5xl font-semibold">Galeria</h2>
        </Reveal>
        <div className="mt-8 sem-barra -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 md:mx-0 md:grid md:snap-none md:overflow-visible md:px-0 md:pb-0 md:mt-10 md:grid-cols-3 md:gap-5">
          {photos.map((photo, index) => (
            <Reveal key={photo.src} delay={(index % 3) * 120} className="w-[82%] shrink-0 snap-start md:w-auto">
              <figure className="group relative h-80 overflow-hidden rounded-2xl md:h-64">
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
        <p aria-hidden="true" className="mt-3 text-center text-xs tracking-wide opacity-60 md:hidden">Arraste para o lado →</p>
      </div>
    </section>
  );
}
