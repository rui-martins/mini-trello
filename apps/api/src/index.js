import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Carregar .env do workspace root (quando o processo é iniciado em apps/api)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import express from 'express';
import cors from 'cors';
import { register, login, authenticate } from './auth.js';
import prisma from './db.js';
import { createBoardSchema, createListSchema, updateListSchema, createCardSchema, updateCardSchema, moveCardSchema } from './schemas.js';
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

// === ROTAS DE LISTAS ===

// Criar uma nova lista num board
app.post('/boards/:boardId/lists', authenticate, async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const body = createListSchema.parse(req.body);

    // Verificar se o board existe e pertence ao utilizador
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { ownerId: true },
    });
    if (!board) return next(new AppError(404, 'Board não encontrado'));
    if (board.ownerId !== req.userId) return next(new AppError(403, 'Acesso proibido'));

    // Contar listas existentes para definir a posição
    const listsCount = await prisma.list.count({
      where: { boardId },
    });

    const list = await prisma.list.create({
      data: {
        title: body.title,
        boardId,
        position: listsCount,
      },
      select: { id: true, title: true, position: true },
    });
    return res.status(201).json(list);
  } catch (err) {
    return next(err);
  }
});

// Listar todas as listas de um board
app.get('/boards/:boardId/lists', authenticate, async (req, res, next) => {
  try {
    const { boardId } = req.params;

    // Verificar se o board existe e pertence ao utilizador
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { ownerId: true },
    });
    if (!board) return next(new AppError(404, 'Board não encontrado'));
    if (board.ownerId !== req.userId) return next(new AppError(403, 'Acesso proibido'));

    const lists = await prisma.list.findMany({
      where: { boardId },
      select: { id: true, title: true, position: true },
      orderBy: { position: 'asc' },
    });
    return res.json(lists);
  } catch (err) {
    return next(err);
  }
});

// Atualizar uma lista
app.patch('/boards/:boardId/lists/:listId', authenticate, async (req, res, next) => {
  try {
    const { boardId, listId } = req.params;
    const body = updateListSchema.parse(req.body);

    // Verificar autorização
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { ownerId: true },
    });
    if (!board) return next(new AppError(404, 'Board não encontrado'));
    if (board.ownerId !== req.userId) return next(new AppError(403, 'Acesso proibido'));

    const list = await prisma.list.update({
      where: { id: listId, boardId },
      data: body,
      select: { id: true, title: true, position: true },
    });
    return res.json(list);
  } catch (err) {
    if (err.code === 'P2025') return next(new AppError(404, 'Lista não encontrada'));
    return next(err);
  }
});

// Deletar uma lista
app.delete('/boards/:boardId/lists/:listId', authenticate, async (req, res, next) => {
  try {
    const { boardId, listId } = req.params;

    // Verificar autorização
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { ownerId: true },
    });
    if (!board) return next(new AppError(404, 'Board não encontrado'));
    if (board.ownerId !== req.userId) return next(new AppError(403, 'Acesso proibido'));

    await prisma.list.delete({
      where: { id: listId, boardId },
    });
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return next(new AppError(404, 'Lista não encontrada'));
    return next(err);
  }
});

// === ROTAS DE CARTÕES ===

// Criar um novo cartão numa lista
app.post('/boards/:boardId/lists/:listId/cards', authenticate, async (req, res, next) => {
  try {
    const { boardId, listId } = req.params;
    const body = createCardSchema.parse(req.body);

    // Verificar se o board existe e pertence ao utilizador
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { ownerId: true },
    });
    if (!board) return next(new AppError(404, 'Board não encontrado'));
    if (board.ownerId !== req.userId) return next(new AppError(403, 'Acesso proibido'));

    // Verificar se a lista existe no board
    const list = await prisma.list.findUnique({
      where: { id: listId, boardId },
    });
    if (!list) return next(new AppError(404, 'Lista não encontrada'));

    // Contar cartões existentes para definir a posição
    const cardsCount = await prisma.card.count({
      where: { listId },
    });

    const card = await prisma.card.create({
      data: {
        title: body.title,
        description: body.description || null,
        listId,
        position: cardsCount,
      },
      select: { id: true, title: true, description: true, position: true },
    });
    return res.status(201).json(card);
  } catch (err) {
    return next(err);
  }
});

