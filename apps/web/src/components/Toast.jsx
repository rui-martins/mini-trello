import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Toast({ message, duration = 3000, onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const id = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(id);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-6 left-1/2 z-50 w-auto -translate-x-1/2">
      <div className="mx-auto flex items-center gap-3 rounded-xl bg-emerald-600/95 px-4 py-2 text-sm text-white shadow-lg">
        <div className="flex-1">{message}</div>
        <button
          type="button"
          onClick={() => onClose && onClose()}
          className="-mr-2 rounded p-1 text-white/90 hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
