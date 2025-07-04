"use client"
import * as React from 'react';
import { useField, useFormFields, SelectInput, Button, TextInput, UploadInput } from '@payloadcms/ui';
import useSWR from 'swr';
import { fetchVariationAttributes } from '@/lib/api';
import type { ProductVariation, ProductVariationMetaData, ProductVariationSelectorProps } from '@/lib/types';

// Helper to fetch variation attributes for a category


function getCategoryId(categoryValue: any): string | undefined {
  if (!categoryValue) return undefined;
  if (typeof categoryValue === 'object' && categoryValue !== null && 'id' in categoryValue) {
    return categoryValue.id;
  }
  if (typeof categoryValue === 'string') {
    return categoryValue;
  }
  return categoryValue;
}

// Helper to check for duplicate variations
function isDuplicateVariation(variations: any[], candidate: any, idx: number, attributeNames: string[]) {
  // Only check if candidate is complete
  if (!attributeNames.every(name => candidate[name])) return false;
  return variations.some((variation, i) => {
    if (i === idx) return false;
    if (!attributeNames.every(name => variation[name])) return false;
    return attributeNames.every(name => variation[name] === candidate[name]);
  });
}

// Helper to check if a variation is complete
const requiredMetaFields: string[] = ['purchasePrice', 'sellingPrice'];
function isVariationComplete(
  variation: Record<string, any>,
  attributeNames: string[],
  requiredMetaFields: string[]
): boolean {
  // Check attribute fields
  if (!attributeNames.every((name: string) => variation[name] !== undefined && variation[name] !== null && variation[name] !== '')) {
    return false;
  }
  // Check metaData fields
  if (!variation.metaData) return false;
  if (!requiredMetaFields.every((field: string) => variation.metaData[field] !== undefined && variation.metaData[field] !== null && variation.metaData[field] !== '')) {
    return false;
  }
  return true;
}

