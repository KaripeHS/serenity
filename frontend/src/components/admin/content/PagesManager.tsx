/**
 * Pages Manager
 * Manage website pages and their sections
 */

import React, { useState, useEffect } from 'react';

interface Page {
  id: string;
  page_slug: string;
  page_title: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_cta_text?: string;
  hero_cta_url?: string;
  hero_image_url?: string;
  meta_description?: string;
  meta_keywords?: string;
  published: boolean;
  section_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface PageSection {
  id: string;
  page_id: string;
  section_type: string;
  section_title?: string;
  section_subtitle?: string;
  content?: string;
  content_format: 'markdown' | 'html' | 'plain';
  image_url?: string;
  image_alt?: string;
  background_color?: string;
  cta_text?: string;
  cta_url?: string;
  position: number;
  published: boolean;
}

export const PagesManager: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPageForm, setShowPageForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [editingSection, setEditingSection] = useState<PageSection | null>(null);

  const [pageFormData, setPageFormData] = useState({
    page_slug: '',
    page_title: '',
    hero_title: '',
    hero_subtitle: '',
    hero_cta_text: '',
    hero_cta_url: '',
    hero_image_url: '',
    meta_description: '',
    meta_keywords: '',
    published: false,
  });

  const [sectionFormData, setSectionFormData] = useState({
    section_type: 'text',
    section_title: '',
    section_subtitle: '',
    content: '',
    content_format: 'markdown' as 'markdown' | 'html' | 'plain',
    image_url: '',
    image_alt: '',
    background_color: '',
    cta_text: '',
    cta_url: '',
    position: 0,
    published: true,
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/content/pages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch pages');

      const data = await response.json();
      setPages(data.data || []);
    } catch (err: any) {
      setError(err.message);
      // Fallback to mock data for development
      setPages([
        {
          id: '1',
          page_slug: 'home',
          page_title: 'Home',
          hero_title: 'Compassionate Home Care You Can Trust',
          hero_subtitle: 'Pod-based care model for personalized, consistent support',
          published: true,
          section_count: 5,
        },
        {
          id: '2',
          page_slug: 'about',
          page_title: 'About Us',
          hero_title: 'Our Story',
          published: true,
          section_count: 3,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (pageId: string) => {
    try {
      const response = await fetch(`/api/admin/content/pages/${pageId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch sections');

      const data = await response.json();
      setSections(data.data.sections || []);
    } catch (err: any) {
      console.error('Error fetching sections:', err);
      setSections([]);
    }
  };

  const handleSelectPage = (page: Page) => {
    setSelectedPage(page);
    fetchSections(page.id);
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editingPage
        ? `/api/admin/content/pages/${editingPage.id}`
        : '/api/admin/content/pages';

      const method = editingPage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(pageFormData),
      });

      if (!response.ok) throw new Error('Failed to save page');

      await fetchPages();
      setShowPageForm(false);
      setEditingPage(null);
      resetPageForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) return;

    setLoading(true);
    setError(null);

    try {
      const url = editingSection
        ? `/api/admin/content/sections/${editingSection.id}`
        : '/api/admin/content/sections';

      const method = editingSection ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          ...sectionFormData,
          page_id: selectedPage.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to save section');

      await fetchSections(selectedPage.id);
      setShowSectionForm(false);
      setEditingSection(null);
      resetSectionForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page? This will also delete all its sections.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/content/pages/${pageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete page');

      await fetchPages();
      if (selectedPage?.id === pageId) {
        setSelectedPage(null);
        setSections([]);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/content/sections/${sectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete section');

      if (selectedPage) {
        await fetchSections(selectedPage.id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetPageForm = () => {
    setPageFormData({
      page_slug: '',
      page_title: '',
      hero_title: '',
      hero_subtitle: '',
      hero_cta_text: '',
      hero_cta_url: '',
      hero_image_url: '',
      meta_description: '',
      meta_keywords: '',
      published: false,
    });
  };

  const resetSectionForm = () => {
    setSectionFormData({
      section_type: 'text',
      section_title: '',
      section_subtitle: '',
      content: '',
      content_format: 'markdown',
      image_url: '',
      image_alt: '',
      background_color: '',
      cta_text: '',
      cta_url: '',
      position: sections.length,
      published: true,
    });
  };

  const editPage = (page: Page) => {
    setEditingPage(page);
    setPageFormData({
      page_slug: page.page_slug,
      page_title: page.page_title,
      hero_title: page.hero_title || '',
      hero_subtitle: page.hero_subtitle || '',
      hero_cta_text: page.hero_cta_text || '',
      hero_cta_url: page.hero_cta_url || '',
      hero_image_url: page.hero_image_url || '',
      meta_description: page.meta_description || '',
      meta_keywords: page.meta_keywords || '',
      published: page.published,
    });
    setShowPageForm(true);
  };

  const editSection = (section: PageSection) => {
    setEditingSection(section);
    setSectionFormData({
      section_type: section.section_type,
      section_title: section.section_title || '',
      section_subtitle: section.section_subtitle || '',
      content: section.content || '',
      content_format: section.content_format,
      image_url: section.image_url || '',
      image_alt: section.image_alt || '',
      background_color: section.background_color || '',
      cta_text: section.cta_text || '',
      cta_url: section.cta_url || '',
      position: section.position,
      published: section.published,
    });
    setShowSectionForm(true);
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pages List */}
        <div className="lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Pages</h2>
            <button
              onClick={() => {
                resetPageForm();
                setEditingPage(null);
                setShowPageForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Page
            </button>
          </div>

          <div className="space-y-2">
            {pages.map((page) => (
              <div
                key={page.id}
                className={`
                  p-4 rounded-lg border cursor-pointer transition-colors
                  ${
                    selectedPage?.id === page.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }
                `}
                onClick={() => handleSelectPage(page)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{page.page_title}</h3>
                    <p className="text-sm text-gray-500">/{page.page_slug}</p>
                    <div className="flex gap-2 mt-2">
                      <span
                        className={`
                          inline-flex items-center px-2 py-1 rounded text-xs font-medium
                          ${page.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                        `}
                      >
                        {page.published ? '✓ Published' : 'Draft'}
                      </span>
                      {page.section_count !== undefined && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {page.section_count} sections
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        editPage(page);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit page"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(page.id);
                      }}
                      className="text-red-600 hover:text-red-800"
                      title="Delete page"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {pages.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                No pages yet. Create your first page!
              </div>
            )}
          </div>
        </div>

        {/* Sections List */}
        <div className="lg:col-span-2">
          {selectedPage ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{selectedPage.page_title} - Sections</h2>
                  <p className="text-sm text-gray-500">Drag to reorder sections</p>
                </div>
                <button
                  onClick={() => {
                    resetSectionForm();
                    setEditingSection(null);
                    setShowSectionForm(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  + New Section
                </button>
              </div>

              <div className="space-y-3">
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    className="p-4 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-gray-400">#{index + 1}</span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                            {section.section_type}
                          </span>
                          {!section.published && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              Hidden
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900">
                          {section.section_title || 'Untitled Section'}
                        </h3>
                        {section.section_subtitle && (
                          <p className="text-sm text-gray-600 mt-1">{section.section_subtitle}</p>
                        )}
                        {section.content && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                            {section.content.substring(0, 150)}...
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editSection(section)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit section"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete section"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {sections.length === 0 && (
                  <div className="text-center py-8 text-gray-500 bg-white border border-gray-200 rounded-lg">
                    No sections yet. Add your first section!
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Select a page to view and edit its sections</p>
            </div>
          )}
        </div>
      </div>

      {/* Page Form Modal */}
      {showPageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingPage ? 'Edit Page' : 'Create New Page'}
              </h2>

              <form onSubmit={handleSavePage} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Page Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={pageFormData.page_slug}
                      onChange={(e) => setPageFormData({ ...pageFormData, page_slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., about, services, contact"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Page Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={pageFormData.page_title}
                      onChange={(e) => setPageFormData({ ...pageFormData, page_title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., About Us"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hero Title
                  </label>
                  <input
                    type="text"
                    value={pageFormData.hero_title}
                    onChange={(e) => setPageFormData({ ...pageFormData, hero_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Main headline on the page"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hero Subtitle
                  </label>
                  <textarea
                    value={pageFormData.hero_subtitle}
                    onChange={(e) => setPageFormData({ ...pageFormData, hero_subtitle: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Supporting text below the hero title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hero CTA Text
                    </label>
                    <input
                      type="text"
                      value={pageFormData.hero_cta_text}
                      onChange={(e) => setPageFormData({ ...pageFormData, hero_cta_text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Get Started"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hero CTA URL
                    </label>
                    <input
                      type="text"
                      value={pageFormData.hero_cta_url}
                      onChange={(e) => setPageFormData({ ...pageFormData, hero_cta_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="/contact"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hero Image URL
                  </label>
                  <input
                    type="text"
                    value={pageFormData.hero_image_url}
                    onChange={(e) => setPageFormData({ ...pageFormData, hero_image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description (SEO)
                  </label>
                  <textarea
                    value={pageFormData.meta_description}
                    onChange={(e) => setPageFormData({ ...pageFormData, meta_description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description for search engines"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Keywords (SEO)
                  </label>
                  <input
                    type="text"
                    value={pageFormData.meta_keywords}
                    onChange={(e) => setPageFormData({ ...pageFormData, meta_keywords: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="published"
                    checked={pageFormData.published}
                    onChange={(e) => setPageFormData({ ...pageFormData, published: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
                    Publish this page (make it visible on the website)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPageForm(false);
                      setEditingPage(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  >
                    {loading ? 'Saving...' : editingPage ? 'Update Page' : 'Create Page'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Section Form Modal */}
      {showSectionForm && selectedPage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingSection ? 'Edit Section' : 'Create New Section'}
              </h2>

              <form onSubmit={handleSaveSection} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section Type *
                    </label>
                    <select
                      required
                      value={sectionFormData.section_type}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, section_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="text">Text</option>
                      <option value="features">Features</option>
                      <option value="stats">Statistics</option>
                      <option value="cta">Call to Action</option>
                      <option value="image-text">Image + Text</option>
                      <option value="testimonials">Testimonials</option>
                      <option value="services">Services</option>
                      <option value="team">Team</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <input
                      type="number"
                      value={sectionFormData.position}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, position: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={sectionFormData.section_title}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, section_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section Subtitle
                  </label>
                  <input
                    type="text"
                    value={sectionFormData.section_subtitle}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, section_subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={sectionFormData.content}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, content: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="Enter content (supports markdown)"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content Format
                    </label>
                    <select
                      value={sectionFormData.content_format}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, content_format: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="markdown">Markdown</option>
                      <option value="html">HTML</option>
                      <option value="plain">Plain Text</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Background Color
                    </label>
                    <input
                      type="text"
                      value={sectionFormData.background_color}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, background_color: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., #f3f4f6, bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={sectionFormData.image_url}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, image_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image Alt Text
                    </label>
                    <input
                      type="text"
                      value={sectionFormData.image_alt}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, image_alt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe the image"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CTA Text
                    </label>
                    <input
                      type="text"
                      value={sectionFormData.cta_text}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, cta_text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Learn More"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CTA URL
                    </label>
                    <input
                      type="text"
                      value={sectionFormData.cta_url}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, cta_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="/contact"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="section-published"
                    checked={sectionFormData.published}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, published: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="section-published" className="ml-2 block text-sm text-gray-700">
                    Publish this section
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSectionForm(false);
                      setEditingSection(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                  >
                    {loading ? 'Saving...' : editingSection ? 'Update Section' : 'Create Section'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
