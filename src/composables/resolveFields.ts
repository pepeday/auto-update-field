import { render, renderFn, get } from 'micromustache';
import type { Api } from '@directus/types';
import { adjustDate } from '@directus/utils';

const relationCache = new Map<string, any>();

/**
 * Fetch and cache relation data
 */
async function fetchRelation(api: Api, collection: string, field: string, id: string | number, relationsStore: any) {
  const relation = relationsStore.getRelationsForField(collection, field)?.[0];
  
  if (!relation) {
    console.warn(`No relation found for field ${field} in collection ${collection}`);
    return null;
  }

  const relatedCollection = relation.related_collection;
  const cacheKey = `${relatedCollection}:${id}`;
  
  if (relationCache.has(cacheKey)) {
    return relationCache.get(cacheKey);
  }

  try {
    const response = await api.get(`/items/${relatedCollection}/${id}`);
    const data = response.data.data;
    relationCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.warn(`Failed to fetch relation ${relatedCollection}/${id}:`, error);
    return null;
  }
}

type DateAdjustment = {
  date: string;      // yyyy-mm-dd
  adjustment: string; // +1y, -2mo, etc.
};

/**
 * Safely parses a date adjustment string like: "2024-01-20(+1y)"
 */
function parseDateAdjustment(input: string): DateAdjustment | null {
  const match = input.match(/^(\d{4}-\d{2}-\d{2})\(([+-]?\d+[a-z]+)\)$/);
  if (!match) return null;

  const [, date, adjustment] = match;
  return { date, adjustment };
}

/**
 * Safely executes a date adjustment
 */
function executeDateAdjustment(operation: DateAdjustment): string {
  const date = new Date(operation.date);
  const result = adjustDate(date, operation.adjustment);
  return result ? result.toISOString().split('T')[0] : operation.date;
}

/**
 * Resolves a template string using current values and evaluates any date-fns expressions
 */
export const resolveValue = async (
  api: Api,
  template: string,
  currentValues: Record<string, any>,
  collection: string,
  relationsStore: any
): Promise<string> => {
  try {
    // First resolve all mustache templates
    const resolvedTemplate = await resolveTemplates();
    console.log('Mustache template resolved to:', resolvedTemplate);
    
    // Then evaluate any date expressions
    if (resolvedTemplate.match(/\d{4}-\d{2}-\d{2}\([+-]?\d+[a-z]+\)/)) {
      console.log('Found date adjustment within:', resolvedTemplate);
      
      // Replace each date adjustment while keeping surrounding text
      return resolvedTemplate.replace(
        /(\d{4}-\d{2}-\d{2})\(([+-]?\d+[a-z]+)\)/g,
        (match, date, adjustment) => {
          const operation = { date, adjustment };
          return executeDateAdjustment(operation);
        }
      );
    }

    return resolvedTemplate;
  } catch (error) {
    console.warn(`Error resolving template "${template}":`, error);
    return template;
  }

  async function resolveTemplates() {
    if (!template.includes('{{')) {
      return template;
    }

    const matches = template.match(/{{\s*([^}]+)\s*}}/g);
    if (!matches) return template;

    let resolvedTemplate = template;

    for (const match of matches) {
      const path = match.replace(/{{\s*|\s*}}/g, '').trim();
      const [field, ...nestedPath] = path.split('.');
      const value = get(currentValues, field);

      let resolvedValue: any;

      // If value is an object, try to get nested value directly
      if (typeof value === 'object' && value !== null) {
        resolvedValue = nestedPath.length ? get(value, nestedPath.join('.')) : value;
      } 
      // If value is primitive and we have nested path, try to fetch
      else if (nestedPath.length > 0 && (typeof value === 'number' || typeof value === 'string')) {
        const relatedData = await fetchRelation(api, collection, field, value, relationsStore);
        resolvedValue = relatedData ? get(relatedData, nestedPath.join('.')) : '';
      } 
      // Simple value
      else {
        resolvedValue = value;
      }

      resolvedTemplate = resolvedTemplate.replace(
        match, 
        typeof resolvedValue === 'object' ? 
          JSON.stringify(resolvedValue) : 
          String(resolvedValue ?? '')
      );
    }

    return resolvedTemplate;
  }
};
