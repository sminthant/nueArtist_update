export const ALBUM_CATEGORIES = [
  'Latest Releases',
  'NUE',
  'Label Releases',
  'Live sets',
] as const;

export type AlbumCategory = (typeof ALBUM_CATEGORIES)[number];
