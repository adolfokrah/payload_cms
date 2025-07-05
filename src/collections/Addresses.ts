import type { CollectionConfig } from 'payload'

export const Addresses: CollectionConfig = {
  slug: 'addresses',
  admin: { useAsTitle: 'addressLine1' },
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
        // Update user's shipping_addresses relationship after address creation or update
        if ((operation === 'create' || operation === 'update') && doc.user) {
          // Skip if we're already updating to avoid infinite loop
          if (context?.updatingUserAddresses) return

          try {
            // Find all addresses for this user
            const userAddresses = await req.payload.find({
              collection: 'addresses',
              where: {
                user: {
                  equals: doc.user,
                },
              },
              limit: 1000, // Set a reasonable limit
            })

            // Extract address IDs
            let addressIds = userAddresses.docs.map((address) => address.id)

            if (operation === 'create') {
              addressIds = [...addressIds, doc.id] // Include the new address ID
            }

            // Update the user's shipping_addresses field
            await req.payload.update({
              collection: 'users',
              id: doc.user,
              data: {
                shipping_addresses: addressIds,
              },
              context: {
                updatingUserAddresses: true, // Prevent infinite loop
              },
              req,
            })

            console.log(
              `Updated user ${doc.user} shipping addresses with ${addressIds.length} addresses`,
            )
          } catch (error) {
            console.error('Error updating user shipping addresses:', error)
          }
        }
      },
    ],
    afterDelete: [
      async ({ doc, req, context }) => {
        // Update user's shipping_addresses relationship after address deletion
        if (doc.user) {
          // Skip if we're already updating to avoid infinite loop
          if (context?.updatingUserAddresses) return

          try {
            // Find remaining addresses for this user
            const userAddresses = await req.payload.find({
              collection: 'addresses',
              where: {
                user: {
                  equals: doc.user,
                },
              },
              limit: 1000,
            })

            // Extract address IDs
            const addressIds = userAddresses.docs.map((address) => address.id)

            // Update the user's shipping_addresses field
            await req.payload.update({
              collection: 'users',
              id: doc.user,
              data: {
                shipping_addresses: addressIds,
              },
              context: {
                updatingUserAddresses: true, // Prevent infinite loop
              },
              req,
            })

            console.log(
              `Updated user ${doc.user} shipping addresses after deletion, now has ${addressIds.length} addresses`,
            )
          } catch (error) {
            console.error('Error updating user shipping addresses after deletion:', error)
          }
        }
      },
    ],
  },
}
