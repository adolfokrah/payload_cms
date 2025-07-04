'use server'
import { SizeType } from '@/payload-types'
import config from '../payload.config'
import { getPayload, OptionObject } from 'payload'

export async function fetchCategoryOptions({
  categoryId,
}: {
  categoryId: string
}): Promise<OptionObject[]> {
  const payload = await getPayload({ config })

  try {
    if (!categoryId) {
      return []
    }
    const category = await payload.findByID({
      collection: 'categories',
      id: categoryId,
      depth: 2,
    })

    const sizeType = category?.sizeTypes?.[0] as SizeType

    return (
      sizeType?.options?.map((option) => ({
        label: option.value, // fallback to empty string if id is null/undefined
        value: option.id || '',
      })) || []
    )
  } catch (error) {
    console.error('Error fetching category options:', error)
    return []
  }
}
