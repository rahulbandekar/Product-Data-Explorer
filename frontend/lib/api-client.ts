import axios from 'axios';

// Set NEXT_PUBLIC_API_URL in Vercel dashboard to your Railway backend URL.
// Falls back to localhost for local dev.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

export const apiClient = {
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    try {
      const response = await instance.get<ApiResponse<T>>(url, { params });
      return response.data;
    } catch (error: any) {
      console.error(`GET ${url}:`, error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await instance.post<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error: any) {
      console.error(`POST ${url}:`, error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await instance.put<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await instance.delete<ApiResponse<T>>(url);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
};