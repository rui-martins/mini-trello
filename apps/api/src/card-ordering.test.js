import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCardPositionUpdates } from './card-ordering.js';

test('reindexes cards correctly when moving a card to the middle of the same list', () => {
  const cards = [
    { id: '1', listId: 'list-a', position: 0 },
    { id: '2', listId: 'list-a', position: 1 },
    { id: '3', listId: 'list-a', position: 2 },
  ];

  const updates = buildCardPositionUpdates({
    sourceCards: cards,
    targetCards: [],
    movedCardId: '3',
    targetListId: 'list-a',
    newPosition: 1,
  });

  assert.deepEqual(updates, [
    { id: '1', listId: 'list-a', position: 0 },
    { id: '3', listId: 'list-a', position: 1 },
    { id: '2', listId: 'list-a', position: 2 },
  ]);
});

test('reindexes cards correctly when moving a card to another list', () => {
  const sourceCards = [
    { id: '1', listId: 'list-a', position: 0 },
    { id: '2', listId: 'list-a', position: 1 },
  ];
  const targetCards = [
    { id: '3', listId: 'list-b', position: 0 },
    { id: '4', listId: 'list-b', position: 1 },
  ];

  const updates = buildCardPositionUpdates({
    sourceCards,
    targetCards,
    movedCardId: '2',
    targetListId: 'list-b',
    newPosition: 1,
  });

  assert.deepEqual(updates, [
    { id: '1', listId: 'list-a', position: 0 },
    { id: '3', listId: 'list-b', position: 0 },
    { id: '2', listId: 'list-b', position: 1 },
    { id: '4', listId: 'list-b', position: 2 },
  ]);
});
