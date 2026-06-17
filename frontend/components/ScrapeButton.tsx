'use client';

import { useState } from 'react';
import { useScrapeNavigation } from '@/hooks/use-api';

export default function ScrapeButton() {
  const scrapeNavigation = useScrapeNavigation();
  const [message, setMessage] = useState<string | null>(null);

  async function handleScrape() {
    try {
      const result = await scrapeNavigation.mutateAsync(true);
      setMessage(`Job queued — data will appear in a few seconds`);
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
      setTimeout(() => setMessage(null), 5000);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleScrape}
        disabled={scrapeNavigation.isPending}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {scrapeNavigation.isPending ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Scraping...
          </>
        ) : (
          <>
            <svg
              className="-ml-1 mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Trigger Scrape
          </>
        )}
      </button>
      {message && (
        <span className="text-xs text-gray-500">{message}</span>
      )}
    </div>
  );
}