// Listar todos os cartões de uma lista
app.get('/boards/:boardId/lists/:listId/cards', authenticate, async (req, res, next) => {
  try {
    const { boardId, listId } = req.params;

    // Verificar se o board existe e pertence ao utilizador
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { ownerId: true },
    });
    if (!board) return next(new AppError(404, 'Board não encontrado'));
    if (board.ownerId !== req.userId) return next(new AppError(403, 'Acesso proibido'));

    const cards = await prisma.card.findMany({
      where: { listId },
      select: { id: true, title: true, description: true, position: true },
      orderBy: { position: 'asc' },
    });
    return res.json(cards);
  } catch (err) {
    return next(err);
  }
});

// Atualizar um cartão
app.patch('/boards/:boardId/lists/:listId/cards/:cardId', authenticate, async (req, res, next) => {
  try {
    const { boardId, listId, cardId } = req.params;
    const body = updateCardSchema.parse(req.body);

    // Verificar autorização
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { ownerId: true },
    });
    if (!board) return next(new AppError(404, 'Board não encontrado'));
    if (board.ownerId !== req.userId) return next(new AppError(403, 'Acesso proibido'));

    const card = await prisma.card.update({
      where: { id: cardId, listId },
      data: body,
      select: { id: true, title: true, description: true, position: true },
    });
    return res.json(card);
  } catch (err) {
    if (err.code === 'P2025') return next(new AppError(404, 'Cartão não encontrado'));
    return next(err);
  }
});

// Deletar um cartão
app.delete('/boards/:boardId/lists/:listId/cards/:cardId', authenticate, async (req, res, next) => {
  try {
    const { boardId, listId, cardId } = req.params;

    // Verificar autorização
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { ownerId: true },
    });
    if (!board) return next(new AppError(404, 'Board não encontrado'));
    if (board.ownerId !== req.userId) return next(new AppError(403, 'Acesso proibido'));

    await prisma.card.delete({
      where: { id: cardId, listId },
    });
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return next(new AppError(404, 'Cartão não encontrado'));
    return next(err);
  }
});

// Mover um cartão para outra lista
app.post('/boards/:boardId/cards/:cardId/move', authenticate, async (req, res, next) => {
  try {
    const { boardId, cardId } = req.params;
    const body = moveCardSchema.parse(req.body);
    const { newListId, newPosition } = body;

    // Verificar autorização
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { ownerId: true },
    });
    if (!board) return next(new AppError(404, 'Board não encontrado'));
    if (board.ownerId !== req.userId) return next(new AppError(403, 'Acesso proibido'));

    // Verificar se o cartão existe
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { listId: true },
    });
    if (!card) return next(new AppError(404, 'Cartão não encontrado'));

    // Verificar se a nova lista existe no mesmo board
    const newList = await prisma.list.findUnique({
      where: { id: newListId, boardId },
    });
    if (!newList) return next(new AppError(404, 'Lista de destino não encontrada'));

    // Atualizar o cartão com a nova lista e posição
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        listId: newListId,
        position: newPosition,
      },
      select: { id: true, title: true, description: true, position: true, listId: true },
    });

    return res.json(updatedCard);
  } catch (err) {
    if (err.code === 'P2025') return next(new AppError(404, 'Cartão ou lista não encontrado'));
    return next(err);
  }
});

// Error handler: centraliza respostas de erro em JSON usando `AppError`
app.use((err, _req, res, _next) => {
  // Erros de parse de JSON (body-parser) — devolvemos 400
  if (err && (err.type === 'entity.parse.failed' || err.status === 400 || err.statusCode === 400)) {
    return res.status(400).json({ error: 'JSON inválido' });
  }

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

// Rotas implementadas para listas e cartões
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`mini-trello-api a escutar em http://0.0.0.0:${PORT}`);
});

// Permitir reutilizar a porta imediatamente após encerramento
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} já está em uso`);
    process.exit(1);
  }
});

// Graceful shutdown para fechar a porta corretamente
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});
