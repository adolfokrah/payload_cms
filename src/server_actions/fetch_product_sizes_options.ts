'use server'
import config from '../payload.config'
import { getPayload, OptionObject } from 'payload'

export async function fetchSizesOptions({ sizes }: { sizes: string[] }): Promise<OptionObject[]> {
  const payload = await getPayload({ config })

  try {
    if (!sizes || sizes.length === 0) {
      return []
    }
    const sizeTypes = await payload.find({
      collection: 'size-types',
      where: {
        'options.id': {
          in: sizes,
        },
      },
    })

    // Collect all matching options from all size types
    const matchingOptions: OptionObject[] = []

    sizeTypes.docs.forEach((sizeType) => {
      if (sizeType.options) {
        sizeType.options.forEach((option) => {
          if (option.id && sizes.includes(option.id)) {
            matchingOptions.push({
              label: option.value,
              value: option.id,
            })
          }
        })
      }
    })

    return matchingOptions
  } catch (error) {
    console.error('Error fetching category options:', error)
    return []
  }
}
