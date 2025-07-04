import { APIError, type CollectionConfig } from 'payload'
import type { ProductVariation } from '@/lib/types';

export const Products: CollectionConfig = {
  slug: 'products',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'richText' },
    { name: 'vendor', type: 'relationship', relationTo: 'vendors', required: true },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      filterOptions: () => {
        // Only show categories without children
        return {
          children: {
            exists: false,
          }
        }
      },
      admin: {
        description: 'Only show categories without children',
      },
    },
    { name: 'brand', type: 'relationship', relationTo: 'brands' },
    { name: 'photos', type: 'upload', relationTo: 'media', hasMany: true, },
    {
      name: 'variations',
      type: 'json',
      admin: {
        components: {
          Field: 'src/fields/ProductVariationSelector.tsx',
        },
      },
    }
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        const variations: ProductVariation[] = data.variations || [];

        if (Array.isArray(variations)) {
          // Get attribute keys (exclude metaData)
          const getAttrKeys = (v: ProductVariation) => Object.keys(v).filter(k => k !== 'metaData' && k !== 'isComplete');
          for (let i = 0; i < variations.length; i++) {
            const keys = getAttrKeys(variations[i]);
            // Check for empty variation
            if (
              keys.length === 0 ||
              keys.every(key => variations[i][key] === undefined || variations[i][key] === null || variations[i][key] === '')
            ) {
              // throw new Error(`Variation at position ${i + 1} is empty.`);
              throw new APIError(`Variation  ${i + 1} is empty.`, 500, undefined, true);
            }
            // Duplicate check
            for (let j = i + 1; j < variations.length; j++) {
              const keysJ = getAttrKeys(variations[j]);
              if (
                keys.length === keysJ.length &&
                keys.every(key => variations[i][key] === variations[j][key])
              ) {
                throw new APIError(`Duplicate variations ${i + 1} and ${j + 1}.`, 500, undefined, true);
              }
            }
          }
        }
        for (let i = 0; i < variations.length; i++) {
          if (!variations[i].isComplete) {
            throw new APIError(`Variation ${i + 1} is incomplete.`, 500, undefined, true);
          }
        }
        return data;
      }
    ]
  }
}
