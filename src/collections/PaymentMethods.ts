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
  admin: { useAsTitle: 'payment_method' },
  fields: [
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
}
