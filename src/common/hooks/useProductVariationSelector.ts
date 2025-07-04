import { useEffect } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'
import useSWR from 'swr'
import { fetchVariationAttributes } from '@/common/lib/api'
import type { ProductVariation, ProductVariationMetaData } from '@/common/lib/types'
import { isVariationComplete } from '@/common/utils/is_variation_complete'
import { RESERVED_NAMES } from '../constants/products'
import { getCategoryId } from '../utils/get_category_id'



export function useProductVariationSelector(path: string, requiredMetaFields: string[]) {
  const { value, setValue, initialValue } = useField<ProductVariation[]>({ path })
  const formFields = useFormFields(([fields]) => fields)
  const categoryId = getCategoryId(formFields?.category?.value)
  const variations: ProductVariation[] = Array.isArray(value || initialValue)
    ? value || initialValue
    : []

  // Fetch variation attributes for the selected category
  const { data: variationAttributes, isLoading } = useSWR(
    categoryId ? `api/variation-attributes-${categoryId}` : null,
    () => fetchVariationAttributes(categoryId as string),
  )

  // Compute attribute names from variationAttributes
  const attributeNames = Array.isArray(variationAttributes)
    ? variationAttributes
        .map((a: any) => a.name)
        .filter(
          (name: string) =>
            !['purchasePrice', 'sellingPrice', 'discountedPrice', 'stock', 'trackStock'].includes(
              name,
            ),
        )
    : []

  const allComplete = (variations || []).every((v) =>
    isVariationComplete(v, attributeNames, requiredMetaFields),
  )

  const handleAddVariation = () => {
    setValue([...(variations || []), { metaData: {} }])
  }

  const handleRemoveVariation = (idx: number) => {
    setValue(variations.filter((_, i) => i !== idx))
  }

  const handleMetaData = (variationIdx: number, field: string, value: string | boolean) => {
    const newVariations: ProductVariation[] = [...variations]
    if (
      typeof newVariations[variationIdx] !== 'object' ||
      Array.isArray(newVariations[variationIdx])
    ) {
      newVariations[variationIdx] = { metaData: {} as ProductVariationMetaData }
    }
    if (!newVariations[variationIdx].metaData) {
      newVariations[variationIdx].metaData = {} as ProductVariationMetaData
    }
    newVariations[variationIdx].metaData[field] = value
    setValue(newVariations)
  }

  const handleChange = (variationIdx: number, attribute: any, selectedOption: any) => {
    const newVariations: ProductVariation[] = [...variations]
    if (
      typeof newVariations[variationIdx] !== 'object' ||
      Array.isArray(newVariations[variationIdx])
    ) {
      newVariations[variationIdx] = { metaData: {} as ProductVariationMetaData }
    }
    newVariations[variationIdx][attribute.name] = selectedOption?.label || ''
    setValue(newVariations)
  }

  // Robust isComplete update: always recalculate for all variations when value, attributeNames, or requiredMetaFields change
  useEffect(() => {
    if (!Array.isArray(value)) return;
    const updated = value.map((variation: ProductVariation) => {
      const complete = isVariationComplete(variation, attributeNames, requiredMetaFields);
      if (variation.isComplete !== complete) {
        return { ...variation, isComplete: complete };
      }
      return variation;
    });
    if (JSON.stringify(updated) !== JSON.stringify(value)) {
      setValue(updated);
    }
    // eslint-disable-next-line
  }, [value, attributeNames, requiredMetaFields]);

  useEffect(() => {
    // Reset variations if category changes
    setValue([])
  }, [categoryId])

  // Reserved field names that should not be used as attribute names
  const invalidAttribute = Array.isArray(variationAttributes)
  ? variationAttributes.some((a: any) => RESERVED_NAMES.includes(a.name))
  : false;

  return {
    value,
    setValue,
    initialValue,
    formFields,
    categoryId,
    variations,
    variationAttributes,
    isLoading,
    attributeNames,
    allComplete,
    handleAddVariation,
    handleRemoveVariation,
    handleMetaData,
    handleChange,
    invalidAttribute,
  }
}
