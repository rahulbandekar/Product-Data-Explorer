// This file should match your Prisma schema EXACTLY
// Delete this file and use the types from api.ts instead
// OR update it to match:

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
  parent?: Category;
  children?: Category[];
  products?: Product[];
  createdAt: string;
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
  category?: Category;
  detail?: ProductDetail;
  reviews?: Review[];
  createdAt: string;
}

export interface ProductDetail {
  productId: number;
  description: string | null;
  specs: any;
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

export interface ApiResponse<T> {
  success: boolean;
  data: T | T[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp?: string;
}