import type {
  Announcement,
  ArtistOverview,
  Biography,
  EventItem,
  HomePageData,
  NavigationItem,
  Release,
  SampleLink,
  SocialLink,
} from '@/types';
import { DEMO_BIOGRAPHY_IMAGES, DEMO_IMAGES } from '@/lib/demo-images';

export const navigation: NavigationItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'music', label: 'Music' },
  { id: 'shows', label: 'Shows' },
  { id: 'sample-links', label: 'Shop' },
  { id: 'about', label: 'About' },
];

export const socialLinks: SocialLink[] = [
  { id: 1, platform: 'Spotify', url: 'https://open.spotify.com/', icon: 'spotify' },
  { id: 2, platform: 'Instagram', url: 'https://instagram.com/', icon: 'instagram' },
  { id: 3, platform: 'YouTube', url: 'https://youtube.com/', icon: 'youtube' },
  { id: 4, platform: 'SoundCloud', url: 'https://soundcloud.com/', icon: 'soundcloud' },
  { id: 5, platform: 'Twitter', url: 'https://twitter.com/', icon: 'twitter' },
];

export const contactEmail = 'contact@nue.artist';

const albumCovers = [DEMO_IMAGES.album, DEMO_IMAGES.album];

export const releases: Release[] = [
  {
    id: 1,
    title: 'NUE — Latest',
    artist_name: 'NUE',
    category: 'Latest Releases',
    cover_image_url: albumCovers[0],
    spotify_url: 'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy',
    soundcloud_url: 'https://soundcloud.com/discover',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: 2,
    title: 'Chrome Red',
    artist_name: 'NUE',
    category: 'NUE',
    cover_image_url: albumCovers[1],
    spotify_url: 'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy',
    soundcloud_url: null,
    youtube_url: null,
  },
  {
    id: 3,
    title: 'Label Session',
    artist_name: 'NUE',
    category: 'Label Releases',
    cover_image_url: albumCovers[0],
    spotify_url: null,
    soundcloud_url: 'https://soundcloud.com/discover',
    youtube_url: null,
  },
  {
    id: 4,
    title: 'Live Set 01',
    artist_name: 'NUE',
    category: 'Live sets',
    cover_image_url: albumCovers[1],
    spotify_url: null,
    soundcloud_url: null,
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
];

export const featuredAlbum: Release = releases[0];

export const latestAnnouncement: Announcement = {
  id: 1,
  title: 'New Drop Incoming',
  content:
    '<p>Cinematic bass music, raw club energy, and immersive visuals. Stay tuned for the next NUE release and tour dates.</p>',
  image_url: DEMO_IMAGES.announcement,
  social_link_1: 'https://instagram.com/',
  social_link_2: 'https://x.com/',
  created_at: new Date().toISOString(),
};

export const upcomingEvents: EventItem[] = [
  {
    id: 1,
    event_name: 'NUE Live',
    venue: 'Main Stage',
    location: 'Bangkok',
    event_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    booking_url: 'https://example.com/tickets',
    poster_image_url: DEMO_IMAGES.event,
  },
];

export const pastEvents: EventItem[] = [
  {
    id: 2,
    event_name: 'Underground Night',
    venue: 'Warehouse',
    location: 'Bangkok',
    event_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    booking_url: null,
    poster_image_url: DEMO_IMAGES.event,
  },
];

export const sampleLinks: SampleLink[] = [
  {
    id: 1,
    name: 'Pack Alpha',
    direct_link: 'https://example.com/pack-alpha',
    image_url: DEMO_IMAGES.sampleLink,
    price: 29.99,
    order: 0,
  },
  {
    id: 2,
    name: 'Pack Beta',
    direct_link: 'https://example.com/pack-beta',
    image_url: DEMO_IMAGES.sampleLink,
    price: 34.99,
    order: 1,
  },
  {
    id: 3,
    name: 'Pack Gamma',
    direct_link: 'https://example.com/pack-gamma',
    image_url: DEMO_IMAGES.sampleLink,
    price: 24.99,
    order: 2,
  },
  {
    id: 4,
    name: 'Pack Delta',
    direct_link: 'https://example.com/pack-delta',
    image_url: DEMO_IMAGES.sampleLink,
    price: 39.99,
    order: 3,
  },
];

const biographyImages = [...DEMO_BIOGRAPHY_IMAGES];

export const biographies: Biography[] = [
  {
    id: 1,
    title: 'Early Years',
    content:
      'NUE emerged from the neo-underground with a focus on cinematic bass and high-energy club performance.\n\nThe sound blends immersive textures with raw physicality, built for both headphones and dark rooms.',
    image_url: biographyImages[0],
    sort_order: 0,
  },
  {
    id: 2,
    title: 'The Sound',
    content:
      'From heavy low-end to chrome-edged melodies, every release is designed as a visual and sonic experience.\n\nLive sets push that energy further — lights, motion, and pressure in sync.',
    image_url: biographyImages[1],
    sort_order: 1,
  },
  {
    id: 3,
    title: 'Today',
    content:
      'NUE continues to expand across releases, shows, and sample packs for producers who want the same edge.',
    image_url: biographyImages[2],
    sort_order: 2,
  },
];

export const artistOverview: ArtistOverview = {
  title: 'Artist Overview',
  excerpt:
    'NUE emerged from the neo-underground with a focus on cinematic bass and high-energy club performance...',
  image_url: biographyImages[0],
  image_urls: biographyImages,
  artist_count: biographies.length,
  detail_url: '/artist-biographies',
};

export function getHomePageData(): HomePageData {
  return {
    navigation,
    socialLinks,
    contactEmail,
    featuredAlbum,
    musicReleases: [featuredAlbum],
    latestAnnouncement,
    upcomingEvents,
    pastEvents,
    sampleLinks,
    artistOverview,
  };
}

export function getMusicPageData() {
  return {
    releases,
    navigation,
    socialLinks,
    contactEmail,
  };
}

export function getBiographiesPageData() {
  return {
    biographies,
    navigation,
    socialLinks,
    contactEmail,
  };
}

export function getBiographyById(id: number): Biography | undefined {
  return biographies.find((biography) => biography.id === id);
}
