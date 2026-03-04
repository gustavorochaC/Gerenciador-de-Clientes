# LoanTrack 💰

Sistema de Gestão de Empréstimos Pessoais — uma aplicação SaaS completa para gerenciar empréstimos a clientes.

## Tecnologias

### Frontend
- **Vite + React** (TypeScript)
- **Tailwind CSS** + **shadcn/ui**
- **React Router DOM v6** — Roteamento
- **TanStack Query** — Estado do servidor
- **Recharts** — Gráficos
- **jsPDF** — Geração de PDFs
- **Lucide React** — Ícones
- **Sonner** — Notificações toast

### Backend
- **Node.js + Express** (TypeScript)
- **Supabase** (PostgreSQL) via `@supabase/supabase-js`
- **Supabase Auth** — Login (backend chama Supabase e devolve token)
- **node-cron** — Job agendado
- **Helmet** — Segurança
- **express-rate-limit** — Rate limiting

## Estrutura do Projeto

```
Projeto-Leo/
├── apps/
│   ├── frontend/          # Vite + React
│   └── backend/           # Express + TypeScript
├── packages/
│   └── shared/            # Schemas Zod compartilhados
├── supabase/
│   ├── migrations/        # SQL de migração
│   └── seed.sql           # Dados iniciais (admin)
├── .env.example
└── README.md
```

## Configuração

### 1. Clonar e instalar dependências

```bash
npm install
cd apps/frontend && npm install
cd ../backend && npm install
cd ../../packages/shared && npm install
```

### 2. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrações em `supabase/migrations/` no SQL Editor (001, 002, 003).
3. Crie o primeiro usuário em **Authentication > Users > Add user** (email e senha). Esse usuário será usado para login no app.

### 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
SUPABASE_JWT_SECRET=seu-jwt-secret-do-painel-supabase
PORT=3001
```

### 4. Executar

```bash
# Backend
cd apps/backend && npm run dev

# Frontend (em outro terminal)
cd apps/frontend && npm run dev
```

Acesse: http://localhost:5173

### 5. Login

Use o email e a senha do usuário criado no Supabase (Authentication > Users). O login é feito pelo backend, que valida as credenciais no Supabase Auth e devolve o token. O backend valida o token nas rotas protegidas via API do Supabase (`getUser`), **sem precisar** de `SUPABASE_JWT_SECRET`.

### 6. Teste do fluxo de login (backend + frontend)

1. Execute a migração `003_supabase_auth_users.sql` no SQL Editor do Supabase (para FKs apontarem para `auth.users`).
2. Crie um usuário em **Authentication > Users > Add user** (email e senha).
3. Inicie o backend: `cd apps/backend && npm run dev`.
4. Inicie o frontend: `cd apps/frontend && npm run dev`.
5. Acesse http://localhost:5173/login e faça login com o email e a senha do usuário criado.

## Funcionalidades

- ✅ Dashboard com KPIs e gráficos
- ✅ CRUD completo de clientes
- ✅ CRUD de empréstimos com cálculo automático de juros simples
- ✅ Geração automática de parcelas
- ✅ Registro de pagamentos (total e parcial)
- ✅ Alertas automáticos de vencimento e atraso (cron diário)
- ✅ Relatórios em PDF (geral e por cliente)
- ✅ Modo escuro/claro
- ✅ Totalmente responsivo (mobile-first)
- ✅ Toda a interface em Português Brasileiro
- ✅ Fonte Satoshi aplicada globalmente
