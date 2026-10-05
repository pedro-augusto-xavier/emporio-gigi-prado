import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { instagramLink, whatsappLink } from '../config';
import { CloseIcon, InstagramIcon, MenuIcon, WhatsAppIcon } from './icons';
import { Logo } from './Logo';

// Links com /#secao funcionam de qualquer página: levam para a inicial e rolam até a seção.
const links = [
  { to: '/cardapio', label: 'Cardápio' },
  { to: '/#especialidades', label: 'Especialidades' },
  { to: '/#bebidas', label: 'Bebidas' },
  { to: '/#eventos', label: 'Eventos' },
  { to: '/#avaliacoes', label: 'Avaliações' },
  { to: '/#duvidas', label: 'Dúvidas' },
];

/** Na página inicial fica transparente em cima da foto; ao rolar (ou em outras páginas) ganha fundo madeira. */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const solid = scrolled || menuOpen || pathname !== '/';

  return (
    <header
      data-solid={solid}
      className={`fixed inset-x-0 top-0 z-40 text-creme transition-colors duration-300 ${
        solid ? 'bg-madeira/95 shadow-lg backdrop-blur' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" aria-label="Empório Gigi Prado, início">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Principal">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm tracking-wide hover:text-palha">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={instagramLink}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram do Empório"
            className="rounded-full bg-folha p-2 hover:bg-folha-escura"
          >
            <InstagramIcon className="h-4 w-4" />
          </a>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp do Empório"
            className="rounded-full bg-folha p-2 hover:bg-folha-escura"
          >
            <WhatsAppIcon className="h-4 w-4" />
          </a>
          <Link
            to="/#reservar"
            className="ml-3 rounded-full bg-folha px-5 py-2 text-sm font-medium hover:bg-folha-escura"
          >
            Reservar mesa
          </Link>
        </div>

        <button
          type="button"
          className="rounded p-2 lg:hidden"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <nav className="border-t border-creme/10 px-4 pb-6 lg:hidden" aria-label="Principal (celular)">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-lg"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/#reservar"
            onClick={() => setMenuOpen(false)}
            className="mt-3 block rounded-full bg-folha py-3 text-center font-medium"
          >
            Reservar mesa
          </Link>
        </nav>
      )}
    </header>
  );
}
