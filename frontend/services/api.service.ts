import { apiClient, ApiResponse } from '@/lib/api-client';

export interface Navigation {
  id: number;
  title: string;
  slug: string;
  lastScrapedAt: string | null;
  createdAt: string;
  _count?: { categories: number };
}

export interface Category {
  id: number;
  title: string;
  slug: string;
  productCount: number | null;
  lastScrapedAt: string | null;
  navigationId: number;
  parentId: number | null;
  _count?: { products: number; children?: number };
  children?: Category[];
  navigation?: Navigation;
}

export interface Product {
  id: number;
  sourceId: string;
  title: string;
  author: string | null;
  price: number | null;
  currency: string | null;
  imageUrl: string | null;
  sourceUrl: string;
  lastScrapedAt: string | null;
  categoryId: number;
  category?: Category;
  detail?: ProductDetail;
}

export interface ProductDetail {
  productId: number;
  description: string | null;
  specs: Record<string, any> | null;
  ratingsAvg: number | null;
  reviewsCount: number | null;
  updatedAt: string;
}

export interface Review {
  id: number;
  author: string | null;
  rating: number | null;
  text: string | null;
  productId: number;
  createdAt: string;
}

export interface ScrapeJob {
  id: number;
  targetUrl: string;
  targetType: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  startedAt: string;
  finishedAt: string | null;
  errorLog: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiService {
  // Navigation
  async getNavigation(): Promise<ApiResponse<Navigation[]>> {
    return apiClient.get('/navigation');
  }

  async scrapeNavigation(
    force = false,
  ): Promise<ApiResponse<{ jobId: string; message: string }>> {
    return apiClient.post('/scrape/navigation', { force });
  }

  // Categories
  async getCategoriesByNavigation(
    navigationId: number,
  ): Promise<ApiResponse<Category[]>> {
    return apiClient.get(`/categories/by-navigation/${navigationId}`);
  }

  async getCategory(categoryId: number): Promise<ApiResponse<Category>> {
    return apiClient.get(`/categories/${categoryId}`);
  }

  async scrapeCategories(
    navigationId: number,
    force = false,
  ): Promise<ApiResponse<{ jobId: string; message: string }>> {
    return apiClient.post(`/scrape/categories/${navigationId}`, { force });
  }

  // Products
  async getProducts(params?: {
    page?: number;
    limit?: number;
    categoryId?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  }): Promise<ApiResponse<PaginatedResponse<Product>>> {
    return apiClient.get('/products', params);
  }

  async getProduct(productId: number): Promise<ApiResponse<Product>> {
    return apiClient.get(`/products/${productId}`);
  }

  async refreshProduct(
    productId: number,
  ): Promise<ApiResponse<{ jobId: string; message: string }>> {
    return apiClient.post(`/products/${productId}/refresh`);
  }

  // Reviews — uses the correct backend endpoint /reviews/by-product/:id
  async getProductReviews(productId: number): Promise<ApiResponse<Review[]>> {
    return apiClient.get(`/reviews/by-product/${productId}`);
  }

  // Scraping
  async scrapeProducts(
    categoryId: number,
    force = false,
    url?: string,
  ): Promise<ApiResponse<{ jobId: string; message: string }>> {
    return apiClient.post(`/scrape/products/${categoryId}`, { force, url });
  }

  async scrapeProductDetail(
    productId: number,
    force = false,
  ): Promise<ApiResponse<{ jobId: string; message: string }>> {
    return apiClient.post(`/scrape/product-detail/${productId}`, { force });
  }

  // Scrape job monitoring
  async getScrapeJob(jobId: string): Promise<ApiResponse<ScrapeJob>> {
    return apiClient.get(`/scrape-jobs/${jobId}`);
  }

  // View history — silently fails if endpoint missing, won't break the app
  async trackView(path: string, sessionId?: string): Promise<void> {
    apiClient
      .post('/view-history/track', { path, sessionId })
      .catch(() => null);
  }

  async getBrowsingHistory(
    sessionId?: string,
  ): Promise<ApiResponse<Array<{ path: string; createdAt: string }>>> {
    return apiClient.get('/view-history/recent', { sessionId });
  }
}

export const apiService = new ApiService();