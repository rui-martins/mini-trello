import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function CardItem({ card, listId, index, isOverlay = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      cardId: card.id,
      listId,
      index,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  if (isOverlay) {
    return (
      <div style={style} className="rounded-xl border border-cyan-400 bg-slate-700/90 p-3 text-sm text-slate-100 shadow-2xl shadow-black/40">
        <div className="font-medium">{card.title}</div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-3 text-sm text-slate-100">
        <div className="font-medium">{card.title}</div>
      </div>
    </div>
  );
}
