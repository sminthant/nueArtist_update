import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Event } from '@prisma/client';
import { paginate, parsePage } from '../../common/utils/pagination.util';
import { formatDateTimeLocal } from '../../common/utils/serialize.util';
import { storageUrl } from '../../common/utils/storage-url.util';
import { validateImageFile } from '../../common/utils/image-validation.util';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async findAll(filterInput?: unknown, pageInput?: unknown) {
    const filter = filterInput === 'past' ? 'past' : 'upcoming';
    const page = parsePage(pageInput, 1);
    const perPage = 8;
    const now = new Date();

    const where =
      filter === 'upcoming'
        ? { deletedAt: null, eventDate: { gte: now } }
        : { deletedAt: null, eventDate: { lt: now } };

    const orderBy =
      filter === 'upcoming'
        ? [{ eventDate: 'asc' as const }, { createdAt: 'desc' as const }]
        : [{ eventDate: 'desc' as const }, { createdAt: 'desc' as const }];

    const [total, events, nextEvent] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.event.findFirst({
        where: { deletedAt: null, eventDate: { gte: now } },
        orderBy: { eventDate: 'asc' },
      }),
    ]);

    return {
      filter,
      nextEventId: nextEvent?.id ?? null,
      ...paginate(events.map((event) => this.serializeEvent(event)), total, page, perPage),
    };
  }

  async create(dto: CreateEventDto, posterImage?: Express.Multer.File) {
    validateImageFile(posterImage, { required: true, field: 'poster_image' });
    this.validateFutureEventDate(dto.event_date, true);

    const created = await this.prisma.event.create({
      data: {
        eventName: dto.event_name,
        venue: dto.venue,
        location: dto.location,
        eventDate: new Date(dto.event_date),
        posterImage: await this.mediaService.store('events', posterImage!),
        bookingUrl: dto.booking_url,
      },
    });

    return {
      message: 'Event created successfully.',
      data: this.serializeEvent(created),
    };
  }

  async update(
    id: bigint,
    dto: UpdateEventDto,
    posterImage?: Express.Multer.File,
  ) {
    const event = await this.findOrFail(id);

    validateImageFile(posterImage, { required: false, field: 'poster_image' });

    const eventDate = new Date(dto.event_date);

    if (Number.isNaN(eventDate.getTime())) {
      throw new BadRequestException({
        message: 'The given data was invalid.',
        errors: {
          event_date: ['Please enter a valid event date and time.'],
        },
      });
    }

    const data: Record<string, unknown> = {
      eventName: dto.event_name,
      venue: dto.venue,
      location: dto.location,
      eventDate,
      bookingUrl: dto.booking_url,
    };

    if (posterImage) {
      await this.mediaService.delete(event.posterImage);
      data.posterImage = await this.mediaService.store('events', posterImage);
    }

    const updated = await this.prisma.event.update({ where: { id }, data });

    return {
      message: 'Event updated successfully.',
      data: this.serializeEvent(updated),
    };
  }

  async remove(id: bigint) {
    const event = await this.findOrFail(id);

    await this.mediaService.delete(event.posterImage);
    await this.prisma.event.delete({ where: { id } });

    return { message: 'Event cancelled successfully.' };
  }

  private validateFutureEventDate(eventDate: string, isCreate: boolean): void {
    const date = new Date(eventDate);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException({
        message: 'The given data was invalid.',
        errors: {
          event_date: ['Please enter a valid event date and time.'],
        },
      });
    }

    if (isCreate && date.getTime() <= Date.now()) {
      throw new BadRequestException({
        message: 'The given data was invalid.',
        errors: {
          event_date: ['Event date and time must be in the future.'],
        },
      });
    }
  }

  private async findOrFail(id: bigint): Promise<Event> {
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    return event;
  }

  private serializeEvent(event: Event) {
    return {
      id: event.id,
      event_name: event.eventName,
      venue: event.venue,
      location: event.location,
      event_date: formatDateTimeLocal(event.eventDate),
      poster_image: event.posterImage,
      poster_image_url: storageUrl(event.posterImage),
      booking_url: event.bookingUrl,
      created_at: event.createdAt.toISOString(),
    };
  }
}
