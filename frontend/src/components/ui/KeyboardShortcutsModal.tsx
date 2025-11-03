/**
 * Keyboard Shortcuts Modal
 *
 * Displays all available keyboard shortcuts organized by category.
 * Triggered by Shift+? or clicking help icon.
 *
 * @module components/ui/KeyboardShortcutsModal
 */

import React, { useState, useEffect } from 'react';
import { KeyboardHint } from '../../hooks/useKeyboardShortcuts';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Card } from './Card';
import { Badge } from './Badge';

interface Shortcut {
  keys: string;
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: 'mod+h', description: 'Go to Home', category: 'Navigation' },
  { keys: 'mod+d', description: 'Go to Dashboard', category: 'Navigation' },
  { keys: 'mod+e', description: 'Go to EVV Clock', category: 'Navigation' },
  { keys: 'mod+s', description: 'Go to Scheduling', category: 'Navigation' },
  { keys: 'mod+b', description: 'Go to Billing', category: 'Navigation' },
  { keys: 'mod+p', description: 'Go to Patients', category: 'Navigation' },
  { keys: 'mod+shift+c', description: 'Go to Caregivers', category: 'Navigation' },

  // Search & Actions
  { keys: 'mod+k', description: 'Open Search', category: 'Search & Actions' },
  { keys: 'mod+/', description: 'Open AI Assistant', category: 'Search & Actions' },
  { keys: 'shift+?', description: 'Show Keyboard Shortcuts', category: 'Search & Actions' },

  // Table Actions
  { keys: 'mod+n', description: 'Create New', category: 'Table Actions' },
  { keys: 'mod+r', description: 'Refresh Table', category: 'Table Actions' },
  { keys: 'mod+shift+e', description: 'Export Data', category: 'Table Actions' },
  { keys: 'enter', description: 'Edit Selected', category: 'Table Actions' },
  { keys: 'del', description: 'Delete Selected', category: 'Table Actions' },

  // Form Actions
  { keys: 'mod+enter', description: 'Save Form', category: 'Form Actions' },
  { keys: 'esc', description: 'Cancel / Close', category: 'Form Actions' },
  { keys: 'mod+shift+r', description: 'Reset Form', category: 'Form Actions' }
];

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShowShortcuts = () => {
      setIsOpen(true);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('show-shortcuts', handleShowShortcuts);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('show-shortcuts', handleShowShortcuts);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Group shortcuts by category
  const groupedShortcuts = SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Keyboard Shortcuts</h2>
            <p className="text-sm text-gray-600 mt-1">
              Speed up your workflow with these keyboard shortcuts
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                  <Badge variant="gray" size="sm">
                    {shortcuts.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm text-gray-700">{shortcut.description}</span>
                      <KeyboardHint keys={shortcut.keys} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Press</span>
              <KeyboardHint keys="shift+?" />
              <span>to toggle this menu</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
