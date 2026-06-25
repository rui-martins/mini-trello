import { useState, useEffect } from 'react';
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
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ListColumn from '../components/ListColumn';
import { getAuthHeaders } from '../lib/auth-store';

function SortableList({ list, boardId, onCardAdded }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: list.id });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="min-w-[280px]">
      <ListColumn list={list} boardId={boardId} onCardAdded={onCardAdded} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

export default function BoardView() {
  const { id } = useParams();
  const [boardTitle, setBoardTitle] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newListTitle, setNewListTitle] = useState('');
  const [creatingList, setCreatingList] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  // Carregar board, listas e cartões
  useEffect(() => {
    async function loadBoardData() {
      if (!id) return;
      try {
        setLoading(true);
        // Carregar board
        const boardRes = await fetch(`/api/boards/${id}`, { headers: getAuthHeaders() });
        if (!boardRes.ok) {
          setLoading(false);
          return;
        }
        const boardData = await boardRes.json();
        setBoardTitle(boardData.title);

        // Carregar listas
        const listsRes = await fetch(`/api/boards/${id}/lists`, { headers: getAuthHeaders() });
        if (!listsRes.ok) {
          setLoading(false);
          return;
        }
        const listsData = await listsRes.json();

        // Carregar cartões para cada lista
        const listsWithCards = await Promise.all(
          listsData.map(async (list) => {
            const cardsRes = await fetch(`/api/boards/${id}/lists/${list.id}/cards`, {
              headers: getAuthHeaders(),
            });
            const cards = cardsRes.ok ? await cardsRes.json() : [];
            return { ...list, cards };
          }),
        );

        setLists(listsWithCards);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBoardData();
  }, [id]);

  async function handleCreateList(e) {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      setCreatingList(true);
      const res = await fetch(`/api/boards/${id}/lists`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newListTitle }),
      });

      if (!res.ok) {
        throw new Error('Erro ao criar lista');
      }

      const newList = await res.json();
      setLists([...lists, { ...newList, cards: [] }]);
      setNewListTitle('');
    } catch (err) {
      console.error('Erro ao criar lista:', err);
    } finally {
      setCreatingList(false);
    }
  }

  function findContainer(cardId) {
    return lists.find((l) => l.cards.find((c) => c.id === cardId))?.id || null;
  }

  function getContainerFromOver(overId) {
    // Se overId é um cartão, encontrar o container (lista)
    const cardContainer = findContainer(overId);
    if (cardContainer) return cardContainer;
    
    // Se overId é uma lista diretamente (lista vazia com useDroppable)
    if (lists.find((l) => l.id === overId)) {
      return overId;
    }
    
    return null;
  }

  async function moveCardInDatabase(cardId, newListId, newPosition) {
    try {
      const res = await fetch(`/api/boards/${id}/cards/${cardId}/move`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ newListId, newPosition }),
      });

      if (!res.ok) {
        throw new Error('Erro ao mover cartão');
      }

      return await res.json();
    } catch (err) {
      console.error('Erro ao mover cartão:', err);
      // Se falhar, recarregar dados para sincronizar
      throw err;
    }
  }

  async function moveListInDatabase(listId, newPosition) {
    try {
      const res = await fetch(`/api/boards/${id}/lists/${listId}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: newPosition }),
      });

      if (!res.ok) {
        throw new Error('Erro ao mover lista');
      }

      return await res.json();
    } catch (err) {
      console.error('Erro ao mover lista:', err);
      throw err;
    }
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
        const newLists = arrayMove(lists, oldIndex, newIndex);
        setLists(newLists);
        Promise.all(
          newLists.map((list, index) => {
            return moveListInDatabase(list.id, index).catch(() => {
              console.error('Falha ao sincronizar posição da lista', list.id);
            });
          }),
        );
      }
      return;
    }

    // Dragging a card: active.id is a card id, over.id is either a card or list id
    const activeContainer = findContainer(active.id);
    const overContainer = getContainerFromOver(over.id);
    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      // reorder within same list
      setLists((prev) =>
        prev.map((l) => {
          if (l.id !== activeContainer) return l;
          const oldIndex = l.cards.findIndex((c) => c.id === active.id);
          
          // Se over.id é um cartão, fazer reorder
          const overCardIndex = l.cards.findIndex((c) => c.id === over.id);
          if (overCardIndex !== -1) {
            const newCards = arrayMove(l.cards, oldIndex, overCardIndex);
            // Atualizar DB com nova posição
            moveCardInDatabase(active.id, l.id, overCardIndex).catch(() => {
              console.error('Falha ao sincronizar com DB');
            });
            return { ...l, cards: newCards };
          }
          
          // Se over.id é a própria lista (vazia), mover para o final
          if (over.id === l.id) {
            const [moved] = l.cards.splice(oldIndex, 1);
            const newCards = [...l.cards, moved];
            moveCardInDatabase(active.id, l.id, newCards.length - 1).catch(() => {
              console.error('Falha ao sincronizar com DB');
            });
            return { ...l, cards: newCards };
          }
          
          return l;
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

      // Se over.id é um cartão na lista destino, inserir antes dele
      let newPosition;
      const overCardIndex = destList.cards.findIndex((c) => c.id === over.id);
      if (overCardIndex !== -1) {
        destList.cards.splice(overCardIndex, 0, moved);
        newPosition = overCardIndex;
      } else {
        // Senão, push to end
        destList.cards.push(moved);
        newPosition = destList.cards.length - 1;
      }

      // Atualizar DB com o cartão movido para a nova lista
      moveCardInDatabase(active.id, overContainer, newPosition).catch(() => {
        console.error('Falha ao sincronizar com DB');
      });

      const newLists = [...prev];
      newLists[sourceListIndex] = sourceList;
      newLists[destListIndex] = destList;
      return newLists;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-8 flex items-center justify-center">
        <div className="text-slate-400">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-8 overflow-x-auto">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Board: {boardTitle ?? id}</h1>
          <Link to="/dashboard" className="text-sm text-cyan-300 hover:underline">Voltar</Link>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={lists.map((l) => l.id)} strategy={rectSortingStrategy}>
            <div className="flex gap-4 pb-4 min-w-max">
              {lists.map((list) => (
                <SortableList
                  key={list.id}
                  list={list}
                  boardId={id}
                  onCardAdded={(card) => {
                    setLists((prev) => prev.map((l) => (l.id === list.id ? { ...l, cards: [...l.cards, card] } : l)));
                  }}
                />
              ))}

              {/* Nova lista */}
              <div className="min-w-[280px]">
                <form onSubmit={handleCreateList} className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                  <input
                    type="text"
                    placeholder="Nova lista..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    className="w-full bg-slate-800 text-sm text-white placeholder-slate-500 rounded px-2 py-2 border border-slate-700 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={creatingList || !newListTitle.trim()}
                    className="mt-3 w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded transition"
                  >
                    {creatingList ? 'A criar...' : 'Criar Lista'}
                  </button>
                </form>
              </div>
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
