import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { MobileActionBar } from './components/MobileActionBar';
import { WhatsAppButton } from './components/WhatsAppButton';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { PrivacyPage } from './pages/PrivacyPage';

const TITLES: Record<string, string> = {
  '/cardapio': 'Cardápio · Empório Gigi Prado',
  '/privacidade': 'Política de Privacidade · Empório Gigi Prado',
};
const DEFAULT_TITLE = 'Empório Gigi Prado · Restaurante em Mury, Nova Friburgo';

/** Ao trocar de página: volta para o topo (a não ser que o endereço tenha #secao) e troca o título da aba. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  useEffect(() => {
    document.title = TITLES[pathname] ?? DEFAULT_TITLE;
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cardapio" element={<MenuPage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppButton />
      <MobileActionBar />
    </>
  );
}
