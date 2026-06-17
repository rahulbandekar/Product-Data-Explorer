"use client";

import { useParams, useRouter } from "next/navigation";
import { useProduct, useRefreshProduct, useProducts } from "@/hooks/use-api";
import Link from "next/link";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  Star,
  ShoppingBag,
  Share2,
  Heart,
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiService } from "@/services/api.service";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.id as string);

  const {
    data: productData,
    isLoading,
    error,
    refetch,
  } = useProduct(productId);
  const refreshProduct = useRefreshProduct(productId);

  const [isLiked, setIsLiked] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  const product = productData?.data;
  const categoryId = productData?.data?.categoryId;

  const { data: relatedProductsData, isLoading: relatedLoading } = useProducts({
    categoryId,
    page: 1,
    limit: 8,
  });

  // Fetch reviews separately
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await apiService.getProductReviews(productId);
        if (response.success && response.data) {
          setReviews(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      }
    };

    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProduct.mutateAsync();
      // Wait a bit then refetch
      setTimeout(() => {
        refetch();
        setIsRefreshing(false);
      }, 2000);
    } catch (err) {
      console.error("Refresh failed:", err);
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 mb-6"
          >
            <svg
              className="mr-1 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Product Not Found
            </h2>
            <p className="mt-2 text-gray-600">
              The requested product could not be loaded.
            </p>
            {error instanceof Error && (
              <p className="mt-1 text-sm text-red-500">{error.message}</p>
            )}
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const averageRating = product.detail?.ratingsAvg || 0;
  const reviewCount = reviews.length || product.detail?.reviewsCount || 0;

  const allRelated = relatedProductsData?.data?.data || [];
  const relatedProducts = allRelated
    .filter((p: any) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/" className="text-gray-400 hover:text-gray-500">
                <svg
                  className="flex-shrink-0 h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="flex-shrink-0 h-5 w-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <Link
                  href="/"
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Home
                </Link>
              </div>
            </li>
            {product.category && (
              <>
                <li>
                  <div className="flex items-center">
                    <svg
                      className="flex-shrink-0 h-5 w-5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <Link
                      href={`/categories/${product.category.id}`}
                      className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      {product.category.title}
                    </Link>
                  </div>
                </li>
              </>
            )}
            <li>
              <div className="flex items-center">
                <svg
                  className="flex-shrink-0 h-5 w-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-4 text-sm font-medium text-gray-700 line-clamp-1">
                  {product.title}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Product Detail Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="md:flex">
            {/* Product Image */}
            <div className="md:w-2/5 p-8">
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      className="h-24 w-24"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="md:w-3/5 p-8">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {product.title}
                </h1>
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-2 rounded-full ${isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
                >
                  <Heart
                    className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`}
                  />
                </button>
              </div>

              {product.author && (
                <p className="text-lg text-gray-700 mb-4">
                  <span className="font-medium">Author:</span> {product.author}
                </p>
              )}

              {/* Rating */}
              <div className="flex items-center mb-6">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(averageRating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-gray-700">
                  {averageRating.toFixed(1)} ({reviewCount} reviews)
                </span>
              </div>

              {/* Price */}
              {product.price !== null && (
                <div className="mb-6">
                  <p className="text-3xl font-bold text-gray-900">
                    {product.currency || "$"} {product.price.toFixed(2)}
                  </p>
                  {product.lastScrapedAt && (
                    <p className="text-sm text-gray-500 mt-1">
                      Price last updated:{" "}
                      {new Date(product.lastScrapedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-4 mb-8">
                <a
                  href={product.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  View on World of Books
                </a>

                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing || refreshProduct.isPending}
                  className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                >
                  {isRefreshing || refreshProduct.isPending ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Refresh Data
                    </>
                  )}
                </button>

                <button className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  <Share2 className="h-5 w-5 mr-2" />
                  Share
                </button>
              </div>

              {/* Product Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {product.category && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Category:
                    </span>
                    <Link
                      href={`/categories/${product.category.id}`}
                      className="ml-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {product.category.title}
                    </Link>
                  </div>
                )}

                {product.sourceId && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Source ID:
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {product.sourceId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Description & Specs */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {product.detail?.description && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Description
                </h2>
                <div className="text-gray-600 leading-relaxed prose max-w-none">
                  {product.detail.description}
                </div>
              </div>
            )}

            {/* Specifications */}
            {product.detail?.specs &&
              Object.keys(product.detail.specs).length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Specifications
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.detail.specs).map(
                      ([key, value]) =>
                        value && (
                          <div key={key} className="flex items-start">
                            <span className="font-medium text-gray-700 mr-2 capitalize min-w-[120px]">
                              {key.replace(/([A-Z])/g, " $1").trim()}:
                            </span>
                            <span className="text-gray-600">
                              {String(value)}
                            </span>
                          </div>
                        ),
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Reviews Sidebar */}
          <div className="space-y-8">
            {/* Rating Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Customer Reviews
              </h2>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 ${star <= Math.round(averageRating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <p className="text-gray-600">{reviewCount} reviews</p>
              </div>
            </div>

            {/* Recent Reviews */}
            {reviews.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Recent Reviews
                </h3>
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review: any, index: number) => (
                    <div
                      key={index}
                      className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= (review.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {review.rating?.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-1">
                        {review.text}
                      </p>
                      <p className="text-xs text-gray-500">
                        {review.author} •{" "}
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
                {reviews.length > 3 && (
                  <button className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-700">
                    View all {reviews.length} reviews
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-2">
                  No Reviews Yet
                </h3>
                <p className="text-gray-600 text-sm">
                  This product doesn't have any reviews yet. Check back later or
                  visit the original listing.
                </p>
              </div>
            )}

            {/* Scraping Info */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2">
                Scraping Information
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Last Scraped:</span>
                  <span className="font-medium">
                    {product.lastScrapedAt
                      ? new Date(product.lastScrapedAt).toLocaleDateString()
                      : "Never"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Data Source:</span>
                  <span className="font-medium">World of Books</span>
                </div>
                <div className="flex justify-between">
                  <span>Product ID:</span>
                  <span className="font-medium">{product.sourceId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* More from this category (Recommendations) */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              More from this category
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((item: any) => (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {item.imageUrl && (
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                      {item.title}
                    </h3>
                    {item.author && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                        {item.author}
                      </p>
                    )}
                    {item.price !== null && (
                      <p className="text-sm font-bold text-gray-900">
                        {item.currency || "£"} {item.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
