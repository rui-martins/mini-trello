import { useEffect, useState } from 'react';

export default function App() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setStatus(data.ok ? 'ok' : 'failed'))
      .catch(() => setStatus('failed'));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold text-slate-900">Mini-Trello</h1>
        <p className="mt-2 text-slate-600">Scaffold pronto. A vossa app vive aqui.</p>
        <p className="mt-6 text-sm">
          <span className="text-slate-500">API health: </span>
          <span
            className={
              status === 'ok'
                ? 'font-semibold text-emerald-600'
                : status === 'failed'
                  ? 'font-semibold text-red-600'
                  : 'font-semibold text-slate-400'
            }
          >
            {status === 'loading' ? '…' : status === 'ok' ? 'OK' : 'falhou'}
          </span>
        </p>
        {status === 'failed' && (
          <p className="mt-2 text-xs text-slate-500 max-w-sm">
            Verifica se a API está a correr em <code>http://localhost:3000</code>{' '}
            (<code>cd apps/api && npm run dev</code>).
          </p>
        )}
      </div>
    </div>
  );
}
