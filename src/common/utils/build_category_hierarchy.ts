import { Payload } from 'payload'

/**
 * Recursively builds the category hierarchy path
 * @param payload - Payload instance for database queries
 * @param parentId - ID of the parent category
 * @param currentTitle - Title of the current category
 * @param visitedIds - Set of visited category IDs to prevent circular references
 * @param depth - Current recursion depth for safety limit
 * @returns Promise<string> - The full hierarchy path
 */
export async function buildCategoryHierarchy(
  payload: Payload,
  parentId: string | number,
  currentTitle: string,
  visitedIds: Set<string | number> = new Set(),
  depth: number = 0
): Promise<string> {
  // Safety limits to prevent infinite recursion
  const maxDepth = 15
  
  if (depth >= maxDepth) {
    console.warn(`Maximum hierarchy depth (${maxDepth}) reached for category "${currentTitle}"`)
    return currentTitle
  }

  if (visitedIds.has(parentId)) {
    console.warn(`Circular reference detected for category "${currentTitle}" (parent: ${parentId})`)
    return currentTitle
  }

  try {
    // Add current parent to visited set before processing
    const newVisitedIds = new Set(visitedIds)
    newVisitedIds.add(parentId)
    
    // Fetch the parent category
    const parentCategory = await payload.findByID({
      collection: 'categories',
      id: parentId,
    })

    if (!parentCategory) {
      console.warn(`Parent category ${parentId} not found for "${currentTitle}"`)
      return currentTitle
    }

    // If the parent has its own parent, recursively build the hierarchy
    if (parentCategory.parent) {
      const parentParentId = typeof parentCategory.parent === 'object' 
        ? parentCategory.parent.id 
        : parentCategory.parent
      
      // Check for circular reference before making recursive call
      if (newVisitedIds.has(parentParentId)) {
        console.warn(`Circular reference detected: parent ${parentParentId} already visited for "${currentTitle}"`)
        // When circular reference is detected, return just the safe parent path
        return parentCategory.title
      }
        
      const parentHierarchy = await buildCategoryHierarchy(
        payload,
        parentParentId,
        parentCategory.title,
        newVisitedIds,
        depth + 1
      )
      return `${parentHierarchy} > ${currentTitle}`
    } else {
      // Parent is a root category, build the final hierarchy
      return `${parentCategory.title} > ${currentTitle}`
    }
  } catch (error) {
    console.error(`Error fetching parent category ${parentId} for "${currentTitle}":`, error)
    return currentTitle
  }
}
