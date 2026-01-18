import { apiClient, Category, Product } from '@/lib/api';
import Link from 'next/link';

interface PageProps {
  params: {
    id: string;
  };
  searchParams?: {
    page?: string;
  };
}

export default async function ProductsPage({ params, searchParams }: PageProps) {
  const categoryId = parseInt(params.id);
  const page = parseInt(searchParams?.page || '1');
  const limit = 20;

  let category: Category | null = null;
  let products: Product[] = [];
  let pagination = null;
  let error: string | null = null;

  try {
    // Get category info
    const categoryResponse = await apiClient.getCategory(categoryId);
    category = categoryResponse.data;

    // Get products
    const productsResponse = await apiClient.getProducts({
      categoryId,
      page,
      limit,
    });
    products = productsResponse.data || [];
    pagination = productsResponse.pagination;
  } catch (err: any) {
    console.error('Failed to fetch products:', err);
    error = err.message;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/" className="text-gray-400 hover:text-gray-500">
                <svg className="flex-shrink-0 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <Link href="/" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                  Home
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-4 text-sm font-medium text-gray-500">Products</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {category?.title || 'Products'}
          </h1>
          {category && (
            <p className="mt-2 text-gray-600">
              {category._count?.products || 0} products available
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">Try triggering a scrape or check another category.</p>
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  {product.imageUrl && (
                    <div className="aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    {product.author && (
                      <p className="text-sm text-gray-600 mb-2">by {product.author}</p>
                    )}
                    {product.price !== null && (
                      <p className="text-lg font-bold text-gray-900 mb-3">
                        {product.currency || '$'} {product.price.toFixed(2)}
                      </p>
                    )}
                    <Link
                      href={`/product/${product.id}`}
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      View Details
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                {page > 1 && (
                  <Link
                    href={`/products/${categoryId}?page=${page - 1}`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Previous
                  </Link>
                )}
                
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Link
                      key={pageNum}
                      href={`/products/${categoryId}?page=${pageNum}`}
                      className={`px-3 py-1 rounded-md ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}

                {pagination.pages > 5 && <span className="text-gray-500">...</span>}

                {page < pagination.pages && (
                  <Link
                    href={`/products/${categoryId}?page=${page + 1}`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}