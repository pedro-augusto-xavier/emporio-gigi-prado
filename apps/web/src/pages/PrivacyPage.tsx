import type { ReactNode } from 'react';
import { restaurant, whatsappLink } from '../config';

// TODO: rascunho baseado no que o sistema faz (docs/LGPD.md). Revisar com a Gigi
// (e, se possível, com alguém da área jurídica) antes de publicar.
// Se o texto mudar, atualize também POLICY_VERSION em apps/api/src/modules/auth/session.ts.
const UPDATED_AT = '05/10/2026';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl font-semibold sm:text-3xl">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-madeira/85">{children}</div>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-36 pb-20 sm:px-6">
      <p className="text-sm tracking-[0.3em] text-folha uppercase">{restaurant.name}</p>
      <h1 className="mt-2 font-serif text-5xl font-semibold">Política de Privacidade</h1>
      <p className="mt-3 text-sm text-madeira/60">Atualizada em {UPDATED_AT}</p>

      <p className="mt-8 text-lg leading-relaxed">
        Levamos seus dados a sério. Aqui explicamos, de forma simples, quais informações pedimos no site, para que elas
        servem e quais são os seus direitos, de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018).
      </p>

      <Section title="Quais dados coletamos">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Na reserva:</strong> nome, telefone, e-mail (se você informar), dia, horário, número de pessoas e
            observações.
          </li>
          <li>
            <strong>Nos pedidos</strong> (quando estiverem disponíveis no site): nome, telefone, endereço de entrega e os
            itens pedidos.
          </li>
          <li>
            <strong>Se você criar uma conta:</strong> nome, e-mail, telefone e senha. A senha é guardada de forma
            embaralhada e nem nós conseguimos vê-la.
          </li>
        </ul>
        <p>Não pedimos CPF nem dados de cartão no site.</p>
      </Section>

      <Section title="Para que usamos">
        <p>
          Só para organizar sua reserva ou seu pedido e falar com você sobre eles (por exemplo, se precisarmos mudar
          algo). Promoções, só se você autorizar, e você pode desistir a qualquer momento.
        </p>
        <p>Não vendemos nem compartilhamos seus dados com outras empresas para fins de propaganda.</p>
      </Section>

      <Section title="Por quanto tempo guardamos">
        <p>
          Pelo tempo necessário para atender você. Se você pedir a exclusão, apagamos seus dados pessoais e mantemos só o
          registro anônimo da reserva ou do pedido (por exemplo, "4 pessoas no dia 10"), que serve para a organização do
          restaurante.
        </p>
      </Section>

      <Section title="Como protegemos">
        <p>
          O site usa conexão segura (HTTPS), o acesso ao sistema é restrito à equipe do restaurante e registramos quem
          mexe em cada informação.
        </p>
      </Section>

      <Section title="Seus direitos">
        <p>Você pode, a qualquer momento:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>saber quais dados seus nós temos e receber uma cópia;</li>
          <li>corrigir dados errados ou desatualizados;</li>
          <li>pedir que seus dados sejam apagados;</li>
          <li>retirar uma autorização que você deu (como receber promoções).</li>
        </ul>
        <p>
          Para isso, fale com a gente pelo{' '}
          <a
            href={whatsappLink('Olá! Gostaria de falar sobre os meus dados pessoais (LGPD).')}
            target="_blank"
            rel="noreferrer"
            className="text-folha underline"
          >
            WhatsApp {restaurant.whatsappDisplay}
          </a>
          . Respondemos o quanto antes.
        </p>
      </Section>

      <Section title="Quem é responsável">
        <p>
          {restaurant.name}, {restaurant.address}.
        </p>
      </Section>
    </div>
  );
}
