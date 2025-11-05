/**
 * Content Manager - Main CMS Interface
 * Manages all public website content
 */

import React, { useState } from 'react';
import { PagesManager } from './PagesManager';
import { TeamMembersManager } from './TeamMembersManager';
import { TestimonialsManager } from './TestimonialsManager';
import { ServicesManager } from './ServicesManager';
import { OrganizationSettingsManager } from './OrganizationSettingsManager';
import { MediaLibrary } from './MediaLibrary';

type TabType = 'pages' | 'team' | 'testimonials' | 'services' | 'settings' | 'media';

export const ContentManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pages');

  const tabs = [
    { id: 'pages', label: 'Pages & Sections', icon: '📄' },
    { id: 'team', label: 'Team Members', icon: '👥' },
    { id: 'testimonials', label: 'Testimonials', icon: '💬' },
    { id: 'services', label: 'Services', icon: '🏥' },
    { id: 'settings', label: 'Site Settings', icon: '⚙️' },
    { id: 'media', label: 'Media Library', icon: '🖼️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Website Content Manager</h1>
          <p className="mt-2 text-gray-600">
            Manage all content for the public website - pages, team members, testimonials, and more.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap
                    border-b-2 transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'pages' && <PagesManager />}
            {activeTab === 'team' && <TeamMembersManager />}
            {activeTab === 'testimonials' && <TestimonialsManager />}
            {activeTab === 'services' && <ServicesManager />}
            {activeTab === 'settings' && <OrganizationSettingsManager />}
            {activeTab === 'media' && <MediaLibrary />}
          </div>
        </div>
      </div>
    </div>
  );
};
