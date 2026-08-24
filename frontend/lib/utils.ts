/**
 * Shared client helpers.
 * API client will connect to NestJS backend when available.
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}
