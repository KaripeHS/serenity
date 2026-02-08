import React, { useState, useEffect, useRef } from 'react';
import { request, getAccessToken } from '../../services/api';

interface ContentAsset {
  id: string;
  key: string;
  url: string;
  description: string;
  section: string;
  page: string;
  alt_text: string;
  image_type: string;
  is_external: boolean;
  file_size: number | null;
  mime_type: string | null;
  sort_order: number;
  updated_at: string;
  updated_by: string | null;
}

const PAGE_LABELS: Record<string, string> = {
  home: 'Home Page',
  about: 'About Page',
  careers: 'Careers Page',
  services: 'Services Page',
};

const PAGES = ['home', 'about', 'careers', 'services'];

export default function ImageManagement() {
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ alt_text: '', description: '' });
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<ContentAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    try {
      const data = await request<ContentAsset[]>('/api/admin/content-assets');
      setAssets(data);
    } catch {
      // Silently handle — admin page will show empty state
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveMetadata(id: string) {
    setSaving(true);
    try {
      const updated = await request<ContentAsset>(`/api/admin/content-assets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      setAssets(prev => prev.map(a => (a.id === id ? updated : a)));
      setEditingId(null);
    } catch {
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(id: string, file: File) {
    setUploadingId(id);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const authValue = `Bearer ${getAccessToken()}`;

      const res = await fetch(`/api/admin/content-assets/${id}/upload`, {
        method: 'POST',
        headers: { Authorization: authValue },
        body: formData,
      });
      if (res.ok) {
        const updated = await res.json();
        setAssets(prev => prev.map(a => (a.id === id ? updated : a)));
      } else {
        alert('Upload failed. Check file size (max 10MB) and type.');
      }
    } catch {
      alert('Upload failed');
    } finally {
      setUploadingId(null);
    }
  }

  function startEdit(asset: ContentAsset) {
    setEditingId(asset.id);
    setEditForm({ alt_text: asset.alt_text || '', description: asset.description || '' });
  }

  const filtered = activePage === 'all' ? assets : assets.filter(a => a.page === activePage);
  const grouped = filtered.reduce<Record<string, ContentAsset[]>>((acc, asset) => {
    const group = asset.page || 'unknown';
    if (!acc[group]) acc[group] = [];
    acc[group].push(asset);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-warm-gray-200 rounded w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-warm-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-warm-gray-900">Website Images</h1>
        <p className="text-warm-gray-600 mt-1">
          Manage all images used across the public website. Upload replacements, update alt text, and preview changes.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-warm-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-serenity-green-600">{assets.length}</div>
          <div className="text-sm text-warm-gray-500">Total Images</div>
        </div>
        {PAGES.map(page => (
          <div key={page} className="bg-white rounded-xl border border-warm-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-warm-gray-800">
              {assets.filter(a => a.page === page).length}
            </div>
            <div className="text-sm text-warm-gray-500">{PAGE_LABELS[page]}</div>
          </div>
        ))}
      </div>

      {/* Page Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActivePage('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activePage === 'all'
              ? 'bg-serenity-green-500 text-white'
              : 'bg-warm-gray-100 text-warm-gray-700 hover:bg-warm-gray-200'
          }`}
        >
          All Pages ({assets.length})
        </button>
        {PAGES.map(page => (
          <button
            key={page}
            onClick={() => setActivePage(page)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePage === page
                ? 'bg-serenity-green-500 text-white'
                : 'bg-warm-gray-100 text-warm-gray-700 hover:bg-warm-gray-200'
            }`}
          >
            {PAGE_LABELS[page]} ({assets.filter(a => a.page === page).length})
          </button>
        ))}
      </div>

      {/* Image Grid by Page */}
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([page, pageAssets]) => (
        <div key={page} className="mb-10">
          <h2 className="text-xl font-semibold text-warm-gray-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-serenity-green-500 rounded-full" />
            {PAGE_LABELS[page] || page}
            <span className="text-sm font-normal text-warm-gray-400">({pageAssets.length} images)</span>
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {pageAssets.map(asset => (
              <div
                key={asset.id}
                className="bg-white rounded-xl border border-warm-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {/* Image Preview */}
                <div
                  className="relative h-48 bg-warm-gray-100 cursor-pointer overflow-hidden"
                  onClick={() => setPreviewAsset(asset)}
                >
                  <img
                    src={asset.url}
                    alt={asset.alt_text || asset.description || asset.key}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(asset.key)}&background=e5e7eb&color=9ca3af&size=400`;
                    }}
                  />
                  {asset.is_external && (
                    <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                      External
                    </span>
                  )}
                  {uploadingId === asset.id && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>

                {/* Info & Actions */}
                <div className="p-4">
                  <div className="text-xs font-mono text-warm-gray-400 mb-1 truncate" title={asset.key}>
                    {asset.key}
                  </div>

                  {editingId === asset.id ? (
                    <div className="space-y-2 mt-2">
                      <input
                        type="text"
                        value={editForm.alt_text}
                        onChange={e => setEditForm(f => ({ ...f, alt_text: e.target.value }))}
                        placeholder="Alt text..."
                        className="w-full px-3 py-1.5 text-sm border border-warm-gray-300 rounded-lg focus:ring-2 focus:ring-serenity-green-200 focus:border-serenity-green-500 outline-none"
                      />
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Description..."
                        className="w-full px-3 py-1.5 text-sm border border-warm-gray-300 rounded-lg focus:ring-2 focus:ring-serenity-green-200 focus:border-serenity-green-500 outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveMetadata(asset.id)}
                          disabled={saving}
                          className="flex-1 px-3 py-1.5 bg-serenity-green-500 text-white text-sm rounded-lg hover:bg-serenity-green-600 disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-warm-gray-100 text-warm-gray-700 text-sm rounded-lg hover:bg-warm-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-warm-gray-700 line-clamp-2 min-h-[2.5rem]">
                        {asset.alt_text || asset.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-warm-gray-400">
                        <span className="bg-warm-gray-100 px-2 py-0.5 rounded">{asset.section}</span>
                        {asset.image_type && (
                          <span className="bg-warm-gray-100 px-2 py-0.5 rounded">{asset.image_type}</span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => startEdit(asset)}
                          className="flex-1 px-3 py-1.5 text-xs font-medium text-serenity-green-700 bg-serenity-green-50 rounded-lg hover:bg-serenity-green-100 transition-colors"
                        >
                          Edit Info
                        </button>
                        <button
                          onClick={() => {
                            setUploadingId(asset.id);
                            fileInputRef.current?.click();
                          }}
                          className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Replace
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-warm-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg">No images found for this page</p>
        </div>
      )}

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file && uploadingId) {
            handleFileUpload(uploadingId, file);
          }
          e.target.value = '';
        }}
      />

      {/* Full-size Preview Modal */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={previewAsset.url}
                alt={previewAsset.alt_text || ''}
                className="w-full max-h-[60vh] object-contain bg-warm-gray-50"
              />
              <button
                onClick={() => setPreviewAsset(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm bg-warm-gray-100 px-3 py-1 rounded-lg">{previewAsset.key}</span>
                {previewAsset.is_external && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">External URL</span>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-warm-gray-500 uppercase">Alt Text</label>
                <p className="text-warm-gray-800">{previewAsset.alt_text || 'Not set'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-warm-gray-500 uppercase">Description</label>
                <p className="text-warm-gray-800">{previewAsset.description || 'Not set'}</p>
              </div>
              <div className="flex gap-6 text-sm text-warm-gray-500">
                <span>Page: <strong className="text-warm-gray-700">{PAGE_LABELS[previewAsset.page] || previewAsset.page}</strong></span>
                <span>Section: <strong className="text-warm-gray-700">{previewAsset.section}</strong></span>
                <span>Type: <strong className="text-warm-gray-700">{previewAsset.image_type}</strong></span>
              </div>
              <div className="text-xs text-warm-gray-400 truncate">
                URL: {previewAsset.url}
              </div>
              <div className="text-xs text-warm-gray-400">
                Last updated: {new Date(previewAsset.updated_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
