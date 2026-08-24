import {
  getBiographiesPageData as getStaticBiographiesPageData,
  getHomePageData as getStaticHomePageData,
  getMusicPageData as getStaticMusicPageData,
} from '@/services/siteData';
import type { HomePageData } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function fetchApi<T>(path: string, tag: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      next: { revalidate: 60, tags: [tag] },
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return (json.data ?? json) as T;
  } catch {
    return null;
  }
}

export async function getHomePageData(): Promise<HomePageData> {
  const data = await fetchApi<HomePageData>('/public/home', 'public-home');
  return data ?? getStaticHomePageData();
}

export async function getMusicPageData() {
  const data = await fetchApi<Awaited<ReturnType<typeof getStaticMusicPageData>>>(
    '/public/music',
    'public-music',
  );
  return data ?? getStaticMusicPageData();
}

export async function getBiographiesPageData() {
  const data = await fetchApi<Awaited<ReturnType<typeof getStaticBiographiesPageData>>>(
    '/public/artist-biographies',
    'public-biographies',
  );
  return data ?? getStaticBiographiesPageData();
}

export async function getBiographyById(id: number) {
  const data = await fetchApi<{
    biography: {
      id: number;
      title: string | null;
      content: string | null;
      image_url: string | null;
    };
    navigation: HomePageData['navigation'];
    socialLinks: HomePageData['socialLinks'];
    contactEmail: string;
  }>(`/public/artist-biographies/${id}`, 'public-biographies');

  if (data) {
    return data;
  }

  const staticData = getStaticBiographiesPageData();
  const biography = staticData.biographies.find((item) => item.id === id);

  return {
    biography: biography ?? null,
    navigation: staticData.navigation,
    socialLinks: staticData.socialLinks,
    contactEmail: staticData.contactEmail,
  };
}
