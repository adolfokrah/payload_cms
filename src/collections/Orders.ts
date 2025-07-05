import { APIError, type CollectionConfig } from 'payload'
import { ORDER_STATUS_OPTIONS } from '@/common/constants/orders'
import { processCartVariation } from '@/common/utils/match_cart_variation'
import { CartSelectedVariation, ProductVariationWithMeta } from '@/common/lib/types'
import { ApiError } from 'next/dist/server/api-utils'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderedBy',
    defaultColumns: ['createdAt', 'orderedBy', 'status'],
  },
  fields: [
    {
      name: 'orderedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
        },
        {
          name: 'order_items_selected_variation',
          label: 'Selected Variation',
          type: 'json',
          hooks: {
            beforeChange: [
              async ({ data, req, siblingData, operation }) => {
                // Only process during create operations

                if (operation == 'create') {
                  try {
                    // Get the product ID from the sibling data (same array item)
                    const productId = siblingData?.product

                    if (!productId || !data) {
                      return data
                    }

                    // The incoming data should be like: { "Color": "Apricot", "Size [S]": "S" }
                    const selectedVariation =
                      siblingData?.order_items_selected_variation as CartSelectedVariation

                    // Fetch the product with its variations
                    const product = await req.payload.findByID({
                      collection: 'products',
                      id: productId,
                    })

                    if (!product || !product.variations) {
                      console.log('Product not found or no variations')
                      return data
                    }

                    // Use the utility function to match and get the price
                    const processedVariation = processCartVariation(
                      selectedVariation as CartSelectedVariation,
                      product.variations as ProductVariationWithMeta[],
                    )

                    if (processedVariation) {
                      // Return the original variation data plus the price
                      const finalVariation = {
                        ...selectedVariation,
                        price:
                          Number(processedVariation.selected_variation.metaData.discountedPrice) ||
                          Number(processedVariation.selected_variation.metaData.sellingPrice) ||
                          0,
                      }

                      console.log('Final variation with price:', finalVariation)
                      return finalVariation
                    }

                    throw new APIError(
                      `Incorrect variation supplied for product "${product.title}"`,
                      400,
                      undefined,
                      true,
                    )
                  } catch (error) {
                    console.error('Error processing order item variation:', error)
                    return data
                  }
                }
              },
            ],
          },
          /*
           {[ [attribute: string]: any, price: number}
          */
        },
      ],
    },
    {
      name: 'shipping_address',
      label: 'Shipping Address',
      type: 'relationship',
      relationTo: 'addresses',
      required: true,
      filterOptions: ({ data }) => {
        if (data?.orderedBy) {
          return {
            user: {
              equals: data.orderedBy,
            },
          }
        }
        return false
      },
    },
    {
      name: 'payment_method',
      type: 'relationship',
      label: 'Payment Method',
      relationTo: 'payment_methods',
      required: true,
      filterOptions: ({ data }) => {
        if (data?.orderedBy) {
          return {
            user: {
              equals: data.orderedBy,
            },
          }
        }
        return false
      },
    },
    {
      name: 'status',
      type: 'select',
      options: ORDER_STATUS_OPTIONS,
      defaultValue: ORDER_STATUS_OPTIONS[0].value, // Default to first option
    },
  ],
}
