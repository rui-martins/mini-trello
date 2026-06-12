import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KanbanSquare, Lock, LogIn, Mail, UserPlus, User as UserIcon } from 'lucide-react';
import { login, register } from '../lib/auth-store';
import AppError from '../lib/AppError';

export function AuthForm({ mode }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: null, name: null, password: null });

  // Determina se é modo registo ou login
  const isRegister = mode === 'register';

  // Handler do formulário
  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    // Validação frontend personalizada (substitui a validação nativa do browser)
    const trimmedEmail = email.trim();
    if (isRegister) {
      if (name.trim().length < 2) {
        setFieldErrors((prev) => ({ ...prev, name: 'Indica o teu nome.' }));
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setFieldErrors((prev) => ({ ...prev, password: 'A password tem de ter pelo menos 6 caracteres.' }));
        setLoading(false);
        return;
      }
    } else {
      if (!trimmedEmail.includes('@')) {
        setFieldErrors((prev) => ({ ...prev, email: 'Inclui um "@" no endereço de email.' }));
        setLoading(false);
        return;
      }
    }

    try {
      // Chama register() ou login() dependendo do mode
      // Ambas as funções fazem fetch à API e guardam o token no localStorage
      if (isRegister) {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }

      // Se chegou aqui, o registo/login foi bem-sucedido
      // Grava uma mensagem temporária para mostrar no dashboard
      try {
        sessionStorage.setItem('flashMessage', isRegister ? 'Conta criada com sucesso.' : 'Iniciada sessão com sucesso.');
      } catch {}
      // Redireciona para o dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // Se houver erro (ex: email duplicado, password errada), mostra-o no UI
      setError(err instanceof Error ? err.message : 'Algo correu mal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20">
            <KanbanSquare className="h-6 w-6" />
          </div>
          <span className="text-2xl font-semibold tracking-tight">Mini-Trello</span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <h1 className="text-2xl font-semibold text-white">{isRegister ? 'Criar conta' : 'Entrar'}</h1>
          <p className="mt-1 text-sm text-slate-300">
            {isRegister
              ? 'Regista-te para organizar os teus boards.'
              : 'Bem-vindo de volta. Entra para continuar.'}
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            {isRegister && (
              <Field icon={<UserIcon className="h-4 w-4" />} label="Nome" error={fieldErrors.name}>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setFieldErrors((prev) => ({ ...prev, name: null }));
                  }}
                  required
                  maxLength={60}
                  placeholder="O teu nome"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                />
              </Field>
            )}

            <Field icon={<Mail className="h-4 w-4" />} label="Email" error={fieldErrors.email}>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldErrors((prev) => ({ ...prev, email: null }));
                }}
                required
                maxLength={120}
                placeholder="tu@exemplo.com"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
              />
            </Field>

            <Field icon={<Lock className="h-4 w-4" />} label="Password" error={fieldErrors.password}>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: null }));
                }}
                required
                minLength={isRegister ? 6 : 1}
                maxLength={120}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
              />
            </Field>

            {error && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isRegister ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              {loading ? 'A processar…' : isRegister ? 'Criar conta' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-300">
            {isRegister ? (
              <>
                Já tens conta?{' '}
                <Link to="/login" className="font-medium text-cyan-300 hover:underline">
                  Entrar
                </Link>
              </>
            ) : (
              <>
                Ainda não tens conta?{' '}
                <Link to="/register" className="font-medium text-cyan-300 hover:underline">
                  Criar conta
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente reutilizável para campos do formulário com ícone
// Mostra label, ícone à esquerda e o input field
function Field({ icon, label, children, error }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/30">
        <span className="text-slate-400">{icon}</span>
        {children}
      </div>
      {error && (
        <div role="alert" className="mt-2 inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.681-1.36 3.446 0l6.518 11.59c.75 1.335-.213 2.985-1.723 2.985H3.462c-1.51 0-2.473-1.65-1.723-2.985L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-.993.883L9 6v4a1 1 0 001.993.117L11 10V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </label>
  );
}
