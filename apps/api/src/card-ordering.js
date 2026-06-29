export function buildCardPositionUpdates({
  sourceCards,
  targetCards,
  movedCardId,
  targetListId,
  newPosition,
}) {
  const sourceListCards = [...sourceCards].sort((a, b) => a.position - b.position);
  const destinationListCards = [...targetCards].sort((a, b) => a.position - b.position);

  const movedCard = sourceListCards.find((card) => card.id === movedCardId);
  if (!movedCard) {
    return [];
  }

  const sourceListId = movedCard.listId;

  if (sourceListId === targetListId) {
    const remainingCards = sourceListCards.filter((card) => card.id !== movedCardId);
    const safePosition = Math.min(Math.max(newPosition, 0), remainingCards.length);
    const reorderedCards = [...remainingCards];
    reorderedCards.splice(safePosition, 0, movedCard);

    return reorderedCards.map((card, index) => ({
      id: card.id,
      listId: targetListId,
      position: index,
    }));
  }

  const sourceWithoutMoved = sourceListCards.filter((card) => card.id !== movedCardId);
  const nextListCards = [...destinationListCards];
  const safePosition = Math.min(Math.max(newPosition, 0), nextListCards.length);
  nextListCards.splice(safePosition, 0, { ...movedCard, listId: targetListId });

  const updates = [];

  sourceWithoutMoved.forEach((card, index) => {
    updates.push({ id: card.id, listId: sourceListId, position: index });
  });

  nextListCards.forEach((card, index) => {
    updates.push({ id: card.id, listId: card.listId, position: index });
  });

  return updates;
}
