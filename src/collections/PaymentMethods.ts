import {
  PAYMENT_METHOD_MOBILE_MONEY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHODS,
} from '@/common/constants/payments'
import type { CollectionConfig } from 'payload'

export const PaymentMethods: CollectionConfig = {
  slug: 'payment_methods',
  labels: {
    singular: 'Payment Method',
    plural: 'Payment Methods',
  },
  admin: {
    useAsTitle: 'display_name',
    defaultColumns: ['display_name', 'payment_method', 'user'],
  },
  fields: [
    {
      name: 'display_name',
      label: 'Display Name',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Auto-generated display name for this payment method',
      },
      hooks: {
        beforeChange: [
          async ({ data, siblingData }) => {
            // Generate display name based on payment method and bank
            if (
              siblingData?.payment_method === PAYMENT_METHODS.mobileMoney &&
              siblingData?.mobile_money?.provider
            ) {
              return `Mobile Money - ${siblingData.mobile_money.provider} - ${siblingData.mobile_money.account_holder_name || 'Account Holder'}`
            }
            return siblingData?.payment_method || 'Payment Method'
          },
        ],
      },
    },
    {
      name: 'payment_method',
      label: 'Payment Method',
      type: 'select',
      required: true,
      options: PAYMENT_METHOD_OPTIONS,
    },
    {
      name: 'mobile_money',
      label: 'Mobile Money Details',
      type: 'group',
      fields: [
        {
          name: 'provider',
          label: 'Provider',
          type: 'select',
          options: PAYMENT_METHOD_MOBILE_MONEY_OPTIONS,
        },
        {
          label: 'Account holder name',
          name: 'account_holder_name',
          type: 'text',
        },
        {
          label: 'Phone Number',
          name: 'phone_number',
          type: 'text',
        },
      ],
      admin: {
        condition: (_, siblings) => siblings?.payment_method == PAYMENT_METHODS.mobileMoney,
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation, req, context }) => {
        // Update user's payment_methods relationship after creation or update
        if ((operation === 'create' || operation === 'update') && doc.user) {
          // Skip if we're already updating to avoid infinite loop
          if (context?.updatingUserPaymentMethods) return

          try {
            // Find all payment methods for this user
            const userPaymentMethods = await req.payload.find({
              collection: 'payment_methods',
              where: {
                user: {
                  equals: doc.user,
                },
              },
            })

            // Extract payment method IDs
            let paymentMethodIds = userPaymentMethods.docs.map((pm) => pm.id)

            if (operation === 'create') {
              paymentMethodIds = [...paymentMethodIds, doc.id] // Include the new payment method ID
            }

            // Update the user's payment_methods field
            await req.payload.update({
              id: doc.user,
              collection: 'users',
              data: {
                payment_methods: paymentMethodIds,
              },
              context: {
                updatingUserPaymentMethods: true, // Prevent infinite loop
              },
              req,
            })

            console.log(
              `Updated user ${doc.user} payment methods after change, now has ${paymentMethodIds.length} methods`,
            )
          } catch (error) {
            console.error('Error updating user payment methods:', error)
          }
        }
      },
    ],
    afterDelete: [
      async ({ doc, req, context }) => {
        // Update user's payment_methods relationship after deletion
        if (doc.user) {
          // Skip if we're already updating to avoid infinite loop
          if (context?.updatingUserPaymentMethods) return

          try {
            // Find all payment methods for this user
            const userPaymentMethods = await req.payload.find({
              collection: 'payment_methods',
              where: {
                user: {
                  equals: doc.user,
                },
              },
            })

            // Extract payment method IDs
            const paymentMethodIds = userPaymentMethods.docs.map((pm) => pm.id)

            // Update the user's payment_methods field
            await req.payload.update({
              id: doc.user,
              collection: 'users',
              data: {
                payment_methods: paymentMethodIds,
              },
              context: {
                updatingUserPaymentMethods: true, // Prevent infinite loop
              },
              req,
            })

            console.log(
              `Updated user ${doc.user} payment methods after deletion, now has ${paymentMethodIds.length} methods`,
            )
          } catch (error) {
            console.error('Error updating user payment methods after deletion:', error)
          }
        }
      },
    ],
  },
}
