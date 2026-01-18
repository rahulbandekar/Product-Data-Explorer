'use client';

import { useState } from 'react';

export default function ScrapeButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleScrape() {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:4000/scrape/navigation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: true }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Scraping job started!\n\nMessage: ${result.message}\nJob ID: ${result.jobId}\n\nPage will refresh in 5 seconds...`);
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      } else {
        alert(`❌ Failed: ${result.message}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleScrape}
      disabled={isLoading}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Scraping...
        </>
      ) : (
        <>
          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Trigger Scrape
        </>
      )}
    </button>
  );
}