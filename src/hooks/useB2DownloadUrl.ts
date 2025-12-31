import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseB2DownloadUrlResult {
  downloadUrl: string | null;
  proxyUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

const urlCache = new Map<string, { url: string; expiresAt: number }>();

export function useB2DownloadUrl(filePath: string | null | undefined): UseB2DownloadUrlResult {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) {
      setDownloadUrl(null);
      setProxyUrl(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // If it's already a full URL (from old Supabase storage), use it directly
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      setDownloadUrl(filePath);
      setProxyUrl(filePath);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Generate proxy URL immediately (doesn't require B2 auth)
    const generateProxyUrl = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const proxyBaseUrl = `https://oxwhqvsoelqqsblmqkxx.supabase.co/functions/v1/b2-proxy-file`;
        setProxyUrl(`${proxyBaseUrl}?path=${encodeURIComponent(filePath)}`);
      }
    };
    generateProxyUrl();

    // Check cache first for direct URL
    const cached = urlCache.get(filePath);
    const now = Date.now();
    
    if (cached && cached.expiresAt > now) {
      setDownloadUrl(cached.url);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Fetch authorized URL from B2
    const fetchUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.functions.invoke('b2-get-download-url', {
          body: { filePath }
        });

        if (error) throw error;
        if (!data?.downloadUrl) throw new Error('No download URL returned');

        const url = data.downloadUrl;
        const expiresIn = data.expiresIn || 3600; // Default 1 hour

        // Cache the URL (expire 5 minutes before actual expiry for safety)
        urlCache.set(filePath, {
          url,
          expiresAt: now + (expiresIn - 300) * 1000
        });

        setDownloadUrl(url);
      } catch (err) {
        console.error('Error fetching B2 download URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to get download URL');
        setDownloadUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUrl();
  }, [filePath]);

  return { downloadUrl, proxyUrl, isLoading, error };
}
