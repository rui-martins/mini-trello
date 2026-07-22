import { useEffect, useRef, useState } from 'react';
import { Edit2, Trash2, GripVertical, MoreHorizontal, X } from 'lucide-react';

export default function CardItem({ card, listId, onEdit, onDelete, dragHandleProps }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEdit = (e) => {
    e?.stopPropagation?.();
    setIsMenuOpen(false);
    onEdit?.(listId, card.id, card.title);
  };

  const handleDelete = (e) => {
    e?.stopPropagation?.();
    setIsMenuOpen(false);
    onDelete?.(listId, card.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit?.(listId, card.id, card.title)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onEdit?.(listId, card.id, card.title);
      }}
      className="rounded-xl border border-slate-800 bg-slate-800/50 p-3 text-sm text-slate-100 hover:bg-slate-800/70 transition group cursor-pointer"
    >
      <div className="flex items-start gap-2 mb-2">
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing opacity-40 group-hover:opacity-60 transition flex-shrink-0 mt-0.5"
          title="Arrastar para mover"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="font-medium flex-1 break-words">{card.title}</div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((current) => !current);
            }}
            aria-haspopup="dialog"
            aria-expanded={isMenuOpen}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700/80 text-slate-200 opacity-70 transition hover:bg-slate-600 hover:opacity-100"
            title="Mais ações"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {isMenuOpen ? (
            <div className="absolute right-0 top-full z-20 mt-2 w-[240px] rounded-2xl border border-slate-700 bg-slate-900 p-3 shadow-2xl shadow-slate-950/80">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-white">Ações do cartão</div>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                  aria-label="Fechar menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-100 transition hover:bg-slate-800"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-red-200 transition hover:bg-slate-800"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
