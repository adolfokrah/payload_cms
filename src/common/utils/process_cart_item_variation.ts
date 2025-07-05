import { APIError } from 'payload'
import { processCartVariation } from './match_cart_variation'
import { CartSelectedVariation, ProductVariationWithMeta } from '@/common/lib/types'

interface ProcessCartItemVariationParams {
  data: any
  siblingData: any
  productId: string | number
  req: any
}

/**
 * Processes cart item variation by validating stock and adding price
 * @param params - Processing parameters
 * @returns Enriched variation data with price
 */
export async function processCartItemVariation({
  data,
  siblingData,
  productId,
  req,
}: ProcessCartItemVariationParams) {
  if (!productId || !data) {
    return data
  }

  // The incoming data should be like: { "Color": "Apricot", "Size [S]": "S" }
  const selectedVariation = siblingData?.selected_variation as CartSelectedVariation

  // Fetch the product with its variations
  const product = await req.payload.findByID({
    collection: 'products',
    id: productId,
  })

  if (!product || !product.variations) {
    throw new Error('Product not found or no variations')
  }

  // Use the utility function to match and get the price
  const processedVariation = processCartVariation(
    selectedVariation as CartSelectedVariation,
    product.variations as ProductVariationWithMeta[],
  )

  if (!processedVariation) {
    throw new Error(`Incorrect variation supplied for product "${product.title}"`)
  }

  // Validate stock if available
  if (processedVariation?.stock) {
    if (Number(processedVariation?.stock) < 1) {
      throw new Error(`Product "${product.title}" is out of stock`)
    }
    if (Number(processedVariation?.stock) < siblingData.quantity) {
      throw new Error(
        `Selected quantity for "${product.title}" is more than available stock (${processedVariation?.stock})`,
      )
    }
  }

  // Return the original variation data plus the price
  const finalVariation = {
    ...selectedVariation,
    price:
      Number(processedVariation.selected_variation.metaData.discountedPrice) ||
      Number(processedVariation.selected_variation.metaData.sellingPrice) ||
      0,
  }

  return finalVariation
}

/**
 * Cart item variation beforeChange hook handler
 */
export async function cartItemVariationBeforeChange({
  data,
  req,
  siblingData,
  operation,
}: {
  data: any
  req: any
  siblingData: any
  operation: string
}) {
  // Only process during create or update operations
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  try {
    // Get the product ID from the sibling data (same array item)
    const productId = siblingData?.product

    return await processCartItemVariation({
      data,
      siblingData,
      productId,
      req,
    })
  } catch (error) {
    throw new APIError(
      error instanceof Error ? error.message : 'An error occurred',
      400,
      undefined,
      true,
    )
  }
}
