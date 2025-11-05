/**
 * Media Library
 * Manage uploaded images and media assets
 */

import React, { useState, useEffect } from 'react';

interface MediaAsset {
  id: string;
  file_name: string;
  original_file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  width?: number;
  height?: number;
  alt_text?: string;
  caption?: string;
  tags?: string[];
  uploaded_at: string;
  uploaded_by_email?: string;
}

export const MediaLibrary: React.FC = () => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/content/media', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch media assets');

      const data = await response.json();
      setAssets(data.data || []);
    } catch (err: any) {
      setError(err.message);
      // Mock data
      setAssets([
        {
          id: '1',
          file_name: 'hero-image.jpg',
          original_file_name: 'hero-image.jpg',
          file_url: 'https://images.unsplash.com/photo-1576765607924-3f7b8410a787?w=800',
          file_type: 'image/jpeg',
          file_size: 245600,
          width: 1920,
          height: 1080,
          alt_text: 'Caregiver assisting elderly patient',
          uploaded_at: new Date().toISOString(),
        },
        {
          id: '2',
          file_name: 'team-photo.jpg',
          original_file_name: 'team-photo.jpg',
          file_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800',
          file_type: 'image/jpeg',
          file_size: 189400,
          width: 1600,
          height: 900,
          alt_text: 'Team of healthcare professionals',
          uploaded_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this media asset?')) return;

    try {
      const response = await fetch(`/api/admin/content/media/${assetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete media asset');

      await fetchAssets();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard!');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${kb.toFixed(2)} KB`;
  };

  const filteredAssets = assets.filter((asset) =>
    asset.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.alt_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Media Library</h2>
          <p className="text-sm text-gray-600">Manage uploaded images and files</p>
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => alert('File upload feature coming soon! For now, use image URLs from Unsplash or other sources.')}
        >
          📤 Upload Media
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Search media by filename or alt text..."
        />
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden group hover:shadow-lg transition-shadow"
          >
            {/* Image Preview */}
            <div className="aspect-video bg-gray-100 relative overflow-hidden">
              {asset.file_type?.startsWith('image/') ? (
                <img
                  src={asset.file_url}
                  alt={asset.alt_text || asset.file_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-4xl">📄</span>
                </div>
              )}

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => copyToClipboard(asset.file_url)}
                  className="px-3 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 text-sm font-medium"
                  title="Copy URL"
                >
                  📋 Copy URL
                </button>
                <button
                  onClick={() => handleDelete(asset.id)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="text-sm font-medium text-gray-900 truncate" title={asset.file_name}>
                {asset.file_name}
              </p>
              {asset.alt_text && (
                <p className="text-xs text-gray-500 truncate mt-1" title={asset.alt_text}>
                  {asset.alt_text}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {formatFileSize(asset.file_size)}
                </span>
                {asset.width && asset.height && (
                  <span className="text-xs text-gray-400">
                    {asset.width}×{asset.height}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredAssets.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-gray-500">
            {searchQuery ? 'No media found matching your search.' : 'No media assets yet. Upload your first file!'}
          </div>
        )}
      </div>

      {/* Usage Note */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">💡 Using Media Assets</h3>
        <p className="text-sm text-blue-800">
          Click "Copy URL" on any media asset to copy its URL to your clipboard.
          Then paste this URL into any image field throughout the CMS (pages, team members, testimonials, etc.).
        </p>
        <p className="text-sm text-blue-800 mt-2">
          <strong>For now:</strong> You can use high-quality images from{' '}
          <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline">
            Unsplash
          </a>
          {' '}or your own hosted images by pasting their URLs directly.
        </p>
      </div>
    </div>
  );
};
