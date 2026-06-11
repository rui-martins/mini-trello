import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { register, login } from './auth.js';

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

app.listen(PORT, () => {
  console.log(`mini-trello-api a escutar em http://localhost:${PORT}`);
});
