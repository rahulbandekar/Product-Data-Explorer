import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api.service";

// Navigation hooks
export const useNavigation = () => {
  return useQuery({
    queryKey: ["navigation"],
    queryFn: () => apiService.getNavigation(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategoriesByNavigation = (navigationId: number) => {
  return useQuery({
    queryKey: ["categories", "navigation", navigationId],
    queryFn: () => apiService.getCategoriesByNavigation(navigationId),
    enabled: !!navigationId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategory = (categoryId: number) => {
  return useQuery({
    queryKey: ["category", categoryId],
    queryFn: () => apiService.getCategory(categoryId),
    enabled: !!categoryId,
  });
};

export const useProducts = (params?: {
  categoryId?: number;
  page?: number;
  limit?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}) => {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => apiService.getProducts(params),
    // skip query entirely if no params passed
    enabled: params !== undefined,
    staleTime: 2 * 60 * 1000,
  });
};

export const useProduct = (productId: number) => {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: () => apiService.getProduct(productId),
    enabled: !!productId,
  });
};

export const useScrapeNavigation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (force: boolean = false) => apiService.scrapeNavigation(force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
    },
  });
};

export const useScrapeCategories = (navigationId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (force: boolean = false) =>
      apiService.scrapeCategories(navigationId, force),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["categories", "navigation", navigationId],
      });
    },
  });
};

export const useRefreshProduct = (productId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiService.refreshProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });
};

export const useScrapeProducts = (categoryId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (force: boolean = false) =>
      apiService.scrapeProducts(categoryId, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
