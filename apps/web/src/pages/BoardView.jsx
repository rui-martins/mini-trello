import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import ListColumn from '../components/ListColumn';

export default function BoardView() {
  const { id } = useParams();

  const [lists, setLists] = useState([
    {
      id: 'list-1',
      title: 'A Fazer',
      cards: [
        { id: 'c1', title: 'Configurar ambiente' },
        { id: 'c2', title: 'Desenhar schema' },
      ],
    },
    {
      id: 'list-2',
      title: 'Em Progresso',
      cards: [{ id: 'c3', title: 'Implementar auth' }],
    },
    {
      id: 'list-3',
      title: 'Concluído',
      cards: [{ id: 'c4', title: 'Escrever US-03' }],
    },
  ]);

  const sensors = useSensors(useSensor(PointerSensor));

  function findContainer(cardId) {
    return lists.find((l) => l.cards.find((c) => c.id === cardId))?.id || null;
  }

  function onDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    // If dragging a list (top-level), reorder lists
    const isListDrag = lists.findIndex((l) => l.id === active.id) > -1;
    if (isListDrag) {
      const oldIndex = lists.findIndex((l) => l.id === active.id);
      const newIndex = lists.findIndex((l) => l.id === over.id);
      if (oldIndex !== newIndex) {
        setLists((prev) => arrayMove(prev, oldIndex, newIndex));
      }
      return;
    }

    // Dragging a card: active.id and over.id are card ids or a list id
    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id) || over.id;
    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      // reorder within same list
      setLists((prev) =>
        prev.map((l) => {
          if (l.id !== activeContainer) return l;
          const oldIndex = l.cards.findIndex((c) => c.id === active.id);
          const newIndex = l.cards.findIndex((c) => c.id === over.id);
          return { ...l, cards: arrayMove(l.cards, oldIndex, newIndex) };
        }),
      );
      return;
    }

    // move card between lists
    setLists((prev) => {
      const sourceListIndex = prev.findIndex((l) => l.id === activeContainer);
      const destListIndex = prev.findIndex((l) => l.id === overContainer);
      if (sourceListIndex === -1 || destListIndex === -1) return prev;

      const sourceList = { ...prev[sourceListIndex] };
      const destList = { ...prev[destListIndex] };

      const cardIndex = sourceList.cards.findIndex((c) => c.id === active.id);
      const [moved] = sourceList.cards.splice(cardIndex, 1);

      // if over is a card id, insert before it; if over is list id, push to end
      const overCardIndex = destList.cards.findIndex((c) => c.id === over.id);
      if (overCardIndex === -1) destList.cards.push(moved);
      else destList.cards.splice(overCardIndex, 0, moved);

      const newLists = [...prev];
      newLists[sourceListIndex] = sourceList;
      newLists[destListIndex] = destList;
      return newLists;
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Board: {id}</h1>
          <Link to="/dashboard" className="text-sm text-cyan-300 hover:underline">Voltar</Link>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={lists.map((l) => l.id)} strategy={rectSortingStrategy}>
            <div className="flex gap-4">
              {lists.map((list) => (
                <div className="min-w-[280px]" key={list.id}>
                  <ListColumn list={list} />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
