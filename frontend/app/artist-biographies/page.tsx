import BiographiesPage from '@/components/sections/BiographiesPage';
import { getBiographiesPageData } from '@/services/api';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Artist Details',
};

export default async function Page() {
  const data = await getBiographiesPageData();
  return <BiographiesPage {...data} />;
}
