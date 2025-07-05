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
}
