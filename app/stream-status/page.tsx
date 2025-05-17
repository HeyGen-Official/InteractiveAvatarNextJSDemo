'use client';

import { useEffect, useState } from 'react';
import { streamService, StreamStatus } from '@/app/lib/services/streamService';

export default function StreamStatusPage() {
  const [streamStatus, setStreamStatus] = useState<StreamStatus | null>(null);

  useEffect(() => {
    // Function to fetch stream status
    const fetchStreamStatus = async () => {
      try {
        const status = await streamService.getStreamStatus();
        setStreamStatus(status);
      } catch (error) {
        console.error('Error fetching stream status:', error);
      }
    };

    // Initial fetch
    fetchStreamStatus();

    // Set up polling every 5 seconds
    const intervalId = setInterval(fetchStreamStatus, 5000);

    // Cleanup
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${streamStatus?.status ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-white font-medium">
              Stream Status: {streamStatus?.status ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 