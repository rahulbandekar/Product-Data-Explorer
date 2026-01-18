'use client';

import Image from 'next/image';
import { Star, ShoppingBag, Share2, Heart, ChevronRight } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';

interface ProductDetailProps {
  product: Product & { detail?: any };
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div>
      <div className="mb-6">
        <nav className="flex items-center text-sm text-gray-600">
          <span>Home</span>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span>Category</span>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900 font-medium">{product.title}</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="relative h-[400px] w-full overflow-hidden rounded-lg bg-gray-100">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
          <p className="text-lg text-gray-600 mb-4">{product.author}</p>
          
          <div className="flex items-center space-x-2 mb-6">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-5 w-5 text-yellow-400 fill-current"
                />
              ))}
            </div>
            <span className="text-gray-600">4.5 • 12 reviews</span>
          </div>

          <div className="mb-8">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {formatPrice(product.price, product.currency)}
            </div>
            <p className="text-green-600 font-medium">In stock • Free shipping</p>
          </div>

          {/* Quantity Selector */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <div className="text-sm text-gray-500">
                Only 5 items left in stock
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Add to Cart
            </button>
            <button className="border-2 border-blue-600 text-blue-600 py-3 px-6 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Buy Now
            </button>
          </div>

          {/* Additional Actions */}
          <div className="flex space-x-4">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-2 rounded-full ${
                isLiked ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Description */}
      <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Description</h2>
        <div className="prose max-w-none">
          {product.detail?.description ? (
            <p className="text-gray-600 leading-relaxed">{product.detail.description}</p>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                This product is sourced from World of Books, one of the largest online book retailers.
                The description and details are fetched in real-time through our scraping system.
              </p>
              <p className="text-gray-600">
                For more detailed information about this product, please visit the original listing
                on World of Books by clicking the source link below.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Specifications */}
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">General</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Source</span>
                  <span className="font-medium">World of Books</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-medium">{new Date(product.last_scraped_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <a
              href={product.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              View on World of Books
              <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}