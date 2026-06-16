import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from './db.js';
import { registerSchema, loginSchema } from './schemas.js';
import AppError from './errors.js';

// Lê a variável de ambiente JWT_SECRET (chave secreta para assinar tokens)
// Se não existir, usa 'dev-secret-key' como fallback (apenas para dev)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// Define o tempo de expiração do token JWT (obrigatoriamente 1 hora)
// Após 1h, o token expira e o utilizador tem que fazer login novamente
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1m';

export async function register(req, res, next) {
  try {
    // Valida os dados recebidos usando Zod (name, email, password)
    // Se falhar, lança um erro automaticamente
    const body = registerSchema.parse(req.body);

    // Procura se o email já existe na BD (evita emails duplicados)
    // findUnique usa o índice UNIQUE no email para fazer a busca eficientemente
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (existingUser) {
      return next(new AppError(409, 'Este email já está registado.'));
    }

    // Transforma a password em hash usando bcrypt (10 rounds de salt)
    // Nunca guardamos passwords em texto simples na BD
    // O hash é irreversível e único para cada password
    const passwordHash = await bcrypt.hash(body.password, 10);

    // Cria o novo utilizador na BD
    // select: escolhe quais campos devolver (não devolvemos passwordHash por segurança)
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Gera um token JWT que expira em 1h
    // O token contém o userId e é assinado com JWT_SECRET
    // O frontend guarda este token e envia-o em requests futuras para autenticação
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({ user, token });
  } catch (err) {
    // Trata erros de validação Zod
    if (err.name === 'ZodError') {
      return next(new AppError(400, err.errors[0].message));
    }
    return next(new AppError(500, 'Erro ao registar.'));
  }
}

export async function login(req, res, next) {
  try {
    // Valida os dados recebidos (email, password)
    const body = loginSchema.parse(req.body);

    // Procura o utilizador pela email na BD
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (!user) {
      return next(new AppError(401, 'Email ou password inválidos.'));
    }

    // Compara a password enviada com o hash guardado na BD
    // bcrypt.compare faz a comparação de forma segura
    // Devolve true se forem iguais, false caso contrário
    const isValidPassword = await bcrypt.compare(body.password, user.passwordHash);

    if (!isValidPassword) {
      return next(new AppError(401, 'Email ou password inválidos.'));
    }

    // Se chegou aqui, a password está correta
    // Gera um novo token JWT que expira em 1h
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    // Trata erros de validação Zod
    if (err.name === 'ZodError') {
      return next(new AppError(400, err.errors[0].message));
    }
    return next(new AppError(500, 'Erro ao fazer login.'));
  }
}

// Middleware simples para autenticar requests usando o token JWT
export function authenticate(req, _res, next) {
  try {
    const auth = req.headers?.authorization || '';
    if (!auth || !auth.startsWith('Bearer ')) {
      const err = new Error('Não autorizado');
      err.name = 'AppError';
      err.status = 401;
      throw err;
    }

    const token = auth.slice('Bearer '.length);
    const payload = jwt.verify(token, JWT_SECRET);
    // payload deve conter userId conforme gerado no register/login
    req.userId = payload.userId;
    return next();
  } catch (err) {
    const e = new Error('Token inválido ou expirado');
    e.name = 'AppError';
    e.status = 401;
    return next(e);
  }
}
