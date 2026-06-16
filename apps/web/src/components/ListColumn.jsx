import { SortableContext } from '@dnd-kit/sortable';
import { rectSortingStrategy } from '@dnd-kit/sortable';
import CardItem from './CardItem';

export default function ListColumn({ list }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">{list.title}</h4>
        <div className="text-xs text-slate-400">{list.cards.length}</div>
      </div>

      <SortableContext items={list.cards.map((c) => c.id)} strategy={rectSortingStrategy}>
        <div className="mt-3 min-h-[60px] flex flex-col gap-3">
          {list.cards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
