import { apiClient, ApiResponse } from "@/lib/api-client";

// Types matching Prisma schema
export interface Navigation {
  id: number;
  title: string;
  slug: string;
  lastScrapedAt: string | null;
  createdAt: string;
  _count?: {
    categories: number;
  };
}

export interface Category {
  id: number;
  title: string;
  slug: string;
  productCount: number | null;
  lastScrapedAt: string | null;
  navigationId: number;
  parentId: number | null;
  _count?: {
    products: number;
    children?: number;
  };
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
  reviews?: Review[];
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
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";
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
  // Navigation endpoints
  async getNavigation(): Promise<ApiResponse<Navigation[]>> {
    return apiClient.get("/navigation");
  }

  async scrapeNavigation(
    force: boolean = false,
  ): Promise<ApiResponse<{ jobId: string; message: string }>> {
    return apiClient.post("/scrape/navigation", { force });
  }

  // Category endpoints
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
    force: boolean = false,
  ): Promise<ApiResponse<{ jobId: string; message: string }>> {
    return apiClient.post(`/scrape/categories/${navigationId}`, { force });
  }

  // Product endpoints
  async getProducts(params?: {
    page?: number;
    limit?: number;
    categoryId?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  }): Promise<ApiResponse<PaginatedResponse<Product>>> {
    return apiClient.get("/products", params);
  }

  async getProduct(productId: number): Promise<ApiResponse<Product>> {
    return apiClient.get(`/products/${productId}`);
  }

  async scrapeProducts(
    categoryId: number,
    force: boolean = false,
    url?: string,
  ): Promise<ApiResponse<{ jobId: string; message: string }>> {
    return apiClient.post(`/scrape/products/${categoryId}`, { force, url });
  }

  async refreshProduct(
    productId: number,
  ): Promise<ApiResponse<{ jobId: string; message: string }>> {
    return apiClient.post(`/products/${productId}/refresh`);
  }

  // Product detail endpoints
  async scrapeProductDetail(
    productId: number,
    force: boolean = false,
  ): Promise<ApiResponse<{ jobId: string; message: string }>> {
    return apiClient.post(`/scrape/product-detail/${productId}`, { force });
  }

  // Review endpoints
  async getProductReviews(productId: number): Promise<ApiResponse<Review[]>> {
    // Backend exposes reviews at /reviews/by-product/:productId
    return apiClient.get(`/reviews/by-product/${productId}`);
  }

  // Scrape job monitoring
  async getScrapeJob(jobId: string): Promise<ApiResponse<ScrapeJob>> {
    // Backend exposes scrape jobs at /scrape-jobs/:id
    return apiClient.get(`/scrape-jobs/${jobId}`);
  }

  async getRecentScrapeJobs(
    limit: number = 10,
  ): Promise<ApiResponse<ScrapeJob[]>> {
    // Backend exposes scrape jobs collection at /scrape-jobs with filters;
    // for now, fetch first page with given limit.
    return apiClient.get("/scrape-jobs", { limit });
  }

  // Search
  async searchProducts(
    query: string,
    filters?: any,
  ): Promise<ApiResponse<PaginatedResponse<Product>>> {
    return apiClient.get("/search/products", { q: query, ...filters });
  }

  // History tracking
  async trackView(
    path: string,
    sessionId?: string,
  ): Promise<ApiResponse<void>> {
    // Backend exposes view history at /view-history/track
    return apiClient.post("/view-history/track", { path, sessionId });
  }

  async getBrowsingHistory(
    sessionId?: string,
  ): Promise<ApiResponse<Array<{ path: string; createdAt: string }>>> {
    // Backend exposes recent views at /view-history/recent
    return apiClient.get("/view-history/recent", { sessionId });
  }
}

export const apiService = new ApiService();
