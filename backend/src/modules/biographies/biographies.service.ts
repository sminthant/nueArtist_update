import { Injectable, NotFoundException } from '@nestjs/common';
import { ArtistBiography } from '@prisma/client';
import { paginate, parsePage } from '../../common/utils/pagination.util';
import { storageUrl } from '../../common/utils/storage-url.util';
import { validateImageFile } from '../../common/utils/image-validation.util';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBiographyDto, UpdateBiographyDto } from './dto/biography.dto';

@Injectable()
export class BiographiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async findAll(pageInput?: unknown) {
    const page = parsePage(pageInput, 1);
    const perPage = 8;
    const where = { deletedAt: null };

    const [total, biographies] = await Promise.all([
      this.prisma.artistBiography.count({ where }),
      this.prisma.artistBiography.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return paginate(
      biographies.map((biography) => this.serializeBiography(biography)),
      total,
      page,
      perPage,
    );
  }

  async create(dto: CreateBiographyDto, image?: Express.Multer.File) {
    validateImageFile(image, { required: false, field: 'image' });

    let sortOrder = dto.sort_order;

    if (sortOrder === undefined || sortOrder === null) {
      const maxSortOrder = await this.prisma.artistBiography.aggregate({
        _max: { sortOrder: true },
        where: { deletedAt: null },
      });

      sortOrder = Math.max(0, (maxSortOrder._max.sortOrder ?? -1) + 1);
    }

    const created = await this.prisma.artistBiography.create({
      data: {
        title: dto.title,
        content: dto.content,
        sortOrder,
        ...(image ? { image: await this.mediaService.store('biographies', image) } : {}),
      },
    });

    return {
      message: 'Biography created successfully.',
      data: this.serializeBiography(created),
    };
  }

  async update(
    id: bigint,
    dto: UpdateBiographyDto,
    image?: Express.Multer.File,
  ) {
    const biography = await this.findOrFail(id);

    validateImageFile(image, { required: false, field: 'image' });

    const data: Record<string, unknown> = {
      title: dto.title,
      content: dto.content,
    };

    if (dto.sort_order !== undefined && dto.sort_order !== null) {
      data.sortOrder = dto.sort_order;
    }

    if (image) {
      await this.mediaService.delete(biography.image);
      data.image = await this.mediaService.store('biographies', image);
    }

    const updated = await this.prisma.artistBiography.update({
      where: { id },
      data,
    });

    return {
      message: 'Biography updated successfully.',
      data: this.serializeBiography(updated),
    };
  }

  async remove(id: bigint) {
    const biography = await this.findOrFail(id);

    await this.mediaService.delete(biography.image);
    await this.prisma.artistBiography.delete({ where: { id } });

    return { message: 'Biography deleted successfully.' };
  }

  private async findOrFail(id: bigint): Promise<ArtistBiography> {
    const biography = await this.prisma.artistBiography.findFirst({
      where: { id, deletedAt: null },
    });

    if (!biography) {
      throw new NotFoundException('Biography not found.');
    }

    return biography;
  }

  private serializeBiography(biography: ArtistBiography) {
    return {
      id: biography.id,
      title: biography.title,
      content: biography.content,
      image: biography.image,
      image_url: storageUrl(biography.image),
      sort_order: biography.sortOrder,
      created_at: biography.createdAt.toISOString(),
    };
  }
}
