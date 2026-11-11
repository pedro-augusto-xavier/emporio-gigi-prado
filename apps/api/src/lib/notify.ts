import type { Env } from '../env.js';

/** Manda um aviso de texto para o celular da dona do restaurante. */
export type Notifier = (text: string) => Promise<void>;

/**
 * Aviso pelo WhatsApp usando o CallMeBot (https://www.callmebot.com).
 * Sem CALLMEBOT_PHONE e CALLMEBOT_APIKEY configurados, não manda nada.
 */
export function createWhatsAppNotifier(env: Env): Notifier {
  const { CALLMEBOT_PHONE: phone, CALLMEBOT_APIKEY: apikey } = env;
  if (!phone || !apikey) return async () => {};

  return async (text) => {
    const url = new URL('https://api.callmebot.com/whatsapp.php');
    url.search = new URLSearchParams({ phone, text, apikey }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`CallMeBot respondeu ${response.status}`);
  };
}
