/**
 * Zero-Dependency DevSecOps Sanitization Utilities
 * Mitigates OWASP Top 10 Injection/XSS risks on client-side inputs.
 */

export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  // Escape standard dangerous entities
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function stripHTML(input: string): string {
  if (!input) return '';
  
  // Strict strip of any HTML-like tags
  return input.replace(/<\/?[^>]+(>|$)/g, '');
}

export function validateEmail(email: string): boolean {
  if (!email) return false;
  // RFC 5322 compliant regex check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}
