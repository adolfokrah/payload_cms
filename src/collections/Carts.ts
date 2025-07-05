import { type CollectionConfig } from 'payload'
import { cartItemVariationBeforeChange } from '@/common/utils/process_cart_item_variation'

export const Carts: CollectionConfig = {
  slug: 'carts',
  admin: {
    useAsTitle: 'user',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      unique: true,
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
          name: 'selected_variation',
          label: 'Selected Variation',
          type: 'json',
          hooks: {
            beforeChange: [
              async ({ data, req, siblingData, operation }) => {
                return await cartItemVariationBeforeChange({
                  data,
                  req,
                  siblingData,
                  operation: operation || 'unknown',
                })
              },
            ],
          },
          /*
           {[ [attribute: string]: any}
          */
        },
      ],
    },
  ],
  // hooks: {
  //   beforeChange: [
  //     async ({ data, req, operation }) => {
  //       const cartData = data as Cart

  //       // Validate each item in the cart
  //       if (cartData.items && Array.isArray(cartData.items)) {
  //         for (const item of cartData.items) {
  //           if (typeof item.product !== 'number') continue

  //           const product = await req.payload.findByID({
  //             collection: 'products',
  //             id: item.product as number,
  //           })

  //           if (product && item.selected_variation) {
  //             const productVariations = product?.variations as ProductVariationWithMeta[]

  //             // Use utility function to match and process variation
  //             const processedVariation = processCartVariation(
  //               item.selected_variation as CartSelectedVariation,
  //               productVariations,
  //             )

  //             if (processedVariation) {
  //               if (processedVariation?.stock) {
  //                 if (Number(processedVariation?.stock) < 1)
  //                   throw new APIError(
  //                     `Product "${product.title}" is out of stock`,
  //                     400,
  //                     undefined,
  //                     false,
  //                   )
  //                 if (Number(processedVariation?.stock) < item.quantity)
  //                   throw new APIError(
  //                     `Selected quantity for "${product.title}" is more than available stock (${processedVariation?.stock})`,
  //                     400,
  //                     undefined,
  //                     false,
  //                   )
  //               }
  //             } else {
  //               throw new APIError(
  //                 `Incorrect variation supplied for product "${product.title}"`,
  //                 400,
  //                 undefined,
  //                 false,
  //               )
  //             }
  //           }
  //         }
  //       }

  //       return data
  //     },
  //   ],
  // },
}
