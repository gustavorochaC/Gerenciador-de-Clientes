# Deploy na Vercel (Backend + Frontend)

O repositório tem **backend** (`apps/backend`) e **frontend** (`apps/frontend`). Na Vercel você usa **dois projetos** no mesmo repositório, cada um com um **Root Directory** diferente. Assim tudo fica “junto” no mesmo repo; você só cria os dois projetos na Vercel.

---

## 1. Backend (você já fez)

- **Repositório:** `gustavorochaC/Gerenciador-de-Clientes`
- **Root Directory:** `apps/backend`
- **Preset:** Express
- **Build Command:** `npm run build`
- **Variáveis:** `SUPABASE_*`, `CRON_SECRET`, `FRONTEND_URL` (opcional)

URL do backend (exemplo): `https://gerenciador-de-clientes-backend.vercel.app`

---

## 2. Frontend (segundo projeto)

1. No dashboard da Vercel: **Add New Project**.
2. **Import** o mesmo repositório: `gustavorochaC/Gerenciador-de-Clientes`.
3. **Root Directory:** clique em **Edit** e escolha **`apps/frontend`**.
4. **Project Name:** ex. `gerenciador-de-clientes` (ou o nome que quiser).
5. **Framework Preset:** Vite (deve detectar sozinho).
6. **Build Command:** `npm run build` (padrão).
7. **Variáveis de ambiente** – adicione:
   - **`VITE_API_URL`** = `https://gerenciador-de-clientes-backend.vercel.app`  
     (troque pela URL real do seu projeto backend na Vercel.)
8. **Deploy.**

Depois do deploy, a **URL do app** será a do projeto do frontend (ex.: `https://gerenciador-de-clientes.vercel.app`). É essa URL que você abre para usar o sistema.

---

## 3. Ligar backend e frontend

- **No projeto do backend** (Vercel):  
  Variável **`FRONTEND_URL`** = URL do frontend (ex.: `https://gerenciador-de-clientes.vercel.app`).  
  Assim o CORS e o link “Abrir aplicação” na página inicial da API funcionam.
- **No projeto do frontend:**  
  **`VITE_API_URL`** = URL do backend (ex.: `https://gerenciador-de-clientes-backend.vercel.app`).

---

## Resumo

| O que              | Onde                         |
|--------------------|------------------------------|
| Repositório        | Um só (Gerenciador-de-Clientes) |
| Projetos na Vercel | Dois (backend + frontend)    |
| Backend            | Root: `apps/backend`          |
| Frontend           | Root: `apps/frontend`        |
| URL para o usuário| Sempre a URL do **frontend** |

Não dá para ter “um único projeto” na Vercel que sirva backend (Express) e frontend (Vite) ao mesmo tempo; por isso são dois projetos, mesmo repo, duas pastas. Para você é “tudo junto” no código; na Vercel são dois deploys.
