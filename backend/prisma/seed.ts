// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Clear existing data (optional)
  await prisma.review.deleteMany();
  await prisma.productDetail.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.navigation.deleteMany();
  await prisma.scrapeJob.deleteMany();
  await prisma.viewHistory.deleteMany();
  
  // Create sample navigation
  const navigation = await prisma.navigation.upsert({
    where: { slug: 'books' },
    update: {},
    create: {
      title: 'Books',
      slug: 'books',
      lastScrapedAt: new Date(),
    },
  });
  
  console.log(`✅ Created navigation: ${navigation.title}`);
  
  // Create sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { navigationId_slug: { navigationId: navigation.id, slug: 'fiction' } },
      update: {},
      create: {
        title: 'Fiction',
        slug: 'fiction',
        navigationId: navigation.id,
        productCount: 0,
        lastScrapedAt: new Date(),
      },
    }),
    prisma.category.upsert({
      where: { navigationId_slug: { navigationId: navigation.id, slug: 'non-fiction' } },
      update: {},
      create: {
        title: 'Non-Fiction',
        slug: 'non-fiction',
        navigationId: navigation.id,
        productCount: 0,
        lastScrapedAt: new Date(),
      },
    }),
    prisma.category.upsert({
      where: { navigationId_slug: { navigationId: navigation.id, slug: 'childrens' } },
      update: {},
      create: {
        title: "Children's Books",
        slug: 'childrens',
        navigationId: navigation.id,
        productCount: 0,
        lastScrapedAt: new Date(),
      },
    }),
  ]);
  
  console.log(`✅ Created ${categories.length} categories`);
  
  // Create sample products with authors
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sourceId: 'test-001' },
      update: {},
      create: {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        price: 12.99,
        currency: 'GBP',
        imageUrl: 'https://images.example.com/gatsby.jpg',
        sourceUrl: 'https://www.worldofbooks.com/en-us/books/the-great-gatsby',
        sourceId: 'test-001',
        categoryId: categories[0].id,
        lastScrapedAt: new Date(),
      },
    }),
    prisma.product.upsert({
      where: { sourceId: 'test-002' },
      update: {},
      create: {
        title: 'A Brief History of Time',
        author: 'Stephen Hawking',
        price: 15.99,
        currency: 'GBP',
        imageUrl: 'https://images.example.com/history-time.jpg',
        sourceUrl: 'https://www.worldofbooks.com/en-us/books/a-brief-history-of-time',
        sourceId: 'test-002',
        categoryId: categories[1].id,
        lastScrapedAt: new Date(),
      },
    }),
    prisma.product.upsert({
      where: { sourceId: 'test-003' },
      update: {},
      create: {
        title: 'Harry Potter and the Philosopher\'s Stone',
        author: 'J.K. Rowling',
        price: 9.99,
        currency: 'GBP',
        imageUrl: 'https://images.example.com/harry-potter.jpg',
        sourceUrl: 'https://www.worldofbooks.com/en-us/books/harry-potter',
        sourceId: 'test-003',
        categoryId: categories[2].id,
        lastScrapedAt: new Date(),
      },
    }),
  ]);
  
  console.log(`✅ Created ${products.length} products with authors`);
  
  // Create product details
  await Promise.all([
    prisma.productDetail.upsert({
      where: { productId: products[0].id },
      update: {},
      create: {
        productId: products[0].id,
        description: 'A classic novel of the Jazz Age...',
        specs: {
          publisher: 'Scribner',
          publicationDate: '1925',
          isbn: '9780743273565',
          pages: 180,
          format: 'Paperback',
        },
        ratingsAvg: 4.5,
        reviewsCount: 3,
      },
    }),
  ]);
  
  // Create sample reviews
  await Promise.all([
    prisma.review.create({
      data: {
        author: 'John Doe',
        rating: 5,
        text: 'Amazing book! Could not put it down.',
        productId: products[0].id,
      },
    }),
    prisma.review.create({
      data: {
        author: 'Jane Smith',
        rating: 4,
        text: 'Great read, but the ending was predictable.',
        productId: products[0].id,
      },
    }),
  ]);
  
  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Navigation: ${navigation.title}`);
  console.log(`- Categories: ${categories.map(c => c.title).join(', ')}`);
  console.log(`- Products: ${products.map(p => `"${p.title}" by ${p.author}`).join(', ')}`);
  console.log(`- Reviews: 2 sample reviews created`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });