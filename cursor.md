# Projeto Rocha Fashion — Guia para o Cursor

## Visão geral

**Rocha Fashion** é um monorepo para controle de empréstimos, com frontend React e backend Node/Express, usando Supabase como banco e autenticação.

- **Nome do pacote raiz:** `loantrack`
- **Apps:** `apps/frontend`, `apps/backend`
- **Pacotes compartilhados:** `packages/shared` (schemas Zod e tipos)

---

## Estrutura do repositório

```
Projeto-Leo/
├── apps/
│   ├── frontend/          # React + Vite + Tailwind
│   │   └── src/
│   │       ├── components/   # UI (Radix), layout
│   │       ├── contexts/     # Auth, Theme
│   │       ├── lib/          # api.ts, mock
│   │       └── pages/
│   └── backend/           # Express + TypeScript
│       └── src/
│           ├── modules/   # auth, clients, loans, installments, dashboard, alerts, reports, transactions
│           ├── jobs/     # alertCron
│           ├── lib/      # supabase
│           ├── middleware/
│           └── utils/
├── packages/
│   └── shared/           # Schemas Zod e tipos compartilhados
│       └── src/index.ts
├── package.json          # workspaces, scripts dev/build
└── .env                  # variáveis de ambiente (raiz)
```

---

## Stack técnico

| Camada      | Tecnologias |
|------------|-------------|
| Frontend   | React 18, Vite 6, TypeScript, Tailwind, Radix UI, TanStack Query, React Hook Form, Zod, Recharts, React Router |
| Backend    | Node, Express, TypeScript, Supabase (JS client), JWT, bcrypt, Zod, node-cron |
| Compartilhado | Zod (schemas de auth, clients, loans, installments, etc.) |
| Banco/Auth | Supabase (PostgreSQL + Auth) |

---

## Scripts principais

- **Desenvolvimento:** `npm run dev` (sobe backend e frontend com `concurrently`)
- **Apenas frontend:** `npm run dev:frontend` → Vite em `http://localhost:5173`
- **Apenas backend:** `npm run dev:backend` → API em `http://localhost:3001`
- **Build:** `npm run build:frontend`, `npm run build:backend`

O frontend faz proxy de `/api` para `http://localhost:3001`, então as chamadas são feitas para `/api/...`.

---

## Convenções de código

1. **Alias no frontend:** `@/` aponta para `apps/frontend/src` (definido em `vite.config.ts`).
2. **Schemas e tipos:** Usar e estender os schemas em `packages/shared/src/index.ts` (Zod); evitar duplicar validações.
3. **Backend:** Um módulo por domínio em `apps/backend/src/modules/<nome>/` (ex.: `controller.ts`, `routes.ts`).
4. **Idioma:** Comentários, commits e mensagens para o usuário em **português (pt-BR)**.
5. **Tamanho de arquivo:** Preferir arquivos com até 200–300 linhas; acima disso, dividir em arquivos ou funções menores.

---

## Ambiente e variáveis

- O `.env` fica na **raiz** do projeto. O backend carrega com `dotenv.config({ path: '../../.env' })`.
- **Backend:** `PORT` (padrão 3001), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL` (produção).
- **Frontend:** variáveis `VITE_*` se necessário; em dev usa proxy para a API.
- **Não sobrescrever o `.env`** sem perguntar e confirmar com o usuário.

---

## API e autenticação

- **Backend:** Rotas em `/api/auth`, `/api/clients`, `/api/loans`, `/api/installments`, `/api/dashboard`, `/api/alerts`, `/api/reports`, `/api/transactions`. Health: `GET /api/health`.
- **Frontend:** Cliente central em `apps/frontend/src/lib/api.ts`. Interceptor adiciona `Authorization: Bearer <token>`; em 401 limpa token e redireciona para `/login`.
- **Mock:** Em `api.ts` existe `USE_MOCK_API`; quando `true`, usa mocks em vez da API real. Em dev/test pode ser útil; em prod deve usar a API real.

---

## Supabase

- Cliente server-side em `apps/backend/src/lib/supabase.ts` (usa `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`).
- O projeto tem MCP do Supabase configurado (ex.: `user-supabase`); pode-se usar ferramentas como `get_project_url`, `list_tables`, `execute_sql`, `apply_migration`, etc., conforme o contexto.

---

## Regras gerais para o assistente

- Responder em **pt-BR**.
- Preferir soluções simples e evitar duplicação; checar se já existe lógica similar no projeto.
- Considerar ambientes **dev**, **test** e **prod** ao sugerir mudanças.
- Ao corrigir bugs, priorizar a stack atual; se introduzir novo padrão/tecnologia, remover o antigo para não deixar lógica duplicada.
- Não simular dados em dev/prod; mocks apenas para testes quando fizer sentido.
- Em commits na main: mensagens humanizadas, sem prefixo “FEAT:”; se já houver versão exposta, incrementar a versão antes do commit.

---

## Referência rápida

| O que fazer | Onde olhar |
|-------------|------------|
| Validação de formulários / tipos | `packages/shared/src/index.ts` |
| Chamadas HTTP no frontend | `apps/frontend/src/lib/api.ts` |
| Rotas e controllers do backend | `apps/backend/src/modules/*` e `apps/backend/src/index.ts` |
| Cliente Supabase no backend | `apps/backend/src/lib/supabase.ts` |
| Rotas e layout do app | `apps/frontend/src/App.tsx`, `AppShell` |
| Autenticação no frontend | `apps/frontend/src/contexts/AuthContext.tsx` |
