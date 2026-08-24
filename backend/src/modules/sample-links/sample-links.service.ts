import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SampleLink } from '@prisma/client';
import { paginate, parsePage } from '../../common/utils/pagination.util';
import {
  isRemoteUrl,
  resolveSampleImageUrl,
} from '../../common/utils/storage-url.util';
import { validateImageFile } from '../../common/utils/image-validation.util';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSampleLinkDto,
  ReorderSampleLinksDto,
  ToggleSampleLinkDto,
  UpdateSampleLinkDto,
} from './dto/sample-link.dto';

@Injectable()
export class SampleLinksService {
  private readonly logger = new Logger(SampleLinksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async findAll(searchInput?: unknown, pageInput?: unknown) {
    const search = typeof searchInput === 'string' ? searchInput.trim() : '';
    const page = parsePage(pageInput, 1);
    const perPage = 10;

    const where = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { directLink: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, sampleLinks] = await Promise.all([
      this.prisma.sampleLink.count({ where }),
      this.prisma.sampleLink.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return {
      ...paginate(
        sampleLinks.map((sampleLink) => this.serializeSampleLink(sampleLink)),
        total,
        page,
        perPage,
      ),
      filters: { search },
    };
  }

  async create(dto: CreateSampleLinkDto, image?: Express.Multer.File) {
    try {
      validateImageFile(image, { required: false, field: 'image' });

      const created = await this.prisma.sampleLink.create({
        data: {
          name: dto.name,
          directLink: dto.direct_link,
          price: dto.price,
          isActive: dto.is_active ?? true,
          order: dto.order ?? 0,
          ...(image ? { image: await this.mediaService.store('sample-links', image) } : {}),
        },
      });

      return {
        message: 'Sample link created successfully.',
        data: this.serializeSampleLink(created),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Failed to create sample link.', error);

      throw new InternalServerErrorException({
        message: 'The given data was invalid.',
        errors: {
          sample_links: ['Failed to create sample link. Please try again.'],
        },
      });
    }
  }

  async update(
    id: bigint,
    dto: UpdateSampleLinkDto,
    image?: Express.Multer.File,
  ) {
    try {
      const sampleLink = await this.findOrFail(id);

      validateImageFile(image, { required: false, field: 'image' });

      const data: Record<string, unknown> = {
        name: dto.name,
        directLink: dto.direct_link,
        price: dto.price,
        isActive: dto.is_active ?? true,
        order: dto.order ?? 0,
      };

      if (image) {
        if (sampleLink.image && !isRemoteUrl(sampleLink.image)) {
          await this.mediaService.delete(sampleLink.image);
        }

        data.image = await this.mediaService.store('sample-links', image);
      }

      const updated = await this.prisma.sampleLink.update({ where: { id }, data });

      return {
        message: 'Sample link updated successfully.',
        data: this.serializeSampleLink(updated),
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(`Failed to update sample link ${id.toString()}.`, error);

      throw new InternalServerErrorException({
        message: 'The given data was invalid.',
        errors: {
          sample_links: ['Failed to update sample link. Please try again.'],
        },
      });
    }
  }

  async remove(id: bigint) {
    try {
      const sampleLink = await this.findOrFail(id);

      if (sampleLink.image && !isRemoteUrl(sampleLink.image)) {
        await this.mediaService.delete(sampleLink.image);
      }

      await this.prisma.sampleLink.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return { message: 'Sample link deleted successfully.' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to delete sample link ${id.toString()}.`, error);

      throw new InternalServerErrorException({
        message: 'The given data was invalid.',
        errors: {
          sample_links: ['Failed to delete sample link. Please try again.'],
        },
      });
    }
  }

  async toggleActive(id: bigint, dto: ToggleSampleLinkDto) {
    try {
      await this.findOrFail(id);

      const updated = await this.prisma.sampleLink.update({
        where: { id },
        data: { isActive: dto.is_active },
      });

      return {
        message: 'Sample link status updated successfully.',
        data: this.serializeSampleLink(updated),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to toggle sample link status ${id.toString()}.`,
        error,
      );

      throw new InternalServerErrorException({
        message: 'The given data was invalid.',
        errors: {
          sample_links: ['Failed to update status. Please try again.'],
        },
      });
    }
  }

  async reorder(dto: ReorderSampleLinksDto) {
    try {
      for (const [position, sampleLinkId] of dto.order.entries()) {
        const exists = await this.prisma.sampleLink.findFirst({
          where: { id: BigInt(sampleLinkId), deletedAt: null },
        });

        if (!exists) {
          throw new BadRequestException({
            message: 'The given data was invalid.',
            errors: {
              order: [`Sample link ${sampleLinkId} does not exist.`],
            },
          });
        }

        await this.prisma.sampleLink.update({
          where: { id: BigInt(sampleLinkId) },
          data: { order: position },
        });
      }

      return { message: 'Sample link order updated successfully.' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Failed to reorder sample links.', error);

      throw new InternalServerErrorException({
        message: 'The given data was invalid.',
        errors: {
          sample_links: ['Failed to reorder sample links. Please try again.'],
        },
      });
    }
  }

  private async findOrFail(id: bigint): Promise<SampleLink> {
    const sampleLink = await this.prisma.sampleLink.findFirst({
      where: { id, deletedAt: null },
    });

    if (!sampleLink) {
      throw new NotFoundException('Sample link not found.');
    }

    return sampleLink;
  }

  private serializeSampleLink(sampleLink: SampleLink) {
    return {
      id: sampleLink.id,
      name: sampleLink.name,
      direct_link: sampleLink.directLink,
      image: sampleLink.image,
      image_url: resolveSampleImageUrl(sampleLink.image),
      price: Number(sampleLink.price),
      is_active: sampleLink.isActive,
      order: sampleLink.order,
      created_at: sampleLink.createdAt.toISOString(),
    };
  }
}
