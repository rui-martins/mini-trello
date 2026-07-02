import { Edit2, Trash2, GripVertical } from 'lucide-react';

export default function CardItem({ card, listId, onEdit, onDelete, dragHandleProps }) {
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(listId, card.id, card.title);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(listId, card.id);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-3 text-sm text-slate-100 hover:bg-slate-800/70 transition group">
      <div className="flex items-start gap-2 mb-2">
        <div 
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing opacity-40 group-hover:opacity-60 transition flex-shrink-0 mt-0.5"
          title="Arrastar para mover"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="font-medium flex-1 break-words">{card.title}</div>
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={handleEdit}
          className="flex-1 flex items-center justify-center gap-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium py-1 rounded transition"
          title="Editar card"
        >
          <Edit2 className="h-3 w-3" />
          Editar
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 flex items-center justify-center gap-1 bg-red-900/50 hover:bg-red-800/70 text-red-200 text-xs font-medium py-1 rounded transition"
          title="Deletar card"
        >
          <Trash2 className="h-3 w-3" />
          Deletar
        </button>
      </div>
    </div>
  );
}
