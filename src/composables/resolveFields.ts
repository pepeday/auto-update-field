import { render, renderFn, get } from 'micromustache';

/**
 * Custom resolver function for micromustache
 */
function resolve(path: string, scope: any) {
  const value = get(scope, path);
  return typeof value === 'object' ? JSON.stringify(value) : value;
}

/**
 * Resolves a template string using current values
 */
export const resolveValue = (
  template: string,
  currentValues: Record<string, any>
): string => {
  try {
    // If template doesn't contain mustache syntax, return as is
    if (!template.includes('{{')) {
      return template;
    }

    // Check for raw template (exact match like {{field}})
    const raw = template.match(/^\{\{\s*([^}\s]+)\s*\}\}$/);
    if (raw) {
      const value = get(currentValues, raw[1]);
      if (value !== undefined) {
        return value;
      }
    }

    // Use renderFn with custom resolver for more complex templates
    return renderFn(template, resolve, currentValues, { explicit: true });
  } catch (error) {
    console.warn(`Error resolving template "${template}":`, error);
    return String(value);
  }
};
