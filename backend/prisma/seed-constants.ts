/** Prefix used to tag demo rows so `seed:clear` can remove them safely. */
export const SEED_PREFIX = '[SEED]';

export function seedTitle(label: string): string {
  return `${SEED_PREFIX} ${label}`;
}

export function isSeedTitle(value: string | null | undefined): boolean {
  return String(value ?? '').startsWith(SEED_PREFIX);
}
