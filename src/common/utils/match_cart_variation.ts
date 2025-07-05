import type {
  ProductVariationWithMeta,
  CartSelectedVariation,
  ProcessedCartVariation,
} from '@/common/lib/types'

/**
 * Matches a cart's selected variation with a product's variations array
 * @param cartSelectedVariation - The variation selected in the cart (e.g., { Color: 'Apricot', 'Size [S]': 'S' })
 * @param productVariations - Array of product variations with metadata
 * @returns The matched variation with metadata, or null if no match found
 */
export function matchCartVariation(
  cartSelectedVariation: CartSelectedVariation,
  productVariations: ProductVariationWithMeta[],
): ProductVariationWithMeta | null {
  if (!Array.isArray(productVariations) || !cartSelectedVariation) {
    return null
  }

  for (const variation of productVariations) {
    // Extract attributes from variation (excluding metaData and isComplete)
    const variationAttributes = Object.keys(variation).filter(
      (key) => key !== 'metaData' && key !== 'isComplete',
    )

    // Check if all attributes in selected_variation match this variation
    const isMatch = variationAttributes.every((attr) => {
      const selectedValue = cartSelectedVariation[attr]
      const variationValue = variation[attr]
      return selectedValue === variationValue
    })

    if (isMatch) {
      return variation
    }
  }

  return null
}

/**
 * Extracts metadata from a matched variation
 * @param variation - The matched variation
 * @returns Object with attributes and metadata separated
 */
export function extractVariationData(variation: ProductVariationWithMeta) {
  const { metaData, isComplete, ...attributes } = variation

  return {
    attributes,
    metaData: metaData || {},
    isComplete: isComplete || false,
  }
}

/**
 * Complete utility to match cart variation and extract all data
 * @param cartSelectedVariation - Cart's selected variation
 * @param productVariations - Product's variations array
 * @returns Object with matched variation data or null
 */
export function processCartVariation(
  cartSelectedVariation: CartSelectedVariation,
  productVariations: ProductVariationWithMeta[],
): ProcessedCartVariation | null {
  const matchedVariation = matchCartVariation(cartSelectedVariation, productVariations)

  if (!matchedVariation) {
    return null
  }

  const { attributes, metaData } = extractVariationData(matchedVariation)

  return {
    selected_variation: {
      ...attributes,
      metaData,
    },
    stock: metaData?.stock,
  }
}
