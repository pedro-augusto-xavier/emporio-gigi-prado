# Deploy

Mesma arquitetura gratuita de **Neon + Render + Vercel**: um `git push` na `main` publica sozinho.

| Peça | Onde | Plano |
|---|---|---|
| Banco PostgreSQL | [Neon](https://neon.tech) | free |
| API (Docker) | [Render](https://render.com) | free (dorme sem uso; a 1ª requisição demora ~1 min) |
| Site (fase 3) | [Vercel](https://vercel.com) | free |

## 1. Banco no Neon

1. Crie uma conta no Neon (pode entrar com o GitHub) e um projeto chamado `gigi`, região **São Paulo** se houver.
2. Em **Connection Details**, copie a connection string **sem pooler** (o host *não* tem `-pooler`).
   Ela parece com `postgresql://usuario:senha@ep-xxx.sa-east-1.aws.neon.tech/neondb?sslmode=require`.
3. Guarde essa string: ela é a senha do banco. **Nunca** coloque no git.

## 2. API no Render

1. Crie uma conta no Render com o GitHub e clique em **New → Blueprint**.
2. Escolha o repositório `TRABALHO-RESTAURANTE-GIGI-`. O Render lê o [render.yaml](../render.yaml).
3. Ele vai pedir as variáveis que não ficam no git:
   - `DATABASE_URL`: a string do Neon
   - `CORS_ORIGIN`: o endereço do site na Vercel (enquanto não existir, use `http://localhost:5173`)
4. Ao terminar, teste `https://gigi-api.onrender.com/api/health`; tem que responder `{"status":"ok"}`.
   As tabelas são criadas sozinhas (migrações rodam a cada deploy).

### Criar o admin e o cardápio no banco de produção

No seu computador, aponte o seed para o Neon **só uma vez** (sem salvar no `.env`):

```bash
# PowerShell
$env:DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
$env:SEED_ADMIN_EMAIL="email-da-gigi@exemplo.com"
$env:SEED_ADMIN_PASSWORD="uma-senha-forte-de-verdade"
npm exec -w apps/api -- tsx src/db/seed.ts
```

## 3. Site na Vercel (fase 3)

O site vai repassar `/api/*` para o Render pela própria Vercel (rewrite). Assim navegador, site e API
ficam no mesmo endereço e o cookie de login continua `SameSite=Strict`.

## Rodando em outro computador

O git guarda o **código** e a **estrutura do banco** (migrações em `apps/api/drizzle/`), nunca os dados.

```bash
git clone https://github.com/pedro-augusto-xavier/TRABALHO-RESTAURANTE-GIGI-.git
cd TRABALHO-RESTAURANTE-GIGI-
npm install
cp .env.example .env
npm run db:seed -w apps/api   # cria o banco local com admin, mesas e cardápio
npm run dev:api
```
