import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function CardItem({ card }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-3 text-sm text-slate-100">
        <div className="font-medium">{card.title}</div>
      </div>
    </div>
  );
}
