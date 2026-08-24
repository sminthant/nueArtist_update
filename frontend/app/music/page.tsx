import MusicPage from '@/components/sections/MusicPage';
import { getMusicPageData } from '@/services/api';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Music Releases',
};

export default async function Page() {
  const data = await getMusicPageData();
  return <MusicPage {...data} />;
}
