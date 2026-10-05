import { Drinks } from './components/Drinks';
import { Events } from './components/Events';
import { Faq } from './components/Faq';
import { Footer } from './components/Footer';
import { Gallery } from './components/Gallery';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Highlights } from './components/Highlights';
import { PetFriendly } from './components/PetFriendly';
import { ReservationForm } from './components/ReservationForm';
import { Reviews } from './components/Reviews';
import { Specialties } from './components/Specialties';
import { WhatsAppButton } from './components/WhatsAppButton';

export function App() {
  return (
    <>
      <Header />
      <main>
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
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
