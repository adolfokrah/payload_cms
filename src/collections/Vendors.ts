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
    {
      name: 'address',
      type: 'relationship',
      relationTo: 'addresses',
      required: true,
      filterOptions: ({ data }) => {
        if (data?.user) {
          return {
            user: {
              equals: data.user,
            },
          }
        }
        return false
      },
    },
    {
      name: 'social_media_pages',
      label: 'Social Media Pages',
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
      name: 'payment_method',
      label: 'Payment Method',
      type: 'relationship',
      relationTo: 'payment_methods',
      filterOptions: ({ data }) => {
        if (data?.user) {
          return {
            user: {
              equals: data.user,
            },
          }
        }
        return false
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
