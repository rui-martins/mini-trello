import { LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../lib/auth-store';

export function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl shadow-black/30">
          <p className="text-lg font-semibold">Ainda não estás autenticado.</p>
          <Link to="/login" className="mt-4 inline-flex text-cyan-300 hover:underline">Voltar ao login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Dashboard</p>
              <h1 className="text-xl font-semibold">Bem-vindo, {user.name}</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/30">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Estado</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Frontend de auth pronto</h2>
              <p className="mt-2 max-w-2xl text-slate-300">
                Esta versão já inclui login, registo e um dashboard simples em frontend, sem base de dados, para poderes continuar a desenvolver a app.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/30">
            <h3 className="text-xl font-semibold text-white">O que está a funcionar</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>• Routes /login, /register e /dashboard</li>
              <li>• Registo simples em localStorage</li>
              <li>• Login com validação local</li>
              <li>• Navegação protegida com estado de sessão</li>
            </ul>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/30">
            <h3 className="text-xl font-semibold text-white">Próximo passo</h3>
            <p className="mt-4 text-sm text-slate-300">
              Quando a API estiver pronta, podemos trocar esta store local por chamadas fetch reais para /auth/login e /auth/register.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
