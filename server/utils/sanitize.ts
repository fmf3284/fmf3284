/**
 * Input sanitization utilities to prevent XSS attacks
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes all HTML tags and encodes special characters
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Encode special characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    // Trim whitespace
    .trim();
}

/**
 * Sanitize text input (for comments, reviews, etc.)
 * Allows basic formatting but removes dangerous content
 */
export function sanitizeText(input: string): string {
  if (!input) return '';

  return sanitizeHtml(input)
    // Decode safe HTML entities (for quotes, etc.)
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitize URL to prevent javascript: and data: schemes
 */
export function sanitizeUrl(input: string): string {
  if (!input) return '';

  const url = input.trim().toLowerCase();

  // Block dangerous schemes
  if (
    url.startsWith('javascript:') ||
    url.startsWith('data:') ||
    url.startsWith('vbscript:') ||
    url.startsWith('file:')
  ) {
    return '';
  }

  return input.trim();
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(input: string): string {
  if (!input) return '';

  return input
    .trim()
    .toLowerCase()
    // Remove any HTML
    .replace(/<[^>]*>/g, '')
    // Basic email validation
    .replace(/[^a-z0-9@._+-]/g, '');
}

/**
 * Sanitize user input object (recursive)
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Sanitize string values
      if (key === 'email') {
        sanitized[key] = sanitizeEmail(value);
      } else if (key === 'website' || key === 'url') {
        sanitized[key] = sanitizeUrl(value);
      } else if (key === 'comment' || key === 'description' || key === 'bio') {
        sanitized[key] = sanitizeText(value);
      } else {
        sanitized[key] = sanitizeHtml(value);
      }
    } else if (Array.isArray(value)) {
      // Recursively sanitize arrays
      sanitized[key] = value.map(item =>
        typeof item === 'object' ? sanitizeObject(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value);
    } else {
      // Keep other types as-is (numbers, booleans, null, undefined)
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
