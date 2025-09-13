/**
 * Utility functions for text processing
 */

/**
 * Extracts plain text from HTML content by removing all HTML tags and decoding entities
 * @param html - The HTML string to convert to plain text
 * @returns Clean plain text string
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';
  
  // Create a temporary div element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Extract text content and normalize whitespace
  return tempDiv.textContent || tempDiv.innerText || '';
};

/**
 * Truncates text to a specified number of words
 * @param text - The text to truncate
 * @param wordLimit - Maximum number of words
 * @returns Truncated text with ellipsis if needed
 */
export const truncateWords = (text: string, wordLimit: number): string => {
  if (!text) return '';
  
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) {
    return text;
  }
  
  return words.slice(0, wordLimit).join(' ') + '...';
};