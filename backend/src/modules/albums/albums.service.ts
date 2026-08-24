import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Album } from '@prisma/client';
import { ALBUM_CATEGORIES } from '../../common/constants/album-categories';
import { paginate, parsePage } from '../../common/utils/pagination.util';
import { formatDateTimeLocal } from '../../common/utils/serialize.util';
import { storageUrl } from '../../common/utils/storage-url.util';
import { validateImageFile } from '../../common/utils/image-validation.util';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAlbumDto, ReorderAlbumsDto, UpdateAlbumDto } from './dto/album.dto';

@Injectable()
export class AlbumsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async findAll(pageInput?: unknown) {
    const page = parsePage(pageInput, 1);
    const perPage = 5;

    const where = { deletedAt: null };

    const [total, albums] = await Promise.all([
      this.prisma.album.count({ where }),
      this.prisma.album.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return {
      ...paginate(albums.map((album) => this.serializeAlbum(album)), total, page, perPage),
      categories: ALBUM_CATEGORIES,
    };
  }

  async create(dto: CreateAlbumDto, coverImage?: Express.Multer.File) {
    validateImageFile(coverImage, { required: true, field: 'cover_image' });

    if (!dto.title || dto.title.trim() === '') {
      throw new BadRequestException({
        message: 'The given data was invalid.',
        errors: { title: ['Please enter the album title.'] },
      });
    }

    const imagePath = await this.mediaService.store('albums', coverImage!);

    await this.prisma.album.updateMany({
      where: { deletedAt: null },
      data: { sortOrder: { increment: 1 } },
    });

    const album = await this.prisma.album.create({
      data: {
        title: dto.title.trim(),
        artistName: dto.artist_name ?? null,
        coverImage: imagePath,
        category: dto.category,
        spotifyUrl: dto.spotify_url ?? null,
        soundcloudUrl: dto.soundcloud_url ?? null,
        youtubeUrl: dto.youtube_url ?? null,
        isPublished: dto.is_published ?? true,
        sortOrder: 0,
      },
    });

    return {
      message: 'Album created successfully.',
      data: this.serializeAlbum(album),
    };
  }

  async update(
    id: bigint,
    dto: UpdateAlbumDto,
    coverImage?: Express.Multer.File,
  ) {
    const album = await this.findOrFail(id);

    validateImageFile(coverImage, { required: false, field: 'cover_image' });

    if (!dto.title || dto.title.trim() === '') {
      throw new BadRequestException({
        message: 'The given data was invalid.',
        errors: { title: ['Please enter the album title.'] },
      });
    }

    const data: Record<string, unknown> = {
      title: dto.title.trim(),
      artistName: dto.artist_name ?? null,
      category: dto.category,
      spotifyUrl: dto.spotify_url ?? null,
      soundcloudUrl: dto.soundcloud_url ?? null,
      youtubeUrl: dto.youtube_url ?? null,
      isPublished: dto.is_published ?? true,
    };

    if (coverImage) {
      await this.mediaService.delete(album.coverImage);
      data.coverImage = await this.mediaService.store('albums', coverImage);
    }

    const updated = await this.prisma.album.update({
      where: { id },
      data,
    });

    return {
      message: 'Album updated successfully.',
      data: this.serializeAlbum(updated),
    };
  }

  async remove(id: bigint) {
    const album = await this.findOrFail(id);

    await this.mediaService.delete(album.coverImage);

    await this.prisma.album.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Album deleted successfully.' };
  }

  async reorder(dto: ReorderAlbumsDto) {
    if (!Array.isArray(dto.order) || dto.order.length === 0) {
      throw new BadRequestException({
        message: 'The given data was invalid.',
        errors: { order: ['The order field is required.'] },
      });
    }

    for (const [position, albumId] of dto.order.entries()) {
      const exists = await this.prisma.album.findFirst({
        where: { id: BigInt(albumId), deletedAt: null },
      });

      if (!exists) {
        throw new BadRequestException({
          message: 'The given data was invalid.',
          errors: { order: [`Album ${albumId} does not exist.`] },
        });
      }

      await this.prisma.album.update({
        where: { id: BigInt(albumId) },
        data: { sortOrder: position },
      });
    }

    return { message: 'Order updated.' };
  }

  private async findOrFail(id: bigint): Promise<Album> {
    const album = await this.prisma.album.findFirst({
      where: { id, deletedAt: null },
    });

    if (!album) {
      throw new NotFoundException('Album not found.');
    }

    return album;
  }

  private serializeAlbum(album: Album) {
    return {
      id: album.id,
      title: album.title,
      artist_name: album.artistName,
      cover_image: album.coverImage,
      cover_image_url: storageUrl(album.coverImage),
      category: album.category,
      spotify_url: album.spotifyUrl,
      soundcloud_url: album.soundcloudUrl,
      youtube_url: album.youtubeUrl,
      is_published: album.isPublished,
      sort_order: album.sortOrder,
      created_at: album.createdAt.toISOString(),
    };
  }
}
