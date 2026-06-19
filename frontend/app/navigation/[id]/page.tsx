"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCategoriesByNavigation } from "@/hooks/use-api";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function NavigationCategoriesPage() {
  const params = useParams();
  const navigationId = parseInt(params.id as string);

  const { data, isLoading, error } = useCategoriesByNavigation(navigationId);
  const categories = data?.data || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Categories</h1>

      {categories.length === 0 ? (
        <p className="text-gray-600">
          No categories found for this navigation yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.id}`}
              className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <h3 className="font-semibold text-gray-900">{cat.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {cat._count?.products ?? 0} products
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
