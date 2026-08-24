import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Post, PostStatus } from '@prisma/client';
import { paginate, parsePage } from '../../common/utils/pagination.util';
import { formatDateTimeLocal } from '../../common/utils/serialize.util';
import { storageUrl } from '../../common/utils/storage-url.util';
import { validateImageFile } from '../../common/utils/image-validation.util';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async findAll(pageInput?: unknown) {
    const page = parsePage(pageInput, 1);
    const perPage = 5;
    const where = { deletedAt: null };

    const [total, posts] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return paginate(posts.map((post) => this.serializePost(post)), total, page, perPage);
  }

  async create(dto: CreatePostDto, image?: Express.Multer.File) {
    validateImageFile(image, { required: true, field: 'image' });
    this.validateTitle(dto.title);
    this.validateExpireAt(dto.expire_at);

    const created = await this.prisma.post.create({
      data: {
        title: dto.title.trim(),
        content: dto.content ?? '',
        image: await this.mediaService.store('posts', image!),
        socialLink1: dto.social_link_1 ?? null,
        socialLink2: dto.social_link_2 ?? null,
        status: dto.status as PostStatus,
        expireAt: dto.expire_at ? new Date(dto.expire_at) : null,
      },
    });

    return {
      message: 'Post created successfully.',
      data: this.serializePost(created),
    };
  }

  async update(id: bigint, dto: UpdatePostDto, image?: Express.Multer.File) {
    const post = await this.findOrFail(id);

    validateImageFile(image, { required: false, field: 'image' });
    this.validateTitle(dto.title);
    this.validateExpireAt(dto.expire_at);

    const data: Record<string, unknown> = {
      title: dto.title.trim(),
      content: dto.content ?? post.content ?? '',
      socialLink1: dto.social_link_1 ?? null,
      socialLink2: dto.social_link_2 ?? null,
      status: dto.status as PostStatus,
      expireAt: dto.expire_at ? new Date(dto.expire_at) : null,
    };

    if (image) {
      await this.mediaService.delete(post.image);
      data.image = await this.mediaService.store('posts', image);
    }

    const updated = await this.prisma.post.update({ where: { id }, data });

    return {
      message: 'Post updated successfully.',
      data: this.serializePost(updated),
    };
  }

  async remove(id: bigint) {
    const post = await this.findOrFail(id);

    await this.mediaService.delete(post.image);
    await this.prisma.post.delete({ where: { id } });

    return { message: 'Post deleted successfully.' };
  }

  private validateTitle(title: string): void {
    if (!title || title.trim() === '') {
      throw new BadRequestException({
        message: 'The given data was invalid.',
        errors: { title: ['Please enter the post title.'] },
      });
    }
  }

  private validateExpireAt(expireAt?: string | null): void {
    if (!expireAt) {
      return;
    }

    const date = new Date(expireAt);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException({
        message: 'The given data was invalid.',
        errors: { expire_at: ['Please enter a valid date and time.'] },
      });
    }

    if (date.getTime() <= Date.now()) {
      throw new BadRequestException({
        message: 'The given data was invalid.',
        errors: {
          expire_at: ['Expiration date and time must be in the future.'],
        },
      });
    }
  }

  private async findOrFail(id: bigint): Promise<Post> {
    const post = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    return post;
  }

  private serializePost(post: Post) {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      image: post.image,
      image_url: storageUrl(post.image),
      social_link_1: post.socialLink1 ?? post.instagramUrl,
      social_link_2: post.socialLink2,
      status: post.status,
      expire_at: formatDateTimeLocal(post.expireAt),
      created_at: post.createdAt.toISOString(),
    };
  }
}
