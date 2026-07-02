import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LayoutDashboard, LogOut } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
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
import CardItem from '../components/CardItem';
import ListColumn from '../components/ListColumn';
import { getAuthHeaders, getCurrentUser, logout } from '../lib/auth-store';

function SortableList({ list, boardId, onCardAdded }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: {
      type: 'list',
      listId: list.id,
    },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    pointerEvents: isDragging ? 'none' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="min-w-[280px]">
      <ListColumn list={list} boardId={boardId} onCardAdded={onCardAdded} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

export default function BoardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [boardTitle, setBoardTitle] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newListTitle, setNewListTitle] = useState('');
  const [creatingList, setCreatingList] = useState(false);
  const [activeDrag, setActiveDrag] = useState({ type: null, id: null });

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

  function getContainerFromOver(overId, overData) {
    if (overData?.type === 'list-end' || overData?.type === 'list') {
      return overData?.listId || overId;
    }

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

  function findCard(cardId) {
    for (const list of lists) {
      const card = list.cards.find((c) => c.id === cardId);
      if (card) return card;
    }
    return null;
  }

  function onDragStart(event) {
    const { active } = event;
    const type = active?.data?.current?.type ?? (lists.some((l) => l.id === active.id) ? 'list' : null);
    setActiveDrag({ type, id: active.id });
  }

  function onDragCancel() {
    setActiveDrag({ type: null, id: null });
  }

  function onDragEnd(event) {
    const { active, over } = event;
    setActiveDrag({ type: null, id: null });
    if (!over || !active) {
      return;
    }

    const overData = over.data?.current;
    const overIndex = overData?.sortable?.index;
    const overType = overData?.type;
    const targetIndex = typeof overData?.index === 'number' ? overData.index : overIndex;

    // If dragging a list (top-level), reorder lists
    const isListDrag = lists.some((l) => l.id === active.id);
    if (isListDrag) {
      const oldIndex = lists.findIndex((l) => l.id === active.id);
      const targetListId = overData?.type === 'list' ? over.id : overData?.listId;
      const newIndex = lists.findIndex((l) => l.id === targetListId);
      if (oldIndex !== newIndex && newIndex !== -1) {
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

    const activeContainer = findContainer(active.id);
    const overContainer = getContainerFromOver(over.id, overData);
    if (!activeContainer || !overContainer) return;

    const activeList = lists.find((l) => l.id === activeContainer);
    if (!activeList) return;

    if (activeContainer === overContainer) {
      const oldIndex = activeList.cards.findIndex((c) => c.id === active.id);
      if (oldIndex === -1 || over.id === active.id) return;

      let newIndex = oldIndex;
      if (overType === 'list' || overType === 'list-end' || over.id === activeContainer) {
        newIndex = activeList.cards.length - 1;
      } else if (typeof targetIndex === 'number') {
        newIndex = targetIndex;
      }

      if (newIndex === oldIndex) return;

      const nextCards = arrayMove(activeList.cards, oldIndex, newIndex);
      setLists((prev) => prev.map((l) => (l.id === activeContainer ? { ...l, cards: nextCards } : l)));
      moveCardInDatabase(active.id, activeContainer, newIndex).catch(() => {
        console.error('Falha ao sincronizar com DB');
      });
      return;
    }

    const sourceList = lists.find((l) => l.id === activeContainer);
    const destList = lists.find((l) => l.id === overContainer);
    if (!sourceList || !destList) return;

    const cardIndex = sourceList.cards.findIndex((c) => c.id === active.id);
    if (cardIndex === -1) return;

    const movedCard = sourceList.cards[cardIndex];
    const nextSourceCards = sourceList.cards.filter((c) => c.id !== active.id);
    const insertIndex = typeof targetIndex === 'number' ? targetIndex : destList.cards.length;
    const nextDestCards = [...destList.cards];
    nextDestCards.splice(insertIndex, 0, movedCard);

    setLists((prev) =>
      prev.map((l) => {
        if (l.id === sourceList.id) return { ...l, cards: nextSourceCards };
        if (l.id === destList.id) return { ...l, cards: nextDestCards };
        return l;
      }),
    );

    moveCardInDatabase(active.id, overContainer, insertIndex).catch(() => {
      console.error('Falha ao sincronizar com DB');
    });
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 overflow-x-auto">
        <header className="sticky top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Board</p>
                <h1 className="text-xl font-semibold">{boardTitle ?? 'A carregar...'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </header>
        <div className="pt-[73px] flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-8">
          <div className="text-slate-400">A carregar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-x-auto">
      <header className="sticky top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Board</p>
              <h1 className="text-xl font-semibold">{boardTitle ?? id}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="px-4 py-8 pt-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Board: {boardTitle ?? id}</h2>
              <Link to="/dashboard" className="text-sm text-cyan-300 hover:underline">Voltar</Link>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragCancel={onDragCancel}
            >
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

              <DragOverlay>
                {activeDrag.type === 'card' ? (
                  <div className="w-[280px] opacity-95">
                    <CardItem card={findCard(activeDrag.id)} />
                  </div>
                ) : null}
                {activeDrag.type === 'list' ? (
                  <div className="min-w-[280px] rounded-2xl border border-slate-800 bg-slate-900/90 p-4 opacity-95">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">
                        {lists.find((l) => l.id === activeDrag.id)?.title}
                      </h4>
                      <div className="text-xs text-slate-400">
                        {lists.find((l) => l.id === activeDrag.id)?.cards.length}
                      </div>
                    </div>
                    <div className="mt-3 space-y-3">
                      {lists
                        .find((l) => l.id === activeDrag.id)
                        ?.cards.slice(0, 3)
                        .map((card) => (
                          <div key={card.id} className="rounded-xl border border-slate-800 bg-slate-800/50 p-3 text-sm text-slate-100">
                            <div className="font-medium">{card.title}</div>
                          </div>
                        ))}
                      {lists.find((l) => l.id === activeDrag.id)?.cards.length > 3 ? (
                        <div className="text-xs text-slate-500">+ more</div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </main>
      </div>
  );
}
