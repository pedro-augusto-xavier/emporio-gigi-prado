import { Link } from 'react-router';
import { whatsappLink } from '../config';
import { WhatsAppIcon } from './icons';

/**
 * Barra fixa no rodapé da tela, só no celular: as três ações mais usadas
 * ficam sempre ao alcance do polegar. No computador o botão flutuante do WhatsApp faz esse papel.
 */
export function MobileActionBar() {
  return (
    <nav
      aria-label="Ações rápidas"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-madeira/10 bg-creme/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(42,29,22,0.12)] backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <Link
          to="/#reservar"
          className="flex h-12 items-center justify-center rounded-full bg-folha text-[15px] font-semibold text-creme active:bg-folha-escura"
        >
          Reservar mesa
        </Link>
        <Link
          to="/cardapio"
          className="flex h-12 items-center justify-center rounded-full border-2 border-madeira text-[15px] font-semibold text-madeira active:bg-madeira active:text-creme"
        >
          Cardápio
        </Link>
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noreferrer"
          aria-label="Conversar no WhatsApp"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white active:brightness-95"
        >
          <WhatsAppIcon className="h-6 w-6" />
        </a>
      </div>
    </nav>
  );
}
