import { useState } from 'react';
import { SortableContext } from '@dnd-kit/sortable';
import { rectSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CardItem from './CardItem';
import { getAuthHeaders } from '../lib/auth-store';

function SortableCard({ card, listId, index, onEditCard, onDeleteCard }) {
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
    opacity: isDragging ? 0 : 1,
    pointerEvents: isDragging ? 'none' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <CardItem card={card} listId={listId} onEdit={onEditCard} onDelete={onDeleteCard} dragHandleProps={listeners} />
    </div>
  );
}

export default function ListColumn({ list, boardId, onCardAdded, onEditCard, onDeleteCard, dragHandleProps }) {
  const [newCardTitle, setNewCardTitle] = useState('');
  const [creatingCard, setCreatingCard] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  
  // Zona de drop para listas vazias
  const isEmpty = list.cards.length === 0;
  const { setNodeRef } = useDroppable({
    id: list.id,
    data: {
      type: 'list',
      listId: list.id,
    },
  });

  const endDropId = `${list.id}-end`;
  const { setNodeRef: setEndDropRef } = useDroppable({
    id: endDropId,
    data: {
      type: 'list-end',
      listId: list.id,
      index: list.cards.length,
    },
  });

  const sortableItems = list.cards.map((c) => c.id);

  async function handleCreateCard(e) {
    e.preventDefault();
    if (!newCardTitle.trim()) return;

    try {
      setCreatingCard(true);
      const res = await fetch(`/api/boards/${boardId}/lists/${list.id}/cards`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newCardTitle }),
      });

      if (!res.ok) {
        throw new Error('Erro ao criar cartão');
      }

      const newCard = await res.json();
      onCardAdded?.(newCard);
      setNewCardTitle('');
      setIsAddingCard(false);
    } catch (err) {
      console.error('Erro ao criar cartão:', err);
    } finally {
      setCreatingCard(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="flex items-center justify-between" {...dragHandleProps}>
        <h4 className="text-sm font-semibold text-white">{list.title}</h4>
        <div className="text-xs text-slate-400">{list.cards.length}</div>
      </div>

      <SortableContext items={sortableItems} strategy={rectSortingStrategy}>
        <div ref={isEmpty ? setNodeRef : undefined} className="mt-3 min-h-[60px] flex flex-col gap-3">
          {list.cards.map((card, index) => (
            <div key={card.id}>
              <SortableCard card={card} listId={list.id} index={index} onEditCard={onEditCard} onDeleteCard={onDeleteCard} />
            </div>
          ))}
          <div ref={setEndDropRef} className="h-3 opacity-0" />
        </div>
      </SortableContext>

      {isAddingCard ? (
        <form onSubmit={handleCreateCard} className="mt-3">
          <input
            type="text"
            placeholder="Título do cartão..."
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            autoFocus
            className="w-full bg-slate-800 text-sm text-white placeholder-slate-500 rounded px-2 py-2 border border-slate-700 focus:outline-none focus:border-cyan-500"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={creatingCard || !newCardTitle.trim()}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-medium py-1 rounded transition"
            >
              {creatingCard ? 'A criar...' : 'Criar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingCard(false);
                setNewCardTitle('');
              }}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium py-1 rounded transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAddingCard(true)}
          className="mt-3 w-full text-left text-sm text-slate-400 hover:text-slate-300 py-2 px-2 rounded hover:bg-slate-800/50 transition"
        >
          + Adicionar cartão
        </button>
      )}
    </div>
  );
}
