"use client";

import { useParams, useRouter } from "next/navigation";
import { useProduct, useRefreshProduct, useProducts } from "@/hooks/use-api";
import Link from "next/link";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Star, Share2, Heart, ExternalLink, RefreshCw } from "lucide-react";
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

  // Fetch recommendations — same category, exclude current product
  const { data: recommendationsData } = useProducts(
    product?.categoryId
      ? { categoryId: product.categoryId, limit: 5, page: 1 }
      : undefined
  );
  const recommendations = (recommendationsData?.data?.data || [])
    .filter((p: any) => p.id !== productId)
    .slice(0, 4);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await apiService.getProductReviews(productId);
        if (response.success && response.data) {
          setReviews(response.data as any[]);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      }
    };
    if (productId) fetchReviews();
  }, [productId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProduct.mutateAsync();
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
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">
              Product Not Found
            </h2>
            <p className="mt-2 text-gray-600">
              The requested product could not be loaded.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/" className="text-gray-400 hover:text-gray-500">
                Home
              </Link>
            </li>
            {product.category && (
              <li className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <Link
                  href={`/categories/${product.category.id}`}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  {product.category.title}
                </Link>
              </li>
            )}
            <li className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-700 text-sm font-medium line-clamp-1">
                {product.title}
              </span>
            </li>
          </ol>
        </nav>

        {/* Product Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="md:flex">
            {/* Image */}
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

            {/* Info */}
            <div className="md:w-3/5 p-8">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {product.title}
                </h1>
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  aria-label={
                    isLiked ? "Remove from wishlist" : "Add to wishlist"
                  }
                  className={`p-2 rounded-full ${
                    isLiked
                      ? "text-red-500"
                      : "text-gray-400 hover:text-red-500"
                  }`}
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
                <div
                  className="flex items-center"
                  aria-label={`Rating: ${averageRating} out of 5`}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(averageRating)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
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
                    {product.currency || "£"} {product.price.toFixed(2)}
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
                  <RefreshCw
                    className={`h-5 w-5 mr-2 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  {isRefreshing ? "Refreshing..." : "Refresh Data"}
                </button>

                <button className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  <Share2 className="h-5 w-5 mr-2" />
                  Share
                </button>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {product.category && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Category:{" "}
                    </span>
                    <Link
                      href={`/categories/${product.category.id}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {product.category.title}
                    </Link>
                  </div>
                )}
                {product.sourceId && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Source ID:{" "}
                    </span>
                    <span className="text-gray-600">{product.sourceId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description + Specs + Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-8">
            {product.detail?.description && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Description
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {product.detail.description}
                </p>
              </div>
            )}

            {product.detail?.specs &&
              Object.keys(product.detail.specs).length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Specifications
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.detail.specs).map(([key, value]) =>
                      value ? (
                        <div key={key} className="flex items-start">
                          <span className="font-medium text-gray-700 mr-2 capitalize min-w-[120px]">
                            {key.replace(/([A-Z])/g, " $1").trim()}:
                          </span>
                          <span className="text-gray-600">{String(value)}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Reviews sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Customer Reviews
              </h2>
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(averageRating)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-500 text-sm">{reviewCount} reviews</p>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {reviews.slice(0, 3).map((review: any, i: number) => (
                    <div key={i} className="border-t border-gray-100 pt-4">
                      <div className="flex items-center mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= (review.rating || 0)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {review.rating?.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{review.text}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {review.author} •{" "}
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mt-4">No reviews yet.</p>
              )}
            </div>

            {/* Scraping info */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Data Info</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Last Scraped:</span>
                  <span className="font-medium">
                    {product.lastScrapedAt
                      ? new Date(product.lastScrapedAt).toLocaleDateString()
                      : "Never"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Source:</span>
                  <span className="font-medium">World of Books</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Recommendations ── */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recommendations.map((rec: any) => (
                <Link
                  key={rec.id}
                  href={`/product/${rec.id}`}
                  className="group flex flex-col"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                    {rec.imageUrl ? (
                      <img
                        src={rec.imageUrl}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg
                          className="h-10 w-10"
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
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {rec.title}
                  </h3>
                  {rec.author && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {rec.author}
                    </p>
                  )}
                  {rec.price !== null && (
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {rec.currency || "£"} {rec.price.toFixed(2)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
