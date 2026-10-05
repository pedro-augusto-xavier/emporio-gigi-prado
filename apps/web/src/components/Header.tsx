import { useEffect, useState } from 'react';
import { instagramLink, whatsappLink } from '../config';
import { CloseIcon, InstagramIcon, MenuIcon, WhatsAppIcon } from './icons';
import { Logo } from './Logo';

const links = [
  { href: '#especialidades', label: 'Especialidades' },
  { href: '#bebidas', label: 'Bebidas' },
  { href: '#eventos', label: 'Eventos' },
  { href: '#galeria', label: 'Galeria' },
  { href: '#avaliacoes', label: 'Avaliações' },
  { href: '#duvidas', label: 'Dúvidas' },
];

/** Transparente em cima da foto; ao rolar a página ganha fundo cor de madeira. */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const solid = scrolled || menuOpen;

  return (
    <header
      data-solid={solid}
      className={`fixed inset-x-0 top-0 z-40 text-creme transition-colors duration-300 ${
        solid ? 'bg-madeira/95 shadow-lg backdrop-blur' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#inicio" aria-label="Empório Gigi Prado, início">
          <Logo />
        </a>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm tracking-wide hover:text-palha">
              {link.label}
            </a>
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
          <a
            href="#reservar"
            className="ml-3 rounded-full bg-folha px-5 py-2 text-sm font-medium hover:bg-folha-escura"
          >
            Reservar mesa
          </a>
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
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-lg"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#reservar"
            onClick={() => setMenuOpen(false)}
            className="mt-3 block rounded-full bg-folha py-3 text-center font-medium"
          >
            Reservar mesa
          </a>
        </nav>
      )}
    </header>
  );
}
