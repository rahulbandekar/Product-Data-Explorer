import { BookOpen, Code, Database, Cpu, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

export default function ReadmePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Product Data Explorer - Documentation</h1>
          <p className="text-lg text-gray-600">
            Full-stack application for exploring World of Books with live on-demand scraping
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Project Overview</h2>
            <p>
              This is a production-minded product exploration platform that lets users navigate from 
              high-level headings → categories → products → product detail pages powered by <strong>live, on-demand scraping</strong>.
            </p>
            <p>
              All scraping is done against <a href="https://www.worldofbooks.com/" target="_blank" className="text-blue-600 hover:underline">World of Books</a> 
              with ethical considerations including rate limiting, caching, and respecting robots.txt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Code className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold">Frontend Stack</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  <span>Next.js 15 (App Router)</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  <span>TypeScript</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  <span>Tailwind CSS v4</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  <span>React Query (TanStack)</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  <span>Responsive & Accessible UI</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Database className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold">Backend Stack</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                  <span>NestJS + TypeScript</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                  <span>PostgreSQL + Prisma ORM</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                  <span>BullMQ for job queues</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                  <span>Redis for caching</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                  <span>Crawlee + Playwright</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🚀 Features Implemented</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Zap className="h-6 w-6 text-green-500 mt-1" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold">Real-time Scraping</h4>
                  <p className="text-gray-600">On-demand scraping triggered by user actions with 24-hour caching</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Cpu className="h-6 w-6 text-green-500 mt-1" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold">Background Job Processing</h4>
                  <p className="text-gray-600">BullMQ queues for scrape jobs with retry logic and exponential backoff</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-green-500 mt-1" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold">Ethical Scraping</h4>
                  <p className="text-gray-600">Rate limiting, delays, robots.txt respect, and proper caching</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-green-500 mt-1" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold">Full Navigation Flow</h4>
                  <p className="text-gray-600">Home → Navigation → Categories → Products → Product Details</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🔧 How to Run Locally</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Prerequisites</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Node.js 18+</li>
                  <li>PostgreSQL 14+</li>
                  <li>Redis 7+</li>
                  <li>Docker (optional, for containerized setup)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Backend Setup</h3>
                <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npx prisma migrate dev
npm run start:dev`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Frontend Setup</h3>
                <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Run Workers</h3>
                <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`# Terminal 1 - Navigation worker
cd backend
npm run worker:navigation

# Terminal 2 - Category worker
npm run worker:category

# Terminal 3 - Product worker
npm run worker:product

# Terminal 4 - Product detail worker
npm run worker:product-detail`}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </Link>
            <a
              href="http://localhost:4000/api-docs"
              target="_blank"
              className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              View API Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}