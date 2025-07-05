import {
  PAYMENT_METHOD_MOBILE_MONEY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHODS,
} from '@/common/constants/payments'
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
      name: 'addresses',
      type: 'group',
      fields: [
        {
          name: 'shipping_addresses',
          label: 'Shipping Addresses',
          type: 'array',
          fields: [
            {
              name: 'addressLine1',
              type: 'text',
              required: true,
              label: 'Address Line 1',
            },
            {
              name: 'addressLine2',
              type: 'text',
              label: 'Address Line 2',
            },
            {
              name: 'city',
              type: 'text',
              required: true,
              label: 'City',
            },
            {
              name: 'state',
              type: 'text',
              label: 'State/Province/Region',
            },
            {
              name: 'postalCode',
              type: 'text',
              required: true,
              label: 'Postal Code',
            },
            {
              name: 'country',
              type: 'text',
              required: true,
              label: 'Country',
            },
          ],
        },
        {
          name: 'billing_addresses',
          label: 'Billing Addresses',
          type: 'array',
          fields: [
            {
              name: 'addressLine1',
              type: 'text',
              required: true,
              label: 'Address Line 1',
            },
            {
              name: 'addressLine2',
              type: 'text',
              label: 'Address Line 2',
            },
            {
              name: 'city',
              type: 'text',
              required: true,
              label: 'City',
            },
            {
              name: 'state',
              type: 'text',
              label: 'State/Province/Region',
            },
            {
              name: 'postalCode',
              type: 'text',
              required: true,
              label: 'Postal Code',
            },
            {
              name: 'country',
              type: 'text',
              required: true,
              label: 'Country',
            },
          ],
        },
      ],
    },
    {
      name: 'payment_methods',
      type: 'array',
      label: 'Payment Methods',
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
      ],
    },
  ],
}
