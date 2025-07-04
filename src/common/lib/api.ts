export async function fetchVariationAttributes(categoryId: string) {
  if (!categoryId) return []
  const res = await fetch(`/api/categories/${categoryId}?depth=3`)
  if (!res.ok) return []
  const data = await res.json()
  // For /api/categories/:id, data.variationAttributes is the array of objects
  return Array.isArray(data.variationAttributes) ? data.variationAttributes : []
}
