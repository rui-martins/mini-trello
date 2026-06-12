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
