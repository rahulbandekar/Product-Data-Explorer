import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingBag } from "lucide-react";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-300 group"
    >
      <div className="relative h-48 mb-4 overflow-hidden rounded-lg bg-gray-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <svg
              className="h-12 w-12"
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
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-semibold text-gray-900">
          {product.price !== null && product.currency
            ? formatPrice(product.price, product.currency)
            : "Price unavailable"}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 line-clamp-2">
          {product.title}
        </h3>
        <p className="text-sm text-gray-600">{product.author}</p>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">4.5</span>
            <span className="text-xs text-gray-400">(12)</span>
          </div>
          <button
            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              // Add to cart logic here
              console.log("Add to cart:", product.id);
            }}
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