const ProductVariationSelector: React.FC<ProductVariationSelectorProps> = ({ path }) => {
  const { value, setValue, initialValue } = useField<ProductVariation[]>({ path });
  const formFields = useFormFields(([fields]) => fields);
  const categoryId = getCategoryId(formFields?.category?.value);
  const variations: ProductVariation[] = Array.isArray(value || initialValue) ? value || initialValue : [];


  // Fetch variation attributes for the selected category
  const { data: variationAttributes, isLoading } = useSWR(
     categoryId ? `api/variation-attributes-${categoryId}` : null,
    () => fetchVariationAttributes(categoryId as string)
  );


  React.useEffect(() => {
    // Reset variations if category changes
    setValue([]);
  }, [categoryId]);

  React.useEffect(() => {
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
  
  }, [value]);

 
  if (isLoading) {
    return <div>Loading variation attributes...</div>;
  }

  if (!variationAttributes || variationAttributes.length === 0) {
    return <div>No variation attributes for this category.</div>;
  }

  // Reserved field names that should not be used as attribute names
  const reservedNames = ['purchasePrice', 'sellingPrice', 'discountedPrice', 'stock', 'trackStock'];
  const invalidAttribute = variationAttributes.some((a: any) => reservedNames.includes(a.name));

  if (invalidAttribute) {
    return (
      <div style={{ color: 'red', fontWeight: 'bold', margin: 16 }}>
        Error: Attribute names cannot be any of: {reservedNames.join(', ')}
      </div>
    );
  }

  const handleAddVariation = () => {
    setValue([...(variations || []), { metaData: {} }]);
  };

  const handleRemoveVariation = (idx: number) => {
    setValue(variations.filter((_, i) => i !== idx));
  };

  const handleMetaData = (variationIdx: number, field: string, value: string | boolean) => {
    const newVariations: ProductVariation[] = [...variations];
    if (typeof newVariations[variationIdx] !== 'object' || Array.isArray(newVariations[variationIdx])) {
      newVariations[variationIdx] = { metaData: {} as ProductVariationMetaData };
    }
    if (!newVariations[variationIdx].metaData) {
      newVariations[variationIdx].metaData = {} as ProductVariationMetaData;
    }
    newVariations[variationIdx].metaData[field] = value;
    setValue(newVariations);
  };

  const handleChange = (
    variationIdx: number,
    attribute: any,
    selectedOption: any
  ) => {
    const newVariations: ProductVariation[] = [...variations];
    // Always ensure the variation is an object with a variation property
    if (typeof newVariations[variationIdx] !== 'object' || Array.isArray(newVariations[variationIdx])) {
      newVariations[variationIdx] = { metaData: {} as ProductVariationMetaData };
    }
    newVariations[variationIdx][attribute.name] = selectedOption?.label || '';
    // Update isComplete
    newVariations[variationIdx].isComplete = isVariationComplete(
      newVariations[variationIdx],
      attributeNames,
      requiredMetaFields
    );
    setValue(newVariations);
  };

  const attributeNames = variationAttributes
    .map((a: any) => a.name)
    .filter(
      (name: string) =>
        !['purchasePrice', 'sellingPrice', 'discountedPrice', 'stock', 'trackStock'].includes(name)
    );
  const allComplete = (variations || []).every(v => isVariationComplete(v, attributeNames, requiredMetaFields));

  return (
    <div>
      <label className='field-label'>Varations [{variations.length}]</label>
      {(variations || []).map((variation, idx) => {
        const isDuplicate = isDuplicateVariation(variations, variation, idx, attributeNames);
        return (
          <div key={idx} style={{ border: '1px solid #333', borderRadius: 6, marginBottom: 16, padding: 12}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Variation {idx + 1}</strong>
              <Button buttonStyle="secondary" onClick={() => handleRemoveVariation(idx)} size="small">Remove</Button>
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
                    options={
                      (attr.options || []).map((opt: any) => ({
                        label: opt.label,
                        value: opt.value || opt.label,
                        id: opt.id || opt.value || opt.label,
                      }))
                    }
                    value={typeof variation?.[attr.name] === 'string' ? variation[attr.name] as string : ''}
                    onChange={(selectedOption: any) => {
                      handleChange(idx, attr, selectedOption);
                    }}
                    placeholder={`Select ${attr.name}`}
                  />
                </div>
              ))}
            </div>
           
            <div style={{display:'flex', flexDirection:'column', gap:16, marginTop:16}}>

               {/* Price fields */}
                  <TextInput
                    path={`${path}.${idx}.metaData.purchasePrice`}
                    required
                    value={variation?.metaData?.purchasePrice !== undefined && variation?.metaData?.purchasePrice !== null ? String(variation.metaData.purchasePrice) : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetaData(idx, 'purchasePrice', e.target.value)}
                    placeholder="Enter purchase price"
                    label={"Purchased Price"}
                  />
                  <TextInput
                    path={`${path}.${idx}.metaData.sellingPrice`}
                    required
                    value={variation?.metaData?.sellingPrice !== undefined && variation?.metaData?.sellingPrice !== null ? String(variation.metaData.sellingPrice) : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetaData(idx, 'sellingPrice', e.target.value)}
                    placeholder="Enter selling price"
                    label={"Selling Price"}
                  />
                  <TextInput
                    path={`${path}.${idx}.metaData.discountedPrice`}
                    value={variation?.metaData?.discountedPrice !== undefined && variation?.metaData?.discountedPrice !== null ? String(variation.metaData.discountedPrice) : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetaData(idx, 'discountedPrice', e.target.value)}
                    placeholder="Enter discounted price"
                    label={"Dicounted Price"}
                  />
              <div>
                <label className="field-label" style={{display:'flex', alignItems:'center', gap:8}}>
                  <input
                    type="checkbox"
                    checked={!!variation?.metaData?.trackStock}
                    onChange={e => handleMetaData(idx, 'trackStock', e.target.checked)}
                    style={{marginRight: 8}}
                  />
                  Track Stock
                </label>
              </div>
              {variation?.metaData?.trackStock && (
                  <TextInput
                    path={`${path}.${idx}.metaData.stock`}
                    value={variation?.metaData?.stock !== undefined && variation?.metaData?.stock !== null ? String(variation.metaData.stock) : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetaData(idx, 'stock', e.target.value)}
                    placeholder="Enter stock quantity"
                    label={"Stock"}
                  />
              )}

              <UploadInput
                hasMany
                allowCreate
                path={`media`}
                relationTo="media"
                value={variation?.metaData?.photos || []}
                api="/api"
                onChange={val => handleMetaData(idx, 'photos', val)}
                serverURL={process.env.NEXT_PUBLIC_SERVER_URL}
                label={"Photos"}
                // displayPreview={true}
              />
            </div>
          </div>
        );
      })}
      <Button buttonStyle="primary" onClick={handleAddVariation} size="small" disabled={!allComplete}>Add Variation</Button>
      {!allComplete && <div style={{color: 'red', marginTop: 8}}>All required fields (attributes and price fields) must be filled before adding a new variation.</div>}
    </div>
  );
};

export default ProductVariationSelector; 




