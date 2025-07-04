// Helper to fetch variation attributes for a category

export function getCategoryId(categoryValue: any): string | undefined {
  if (!categoryValue) return undefined
  if (typeof categoryValue === 'object' && categoryValue !== null && 'id' in categoryValue) {
    return categoryValue.id
  }
  if (typeof categoryValue === 'string') {
    return categoryValue
  }
  return categoryValue
}
