import { useState, useEffect } from 'react';

interface ContentAsset {
  key: string;
  url: string;
  alt_text: string;
  section: string;
}

// In-memory cache shared across all hook instances
const assetCache: Record<string, ContentAsset[]> = {};
const pendingRequests: Record<string, Promise<ContentAsset[]>> = {};

/**
 * Hook to fetch all content assets for a given page.
 * Returns a lookup function to get individual assets by key.
 * Falls back to provided defaults if the API is unavailable.
 */
export function useContentAssets(page: string, defaults: Record<string, { url: string; alt_text: string }> = {}) {
  const [assets, setAssets] = useState<Record<string, ContentAsset>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAssets() {
      // Check cache first
      if (assetCache[page]) {
        if (!cancelled) {
          const map: Record<string, ContentAsset> = {};
          assetCache[page].forEach(a => { map[a.key] = a; });
          setAssets(map);
          setLoading(false);
        }
        return;
      }

      // Deduplicate concurrent requests for the same page
      if (!pendingRequests[page]) {
        pendingRequests[page] = fetch(`/api/public/content-assets?page=${page}`)
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
          })
          .finally(() => {
            delete pendingRequests[page];
          });
      }

      try {
        const data = await pendingRequests[page];
        assetCache[page] = data;
        if (!cancelled) {
          const map: Record<string, ContentAsset> = {};
          data.forEach((a: ContentAsset) => { map[a.key] = a; });
          setAssets(map);
        }
      } catch {
        // API unavailable — use defaults silently
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAssets();
    return () => { cancelled = true; };
  }, [page]);

  /** Get image URL by asset key, falling back to default */
  function getUrl(key: string): string {
    return assets[key]?.url || defaults[key]?.url || '';
  }

  /** Get alt text by asset key, falling back to default */
  function getAlt(key: string): string {
    return assets[key]?.alt_text || defaults[key]?.alt_text || '';
  }

  return { getUrl, getAlt, loading, assets };
}
