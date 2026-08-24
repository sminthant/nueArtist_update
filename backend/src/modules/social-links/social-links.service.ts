import { Injectable, NotFoundException } from '@nestjs/common';
import { SocialLink } from '@prisma/client';
import { paginate, parsePage } from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSocialLinkDto,
  UpdateSocialLinkDto,
} from './dto/social-link.dto';

@Injectable()
export class SocialLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(pageInput?: unknown) {
    const page = parsePage(pageInput, 1);
    const perPage = 10;

    const [total, socialLinks] = await Promise.all([
      this.prisma.socialLink.count(),
      this.prisma.socialLink.findMany({
        orderBy: [{ isActive: 'desc' }, { platform: 'asc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return paginate(
      socialLinks.map((link) => this.serializeSocialLink(link)),
      total,
      page,
      perPage,
    );
  }

  async create(dto: CreateSocialLinkDto) {
    const created = await this.prisma.socialLink.create({
      data: {
        platform: dto.platform,
        url: dto.url,
        icon: dto.icon ?? null,
        isActive: dto.is_active ?? true,
      },
    });

    return {
      message: 'Social link created successfully.',
      data: this.serializeSocialLink(created),
    };
  }

  async update(id: bigint, dto: UpdateSocialLinkDto) {
    await this.findOrFail(id);

    const updated = await this.prisma.socialLink.update({
      where: { id },
      data: {
        platform: dto.platform,
        url: dto.url,
        icon: dto.icon ?? null,
        isActive: dto.is_active ?? true,
      },
    });

    return {
      message: 'Social link updated successfully.',
      data: this.serializeSocialLink(updated),
    };
  }

  async remove(id: bigint) {
    await this.findOrFail(id);
    await this.prisma.socialLink.delete({ where: { id } });

    return { message: 'Social link deleted successfully.' };
  }

  private async findOrFail(id: bigint): Promise<SocialLink> {
    const socialLink = await this.prisma.socialLink.findUnique({ where: { id } });

    if (!socialLink) {
      throw new NotFoundException('Social link not found.');
    }

    return socialLink;
  }

  private serializeSocialLink(socialLink: SocialLink) {
    return {
      id: socialLink.id,
      platform: socialLink.platform,
      url: socialLink.url,
      icon: socialLink.icon,
      is_active: socialLink.isActive,
      created_at: socialLink.createdAt.toISOString(),
    };
  }
}
