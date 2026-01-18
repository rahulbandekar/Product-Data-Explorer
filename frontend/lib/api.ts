import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

console.log('🌐 API Base URL:', API_BASE_URL);

// Types matching YOUR backend (from your Prisma schema)
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
  navigation?: Navigation;
  children?: Category[];
  products?: Product[];
  _count?: {
    products: number;
  };
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
  category?: {
    title: string;
    slug: string;
  };
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

// Your backend response format
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
  count?: number;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions that match YOUR backend endpoints
export const apiClient = {
  // Navigation (for homepage)
  getNavigation: async (): Promise<ApiResponse<Navigation[]>> => {
    const response = await api.get<ApiResponse<Navigation[]>>('/navigation');
    return response.data;
  },

  // Categories (for category drilldown)
  getCategoriesByNavigation: async (navigationId: number): Promise<ApiResponse<Category[]>> => {
    const response = await api.get<ApiResponse<Category[]>>(`/categories/by-navigation/${navigationId}`);
    return response.data;
  },

  getCategory: async (id: number): Promise<ApiResponse<Category>> => {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data;
  },

  // Products (for product grid)
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    categoryId?: number;
  }): Promise<PaginatedResponse<Product>> => {
    const response = await api.get<PaginatedResponse<Product>>('/products', { params });
    return response.data;
  },

  // Product detail
  getProduct: async (id: number): Promise<ApiResponse<Product>> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },

  refreshProduct: async (id: number): Promise<ApiResponse<{ jobId: string; message: string }>> => {
    const response = await api.post<ApiResponse<{ jobId: string; message: string }>>(`/products/${id}/refresh`);
    return response.data;
  },

  // Scrape operations
  scrapeNavigation: async (force: boolean = false): Promise<ApiResponse<{ jobId: string; message: string }>> => {
    const response = await api.post<ApiResponse<{ jobId: string; message: string }>>('/scrape/navigation', { force });
    return response.data;
  },

  scrapeCategories: async (navigationId: number, force: boolean = false): Promise<ApiResponse<{ jobId: string; message: string }>> => {
    const response = await api.post<ApiResponse<{ jobId: string; message: string }>>(`/scrape/categories/${navigationId}`, { force });
    return response.data;
  },

  scrapeProducts: async (categoryId: number, force: boolean = false, url?: string): Promise<ApiResponse<{ jobId: string; message: string }>> => {
    const response = await api.post<ApiResponse<{ jobId: string; message: string }>>(`/scrape/products/${categoryId}`, { force, url });
    return response.data;
  },

  scrapeProductDetail: async (productId: number, force: boolean = false): Promise<ApiResponse<{ jobId: string; message: string }>> => {
    const response = await api.post<ApiResponse<{ jobId: string; message: string }>>(`/scrape/product-detail/${productId}`, { force });
    return response.data;
  },
};