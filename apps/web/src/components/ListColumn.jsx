import { useState } from 'react';
import { SortableContext } from '@dnd-kit/sortable';
import { rectSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable, useDndMonitor } from '@dnd-kit/core';
import CardItem from './CardItem';
import { getAuthHeaders } from '../lib/auth-store';

export default function ListColumn({ list, boardId, onCardAdded, dragHandleProps }) {
  const [newCardTitle, setNewCardTitle] = useState('');
  const [creatingCard, setCreatingCard] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [activeDropIndex, setActiveDropIndex] = useState(null);
  
  // Zona de drop para listas vazias
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

  useDndMonitor({
    onDragOver(event) {
      const { over } = event;
      if (!over) {
        setActiveDropIndex(null);
        return;
      }

      const overData = over.data?.current;
      if (overData?.type === 'card') {
        setActiveDropIndex(overData.index);
        return;
      }

      if (overData?.type === 'list-end') {
        setActiveDropIndex(list.cards.length);
        return;
      }

      if (overData?.type === 'list' && list.cards.length === 0) {
        setActiveDropIndex(0);
        return;
      }

      setActiveDropIndex(null);
    },
    onDragEnd() {
      setActiveDropIndex(null);
    },
  });

  // Criar um placeholder ID quando a lista está vazia para permitir drop
  const placeholderId = list.cards.length === 0 ? `empty-${list.id}` : null;
  const sortableItems = placeholderId ? [placeholderId] : list.cards.map((c) => c.id);

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
        <div ref={setNodeRef} className="mt-3 min-h-[60px] flex flex-col gap-3">
          {list.cards.map((card, index) => (
            <div key={card.id}>
              {activeDropIndex === index && (
                <div className="mb-2 rounded-xl border border-dashed border-slate-600 bg-slate-800/40 p-3" />
              )}
              <CardItem card={card} listId={list.id} index={index} />
            </div>
          ))}

          {activeDropIndex === list.cards.length && (
            <div className="rounded-xl border border-dashed border-slate-600 bg-slate-800/40 p-3" />
          )}
          <div ref={setEndDropRef} className="mt-1 h-10 rounded border border-dashed border-transparent transition hover:border-cyan-500/50" />
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
