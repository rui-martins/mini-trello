import { LayoutDashboard, LogOut, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Toast from '../components/Toast';
import NewBoardModal from '../components/NewBoardModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { getCurrentUser, logout, getToken, getAuthHeaders } from '../lib/auth-store';

export function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [flash, setFlash] = useState(null);
  const [boards, setBoards] = useState([]);
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, boardId: null });

  useEffect(() => {
    try {
      const msg = sessionStorage.getItem('flashMessage');
      if (msg) {
        setFlash(msg);
        sessionStorage.removeItem('flashMessage');
      }
    } catch {}
  }, []);

  // Carrega os boards do backend (se autenticado)
  useEffect(() => {
    async function loadBoards() {
      try {
        const res = await fetch('/api/boards', { headers: getAuthHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        setBoards(data);
      } catch (err) {
        // ignore for now
      }
    }
    loadBoards();
  }, []);

  // Verifica expiração imediatamente e depois a cada 5 segundos
  // Se o token expirou, faz logout automático e redireciona para login
  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = getToken();
      if (!token) {
        logout();
        navigate('/login', { replace: true });
      }
    };

    // Verifica imediatamente
    checkTokenExpiry();
    
    // E depois a cada 5 segundos
    const interval = setInterval(checkTokenExpiry, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  function requestDeleteBoard(boardId) {
    setConfirmState({ open: true, boardId });
  }

  async function handleDeleteBoard(boardId) {
    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error('Erro ao eliminar board');
      }

      setBoards((prev) => prev.filter((board) => board.id !== boardId));
    } catch (err) {
      console.error('Erro ao eliminar board:', err);
      setFlash(err.message || 'Erro ao eliminar board');
    } finally {
      setConfirmState({ open: false, boardId: null });
    }
  }

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
      {flash && <Toast message={flash} onClose={() => setFlash(null)} />}
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
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Os teus Boards</h3>
            <button
              type="button"
              onClick={() => setShowNewBoardModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 text-sm font-medium text-slate-100 hover:bg-slate-700"
            >
              Novo Board
            </button>
          </div>

          <NewBoardModal
            open={showNewBoardModal}
            onClose={() => setShowNewBoardModal(false)}
            onCreate={async (title) => {
              try {
                const res = await fetch('/api/boards', {
                  method: 'POST',
                  headers: getAuthHeaders(),
                  body: JSON.stringify({ title }),
                });
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  throw new Error(err.error || 'Erro ao criar board');
                }
                const board = await res.json();
                setBoards((prev) => [...prev, board]);
              } catch (err) {
                setFlash(err.message || 'Erro ao criar board');
                throw err;
              }
            }}
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.length === 0 ? (
              <>
              </>
            ) : (
              boards.map((b) => (
                <div key={b.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-slate-100">
                  <Link to={`/boards/${b.id}`} className="block hover:bg-slate-800/70 rounded-xl p-2 -m-2 transition">
                    <div className="font-semibold">{b.title}</div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => requestDeleteBoard(b.id)}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-1.5 text-sm font-medium text-red-200 transition hover:bg-red-900/60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <ConfirmDialog
        open={confirmState.open}
        title="Eliminar board"
        message="Esta ação remove o board e todo o conteúdo associado. Quer continuar?"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => handleDeleteBoard(confirmState.boardId)}
        onCancel={() => setConfirmState({ open: false, boardId: null })}
      />
    </div>
  );
}
