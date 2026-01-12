/**
 * Search Results Page
 * Full page search with filtering and sorting options
 * Displays all matching pages/dashboards from the search index
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  XMarkIcon,
  ArrowLeftIcon,
  FolderIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { canAccessRoute, UserRole } from '../hooks/useRoleAccess';
import { useAuth } from '../contexts/AuthContext';
import {
  SearchItem,
  SearchCategory,
  getFilteredSearchItems,
  searchItems,
} from '../services/searchIndex.service';

type SortOption = 'relevance' | 'name-asc' | 'name-desc' | 'category';

const CATEGORY_OPTIONS: SearchCategory[] = [
  'Main',
  'Portals',
  'Care Delivery',
  'Clinical',
  'Billing',
  'HR',
  'Compliance',
  'Operations',
  'Finance',
  'Admin',
  'Quick Actions',
  'Reports',
  'Settings',
];

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get query from URL
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);

  // Filtering and sorting state
  const [selectedCategories, setSelectedCategories] = useState<Set<SearchCategory>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showFilters, setShowFilters] = useState(false);

  // Update query when URL changes
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    setQuery(urlQuery);
    setInputValue(urlQuery);
  }, [searchParams]);

  // Get RBAC-filtered items
  const accessibleItems = useMemo(() => {
    if (!user?.role) return [];
    return getFilteredSearchItems(
      user.role,
      (route, role) => canAccessRoute(route, role as UserRole)
    );
  }, [user?.role]);

  // Search items
  const searchResults = useMemo(() => {
    if (!query.trim()) return accessibleItems;
    return searchItems(accessibleItems, query, 100); // Get all results
  }, [query, accessibleItems]);

  // Apply category filter
  const filteredResults = useMemo(() => {
    if (selectedCategories.size === 0) return searchResults;
    return searchResults.filter(item => selectedCategories.has(item.category));
  }, [searchResults, selectedCategories]);

  // Apply sorting
  const sortedResults = useMemo(() => {
    const results = [...filteredResults];

    switch (sortBy) {
      case 'name-asc':
        return results.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return results.sort((a, b) => b.name.localeCompare(a.name));
      case 'category':
        return results.sort((a, b) => a.category.localeCompare(b.category));
      case 'relevance':
      default:
        return results; // Already sorted by relevance from searchItems
    }
  }, [filteredResults, sortBy]);

  // Get available categories from results
  const availableCategories = useMemo(() => {
    const cats = new Set<SearchCategory>();
    searchResults.forEach(item => cats.add(item.category));
    return CATEGORY_OPTIONS.filter(cat => cats.has(cat));
  }, [searchResults]);

  // Handle search form submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    }
  };

  // Toggle category filter
  const toggleCategory = (category: SearchCategory) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories(new Set());
    setSortBy('relevance');
  };

  // Navigate to item
  const handleItemClick = (item: SearchItem) => {
    navigate(item.href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          {/* Back button and title */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Search</h1>
          </div>

          {/* Search input */}
          <form onSubmit={handleSearch} className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Search dashboards, pages, actions..."
              className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
              autoFocus
            />
          </form>

          {/* Filter and sort controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  showFilters || selectedCategories.size > 0
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FunnelIcon className="h-4 w-4" />
                Filters
                {selectedCategories.size > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                    {selectedCategories.size}
                  </span>
                )}
              </button>

              {(selectedCategories.size > 0 || sortBy !== 'relevance') && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="relevance">Relevance</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>

          {/* Category filter chips */}
          {showFilters && availableCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              {availableCategories.map(category => {
                const isSelected = selectedCategories.has(category);
                const count = searchResults.filter(r => r.category === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isSelected && <CheckIcon className="h-3.5 w-3.5" />}
                    {category}
                    <span className={`text-xs ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Results count */}
        <div className="mb-4 text-sm text-gray-500">
          {query ? (
            <>
              Found <span className="font-medium text-gray-900">{sortedResults.length}</span> results
              {query && <> for "<span className="font-medium text-gray-900">{query}</span>"</>}
            </>
          ) : (
            <>
              Showing <span className="font-medium text-gray-900">{sortedResults.length}</span> pages
            </>
          )}
        </div>

        {/* Results list */}
        {sortedResults.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
            <p className="mt-2 text-sm text-gray-500">
              {query
                ? `We couldn't find any pages matching "${query}". Try different keywords.`
                : 'Try searching for a dashboard, page, or action.'}
            </p>
            {selectedCategories.size > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {sortedResults.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                    <Icon className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <ArrowsUpDownIcon className="h-4 w-4 text-gray-300 rotate-90" />
                </button>
              );
            })}
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <span>Press </span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded">Ctrl+K</kbd>
          <span> to search from anywhere</span>
        </div>
      </div>
    </div>
  );
}
