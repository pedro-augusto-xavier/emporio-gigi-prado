import { PawIcon } from './icons';
import { Reveal } from './Reveal';

export function PetFriendly() {
  return (
    <section id="pets" className="scroll-mt-20 bg-folha text-creme">
      <div className="grid md:grid-cols-2">
        <Reveal className="h-72 md:h-full md:min-h-96">
          <img
            src="/fotos/pet-mesa.webp"
            alt="Cachorro deitado embaixo da mesa enquanto os donos almoçam"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </Reveal>
        <Reveal delay={150} className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:px-20">
          <PawIcon className="h-12 w-12 text-palha" />
          <h2 className="mt-4 font-serif text-4xl leading-tight font-semibold sm:text-5xl">Seu cachorro é <span className="whitespace-nowrap">bem-vindo</span></h2>
          <p className="mt-4 max-w-md text-lg text-creme/90">
            Aqui o almoço é em família, e família inclui quem tem quatro patas. Traga seu cachorro para curtir o jardim
            com você.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
