// Save as backend/scripts/setup-test.js
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Setting up test environment...\n');

// 1. Check if Redis is running
console.log('1. Checking Redis...');
try {
  execSync('redis-cli ping', { stdio: 'pipe' });
  console.log('   ✅ Redis is running\n');
} catch (error) {
  console.log('   ❌ Redis is not running. Starting Redis...');
  try {
    execSync('redis-server --daemonize yes', { stdio: 'pipe' });
    console.log('   ✅ Redis started\n');
  } catch (startError) {
    console.log('   ❌ Failed to start Redis. Please start manually:');
    console.log('      brew services start redis  # if using Homebrew');
    console.log('      or: redis-server\n');
  }
}

// 2. Check database connection
console.log('2. Checking database...');
try {
  execSync('npx prisma db push --skip-generate', { stdio: 'pipe' });
  console.log('   ✅ Database connection OK\n');
} catch (dbError) {
  console.log('   ❌ Database connection failed');
  console.log('      Make sure PostgreSQL is running and DATABASE_URL is set\n');
}

// 3. Create test directories
console.log('3. Creating necessary directories...');
const dirs = [
  'src/scrape/workers',
  'scripts',
  'logs'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`   ✅ Created: ${dir}`);
  }
});

console.log('\n✅ Setup complete!');
console.log('\nTo run the full test:');
console.log('1. Terminal 1: npx ts-node src/scrape/workers/navigation.worker.ts');
console.log('2. Terminal 2: npx ts-node src/scrape/workers/category.worker.ts');
console.log('3. Terminal 3: npx ts-node src/scrape/test-category-fixed.ts');
console.log('\nOr run: node scripts/setup-test.js');