import { APIError, type CollectionConfig } from 'payload'
import { ORDER_STATUS_OPTIONS } from '@/common/constants/orders'
import { processCartVariation } from '@/common/utils/match_cart_variation'
import { CartSelectedVariation, ProductVariationWithMeta } from '@/common/lib/types'
import { cartItemVariationBeforeChange } from '@/common/utils/process_cart_item_variation'

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
  hooks: {
    afterChange: [
      async ({ doc, operation, req, context }) => {
        // Delete user cart after order is created
        if (operation === 'create' && doc.orderedBy) {
          // Skip if we're already processing cart deletion to avoid infinite loops
          if (context?.deletingCart) return

          try {
            // Find the user's cart
            const userCart = await req.payload.find({
              collection: 'carts',
              where: {
                user: {
                  equals: doc.orderedBy,
                },
              },
              limit: 1,
            })

            // Delete the cart if it exists
            if (userCart.docs.length > 0) {
              await req.payload.delete({
                collection: 'carts',
                id: userCart.docs[0].id,
                context: {
                  deletingCart: true, // Prevent infinite loops
                },
              })

              console.log(`Cart deleted for user ${doc.orderedBy} after order creation`)
            }
          } catch (error) {
            console.error('Error deleting user cart after order creation:', error)
          }
        }
      },
    ],
  },
}
