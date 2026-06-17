import { z } from 'zod';

// Schema Zod para validar dados de registo
// Define as regras que os dados devem cumprir:
// - name: string com mínimo 2 caracteres
// - email: string válida como email
// - password: string com mínimo 6 caracteres
// Se algum campo não cumprir, Zod lança um erro automático
export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password deve ter pelo menos 6 caracteres'),
});

// Schema Zod para validar dados de login
// - email: string válida como email
// - password: string obrigatória (pode ser qualquer tamanho, é validado na BD)
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password obrigatória'),
});

// Schema para criação de boards
export const createBoardSchema = z.object({
  title: z.string().min(1, 'Título do board é obrigatório'),
});

// Schema para criação de listas
export const createListSchema = z.object({
  title: z.string().min(1, 'Título da lista é obrigatório'),
});

// Schema para atualizar lista
export const updateListSchema = z.object({
  title: z.string().min(1, 'Título da lista é obrigatório').optional(),
  position: z.number().int().optional(),
});

// Schema para criação de cartões
export const createCardSchema = z.object({
  title: z.string().min(1, 'Título do cartão é obrigatório'),
  description: z.string().optional(),
});

// Schema para atualizar cartão
export const updateCardSchema = z.object({
  title: z.string().min(1, 'Título do cartão é obrigatório').optional(),
  description: z.string().optional(),
  position: z.number().int().optional(),
});

// Schema para mover cartão entre listas
export const moveCardSchema = z.object({
  newListId: z.string().uuid('ID da lista inválido'),
  newPosition: z.number().int().min(0, 'Posição deve ser >= 0'),
});
