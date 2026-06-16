import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { register, login, authenticate } from './auth.js';
import prisma from './db.js';
import { createBoardSchema } from './schemas.js';
import AppError from './errors.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'mini-trello-api' });
});

app.post('/auth/register', register);
app.post('/auth/login', login);

// Criar um novo board (autenticado)
app.post('/boards', authenticate, async (req, res, next) => {
  try {
    const body = createBoardSchema.parse(req.body);
    const board = await prisma.board.create({
      data: { title: body.title, ownerId: req.userId },
      select: { id: true, title: true },
    });
    return res.status(201).json(board);
  } catch (err) {
    return next(err);
  }
});

// Listar boards do utilizador autenticado
app.get('/boards', authenticate, async (req, res, next) => {
  try {
    const boards = await prisma.board.findMany({
      where: { ownerId: req.userId },
      select: { id: true, title: true },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(boards);
  } catch (err) {
    return next(err);
  }
});

// Obter detalhes de um board (inclui título) — apenas owner pode ver
app.get('/boards/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const board = await prisma.board.findUnique({
      where: { id },
      select: { id: true, title: true, ownerId: true },
    });
    if (!board) return next(new AppError(404, 'Board não encontrado'));
    if (board.ownerId !== req.userId) return next(new AppError(403, 'Acesso proibido'));
    return res.json({ id: board.id, title: board.title });
  } catch (err) {
    return next(err);
  }
});

// As rotas de boards, lists e cards são adicionadas pelos estagiários
// à medida que cada user story for sendo implementada.

// Error handler: centraliza respostas de erro em JSON usando `AppError`
app.use((err, _req, res, _next) => {
  // Zod validation errors (thrown by schema.parse)
  if (err && err.name === 'ZodError') {
    return res.status(400).json({ error: err.errors[0].message });
  }

  // AppError => usamos o status definido
  if (err && err.name === 'AppError') {
    return res.status(err.status || 500).json({ error: err.message });
  }

  // Fallback: log e 500
  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`mini-trello-api a escutar em http://localhost:${PORT}`);
});
