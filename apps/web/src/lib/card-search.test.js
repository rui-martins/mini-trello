import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesCardTitleSearch } from './card-search.js';

test('matches case-insensitive title search', () => {
  assert.equal(matchesCardTitleSearch('Refatorar API', 'refator'), true);
  assert.equal(matchesCardTitleSearch('Refatorar API', 'UX'), false);
});

test('handles empty search query', () => {
  assert.equal(matchesCardTitleSearch('Refatorar API', ''), true);
  assert.equal(matchesCardTitleSearch('Refatorar API', '   '), true);
});
