import { APIError, type CollectionConfig } from 'payload'

export const VariationAttributes: CollectionConfig = {
  slug: 'variation-attributes',
  admin: { useAsTitle: 'name' },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Name of the variation attribute, e.g., Color, Size.',
      },
    },
    {
      name: 'options',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          unique: true,
          admin: {
            description: 'Value of the option, e.g., Red, Blue, Small, Large.',
          },
        },
        {
          name: 'value',
          type: 'text',
          unique: true
        },
      ],
      required: true,
      admin: {
        description: 'List of options for this variation attribute.',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      filterOptions: () => {
        return {
          children: {
             exists: false,
          },
        }
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation, context, previousDoc }) => {
        // Update all products in categories that use this variation attribute
        if (doc.categories && (operation === 'create' || operation === 'update')) {
          const categoryIds = doc.categories.map((cat: any) =>
            typeof cat === 'object' ? cat.id : cat,
          )

          if (context.skipHooks === true) {
            return
          }

          if(previousDoc?.categories){
              const previousCategoryIds = previousDoc.categories.map((cat: any) =>
                typeof cat === 'object' ? cat.id : cat,
              )

              const remmovedCategoryIds = previousCategoryIds.filter(
                (id: string) => !categoryIds.includes(id)
              )
              
              // Remove this variation attribute from categories that no longer include it
              if (remmovedCategoryIds.length > 0) {
                const categoriesToUpdate = await req.payload.find({
                  collection: 'categories',
                  where: {
                    id: {
                      in: remmovedCategoryIds,
                    },
                    variationAttributes: {
                      in: doc.id,
                    },
                  },
                })

                if (categoriesToUpdate && Array.isArray(categoriesToUpdate.docs)) {
                  for (const category of categoriesToUpdate.docs) {
                    const updatedVariationAttributes = category.variationAttributes?.filter(
                      (attr) =>
                        (typeof attr === 'object' && attr !== null ? attr.id : attr) !== doc.id
                    ) || []

                    await req.payload.update({
                      collection: 'categories',
                      id: category.id,
                      data: {
                        variationAttributes: updatedVariationAttributes,
                      },
                      context: {
                        skipHooks: true, // Skip hooks to avoid infinite loops
                      },
                      req
                    })
                  }
                }
              }
          }


          // Find all products in the relevant categories
          const categories = await req.payload.find({
            collection: 'categories',
            where: {
              id: {
                in: categoryIds,
              },
            },
          })

          // Update each product individually
          if (categories && Array.isArray(categories.docs)) {
            for (const category of categories.docs) {
              const categoryVariationAttributes = category.variationAttributes?.map((attr) =>
                typeof attr === 'object' && attr !== null ? attr.id : attr
              )?.filter(attr=>attr != doc.id) || []

              await req.payload.update({
                  collection: 'categories',
                  id: category.id,
                  data: {
                    variationAttributes: [...categoryVariationAttributes, doc.id],
                  },
                  context: {
                    skipHooks: true, // Skip hooks to avoid infinite loops
                  },
                  req
                })
            }
          }
        }
      },
    ],
    afterDelete: [
      async ({ doc, req, context }) => {
        try {
          if (context.skipHooks === true) {
            return
          }
  
          // Remove this variation attribute from all categories that use it
          const categoriesToUpdate = await req.payload.find({
            collection: 'categories',
            where: {
              variationAttributes: {
                in: doc.id,
              },
            },
          })
  
          if (categoriesToUpdate && Array.isArray(categoriesToUpdate.docs)) {
            for (const category of categoriesToUpdate.docs) {
              const updatedVariationAttributes = category.variationAttributes?.filter(
                (attr) =>
                  (typeof attr === 'object' && attr !== null ? attr.id : attr) !== doc.id
              ) || []
  
              await req.payload.update({
                collection: 'categories',
                id: category.id,
                data: {
                  variationAttributes: updatedVariationAttributes,
                },
                context: {
                  skipHooks: true, // Skip hooks to avoid infinite loops
                },
                req
              })
            }
          }
        } catch (error) {
          throw new APIError("error", 500, undefined, false);
        }
      }
    ]
  },
}
