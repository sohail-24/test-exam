/**
 * Utility functions for tenant management
 * Note: Server actions with 'use server' are in admin-actions.ts
 */

export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}