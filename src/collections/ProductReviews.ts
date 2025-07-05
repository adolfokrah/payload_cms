import type { CollectionConfig } from 'payload'

export const ProductReviews: CollectionConfig = {
  slug: 'product_reviews',
    labels: {
        singular: 'Product Review',
        plural: 'Product Reviews',
    },
  admin: { useAsTitle: 'review_text' },
  fields: [
    {
        name: 'user',
        type: 'relationship',
        relationTo: 'users',
        required: true,
    },
    {
        name: 'product',
        type: 'relationship',
        relationTo: 'products',
        required: true,
    },
    {
        name: 'rating',
        type: 'number',
        required: true,
        min: 1,
        max: 5,
    },
    {
        name: 'review_text',
        label: 'Review Text',
        type: 'textarea',
        required: true,
    }
  ],
}
