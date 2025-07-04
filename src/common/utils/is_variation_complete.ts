export function isVariationComplete(
  variation: Record<string, any>,
  attributeNames: string[],
  requiredMetaFields: string[],
): boolean {
  // Check attribute fields
  if (
    !attributeNames.every(
      (name: string) =>
        variation[name] !== undefined && variation[name] !== null && variation[name] !== '',
    )
  ) {
    return false
  }
  // Check metaData fields
  if (!variation.metaData) return false
  if (
    !requiredMetaFields.every(
      (field: string) =>
        variation.metaData[field] !== undefined &&
        variation.metaData[field] !== null &&
        variation.metaData[field] !== '',
    )
  ) {
    return false
  }
  return true
}
