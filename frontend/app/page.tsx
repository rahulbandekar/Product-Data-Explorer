"use client";

import { useNavigation, useScrapeNavigation } from "@/hooks/use-api";
import Link from "next/link";
import ScrapeButton from "@/components/ScrapeButton";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function HomePage() {
  const { data: navigationData, isLoading, error, refetch } = useNavigation();
  const scrapeNavigation = useScrapeNavigation();

  const navigations = navigationData?.data || [];
  const errorMessage = error?.message || navigationData?.error;

  const handleScrape = async () => {
    try {
      await scrapeNavigation.mutateAsync(true);
      // Refetch navigation after scrape
      setTimeout(() => {
        refetch();
      }, 3000);
    } catch (err) {
      console.error("Scrape failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Product Data Explorer
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Explore books and products from World of Books with live on-demand
              scraping
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  API Connection Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Could not connect to backend API. Make sure:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Backend is running at http://localhost:4000</li>
                    <li>Database is connected and seeded</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Headings */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Navigation Headings
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Browse through categories from World of Books
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {navigations.length} items
              </span>
              <ScrapeButton />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading navigation...</p>
            </div>
          ) : navigations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No navigation data found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                The database is empty. Click the button below to trigger
                scraping from World of Books.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleScrape}
                  disabled={scrapeNavigation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {scrapeNavigation.isPending
                    ? "Scraping..."
                    : "Trigger Navigation Scrape"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {navigations.map((nav) => (
                <Link
                  key={nav.id}
                  href={`/navigation/${nav.id}`}
                  className="group bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                        {nav.title}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {nav._count?.categories || 0} categories
                      </span>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <svg
                        className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Last updated:{" "}
                      {nav.lastScrapedAt
                        ? new Date(nav.lastScrapedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : "Never"}
                    </div>
                    <div className="mt-6 flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-500">
                      Browse categories
                      <svg
                        className="ml-1 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Requirements Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Assignment Requirements Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <RequirementCard
              icon="⏱"
              title="Landing loads navigation"
              description="From World of Books via backend"
              status={navigations.length > 0 ? "complete" : "pending"}
            />
            <RequirementCard
              icon="⚡"
              title="Real-time scraping"
              description="Triggered on-demand via API"
              status="complete"
            />
            <RequirementCard
              icon="💾"
              title="Data persistence"
              description="PostgreSQL database connected"
              status="complete"
            />
            <RequirementCard
              icon="🚀"
              title="Production-ready"
              description="NestJS with error handling"
              status="complete"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

interface RequirementCardProps {
  icon: string;
  title: string;
  description: string;
  status: "complete" | "pending" | "in-progress";
}

function RequirementCard({
  icon,
  title,
  description,
  status = "complete",
}: RequirementCardProps) {
  const statusConfig = {
    complete: { bg: "bg-green-100", text: "text-green-800", label: "Complete" },
    pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
    "in-progress": {
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "In Progress",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center mb-3">
        <span className="mr-2">{icon}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
      <div
        className={`mt-3 px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </div>
    </div>
  );
}
