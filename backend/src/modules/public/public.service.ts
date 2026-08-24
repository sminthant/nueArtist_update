import { Injectable, NotFoundException } from '@nestjs/common';
import { PostStatus } from '@prisma/client';
import { limit, stripTags } from '../../common/utils/serialize.util';
import { resolveSampleImageUrl, storageUrl } from '../../common/utils/storage-url.util';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  private readonly navigation = [
    { id: 'home', label: 'Home' },
    { id: 'music', label: 'Music' },
    { id: 'shows', label: 'Shows' },
    { id: 'sample-links', label: 'Shop' },
    { id: 'about', label: 'About' },
  ];

  private async getSharedContext() {
    const [socialLinks, contactEmail] = await Promise.all([
      this.prisma.socialLink.findMany({
        where: { isActive: true },
        orderBy: { platform: 'asc' },
      }),
      this.usersService.getAdminContactEmail(),
    ]);

    return {
      navigation: this.navigation,
      socialLinks: socialLinks.map((link) => ({
        id: link.id,
        platform: link.platform,
        url: link.url,
        icon: link.icon,
      })),
      contactEmail,
    };
  }

  async getHome() {
    const now = new Date();
    const shared = await this.getSharedContext();

    const [
      featuredAlbum,
      musicRelease,
      latestAnnouncement,
      upcomingEvents,
      pastEvents,
      artistBiographyCount,
      leadBiography,
      overviewImages,
      sampleLinks,
    ] = await Promise.all([
      this.prisma.album.findFirst({
        where: { isPublished: true, deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.album.findFirst({
        where: { isPublished: true, deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.post.findFirst({
        where: {
          status: PostStatus.published,
          deletedAt: null,
          OR: [{ expireAt: null }, { expireAt: { gt: now } }],
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.event.findMany({
        where: { eventDate: { gte: now }, deletedAt: null },
        orderBy: { eventDate: 'asc' },
        take: 6,
      }),
      this.prisma.event.findMany({
        where: { eventDate: { lt: now }, deletedAt: null },
        orderBy: { eventDate: 'desc' },
        take: 6,
      }),
      this.prisma.artistBiography.count({ where: { deletedAt: null } }),
      this.prisma.artistBiography.findFirst({
        where: { deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.artistBiography.findMany({
        where: { image: { not: null }, deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        select: { image: true },
      }),
      this.prisma.sampleLink.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      }),
    ]);

    const musicReleases = musicRelease
      ? [
          {
            id: musicRelease.id,
            title: musicRelease.title,
            artist_name: musicRelease.artistName,
            category: musicRelease.category,
            cover_image_url: storageUrl(musicRelease.coverImage),
            spotify_url: musicRelease.spotifyUrl,
            soundcloud_url: musicRelease.soundcloudUrl,
            youtube_url: musicRelease.youtubeUrl,
          },
        ]
      : [];

    const artistOverview = leadBiography
      ? {
          title: 'Artist Overview',
          excerpt: limit(stripTags(leadBiography.content ?? ''), 180),
          image_url: storageUrl(leadBiography.image),
          image_urls: overviewImages
            .map((item) => storageUrl(item.image))
            .filter((url): url is string => url !== null),
          artist_count: artistBiographyCount,
          detail_url: '/artist-biographies',
        }
      : null;

    return {
      ...shared,
      featuredAlbum: featuredAlbum
        ? {
            id: featuredAlbum.id,
            title: featuredAlbum.title,
            cover_image_url: storageUrl(featuredAlbum.coverImage),
            artist_name: featuredAlbum.artistName,
            category: featuredAlbum.category,
            spotify_url: featuredAlbum.spotifyUrl,
            soundcloud_url: featuredAlbum.soundcloudUrl,
            youtube_url: featuredAlbum.youtubeUrl,
          }
        : null,
      musicReleases,
      latestAnnouncement: latestAnnouncement
        ? {
            id: latestAnnouncement.id,
            title: latestAnnouncement.title,
            content: latestAnnouncement.content,
            image_url: storageUrl(latestAnnouncement.image),
            social_link_1:
              latestAnnouncement.socialLink1 ?? latestAnnouncement.instagramUrl,
            social_link_2: latestAnnouncement.socialLink2,
            created_at: latestAnnouncement.createdAt.toISOString(),
          }
        : null,
      sampleLinks: sampleLinks.map((sampleLink) => ({
        id: sampleLink.id,
        name: sampleLink.name,
        direct_link: sampleLink.directLink,
        image_url: resolveSampleImageUrl(sampleLink.image),
        price: Number(sampleLink.price),
        order: sampleLink.order,
      })),
      upcomingEvents: upcomingEvents.map((event) => ({
        id: event.id,
        event_name: event.eventName,
        venue: event.venue,
        location: event.location,
        event_date: event.eventDate?.toISOString() ?? null,
        booking_url: event.bookingUrl,
        poster_image_url: storageUrl(event.posterImage),
      })),
      pastEvents: pastEvents.map((event) => ({
        id: event.id,
        event_name: event.eventName,
        venue: event.venue,
        location: event.location,
        event_date: event.eventDate?.toISOString() ?? null,
        booking_url: event.bookingUrl,
        poster_image_url: storageUrl(event.posterImage),
      })),
      artistOverview,
    };
  }

  async getMusic() {
    const shared = await this.getSharedContext();

    const releases = await this.prisma.album.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return {
      ...shared,
      releases: releases.map((album) => ({
        id: album.id,
        title: album.title,
        artist_name: album.artistName,
        category: album.category,
        cover_image_url: storageUrl(album.coverImage),
        spotify_url: album.spotifyUrl,
        soundcloud_url: album.soundcloudUrl,
        youtube_url: album.youtubeUrl,
      })),
    };
  }

  async getArtistBiographies() {
    const shared = await this.getSharedContext();

    const biographies = await this.prisma.artistBiography.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return {
      ...shared,
      biographies: biographies.map((biography) => ({
        id: biography.id,
        title: biography.title,
        content: biography.content,
        image_url: storageUrl(biography.image),
      })),
    };
  }

  async getArtistBiography(id: bigint) {
    const shared = await this.getSharedContext();

    const biography = await this.prisma.artistBiography.findFirst({
      where: { id, deletedAt: null },
    });

    if (!biography) {
      throw new NotFoundException('Artist biography not found.');
    }

    return {
      ...shared,
      biography: {
        id: biography.id,
        title: biography.title,
        content: biography.content,
        image_url: storageUrl(biography.image),
      },
    };
  }
}
