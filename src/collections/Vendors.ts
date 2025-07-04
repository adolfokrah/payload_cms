import {
  PAYMENT_METHOD_MOBILE_MONEY_OPTIONS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_OPTIONS,
} from '@/common/constants/payments'
import type { CollectionConfig } from 'payload'

export const Vendors: CollectionConfig = {
  slug: 'vendors',
  admin: { useAsTitle: 'shop name' },
  fields: [
    { name: 'shop name', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'website', type: 'text', required: false },
    { name: 'email', type: 'email', required: true, unique: true },
    { name: 'phone', type: 'text' },
    { name: 'address', type: 'text' },
    { name: 'city', type: 'text' },
    { name: 'gps code', type: 'text' },
    { name: 'zip code', type: 'text' },
    { name: 'country', type: 'text' },
    {
      name: 'social media pages',
      type: 'array',
      fields: [
        {
          name: 'social media',
          type: 'select',
          options: ['Facebook', 'Tiktok', 'Instagram', 'Snapchat'],
        },
        {
          name: 'page link',
          type: 'text',
        },
      ],
    },
    {
      name: 'payment Method',
      type: 'select',
      required: true,
      options: PAYMENT_METHOD_OPTIONS,
    },
    {
      name: 'Mobile Money',
      type: 'group',
      fields: [
        {
          name: 'Provider',
          type: 'select',
          options: PAYMENT_METHOD_MOBILE_MONEY_OPTIONS,
        },
        {
          name: 'Account holder name',
          type: 'text',
        },
        {
          name: 'Phone Number',
          type: 'text',
        },
      ],
      admin: {
        condition: (data) => data?.['payment Method'] == PAYMENT_METHODS.mobileMoney,
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      filterOptions: ({ data }) => {
        const filters: any[] = []
        filters.push({ role: { not_equals: 'vendor' } })
        const currentUser = data?.user
        if (currentUser) {
          filters.push({
            id: {
              equals:
                typeof currentUser === 'object' && currentUser !== null
                  ? currentUser.id
                  : currentUser,
            },
          })
        }
        return { or: filters }
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        // Update the user's vendor_profile when vendor is created/updated
        if (doc.user && (operation === 'create' || operation === 'update')) {
          try {
            const userId = typeof doc.user === 'object' ? doc.user.id : doc.user

            // Update the user to link to this vendor profile
            await req.payload.update({
              collection: 'users',
              id: userId,
              data: {
                vendor_profile: doc.id,
                role: 'vendor', // Ensure the user role is vendor
              },
              req,
            })
          } catch (error) {
            console.error('Error updating user vendor_profile:', error)
          }
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        // Clear the user's vendor_profile when vendor is deleted
        if (doc.user) {
          try {
            const userId = typeof doc.user === 'object' ? doc.user.id : doc.user

            // Clear the vendor_profile from the user
            await req.payload.update({
              collection: 'users',
              id: userId,
              data: {
                vendor_profile: null,
                role: 'buyer', // Reset the user role to user
              },
              req,
            })
          } catch (error) {
            console.error('Error clearing user vendor_profile:', error)
          }
        }
      },
    ],
  },
}
