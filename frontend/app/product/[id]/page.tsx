import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const productId = parseInt(params.id);
  let product = null;
  let error = null;

  try {
    const response = await apiClient.getProduct(productId);
    product = response.data;
  } catch (err: any) {
    console.error('Failed to fetch product:', err);
    error = err.message;
  }

  if (error || !product) {
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
            <h2 className="text-2xl font-bold text-gray-900">Product Not Found</h2>
            <p className="mt-2 text-gray-600">The requested product could not be loaded.</p>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
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
                <span className="ml-4 text-sm font-medium text-gray-500">Product Details</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Product Detail Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="md:flex">
            {/* Product Image */}
            {product.imageUrl && (
              <div className="md:w-1/3 p-8">
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Product Info */}
            <div className="md:w-2/3 p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
              
              {product.author && (
                <p className="text-lg text-gray-700 mb-4">
                  <span className="font-medium">Author:</span> {product.author}
                </p>
              )}
              
              {product.price !== null && (
                <p className="text-3xl font-bold text-gray-900 mb-6">
                  {product.currency || '$'} {product.price.toFixed(2)}
                </p>
              )}
              
              {product.detail?.description && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Description</h2>
                  <div className="text-gray-600 leading-relaxed">
                    {product.detail.description}
                  </div>
                </div>
              )}
              
              {/* Specifications */}
              {product.detail?.specs && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Specifications</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.detail.specs).map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        <span className="font-medium text-gray-700 mr-2 capitalize">{key}:</span>
                        <span className="text-gray-600">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Ratings */}
              {product.detail?.ratingsAvg && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Ratings</h2>
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${i < Math.floor(product.detail!.ratingsAvg!) ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-gray-700">
                      {product.detail!.ratingsAvg!.toFixed(1)} ({product.detail!.reviewsCount || 0} reviews)
                    </span>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex flex-wrap gap-4 mt-8">
                <a
                  href={product.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  View on World of Books
                </a>
                
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`http://localhost:4000/products/${productId}/refresh`, {
                        method: 'POST',
                      });
                      const result = await response.json();
                      alert(result.message || 'Refresh queued!');
                    } catch (err: any) {
                      alert('Failed to refresh product');
                    }
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}