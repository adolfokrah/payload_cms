// Product variation types for use in ProductVariationSelector and related components

export interface ProductVariationMetaData {
  purchasePrice: number | string
  sellingPrice: number | string
  discountedPrice?: number | string
  trackStock?: boolean
  stock?: number | string
  photos?: number[]
  [key: string]: any
}

// Alternative interface for when metaData is guaranteed to exist
export interface ProductVariationWithMeta {
  [key: string]: any
  metaData: ProductVariationMetaData
  isComplete?: boolean
}

// Return type for processCartVariation utility function
export interface ProcessedCartVariation {
  selected_variation: {
    [key: string]: any
    metaData: ProductVariationMetaData
  }
  stock?: number | string
}

export interface ProductVariationSelectorProps {
  path: string
}

// Example: { Color: 'Apricot', 'Size [S]': 'S' }
export interface CartSelectedVariation {
  [key: string]: string | number | boolean | undefined
}

export interface ProductVariation {
  metaData: ProductVariationMetaData
  isComplete?: boolean
  [attribute: string]: string | boolean | undefined | ProductVariationMetaData
}
