import type { CollectionConfig } from 'payload'

export const Vendors: CollectionConfig = {
  slug: 'vendors',
  admin: { useAsTitle: 'shop_name' },
  fields: [
    { name: 'shop_name', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'website', type: 'text', required: true },
    { name: 'email', type: 'email', required: true, unique: true },
    { name: 'phone', type: 'text' },
    { name: 'address', type: 'text' },
    { name: 'city', type: 'text' },
    { name: 'gps_code', type: 'text' },
    { name: 'zip_code', type: 'text' },
    { name: 'country', type: 'text' },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, unique: true,  filterOptions: () => {
      return {
        role: {
          not_equals:  'vendor', // Ensure the user is not already a vendor
        },
      }
    }},
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
              req
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
              req
            })
          } catch (error) {
            console.error('Error clearing user vendor_profile:', error)
          }
        }
      },
    ],
  },
}
