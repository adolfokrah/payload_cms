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

export interface ProductVariation {
  [attribute: string]: string | ProductVariationMetaData | boolean | undefined
  metaData: ProductVariationMetaData
  isComplete?: boolean
}

export interface ProductVariationSelectorProps {
  path: string
}
