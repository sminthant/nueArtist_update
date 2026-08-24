import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { isRemoteUrl } from '../../common/utils/storage-url.util';

export type StorageFolder =
  | 'albums'
  | 'posts'
  | 'events'
  | 'biographies'
  | 'sample-links';

export interface StorageDriver {
  store(folder: StorageFolder, file: Express.Multer.File): Promise<string>;
  delete(path: string): Promise<void>;
}

@Injectable()
export class LocalStorageDriver implements StorageDriver {
  constructor(private readonly configService: ConfigService) {}

  private get basePath(): string {
    return this.configService.get<string>('STORAGE_LOCAL_PATH', './uploads');
  }

  async store(folder: StorageFolder, file: Express.Multer.File): Promise<string> {
    const extension = file.originalname.includes('.')
      ? file.originalname.slice(file.originalname.lastIndexOf('.'))
      : '';
    const filename = `${randomUUID()}${extension}`;
    const relativePath = `${folder}/${filename}`;
    const absoluteDir = join(this.basePath, folder);
    const absolutePath = join(this.basePath, relativePath);

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absolutePath, file.buffer);

    return relativePath;
  }

  async delete(path: string): Promise<void> {
    if (isRemoteUrl(path)) {
      return;
    }

    try {
      await unlink(join(this.basePath, path));
    } catch {
      // Ignore missing files, matching Laravel Storage behavior.
    }
  }
}

@Injectable()
export class MediaService {
  private readonly driver: StorageDriver;

  constructor(
    private readonly configService: ConfigService,
    localStorageDriver: LocalStorageDriver,
  ) {
    const storageDriver = this.configService.get<string>('STORAGE_DRIVER', 'local');

    this.driver = storageDriver === 'local' ? localStorageDriver : localStorageDriver;
  }

  store(folder: StorageFolder, file: Express.Multer.File): Promise<string> {
    return this.driver.store(folder, file);
  }

  delete(path: string | null | undefined): Promise<void> {
    if (!path) {
      return Promise.resolve();
    }

    return this.driver.delete(path);
  }

  getPublicPath(): string {
    return this.configService.get<string>('STORAGE_PUBLIC_URL', '/storage');
  }
}
