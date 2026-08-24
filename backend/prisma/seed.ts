import { PrismaClient, PostStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SEED_PREFIX, seedTitle } from './seed-constants';

const prisma = new PrismaClient();

async function seedAdminUser(): Promise<void> {
  const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const password = process.env.ADMIN_PASSWORD ?? 'password';
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name: process.env.ADMIN_NAME ?? 'Admin User',
      email,
      password: hashedPassword,
      role: process.env.ADMIN_ROLE ?? 'admin',
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Created admin user: ${email}`);
}

async function seedDemoContent(): Promise<void> {
  const existingSeedAlbum = await prisma.album.findFirst({
    where: { title: { startsWith: SEED_PREFIX } },
  });

  if (existingSeedAlbum) {
    console.log('Demo seed data already exists. Run `npm run seed:clear` first to re-seed.');
    return;
  }

  const now = new Date();
  const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  await prisma.socialLink.createMany({
    data: [
      {
        platform: 'Instagram',
        url: 'https://instagram.com/nue.artist',
        icon: 'instagram',
        isActive: true,
      },
      {
        platform: 'Spotify',
        url: 'https://open.spotify.com/artist/demo',
        icon: 'spotify',
        isActive: true,
      },
      {
        platform: 'SoundCloud',
        url: 'https://soundcloud.com/nue-demo',
        icon: 'soundcloud',
        isActive: true,
      },
    ],
  });

  await prisma.album.createMany({
    data: [
      {
        title: seedTitle('Neon Pulse EP'),
        artistName: 'NUE',
        category: 'NUE',
        spotifyUrl: 'https://open.spotify.com/album/4uLU6hMCjMI75M1A2tKUQC',
        soundcloudUrl: 'https://soundcloud.com/forss/flickermood',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        isPublished: true,
        sortOrder: 1,
      },
      {
        title: seedTitle('Midnight Circuit'),
        artistName: 'NUE',
        category: 'Latest Releases',
        spotifyUrl: 'https://open.spotify.com/album/1dfeG4gH3GoXTJmiq8zB6',
        isPublished: true,
        sortOrder: 2,
      },
      {
        title: seedTitle('Red Horizon'),
        artistName: 'NUE',
        category: 'Label Releases',
        isPublished: true,
        sortOrder: 3,
      },
    ],
  });

  await prisma.post.create({
    data: {
      title: seedTitle('New single out now'),
      content:
        '<p>Our latest track is live on all platforms. Turn it up and tag us in your stories.</p>',
      status: PostStatus.published,
      socialLink1: 'https://open.spotify.com/album/4uLU6hMCjMI75M1A2tKUQC',
      socialLink2: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      expireAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.event.createMany({
    data: [
      {
        eventName: seedTitle('Tokyo Bass Night'),
        venue: 'Club Voltage',
        location: 'Tokyo, JP',
        eventDate: inTwoWeeks,
        bookingUrl: 'https://example.com/tickets/tokyo',
      },
      {
        eventName: seedTitle('Bangkok Warehouse Session'),
        venue: 'The Loft',
        location: 'Bangkok, TH',
        eventDate: lastMonth,
      },
    ],
  });

  await prisma.sampleLink.createMany({
    data: [
      {
        name: seedTitle('Kick Pack Vol. 1'),
        directLink: 'https://example.com/sample-pack-1',
        price: 19.99,
        isActive: true,
        order: 1,
      },
      {
        name: seedTitle('808 Essentials'),
        directLink: 'https://example.com/sample-pack-2',
        price: 24.99,
        isActive: true,
        order: 2,
      },
    ],
  });

  await prisma.artistBiography.createMany({
    data: [
      {
        title: seedTitle('Artist Bio'),
        content:
          'NUE blends cinematic bass, raw club energy, and immersive visuals into a neo-underground sound built for late nights and loud systems.',
        sortOrder: 1,
      },
      {
        title: seedTitle('Live Performance'),
        content:
          'From warehouse raves to festival main stages, NUE delivers high-impact sets with custom visuals and heavy low-end.',
        sortOrder: 2,
      },
    ],
  });

  console.log('Demo seed data inserted successfully.');
}

async function main(): Promise<void> {
  await seedAdminUser();
  await seedDemoContent();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
