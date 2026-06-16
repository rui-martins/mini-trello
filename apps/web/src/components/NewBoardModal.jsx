import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function NewBoardModal({ open, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setTitle('');
      setError(null);
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Criar novo board</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-300 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-2 block text-sm text-slate-300">Título</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-1 focus:ring-cyan-400"
          placeholder="Ex: Projeto Pessoal"
        />

        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={async () => {
              if (!title.trim()) return setError('Título obrigatório');
              setError(null);
              setLoading(true);
              try {
                await onCreate(title.trim());
                onClose();
              } catch (err) {
                setError(err?.message || 'Erro ao criar board');
              } finally {
                setLoading(false);
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
            disabled={loading}
          >
            {loading ? 'A criar...' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}
