export type NavigationItem = {
  id: string;
  label: string;
};

export type SocialLink = {
  id: number;
  platform: string;
  url: string;
  icon?: string | null;
};

export type Release = {
  id: number;
  title: string;
  artist_name: string;
  category: string | null;
  cover_image_url: string | null;
  spotify_url: string | null;
  soundcloud_url: string | null;
  youtube_url: string | null;
};

export type Announcement = {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  social_link_1: string | null;
  social_link_2: string | null;
  created_at: string | null;
};

export type EventItem = {
  id: number;
  event_name: string;
  venue: string | null;
  location: string | null;
  event_date: string | null;
  booking_url: string | null;
  poster_image_url: string | null;
};

export type SampleLink = {
  id: number;
  name: string;
  direct_link: string;
  image_url: string | null;
  price: number;
  order: number;
};

export type ArtistOverview = {
  title: string;
  excerpt: string;
  image_url: string | null;
  image_urls: string[];
  artist_count: number;
  detail_url: string;
};

export type Biography = {
  id: number;
  title: string | null;
  content: string | null;
  image_url: string | null;
  sort_order?: number;
};

export type HomePageData = {
  navigation: NavigationItem[];
  socialLinks: SocialLink[];
  contactEmail: string;
  featuredAlbum: Release | null;
  musicReleases: Release[];
  latestAnnouncement: Announcement | null;
  upcomingEvents: EventItem[];
  pastEvents: EventItem[];
  sampleLinks: SampleLink[];
  artistOverview: ArtistOverview | null;
};
