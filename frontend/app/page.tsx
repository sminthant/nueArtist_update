import HomePage from '@/components/sections/HomePage';
import { getHomePageData } from '@/services/api';

export default async function Page() {
  const data = await getHomePageData();
  return <HomePage data={data} />;
}
