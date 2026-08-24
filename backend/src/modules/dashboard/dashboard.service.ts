import { Injectable } from '@nestjs/common';
import { limit, stripTags } from '../../common/utils/serialize.util';
import { storageUrl } from '../../common/utils/storage-url.util';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();

    const [
      albumsCount,
      postsCount,
      upcomingEventsCount,
      pastEventsCount,
      activeSocialLinksCount,
      latestPost,
      nextEvent,
      upcomingEvents,
    ] = await Promise.all([
      this.prisma.album.count({ where: { deletedAt: null } }),
      this.prisma.post.count({ where: { deletedAt: null } }),
      this.prisma.event.count({
        where: { eventDate: { gte: now }, deletedAt: null },
      }),
      this.prisma.event.count({
        where: { eventDate: { lt: now }, deletedAt: null },
      }),
      this.prisma.socialLink.count({ where: { isActive: true } }),
      this.prisma.post.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.event.findFirst({
        where: { eventDate: { gte: now }, deletedAt: null },
        orderBy: { eventDate: 'asc' },
      }),
      this.prisma.event.findMany({
        where: { eventDate: { gte: now }, deletedAt: null },
        orderBy: { eventDate: 'asc' },
        take: 3,
      }),
    ]);

    const latestAnnouncement = latestPost
      ? {
          id: latestPost.id,
          title: latestPost.title,
          excerpt: limit(stripTags(latestPost.content ?? ''), 120),
          status: latestPost.status,
          social_link_1: latestPost.socialLink1 ?? latestPost.instagramUrl,
          social_link_2: latestPost.socialLink2,
          created_at: latestPost.createdAt.toISOString(),
        }
      : null;

    return {
      albumsCount,
      postsCount,
      upcomingEventsCount,
      pastEventsCount,
      activeSocialLinksCount,
      nextEvent: nextEvent
        ? {
            id: nextEvent.id,
            event_name: nextEvent.eventName,
            location: nextEvent.location,
            event_date: nextEvent.eventDate?.toISOString() ?? null,
            booking_url: nextEvent.bookingUrl,
            poster_image_url: storageUrl(nextEvent.posterImage),
          }
        : null,
      upcomingEvents: upcomingEvents.map((event) => ({
        id: event.id,
        event_name: event.eventName,
        location: event.location,
        event_date: event.eventDate?.toISOString() ?? null,
        booking_url: event.bookingUrl,
        poster_image_url: storageUrl(event.posterImage),
      })),
      latestAnnouncement,
    };
  }
}
