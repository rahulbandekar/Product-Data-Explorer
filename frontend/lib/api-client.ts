import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

export const apiClient = {
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    try {
      const response = await axios.get<ApiResponse<T>>(`${API_BASE_URL}${url}`, { params });
      return response.data;
    } catch (error: any) {
      console.error(`API Error (GET ${url}):`, error);
      return {
        success: false,
        error: error.message || 'An error occurred',
        data: undefined,
      };
    }
  },

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await axios.post<ApiResponse<T>>(`${API_BASE_URL}${url}`, data);
      return response.data;
    } catch (error: any) {
      console.error(`API Error (POST ${url}):`, error);
      return {
        success: false,
        error: error.message || 'An error occurred',
        data: undefined,
      };
    }
  },

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await axios.put<ApiResponse<T>>(`${API_BASE_URL}${url}`, data);
      return response.data;
    } catch (error: any) {
      console.error(`API Error (PUT ${url}):`, error);
      return {
        success: false,
        error: error.message || 'An error occurred',
        data: undefined,
      };
    }
  },

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await axios.delete<ApiResponse<T>>(`${API_BASE_URL}${url}`);
      return response.data;
    } catch (error: any) {
      console.error(`API Error (DELETE ${url}):`, error);
      return {
        success: false,
        error: error.message || 'An error occurred',
        data: undefined,
      };
    }
  },
};