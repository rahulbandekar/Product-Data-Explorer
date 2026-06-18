import { BookOpen, Globe, Shield, Zap } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl m-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          About Product Data Explorer
        </h1>
        <p className="text-lg text-gray-600">
          A full-stack application for exploring products with live on-demand
          scraping
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <BookOpen className="h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Real-time Data</h3>
          <p className="text-gray-600">
            Products and categories are scraped in real-time from World of
            Books, ensuring you always see the latest information.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <Globe className="h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ethical Scraping</h3>
          <p className="text-gray-600">
            We respect robots.txt, implement rate limiting, and cache results to
            minimize impact on the target website.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <Zap className="h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Fast & Responsive</h3>
          <p className="text-gray-600">
            Built with Next.js and React Query for optimal performance and
            seamless user experience.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <Shield className="h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Production Ready</h3>
          <p className="text-gray-600">
            Includes error handling, logging, testing, and follows best
            practices for deployment.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-4">Technology Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="font-semibold text-blue-600">Frontend</div>
            <div className="text-sm text-gray-600">
              Next.js 14, React, TypeScript, Tailwind
            </div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">Backend</div>
            <div className="text-sm text-gray-600">
              NestJS, TypeScript, PostgreSQL
            </div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">Scraping</div>
            <div className="text-sm text-gray-600">Crawlee, Playwright</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">Deployment</div>
            <div className="text-sm text-gray-600">Vercel, Render, Docker</div>
          </div>
        </div>
      </div>
    </div>
  );
}
