# Restaurante Gigi

Sistema do restaurante: cardápio, reservas online, pedidos para entrega/retirada e painel administrativo.

## Estrutura

```
apps/
  api/          Back-end: Node + TypeScript + Fastify + PostgreSQL (Drizzle ORM)
    src/
      modules/  auth, me (LGPD), menu, tables, reservations, orders
      db/       schema, migrações, seed
    drizzle/    migrações SQL geradas
    test/       testes (Vitest + PGlite, sem precisar de Docker)
docs/LGPD.md    como o sistema trata dados pessoais
```

## Roadmap

- [x] **Fase 1:** base da API, autenticação, segurança, LGPD, cardápio, mesas e reservas
- [x] **Fase 2:** pedidos para entrega e retirada, taxa definida ao confirmar, pagamento na entrega
- [ ] **Fase 3:** front-end (site do cliente + painel)
- [ ] **Fase 4:** deploy
- [ ] Taxa automática por distância (aguardando definição)
- [ ] Pagamento online (aguardando definição)

## Rodando no seu computador

Só precisa do **Node 22+**. Não precisa instalar banco de dados nem Docker: em desenvolvimento a API usa
um Postgres embutido, salvo na pasta `apps/api/.data`.

```bash
npm install
cp .env.example .env          # já vem pronto para desenvolvimento
npm run db:seed -w apps/api   # cria admin, mesas e cardápio de exemplo
npm run dev:api               # API em http://localhost:3333 (reinicia sozinha ao salvar)
npm test                      # roda todos os testes
```

Quer zerar o banco de desenvolvimento? Apague a pasta `apps/api/.data` e rode o seed de novo.

Mudou o `schema.ts`? Gere a migração com `npm run db:generate -w apps/api`.

### Com Docker (para produção)

O Docker empacota a API junto com um PostgreSQL de verdade, do mesmo jeito que vai rodar no servidor.
Só é necessário na hora do deploy.

```bash
docker compose up -d --build  # Postgres + API em http://localhost:3333
```

## Como funciona um pedido

1. O cliente monta o pedido (entrega ou retirada) e escolhe como vai pagar na entrega: dinheiro (com troco), cartão ou Pix.
2. O pedido chega como **pendente** no painel. Se for entrega, quem atende **define a taxa** ao confirmar.
3. O cliente acompanha pelo código e vê o total atualizado. Só consegue cancelar enquanto está pendente.
4. Status: pendente → confirmado → em preparo → pronto → saiu para entrega (anota o motoboy) → concluído.
   Dá para pular etapas; para cancelar é preciso um motivo, que o cliente vê.

Pedidos só são aceitos dentro do horário de funcionamento.

## API (resumo)

| Método | Rota | Quem |
|---|---|---|
| POST | `/api/auth/register` · `/login` · `/refresh` · `/logout` | público |
| GET/PATCH/DELETE | `/api/me` · GET `/api/me/export` · PUT `/api/me/consents` | logado |
| GET | `/api/menu` | público |
| GET | `/api/reservations/availability?date=AAAA-MM-DD&partySize=N` | público |
| POST | `/api/reservations` | público (com ou sem conta) |
| GET / POST | `/api/reservations/:code?phone=` · `/api/reservations/:code/cancel` | público (código + telefone) |
| GET | `/api/me/reservations` | logado |
| POST | `/api/orders` | público (com ou sem conta) |
| GET / POST | `/api/orders/:code?phone=` · `/api/orders/:code/cancel` | público (código + telefone) |
| GET | `/api/me/orders` | logado |
| * | `/api/admin/menu/*` · `/api/admin/tables` | admin (atendente: só disponibilidade) |
| GET / PATCH | `/api/admin/reservations?date=` · `/:id/status` | admin, atendente |
| GET / PATCH | `/api/admin/orders` (em aberto) · `?date=` · `/:id` · `/:id/status` | admin, atendente |

Horários de funcionamento e regras de reserva: [apps/api/src/config/restaurant.ts](apps/api/src/config/restaurant.ts).
