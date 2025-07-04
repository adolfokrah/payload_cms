'use client'
import * as React from 'react'
import { SelectInput, Button, TextInput, UploadInput } from '@payloadcms/ui'
import type { ProductVariationSelectorProps } from '@/common/lib/types'
import { isDuplicateVariation } from '@/common/utils/is_duplicate_variation'
import { useProductVariationSelector } from '@/common/hooks/useProductVariationSelector'
import { RESERVED_NAMES } from '@/common/constants/products'

const ProductVariationSelector: React.FC<ProductVariationSelectorProps> = ({ path }) => {
  const REQUIRED_META_FIELDS = ['purchasePrice', 'sellingPrice']
  const {
    handleAddVariation,
    handleRemoveVariation,
    handleMetaData,
    handleChange,
    attributeNames,
    allComplete,
    variations,
    variationAttributes,
    invalidAttribute,
    isLoading,
  } = useProductVariationSelector(path, REQUIRED_META_FIELDS)

  if (isLoading) {
    return <div>Loading variation attributes...</div>
  }

  if (!variationAttributes || variationAttributes.length === 0) {
    return <div>No variation attributes for this category.</div>
  }

  if (invalidAttribute) {
    return (
      <div style={{ color: 'red', fontWeight: 'bold', margin: 16 }}>
        Error: Attribute names cannot be any of: {RESERVED_NAMES.join(', ')}
      </div>
    )
  }

  return (
    <div>
      <h3 style={{ marginBottom: 10 }}>Variations [{variations.length}]</h3>
      {(variations || []).map((variation, idx) => {
        const isDuplicate = isDuplicateVariation(variations, variation, idx, attributeNames)
        return (
          <div
            key={idx}
            style={{ border: '1px solid #333', borderRadius: 6, marginBottom: 16, padding: 12 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Variation {idx + 1}</strong>
              <Button
                buttonStyle="secondary"
                onClick={() => handleRemoveVariation(idx)}
                size="small"
              >
                Remove
              </Button>
            </div>
            {isDuplicate && (
              <div style={{ color: 'red', marginBottom: 8 }}>
                Duplicate variation! Please select a unique combination.
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
              {variationAttributes.map((attr: any) => (
                <div key={attr.id} style={{ minWidth: 180 }}>
                  <SelectInput
                    path={`${path}.${idx}.variation.${attr.id}`}
                    name={`${path}.${idx}.variation.${attr.id}`}
                    label={attr.name}
                    required
                    options={(attr.options || []).map((opt: any) => ({
                      label: opt.label,
                      value: opt.value || opt.label,
                      id: opt.id || opt.value || opt.label,
                    }))}
                    value={
                      typeof variation?.[attr.name] === 'string'
                        ? (variation[attr.name] as string)
                        : ''
                    }
                    onChange={(selectedOption: any) => {
                      handleChange(idx, attr, selectedOption)
                    }}
                    placeholder={`Select ${attr.name}`}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
              <TextInput
                path={`${path}.${idx}.metaData.purchasePrice`}
                required
                value={
                  variation?.metaData?.purchasePrice !== undefined &&
                  variation?.metaData?.purchasePrice !== null
                    ? String(variation.metaData.purchasePrice)
                    : ''
                }
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleMetaData(idx, 'purchasePrice', e.target.value)
                }
                placeholder="Enter purchase price"
                label={'Purchased Price'}
              />
              <TextInput
                path={`${path}.${idx}.metaData.sellingPrice`}
                required
                value={
                  variation?.metaData?.sellingPrice !== undefined &&
                  variation?.metaData?.sellingPrice !== null
                    ? String(variation.metaData.sellingPrice)
                    : ''
                }
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleMetaData(idx, 'sellingPrice', e.target.value)
                }
                placeholder="Enter selling price"
                label={'Selling Price'}
              />
              <TextInput
                path={`${path}.${idx}.metaData.discountedPrice`}
                value={
                  variation?.metaData?.discountedPrice !== undefined &&
                  variation?.metaData?.discountedPrice !== null
                    ? String(variation.metaData.discountedPrice)
                    : ''
                }
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleMetaData(idx, 'discountedPrice', e.target.value)
                }
                placeholder="Enter discounted price"
                label={'Dicounted Price'}
              />
              <div>
                <label
                  className="field-label"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <input
                    type="checkbox"
                    checked={!!variation?.metaData?.trackStock}
                    onChange={(e) => handleMetaData(idx, 'trackStock', e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  Track Stock
                </label>
              </div>
              {variation?.metaData?.trackStock && (
                <TextInput
                  path={`${path}.${idx}.metaData.stock`}
                  value={
                    variation?.metaData?.stock !== undefined && variation?.metaData?.stock !== null
                      ? String(variation.metaData.stock)
                      : ''
                  }
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleMetaData(idx, 'stock', e.target.value)
                  }
                  placeholder="Enter stock quantity"
                  label={'Stock'}
                />
              )}

              <UploadInput
                hasMany
                allowCreate
                path={`media`}
                relationTo="media"
                value={variation?.metaData?.photos || []}
                api="/api"
                onChange={(val) => handleMetaData(idx, 'photos', val)}
                serverURL={process.env.NEXT_PUBLIC_SERVER_URL}
                label={'Photos'}
                // displayPreview={true}
              />
            </div>
          </div>
        )
      })}
      <Button
        buttonStyle="primary"
        onClick={handleAddVariation}
        size="small"
        disabled={!allComplete}
      >
        Add Variation
      </Button>
      {!allComplete && (
        <div style={{ color: 'red', marginTop: 8 }}>
          All required fields (attributes and price fields) must be filled before adding a new
          variation.
        </div>
      )}
    </div>
  )
}

export default ProductVariationSelector
