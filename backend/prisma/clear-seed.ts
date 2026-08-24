import { PrismaClient } from '@prisma/client';
import { SEED_PREFIX } from './seed-constants';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const seedFilter = { startsWith: SEED_PREFIX };

  const [posts, albums, events, sampleLinks, biographies] = await Promise.all([
    prisma.post.deleteMany({ where: { title: seedFilter } }),
    prisma.album.deleteMany({ where: { title: seedFilter } }),
    prisma.event.deleteMany({ where: { eventName: seedFilter } }),
    prisma.sampleLink.deleteMany({ where: { name: seedFilter } }),
    prisma.artistBiography.deleteMany({ where: { title: seedFilter } }),
  ]);

  console.log('Removed seeded demo rows:');
  console.log(`  posts: ${posts.count}`);
  console.log(`  albums: ${albums.count}`);
  console.log(`  events: ${events.count}`);
  console.log(`  sample links: ${sampleLinks.count}`);
  console.log(`  biographies: ${biographies.count}`);
  console.log('');
  console.log('Note: admin user and social links from seed are kept.');
  console.log('To remove social links too, delete them manually in admin or extend clear-seed.ts.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
