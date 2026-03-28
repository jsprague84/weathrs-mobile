import { useQuery } from '@tanstack/react-query';

interface RadarMetadata {
  /** Unix timestamp of the latest available tile */
  timestamp: number;
  /** ISO string for display */
  updatedAt: string;
}

/**
 * Hook that tracks radar tile freshness.
 * Polls every 5 minutes to trigger tile re-fetches.
 * For Weather Maps 1.0 (free tier), tiles are always "current" —
 * this hook provides the polling trigger and timestamp.
 */
export function useRadar() {
  const { data } = useQuery<RadarMetadata>({
    queryKey: ['radar', 'metadata'],
    queryFn: () => ({
      timestamp: Math.floor(Date.now() / 1000),
      updatedAt: new Date().toISOString(),
    }),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 4 * 60 * 1000, // 4 minutes
  });

  return {
    timestamp: data?.timestamp ?? Math.floor(Date.now() / 1000),
    updatedAt: data?.updatedAt ?? new Date().toISOString(),
  };
}
