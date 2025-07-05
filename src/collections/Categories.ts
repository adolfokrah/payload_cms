import { CollectionConfig, APIError } from 'payload'
import { buildCategoryHierarchy } from '../common/utils/build_category_hierarchy'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    update: () => true, // allow anyone to update for now
  },
  admin: {
    useAsTitle: 'display_name',
    defaultColumns: ['display_name', 'title', 'parent'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'display_name',
      label: 'Category Hierarchy',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Auto-generated hierarchy path showing parent categories',
      },
      hooks: {
        beforeChange: [
          async ({ data, siblingData, req }) => {
            // Generate display name based on category hierarchy
            const categoryTitle = siblingData?.title || data

            if (siblingData?.parent) {
              try {
                // Build hierarchy using recursive function
                const result = await buildCategoryHierarchy(
                  req.payload,
                  siblingData.parent,
                  categoryTitle,
                  new Set() // Track visited IDs to prevent circular references
                )
                console.log(`Building hierarchy for "${categoryTitle}":`, result)
                return result
              } catch (error) {
                console.error('Error building category hierarchy:', error)
                return categoryTitle
              }
            }

            // No parent, just return the title
            console.log(`No parent for "${categoryTitle}", returning title only`)
            return categoryTitle
          },
        ],
      },
    },

    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      required: false,
      filterOptions: ({ id }) => ({
        id: { not_equals: id },
      }),
      admin: {
        description:
          'Select parent category (only after save). Leave empty for main category. eg. Women, Men, Kids',
      },
    },
    {
      name: 'children',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      required: false,
      admin: {
        readOnly: true,
        description: 'Child categories are automatically populated.',
      },
    },
    {
      name: 'variationAttributes',
      type: 'relationship',
      relationTo: 'variation-attributes',
      hasMany: true,
      required: false,
      admin: {
        readOnly: true,
        description: 'Select all option types relevant for this category.',
        condition: (data) => {
          return data?.children?.length < 1
        },
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation, context, previousDoc }) => {
        try {
          if (operation == 'create' || operation == 'update') {
            if (context.skipHooks === true) {
              return
            }

            // Update children's display names if this category's hierarchy changed
            if (doc?.children && Array.isArray(doc.children)) {
              for (const child of doc.children) {
                const childId = typeof child === 'object' ? child.id : child
                try {
                  // Force update the child to regenerate its display name
                  const childDoc = await req.payload.findByID({
                    collection: 'categories',
                    id: childId
                  })
                  
                  if (childDoc) {
                    await req.payload.update({
                      collection: 'categories',
                      id: childId,
                      data: {
                        title: childDoc.title // This will trigger the beforeChange hook
                      },
                      context: {
                        skipHooks: false, // Allow hooks to run to update display_name
                      }
                    })
                    console.log(`Updated child category ${childDoc.title} display name`)
                  }
                } catch (childError) {
                  console.error(`Error updating child category ${childId}:`, childError)
                }
              }
            }

            if (previousDoc?.parent && previousDoc?.parent !== doc?.parent) {
              // If parent has changed, remove this category from the old parent's children
              const oldParent = await req.payload.findByID({
                collection: 'categories',
                id: previousDoc?.parent,
              })

              if (oldParent) {
                const updatedChildren =
                  oldParent.children?.filter((child) =>
                    typeof child === 'object' ? child.id !== doc.id : child !== doc.id,
                  ) || undefined

                await req.payload.update({
                  collection: 'categories',
                  id: previousDoc?.parent,
                  data: {
                    children: updatedChildren,
                  },
                  context: {
                    skipHooks: true, // Skip hooks to avoid infinite loop
                  },
                  req,
                })
              }
            }

            if (doc?.parent) {
              const foundParent = await req.payload.findByID({
                collection: 'categories',
                id: doc?.parent,
              })

              if (foundParent) {
                const children = foundParent?.children || []
                const childIds = children.map(child => 
                  typeof child === 'object' ? child.id : child
                )
                
                // Add current document if not already in children
                if (!childIds.includes(doc.id)) {
                  const updatedChildren = [...children, doc.id]
                  
                  await req.payload.update({
                    collection: 'categories',
                    id: doc?.parent,
                    data: {
                      children: updatedChildren,
                    },
                    context: {
                      skipHooks: true, // Skip hooks to avoid infinite loop
                    },
                    req,
                  })
                  
                  console.log(`Added ${doc.title} to parent ${foundParent.title} children`)
                }
              }
            } else {
              console.log('No parent selected')
            }
          }
        } catch (error) {
          throw new APIError(
            `Category update failed: ${error instanceof Error ? error.message : String(error)}`,
            500,
            undefined,
            true,
          )
        }
      },
    ],
    afterDelete: [
      async ({ doc, req, context }) => {
        try {
          if (context.skipHooks === true) {
            return
          }
          // Update parent's children array when a category is deleted
          if (doc.parent) {
            const parentId = typeof doc.parent === 'object' ? doc.parent.id : doc.parent

            const siblings = await req.payload.findByID({
              collection: 'categories',
              id: parentId,
            })

            // Update parent directly at database level
            await req.payload.update({
              collection: 'categories',
              id: parentId,
              data: {
                children:
                  (siblings.children ?? []).filter((child) =>
                    typeof child === 'object' ? child.id !== doc.id : child !== doc.id,
                  ) || undefined,
              },
              req,
              context: {
                skipHooks: true, // Skip hooks to avoid infinite loop
              },
            })
          }
        } catch (error) {
          throw new APIError(
            `Category delete failed: ${error instanceof Error ? error.message : String(error)}`,
            500,
            undefined,
            false,
          )
        }
      },
    ],
  },
}
