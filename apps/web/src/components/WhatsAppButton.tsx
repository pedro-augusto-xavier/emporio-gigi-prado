import { whatsappLink } from '../config';
import { WhatsAppIcon } from './icons';

/** Botão fixo no canto da tela, como no site de referência. */
export function WhatsAppButton() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noreferrer"
      aria-label="Conversar no WhatsApp"
      className="fixed right-5 bottom-5 z-50 rounded-2xl bg-[#25D366] p-3 text-white shadow-xl transition-transform hover:scale-110"
    >
      <WhatsAppIcon className="h-8 w-8" />
    </a>
  );
}
