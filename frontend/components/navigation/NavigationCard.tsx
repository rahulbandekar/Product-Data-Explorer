import Link from 'next/link';
import { Navigation } from '@/lib/types';

interface NavigationCardProps {
  navigation: Navigation;
}

export default function NavigationCard({ navigation }: NavigationCardProps) {
  return (
    <Link
      href={`/category/${navigation.slug}`}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-center"
    >
      <div className="p-3 bg-blue-100 rounded-full mb-4 inline-block">
        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {navigation.title}
      </h3>
      <div className="flex items-center justify-center text-blue-600 text-sm font-medium">
        Browse now
        <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
    </Link>
  );
}