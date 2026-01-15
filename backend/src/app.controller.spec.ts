// src/app.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getNavigation: jest.fn().mockResolvedValue([
              { id: 1, title: 'Books', slug: 'books' },
              { id: 2, title: 'Music', slug: 'music' }
            ]),
            getCategories: jest.fn().mockResolvedValue([
              { id: 1, title: 'Fiction', slug: 'fiction' },
              { id: 2, title: 'Non-Fiction', slug: 'non-fiction' }
            ]),
            scrapeCategories: jest.fn().mockResolvedValue({
              success: true,
              jobId: 'scrape-job-123'
            }),
          },
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('getNavigation', () => {
    it('should return navigation items', async () => {
      const result = await appController.getNavigation();
      
      expect(appService.getNavigation).toHaveBeenCalled();
      expect(result).toEqual([
        { id: 1, title: 'Books', slug: 'books' },
        { id: 2, title: 'Music', slug: 'music' }
      ]);
    });
  });

  describe('getCategories', () => {
    it('should return categories for a navigation slug', async () => {
      const result = await appController.getCategories('books');
      
      expect(appService.getCategories).toHaveBeenCalledWith('books');
      expect(result).toEqual([
        { id: 1, title: 'Fiction', slug: 'fiction' },
        { id: 2, title: 'Non-Fiction', slug: 'non-fiction' }
      ]);
    });
  });

  describe('scrapeCategories', () => {
    it('should trigger category scraping', async () => {
      const result = await appController.scrapeCategories({ navigationId: '1' });
      
      expect(appService.scrapeCategories).toHaveBeenCalledWith('1');
      expect(result).toEqual({
        success: true,
        jobId: 'scrape-job-123'
      });
    });
  });
});