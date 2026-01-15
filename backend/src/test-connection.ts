// backend/src/test-connection.ts
import 'dotenv/config';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

async function testConnection() {
  console.log('🔌 Testing Redis connection...\n');
  
  // Test basic Redis connection
  const redis = new IORedis({
    host: '127.0.0.1',
    port: 6379,
    maxRetriesPerRequest: null,
  });
  
  try {
    await redis.ping();
    console.log('✅ Redis connection successful');
    
    // Check if BullMQ can write to Redis
    const queue = new Queue('test-connection-queue', { connection: redis });
    
    // Add a test job
    const job = await queue.add('connection-test', { timestamp: Date.now() });
    console.log('✅ BullMQ queue job added:', job.id);
    
    // Create a worker to process it
    const worker = new Worker(
      'test-connection-queue',
      async (job) => {
        console.log('✅ Worker received job:', job.id);
        return { success: true };
      },
      { connection: redis }
    );
    
    worker.on('completed', (job) => {
      console.log('✅ Job completed:', job.id);
      process.exit(0);
    });
    
    worker.on('failed', (job, err) => {
      console.error('❌ Job failed:', err);
      process.exit(1);
    });
    
    // Wait for processing
    setTimeout(() => {
      console.log('⚠️ Timeout - job not processed');
      process.exit(1);
    }, 3000);
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    process.exit(1);
  }
}

testConnection();