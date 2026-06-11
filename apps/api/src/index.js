import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { register, login } from './auth.js';
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
