import { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    update: () => true, // allow anyone to update for now
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'parent'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      required: false,
      filterOptions: ({ id }) => ({
        id: { not_equals: id }
      }),
      admin: {
        condition: (_, { id }) => Boolean(id),
        description: 'Select parent category (only after save). Leave empty for main category. eg. Women, Men, Kids',
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
        }
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation, context, previousDoc }) => {
        try {
         if(operation == "create" || operation == "update"){

          if (context.skipHooks === true) {
            return
          }

            if(previousDoc?.parent && previousDoc?.parent !== doc?.parent){
              // If parent has changed, remove this category from the old parent's children
              const oldParent = await req.payload.findByID({
                collection: 'categories',
                id: previousDoc?.parent,
              })

              if (oldParent) {
                const updatedChildren = oldParent.children?.filter(
                  (child) =>
                    typeof child === 'object'
                      ? child.id !== doc.id
                      : child !== doc.id
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
           
            if(doc?.parent){
               const foundParent = await req.payload.findByID({
                collection: 'categories',
                 id: doc?.parent
               })
               
               if(foundParent){
                const children = foundParent?.children
                
                await req.payload.update({
                  collection: 'categories',
                  id: doc?.parent,
                  data: {
                    children: children ? [...children, doc?.id] : [doc?.id],
                  },
                  context: {
                    skipHooks: true, // Skip hooks to avoid infinite loop
                  },
                  req
                })

               }
            }else{
              console.log('not fond parent')
            }
         }
        } catch (error) {
          console.error('Error in afterChange hook:', error)
        }
      },
    ],
    afterDelete: [
      async ({ doc, req, context}) => {
        try {

          if (context.skipHooks === true) {
            return
          }
          // Update parent's children array when a category is deleted
          if (doc.parent) {
            const parentId = typeof doc.parent === 'object' ? doc.parent.id : doc.parent

            const siblings = await req.payload.findByID({
              collection: 'categories',
              id: parentId
            })

            // Update parent directly at database level
            await req.payload.update({
              collection: 'categories',
              id: parentId,
              data: {
                children: (siblings.children ?? []).filter(
                  (child) => typeof child === 'object'
                    ? child.id !== doc.id
                    : child !== doc.id
                ) || undefined,
              },
              req,
              context: {
                skipHooks: true, // Skip hooks to avoid infinite loop
              }
            })
          }
        } catch (error) {
          console.error('Error updating parent children after delete:', error)
        }
      },
    ],
  },
}
