// Helper to check for duplicate variations
export function isDuplicateVariation(
  variations: any[],
  candidate: any,
  idx: number,
  attributeNames: string[],
) {
  // Only check if candidate is complete
  if (!attributeNames.every((name) => candidate[name])) return false
  return variations.some((variation, i) => {
    if (i === idx) return false
    if (!attributeNames.every((name) => variation[name])) return false
    return attributeNames.every((name) => variation[name] === candidate[name])
  })
}
