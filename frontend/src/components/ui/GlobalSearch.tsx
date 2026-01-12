/**
 * Global Search Component
 * Inline search with dropdown results - type directly in the search bar
 * Press Enter to open full search results page with filtering/sorting
 *
 * HIPAA Compliance:
 * - Only indexes navigation metadata (page names, descriptions)
 * - NO patient/client data is ever searched or displayed
 * - Results are filtered by RBAC (user role permissions)
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ArrowRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { canAccessRoute, UserRole } from '../../hooks/useRoleAccess';
import { useAuth } from '../../contexts/AuthContext';
import {
  SearchItem,
  getFilteredSearchItems,
  searchItems,
  groupByCategory,
} from '../../services/searchIndex.service';

interface GlobalSearchProps {
  /** Placeholder text for search input */
  placeholder?: string;
}

export function GlobalSearch({
  placeholder = 'Search dashboards, pages, actions...',
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get RBAC-filtered items for the current user
  const accessibleItems = useMemo(() => {
    if (!user?.role) return [];
    return getFilteredSearchItems(
      user.role,
      (route, role) => canAccessRoute(route, role as UserRole)
    );
  }, [user?.role]);

  // Search and filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return [];
    return searchItems(accessibleItems, query, 8); // Show max 8 in dropdown
  }, [query, accessibleItems]);

  // Group filtered items by category for display
  const groupedItems = useMemo(() => {
    const groups = groupByCategory(filteredItems);
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [filteredItems]);

  // Flatten for keyboard navigation
  const flattenedItems = useMemo(() => {
    return groupedItems.flatMap(([_, items]) => items);
  }, [groupedItems]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      // "/" when not in an input to focus search
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (dropdownRef.current && flattenedItems.length > 0) {
      const selectedElement = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, flattenedItems.length]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsDropdownOpen(value.trim().length > 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isDropdownOpen && e.key !== 'Enter') return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isDropdownOpen && query.trim()) {
          setIsDropdownOpen(true);
        } else {
          setSelectedIndex(i => Math.min(i + 1, flattenedItems.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flattenedItems[selectedIndex] && isDropdownOpen) {
          // Navigate to selected item
          handleSelect(flattenedItems[selectedIndex]);
        } else if (query.trim()) {
          // Navigate to full search results page
          navigateToSearchPage();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        inputRef.current?.blur();
        break;
      case 'Tab':
        setIsDropdownOpen(false);
        break;
    }
  }, [flattenedItems, selectedIndex, isDropdownOpen, query]);

  // Handle item selection from dropdown
  const handleSelect = useCallback((item: SearchItem) => {
    setQuery('');
    setIsDropdownOpen(false);
    navigate(item.href);
  }, [navigate]);

  // Navigate to full search results page
  const navigateToSearchPage = useCallback(() => {
    if (query.trim()) {
      setIsDropdownOpen(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, navigate]);

  // Clear search
  const handleClear = () => {
    setQuery('');
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  // Handle focus
  const handleFocus = () => {
    if (query.trim()) {
      setIsDropdownOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full h-10 pl-10 pr-20 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs text-gray-400 bg-gray-100 rounded border border-gray-200 font-sans">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Dropdown Results */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
        >
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No results found</p>
              <p className="text-xs text-gray-400 mt-1">
                Press Enter to search all pages
              </p>
            </div>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto">
                {groupedItems.map(([category, items]) => (
                  <div key={category}>
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">
                      {category}
                    </div>
                    {items.map((item: SearchItem) => {
                      const globalIndex = flattenedItems.indexOf(item);
                      const isSelected = globalIndex === selectedIndex;
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.id}
                          data-index={globalIndex}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                            isSelected
                              ? 'bg-blue-50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <Icon className={`h-5 w-5 flex-shrink-0 ${
                            isSelected ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              isSelected ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {item.description}
                            </p>
                          </div>
                          {isSelected && (
                            <ArrowRightIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Footer with hint */}
              <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded mr-1">↑↓</kbd>
                  Navigate
                  <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded mx-1">Enter</kbd>
                  Select
                </span>
                <button
                  onClick={navigateToSearchPage}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all results →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
