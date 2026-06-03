# Mini-Trello

Projeto integrador do estágio full-stack (Semanas 6-8). A spec completa está em `spec_mini_trello.docx`.

## Pré-requisitos

Instalar localmente, na vossa máquina:

- **Node.js 24 LTS** — https://nodejs.org/
- **PostgreSQL 18** — https://www.postgresql.org/download/
- **Git**

Confirmem com:

```bash
node --version    # deve dizer v24.x
psql --version    # deve dizer 18.x
```

## Estrutura do monorepo

```
apps/
├── api/   # Backend: Express + JavaScript (ESM) + Prisma
└── web/   # Frontend: Vite + React + JavaScript (ESM) + Tailwind
```

Cada app é independente — tem o seu próprio `package.json`, `node_modules` e `npm install`. Não há workspaces.

## Setup inicial

### 1. Criar base de dados local

Abrir `psql` (ou pgAdmin) e correr:

```sql
CREATE DATABASE mini_trello;
```

### 2. Backend

```bash
cd apps/api
cp .env.example .env
# editar .env: preencher DATABASE_URL com utilizador/password da vossa Postgres
npm install
npm run dev
```

A API arranca em `http://localhost:3000`. Confirmem com `curl http://localhost:3000/health` — deve devolver `{"ok":true}`.

### 3. Frontend

Num terminal separado:

```bash
cd apps/web
npm install
npm run dev
```

O FE arranca em `http://localhost:5173`. Abram no browser — devem ver "API health: OK". Se aparecer "falhou", a API não está a responder.

## Como o FE fala com o BE

Em desenvolvimento, o Vite proxy reencaminha tudo o que comece por `/api` para `http://localhost:3000`. Quer dizer que no código FE escrevem `fetch('/api/boards')` e funciona em local e em produção, sem `if (env === 'dev')`.

## O que está pronto vs o que vão criar

### Já configurado (não precisam de tocar, salvo necessidade real)

- JavaScript (ESM) em ambos os apps — sem passo de compilação
- ESLint + Prettier configurados
- Vite com proxy `/api` → backend
- Tailwind CSS v4 no FE
- Express + `node --watch` no BE com hot reload
- Todas as dependências da stack instaladas: `@dnd-kit`, `react-router-dom`, `prisma`, `@prisma/client`, `zod`, `jsonwebtoken`, `bcrypt`, `cors`, etc.
- Health check FE↔BE como prova de que a tubagem funciona

### A vossa parte (criar de raiz, na ordem das User Stories)

- `prisma/schema.prisma` com User, Board, List, Card — ler secção 4 da spec
- Primeira migração: `npx prisma migrate dev --name init`
- Endpoints `/auth/register` e `/auth/login`
- Middleware JWT para proteger as rotas
- Schemas Zod para validação
- Endpoints de boards, lists, cards
- Telas `/login`, `/register`, `/dashboard`, `/boards/:id`
- Drag-and-drop com `@dnd-kit/sortable`
- Tudo o que aparece nas user stories US-01 a US-08

## Comandos úteis

| App | Comando | O que faz |
|-----|---------|-----------|
| api | `npm run dev` | Arranca a API com hot reload |
| api | `npm start` | Arranca a API sem watch (`node src/index.js`) |
| api | `npm run lint` | Corre ESLint |
| api | `npx prisma migrate dev` | Aplica migrações novas à BD |
| api | `npx prisma studio` | UI web para inspecionar a BD |
| web | `npm run dev` | Arranca o frontend |
| web | `npm run build` | Build de produção para `dist/` |
| web | `npm run lint` | Corre ESLint |

## Workflow GitLab

1. Criar branch `feature/us-XX-descricao` (ex: `feature/us-01-register`)
2. Commits pequenos e descritivos
3. Abrir MR para `main` com a descrição da US
4. Esperar revisão do par e/ou mentor
5. Merge depois da pipeline verde
