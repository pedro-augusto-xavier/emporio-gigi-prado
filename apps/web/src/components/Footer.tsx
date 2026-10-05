import { Link } from 'react-router';
import { instagramLink, mapsLink, openingHours, restaurant, whatsappLink } from '../config';
import { InstagramIcon, PinIcon, WhatsAppIcon } from './icons';
import { Logo } from './Logo';

const navLinks = [
  { to: '/cardapio', label: 'Cardápio' },
  { to: '/#especialidades', label: 'Especialidades' },
  { to: '/#bebidas', label: 'Bebidas' },
  { to: '/#eventos', label: 'Eventos e música' },
  { to: '/#avaliacoes', label: 'Avaliações' },
  { to: '/#reservar', label: 'Reservas' },
  { to: '/#duvidas', label: 'Dúvidas' },
];

function ColumnTitle({ children }: { children: string }) {
  return <h2 className="text-sm font-semibold tracking-[0.2em] uppercase">{children}</h2>;
}

export function Footer() {
  return (
    <footer id="contato" className="scroll-mt-24 bg-madeira-escura text-creme">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.3fr_0.8fr_1fr_1.3fr]">
        <div>
          <Logo className="items-start" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-creme/75">
            Restaurante e empório em meio ao verde de Mury, Nova Friburgo. Pratos da casa, sobremesas e encomendas de
            pães, bolos, tortas, quiches, sopas e caldos.
          </p>
        </div>

        <div>
          <ColumnTitle>Navegue</ColumnTitle>
          <ul className="mt-5 space-y-3">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-creme/85 hover:text-palha">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ColumnTitle>Horário</ColumnTitle>
          <ul className="mt-5 space-y-2 text-sm">
            {openingHours.map((row) => (
              <li key={row.days} className="flex justify-between gap-4 text-creme/85">
                <span>{row.days}</span>
                <span className={row.hours === 'Fechado' ? 'text-creme/50' : ''}>{row.hours}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ColumnTitle>Contato</ColumnTitle>
          <ul className="mt-5 space-y-4 text-creme/85">
            <li>
              <a href={whatsappLink()} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-palha">
                <WhatsAppIcon className="h-4 w-4 shrink-0" /> {restaurant.whatsappDisplay}
              </a>
            </li>
            <li>
              <a href={instagramLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-palha">
                <InstagramIcon className="h-4 w-4 shrink-0" /> @{restaurant.instagramHandle}
              </a>
            </li>
            <li>
              <a href={mapsLink} target="_blank" rel="noreferrer" className="flex gap-3 hover:text-palha">
                <PinIcon className="mt-1 h-4 w-4 shrink-0" />
                <span className="text-sm leading-relaxed">{restaurant.address}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t border-creme/10 py-5 text-center text-xs text-creme/50">
        © {new Date().getFullYear()} {restaurant.name}. Fotos ilustrativas de pratos: Unsplash.
      </p>
    </footer>
  );
}
