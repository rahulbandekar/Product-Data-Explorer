'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { apiService } from '@/services/api.service';

let sessionId: string | null = null;

export function useBrowsingHistory() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only track in production or if explicitly enabled
    const shouldTrack = process.env.NODE_ENV === 'production' || false;
    
    if (!shouldTrack) {
      return;
    }

    // Generate or retrieve session ID
    if (!sessionId) {
      sessionId = localStorage.getItem('sessionId') || crypto.randomUUID();
      localStorage.setItem('sessionId', sessionId);
    }

    // Track page view - with error handling
    const trackView = async () => {
      const fullPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      
      try {
        // Try to use the endpoint if it exists
        await apiService.trackView(fullPath, sessionId!);
      } catch (error) {
        // Silently fail - this is a bonus feature
        console.debug('History tracking not available');
      }
    };

    // Debounce tracking to avoid excessive calls
    const timeoutId = setTimeout(trackView, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [pathname, searchParams]);
}