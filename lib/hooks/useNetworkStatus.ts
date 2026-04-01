// FILE: lib/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react'; // Added missing React imports
import { triggerSupabaseSync } from '@/lib/local-db/syncEngine'; // Fixed import to match renamed file

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial status
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        triggerSupabaseSync(); 
      };
      
      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return isOnline;
}