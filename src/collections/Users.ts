import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
      label: 'First Name',
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
      label: 'Last Name',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      label: 'Email Address',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      options: [
        { label: 'Buyer', value: 'buyer' },
        { label: 'Vendor', value: 'vendor' },
        { label: 'Admin', value: 'admin' },
      ],
      defaultValue: 'buyer',
      label: 'Role',
      filterOptions: ({ data, options }) => {
        if (data?.role == 'vendor') {
          const opt = options.filter(
            (option) => (typeof option === 'object' ? option.value : option) == 'vendor',
          )
          return opt
        }
        return options.filter((option) => {
          return (typeof option === 'object' ? option.value : option) !== 'vendor'
        })
      },
    },
    {
      name: 'profilePicture',
      type: 'upload',
      relationTo: 'media',
      label: 'Profile Picture',
      required: false,
    },
    {
      name: 'vendor_profile',
      type: 'relationship',
      relationTo: 'vendors',
      label: 'Vendor Profile',
      required: false,
      admin: {
        condition: (data, siblingData) => {
          return siblingData.role === 'vendor'
        },
        readOnly: true,
        description: 'Automatically linked to your vendor profile',
      },
      hooks: {
        beforeChange: [
          async ({ data, req, operation, originalDoc }) => {
            // Only auto-link if user is a vendor and no vendor_profile is already set
            if (data?.role === 'vendor') {
              try {
                // Find vendor profile linked to this user
                const vendorQuery = await req.payload.find({
                  collection: 'vendors',
                  where: {
                    user: {
                      equals: originalDoc?.id || data.id,
                    },
                  },
                  limit: 1,
                })

                if (vendorQuery.docs.length > 0) {
                  return vendorQuery.docs[0].id
                }
              } catch (error) {
                console.error('Error finding vendor profile:', error)
              }
            }

            // If not a vendor, clear the vendor_profile
            if (data?.role !== 'vendor') {
              return null
            }

            return data.vendor_profile
          },
        ],
      },
    },
    {
      name: 'shipping_addresses',
      label: 'Shipping Addresses',
      type: 'relationship',
      relationTo: 'addresses',
      hasMany: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'payment_methods',
      type: 'relationship',
      label: 'Payment Methods',
      relationTo: 'payment_methods',
      hasMany: true,
      admin: {
        readOnly: true,
      },
    },
  ],
}
