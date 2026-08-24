'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

/** Bust Next.js ISR cache for all public client pages after admin content changes. */
export async function revalidatePublicSite(): Promise<void> {
  revalidateTag('public-home');
  revalidateTag('public-music');
  revalidateTag('public-biographies');
  revalidatePath('/');
  revalidatePath('/music');
  revalidatePath('/artist-biographies');
}
