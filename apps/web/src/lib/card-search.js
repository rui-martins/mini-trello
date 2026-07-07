export function matchesCardTitleSearch(cardTitle, searchQuery) {
  const normalizedTitle = cardTitle?.toLowerCase?.() ?? '';
  const normalizedQuery = searchQuery?.trim().toLowerCase() ?? '';

  if (!normalizedQuery) {
    return true;
  }

  return normalizedTitle.includes(normalizedQuery);
}
