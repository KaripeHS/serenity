/**
 * Global Search Modal (Command Palette)
 *
 * Universal search interface triggered by Cmd+K / Ctrl+K:
 * - Search patients, caregivers, claims, visits
 * - Quick navigation to any page
 * - Execute common actions
 * - Fuzzy search with keyboard navigation
 * - Recent searches
 * - Search suggestions
 *
 * @module components/ui/GlobalSearchModal
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  UserGroupIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  HeartIcon,
  TruckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { KeyboardHint } from '../../hooks/useKeyboardShortcuts';
import { Badge } from './Badge';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: 'patient' | 'caregiver' | 'claim' | 'visit' | 'page' | 'action';
  icon: React.ComponentType<any>;
  href?: string;
  action?: () => void;
}

const QUICK_ACTIONS: SearchResult[] = [
  {
    id: 'create-visit',
    title: 'Create New Visit',
    subtitle: 'Schedule a patient visit',
    category: 'action',
    icon: CalendarIcon,
    href: '/scheduling/new'
  },
  {
    id: 'create-patient',
    title: 'Add New Patient',
    subtitle: 'Patient intake',
    category: 'action',
    icon: UserGroupIcon,
    href: '/patients/new'
  },
  {
    id: 'create-caregiver',
    title: 'Add New Caregiver',
    subtitle: 'Caregiver registration',
    category: 'action',
    icon: UsersIcon,
    href: '/caregivers/new'
  },
  {
    id: 'process-billing',
    title: 'Process Billing',
    subtitle: 'Submit claims',
    category: 'action',
    icon: CurrencyDollarIcon,
    href: '/billing/process'
  }
];

const QUICK_NAV: SearchResult[] = [
  {
    id: 'nav-dashboard',
    title: 'Dashboard',
    subtitle: 'Overview and metrics',
    category: 'page',
    icon: ChartBarIcon,
    href: '/dashboard'
  },
  {
    id: 'nav-evv',
    title: 'EVV Clock',
    subtitle: 'Time tracking',
    category: 'page',
    icon: ClockIcon,
    href: '/evv/clock'
  },
  {
    id: 'nav-scheduling',
    title: 'Scheduling',
    subtitle: 'Manage visits',
    category: 'page',
    icon: CalendarIcon,
    href: '/scheduling'
  },
  {
    id: 'nav-patients',
    title: 'Patients',
    subtitle: 'Patient directory',
    category: 'page',
    icon: HeartIcon,
    href: '/patients'
  },
  {
    id: 'nav-caregivers',
    title: 'Caregivers',
    subtitle: 'Staff directory',
    category: 'page',
    icon: UsersIcon,
    href: '/caregivers'
  },
  {
    id: 'nav-billing',
    title: 'Billing',
    subtitle: 'Claims and payments',
    category: 'page',
    icon: CurrencyDollarIcon,
    href: '/billing'
  },
  {
    id: 'nav-operations',
    title: 'Operations',
    subtitle: 'Daily operations',
    category: 'page',
    icon: TruckIcon,
    href: '/dashboard/operations'
  }
];

export function GlobalSearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Open/close modal
  useEffect(() => {
    const handleOpenSearch = () => {
      setIsOpen(true);
      setQuery('');
      setSelectedIndex(0);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('open-search', handleOpenSearch);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-search', handleOpenSearch);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      try {
        setRecentSearches(JSON.parse(recent));
      } catch (e) {
        // Ignore
      }
    }
  }, []);

  // Perform search
  const performSearch = async (q: string): Promise<SearchResult[]> => {
    if (!q.trim()) {
      // Return quick actions and navigation when no query
      return [...QUICK_ACTIONS, ...QUICK_NAV];
    }

    const lowerQuery = q.toLowerCase();

    // Filter quick actions and navigation
    const filtered = [...QUICK_ACTIONS, ...QUICK_NAV].filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.subtitle?.toLowerCase().includes(lowerQuery)
    );

    // In real implementation, this would also search:
    // - Patients (API call)
    // - Caregivers (API call)
    // - Claims (API call)
    // - Visits (API call)

    // Mock patient results
    if (lowerQuery.includes('patient') || lowerQuery.includes('john') || lowerQuery.includes('mary')) {
      filtered.push({
        id: 'patient-1',
        title: 'John Doe',
        subtitle: 'Patient #12345 • 123 Main St',
        category: 'patient',
        icon: HeartIcon,
        href: '/patients/12345'
      });

      filtered.push({
        id: 'patient-2',
        title: 'Mary Smith',
        subtitle: 'Patient #12346 • 456 Oak Ave',
        category: 'patient',
        icon: HeartIcon,
        href: '/patients/12346'
      });
    }

    // Mock caregiver results
    if (lowerQuery.includes('caregiver') || lowerQuery.includes('sarah') || lowerQuery.includes('staff')) {
      filtered.push({
        id: 'caregiver-1',
        title: 'Sarah Johnson',
        subtitle: 'Caregiver • Pod A • Active',
        category: 'caregiver',
        icon: UsersIcon,
        href: '/caregivers/101'
      });
    }

    return filtered;
  };

  const [results, setResults] = useState<SearchResult[]>([]);

  // Update results when query changes
  useEffect(() => {
    const search = async () => {
      const searchResults = await performSearch(query);
      setResults(searchResults);
      setSelectedIndex(0);
    };

    search();
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        event.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
    }
  };

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    // Save to recent searches
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    // Navigate or execute action
    if (result.href) {
      navigate(result.href);
    } else if (result.action) {
      result.action();
    }

    setIsOpen(false);
  };

  const getCategoryBadge = (category: SearchResult['category']) => {
    const variants = {
      patient: 'default',
      caregiver: 'success',
      claim: 'warning',
      visit: 'info',
      page: 'gray',
      action: 'default'
    };

    const labels = {
      patient: 'Patient',
      caregiver: 'Caregiver',
      claim: 'Claim',
      visit: 'Visit',
      page: 'Page',
      action: 'Action'
    };

    return (
      <Badge variant={variants[category] as any} size="sm">
        {labels[category]}
      </Badge>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 pt-20">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden animate-slide-up">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search patients, caregivers, claims, visits, or navigate..."
              className="flex-1 text-lg outline-none bg-transparent"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No results found</p>
              <p className="text-sm mt-1">Try searching for patients, caregivers, or pages</p>
            </div>
          ) : (
            <div>
              {results.map((result, index) => {
                const Icon = result.icon;
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary-100' : 'bg-gray-100'}`}>
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-primary-600' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-sm text-gray-500">{result.subtitle}</div>
                      )}
                    </div>
                    {getCategoryBadge(result.category)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <KeyboardHint keys="↑" className="text-xs" />
              <KeyboardHint keys="↓" className="text-xs" />
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <KeyboardHint keys="enter" className="text-xs" />
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1">
              <KeyboardHint keys="esc" className="text-xs" />
              <span>Close</span>
            </div>
          </div>
          <div className="text-gray-500">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
