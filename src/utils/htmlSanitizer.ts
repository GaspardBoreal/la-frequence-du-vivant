import DOMPurify from 'dompurify';

// Configuration for HTML sanitization
const sanitizeConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
    'blockquote', 'code', 'pre'
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'alt', 'src', 'width', 'height',
    'class', 'id', 'target', 'rel'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export const sanitizeHtml = (dirty: string): string => {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, sanitizeConfig);
};

/**
 * Sanitizes HTML and converts newlines to <br> tags
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string with newlines converted to <br>
 */
export const sanitizeHtmlWithLineBreaks = (dirty: string): string => {
  if (!dirty) return '';
  
  const withBreaks = dirty.replace(/\n/g, '<br />');
  return DOMPurify.sanitize(withBreaks, sanitizeConfig);
};

/**
 * React component prop for safe HTML rendering
 * @param html - The HTML string to sanitize
 * @returns Object suitable for dangerouslySetInnerHTML
 */
export const createSafeHtml = (html: string) => ({
  __html: sanitizeHtml(html)
});

/**
 * React component prop for safe HTML rendering with line breaks
 * @param html - The HTML string to sanitize and add line breaks
 * @returns Object suitable for dangerouslySetInnerHTML
 */
export const createSafeHtmlWithLineBreaks = (html: string) => ({
  __html: sanitizeHtmlWithLineBreaks(html)
});