// Chave onde guardamos a sessão do utilizador no localStorage
// Contém: { user: {...}, token: "JWT_TOKEN" }
const SESSION_KEY = 'mini-trello-session';

// Lê o utilizador guardado no localStorage
// Tenta fazer parse do JSON e devolve o utilizador (ou null se não existir)
function getStoredUser() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
    return session?.user ?? null;
  } catch {
    return null;
  }
}

// Lê o token JWT guardado no localStorage
// Este token é enviado ao backend em requests futuras para autenticação
function getStoredToken() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
    return session?.token ?? null;
  } catch {
    return null;
  }
}

// Guarda o utilizador e token no localStorage
// Isto permite ao utilizador manter a sessão mesmo após recarregar a página
function setSession(user, token) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }));
  try {
    window.dispatchEvent(new CustomEvent('sessionChanged'));
  } catch {}
}

// Função de registo que chama a API
// Valida no frontend antes de enviar, depois envia os dados à API
// A API faz o registo na BD e devolve o utilizador + token JWT (1h)
import AppError from './AppError';

export async function register(name, email, password) {
  // Faz um POST request à API com os dados do novo utilizador
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  // Se a resposta não for OK (ex: email já existe), lê o erro e lança uma exceção
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new AppError(response.status, error.error || 'Erro ao registar');
  }

  // Sucesso! Lê a resposta JSON que contém user + token
  const data = await response.json();
  // Guarda a sessão no localStorage para manter o utilizador conectado
  setSession(data.user, data.token);
  return data.user;
}

// Função de login que chama a API
// Envia email + password e recebe o utilizador + token JWT (1h)
export async function login(email, password) {
  // Faz um POST request à API com email e password
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  // Se falhar (ex: password errada), lança um erro
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new AppError(response.status, error.error || 'Erro ao fazer login');
  }

  // Sucesso! Lê a resposta e guarda a sessão
  const data = await response.json();
  setSession(data.user, data.token);
  return data.user;
}

// Remove a sessão do localStorage (logout)
// O utilizador fica desconectado e é redirecionado para /login
export function logout() {
  localStorage.removeItem(SESSION_KEY);
  try {
    window.dispatchEvent(new CustomEvent('sessionChanged'));
  } catch {}
}

// Devolve o utilizador atualmente conectado (ou null se não existir)
export function getCurrentUser() {
  return getStoredUser();
}

// Devolve o token JWT (usado para autenticar requests futuros à API)
// Será necessário enviar este token em requests protegidas
export function getToken() {
  return getStoredToken();
}
