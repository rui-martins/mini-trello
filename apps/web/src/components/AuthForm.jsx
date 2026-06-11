import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KanbanSquare, Lock, LogIn, Mail, UserPlus, User as UserIcon } from 'lucide-react';
import { login, register } from '../lib/auth-store';

export function AuthForm({ mode }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Determina se é modo registo ou login
  const isRegister = mode === 'register';

  // Handler do formulário
  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Chama register() ou login() dependendo do mode
      // Ambas as funções fazem fetch à API e guardam o token no localStorage
      if (isRegister) {
        // Validações frontend simples antes de enviar
        if (name.trim().length < 2) throw new Error('Indica o teu nome.');
        if (password.length < 6) throw new Error('A password tem de ter pelo menos 6 caracteres.');
        // Chama a função register que faz POST à API /auth/register
        register(name.trim(), email.trim(), password);
      } else {
        // Chama a função login que faz POST à API /auth/login
        login(email.trim(), password);
      }

      // Se chegou aqui, o registo/login foi bem-sucedido
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

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {isRegister && (
              <Field icon={<UserIcon className="h-4 w-4" />} label="Nome">
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={60}
                  placeholder="O teu nome"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                />
              </Field>
            )}

            <Field icon={<Mail className="h-4 w-4" />} label="Email">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                maxLength={120}
                placeholder="tu@exemplo.com"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
              />
            </Field>

            <Field icon={<Lock className="h-4 w-4" />} label="Password">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
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
function Field({ icon, label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/30">
        <span className="text-slate-400">{icon}</span>
        {children}
      </div>
    </label>
  );
}
