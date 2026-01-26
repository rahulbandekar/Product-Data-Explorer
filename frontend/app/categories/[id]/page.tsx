'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCategory, useProducts, useScrapeCategories } from '@/hooks/use-api';
import Link from 'next/link';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProductGrid from '@/components/product/ProductGrid'; 
import { useState } from 'react';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = parseInt(params.id as string);
  
  const [page, setPage] = useState(1);
  const limit = 12;

  // Fetch category details
  const { 
    data: categoryData, 
    isLoading: categoryLoading, 
    error: categoryError,
    refetch: refetchCategory 
  } = useCategory(categoryId);

  // Fetch products for this category
  const { 
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useProducts({
    categoryId,
    page,
    limit
  });

  // Scrape categories mutation
  const scrapeCategories = useScrapeCategories(categoryData?.data?.navigationId || 0);

  const category = categoryData?.data;
  const products = productsData?.data?.data || [];
  const pagination = productsData?.data?.pagination;

  const handleScrape = async () => {
    if (!category?.navigationId) return;
    
    try {
      await scrapeCategories.mutateAsync(true);
      // Refetch data after scrape
      setTimeout(() => {
        refetchCategory();
        refetchProducts();
      }, 3000);
    } catch (err) {
      console.error('Scrape failed:', err);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (categoryError || !category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link 
            href="/"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 mb-6"
          >
            <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Category Not Found</h2>
            <p className="mt-2 text-gray-600">
              {categoryError instanceof Error ? categoryError.message : 'The requested category could not be loaded.'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
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
                <span className="ml-4 text-sm font-medium text-gray-700">{category.title}</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category.title}</h1>
              <p className="mt-2 text-gray-600">
                {category._count?.products || 0} products available
                {category.lastScrapedAt && (
                  <span className="ml-4 text-sm text-gray-500">
                    Last updated: {new Date(category.lastScrapedAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {category.navigation && (
                <Link
                  href={`/categories/${category.navigation.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View all categories in {category.navigation.title}
                </Link>
              )}
              
              <button
                onClick={handleScrape}
                disabled={scrapeCategories.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {scrapeCategories.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Scraping...
                  </>
                ) : (
                  'Refresh Category Data'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Subcategories (if any) */}
        {category.children && category.children.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Subcategories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/categories/${child.id}`}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <h3 className="font-medium text-gray-900">{child.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {child._count?.products || 0} products
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Products</h2>
            <div className="text-sm text-gray-500">
              Page {page} of {pagination?.pages || 1}
            </div>
          </div>

          {productsError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">Error loading products: {productsError.message}</p>
            </div>
          )}

          <ProductGrid
            products={products}
            isLoading={productsLoading}
            totalPages={pagination?.pages || 1}
            currentPage={page}
            onPageChange={handlePageChange}
          />

          {/* Products Empty State */}
          {!productsLoading && products.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">Try refreshing the category data or check back later.</p>
              <div className="mt-6">
                <button
                  onClick={handleScrape}
                  disabled={scrapeCategories.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Refresh Products
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}