import { Test, TestingModule } from '@nestjs/testing';
import { ScrapeService } from './scrape.service';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

describe('ScrapeService', () => {
  let service: ScrapeService;
  let queueMock: jest.Mocked<Partial<Queue>>;

  beforeEach(async () => {
    queueMock = {
      add: jest.fn().mockResolvedValue({
        id: 'test-job-id',
        name: 'scrape-navigation',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrapeService,
        {
          // Must use getQueueToken('scrape') — matches @InjectQueue('scrape')
          provide: getQueueToken('scrape'),
          useValue: queueMock,
        },
      ],
    }).compile();

    service = module.get<ScrapeService>(ScrapeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enqueueNavigationScrape', () => {
    it('should add a navigation scrape job with correct parameters', async () => {
      const result = await service.enqueueNavigationScrape();

      expect(queueMock.add).toHaveBeenCalledWith(
        'scrape-navigation',
        {},
        {
          removeOnComplete: true,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );

      expect(result).toEqual({ id: 'test-job-id', name: 'scrape-navigation' });
    });

    it('should handle queue errors gracefully', async () => {
      queueMock.add = jest.fn().mockRejectedValueOnce(new Error('Queue error'));

      await expect(service.enqueueNavigationScrape()).rejects.toThrow(
        'Queue error',
      );
    });
  });
});
