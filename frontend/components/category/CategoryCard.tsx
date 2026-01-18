import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import { Category } from '@/lib/types';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <FolderOpen className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {category.title}
          </h3>
          <p className="text-sm text-gray-500">
            {category.product_count} products
          </p>
        </div>
        <div className="text-blue-600 text-sm font-medium">
          View →
        </div>
      </div>
    </Link>
  );
}