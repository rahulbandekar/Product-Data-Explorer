'use client';

import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '@/lib/api';
import CategoryCard from './CategoryCard';

interface CategoryGridProps {
  parentId?: string;
}

export default function CategoryGrid({ parentId }: CategoryGridProps) {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories', parentId],
    queryFn: () => {
      if (parentId) {
        return categoryApi.getChildren(parentId).then(res => res.data);
      }
      return categoryApi.getAll().then(res => res.data.data);
    },
    enabled: !parentId || !!parentId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500">
        Failed to load categories
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No categories found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category: any) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}