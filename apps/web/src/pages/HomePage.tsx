import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Drinks } from '../components/Drinks';
import { Events } from '../components/Events';
import { Faq } from '../components/Faq';
import { Gallery } from '../components/Gallery';
import { Hero } from '../components/Hero';
import { Highlights } from '../components/Highlights';
import { PetFriendly } from '../components/PetFriendly';
import { ReservationForm } from '../components/ReservationForm';
import { Reviews } from '../components/Reviews';
import { Specialties } from '../components/Specialties';

export function HomePage() {
  const { hash } = useLocation();

  // Vindo de outra página com /#secao: rola até a seção depois que ela existe na tela.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <>
      <Hero />
      <Highlights />
      <Specialties />
      <Drinks />
      <Gallery />
      <Events />
      <PetFriendly />
      <Reviews />
      <ReservationForm />
      <Faq />
    </>
  );
}
