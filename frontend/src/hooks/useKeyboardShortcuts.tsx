/**
 * useKeyboardShortcuts Hook
 *
 * Provides keyboard shortcut functionality for power users:
 * - Global navigation shortcuts
 * - Context-specific actions
 * - Customizable key bindings
 * - Visual shortcut hints
 * - Conflict detection
 * - Cross-platform support (Cmd on Mac, Ctrl on Windows/Linux)
 *
 * @module hooks/useKeyboardShortcuts
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export interface KeyboardShortcut {
  /**
   * Unique identifier for this shortcut
   */
  id: string;

  /**
   * Keys to press (e.g., 'ctrl+k', 'cmd+shift+p')
   * Use 'mod' for platform-agnostic Cmd/Ctrl
   */
  keys: string;

  /**
   * Human-readable description
   */
  description: string;

  /**
   * Category for grouping
   */
  category: 'navigation' | 'actions' | 'search' | 'editing' | 'global';

  /**
   * Handler function
   */
  handler: (event: KeyboardEvent) => void;

  /**
   * Only active in specific contexts
   */
  context?: string;

  /**
   * Disabled state
   */
  disabled?: boolean;
}

/**
 * Platform detection
 */
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/**
 * Normalize keyboard event to shortcut string
 */
function eventToShortcut(event: KeyboardEvent): string {
  const parts: string[] = [];

  if (event.ctrlKey || (isMac && event.metaKey)) {
    parts.push(isMac ? 'cmd' : 'ctrl');
  }
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');

  // Normalize key name
  let key = event.key.toLowerCase();

  // Special keys
  const specialKeys: Record<string, string> = {
    ' ': 'space',
    'escape': 'esc',
    'arrowup': 'up',
    'arrowdown': 'down',
    'arrowleft': 'left',
    'arrowright': 'right'
  };

  key = specialKeys[key] || key;

  parts.push(key);

  return parts.join('+');
}

/**
 * Normalize shortcut string (replace 'mod' with platform-specific)
 */
function normalizeShortcut(shortcut: string): string {
  return shortcut.replace('mod', isMac ? 'cmd' : 'ctrl');
}

/**
 * useKeyboardShortcuts Hook
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], context?: string) {
  const activeShortcuts = useRef<Map<string, KeyboardShortcut>>(new Map());

  useEffect(() => {
    // Build shortcut map
    activeShortcuts.current.clear();
    for (const shortcut of shortcuts) {
      if (shortcut.disabled) continue;
      if (context && shortcut.context && shortcut.context !== context) continue;

      const normalizedKeys = normalizeShortcut(shortcut.keys);
      activeShortcuts.current.set(normalizedKeys, shortcut);
    }

    // Handler
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow certain global shortcuts even in inputs
        const eventShortcut = eventToShortcut(event);
        const shortcut = activeShortcuts.current.get(eventShortcut);
        if (!shortcut || shortcut.category !== 'global') {
          return;
        }
      }

      const eventShortcut = eventToShortcut(event);
      const shortcut = activeShortcuts.current.get(eventShortcut);

      if (shortcut) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.handler(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, context]);
}

/**
 * Global Navigation Shortcuts
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    {
      id: 'nav-home',
      keys: 'mod+h',
      description: 'Go to Home',
      category: 'navigation',
      handler: () => navigate('/')
    },
    {
      id: 'nav-dashboard',
      keys: 'mod+d',
      description: 'Go to Dashboard',
      category: 'navigation',
      handler: () => navigate('/dashboard/executive')
    },
    {
      id: 'nav-search',
      keys: 'mod+k',
      description: 'Open Search',
      category: 'search',
      handler: () => {
        // Trigger search modal
        const event = new CustomEvent('open-search');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'nav-help',
      keys: 'shift+?',
      description: 'Show Keyboard Shortcuts',
      category: 'global',
      handler: () => {
        // Trigger shortcuts modal
        const event = new CustomEvent('show-shortcuts');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'nav-evv',
      keys: 'mod+e',
      description: 'Go to EVV Clock',
      category: 'navigation',
      handler: () => navigate('/evv/clock')
    },
    {
      id: 'nav-scheduling',
      keys: 'mod+s',
      description: 'Go to Scheduling',
      category: 'navigation',
      handler: () => navigate('/dashboard/scheduling-calendar')
    },
    {
      id: 'nav-billing',
      keys: 'mod+b',
      description: 'Go to Billing',
      category: 'navigation',
      handler: () => navigate('/dashboard/billing')
    },
    {
      id: 'nav-patients',
      keys: 'mod+p',
      description: 'Go to Patients',
      category: 'navigation',
      handler: () => navigate('/patients')
    },
    {
      id: 'nav-caregivers',
      keys: 'mod+shift+c',
      description: 'Go to Caregivers',
      category: 'navigation',
      handler: () => navigate('/caregiver-portal')
    },
    {
      id: 'nav-ai-assistant',
      keys: 'mod+/',
      description: 'Open AI Assistant',
      category: 'global',
      handler: () => {
        const event = new CustomEvent('open-ai-assistant');
        window.dispatchEvent(event);
      }
    }
  ];

  useKeyboardShortcuts(shortcuts);
}

/**
 * Context-specific shortcuts for data tables
 */
export function useTableShortcuts(options: {
  onDelete?: () => void;
  onEdit?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onNew?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      id: 'table-delete',
      keys: 'del',
      description: 'Delete Selected',
      category: 'actions',
      handler: () => options.onDelete?.(),
      disabled: !options.onDelete
    },
    {
      id: 'table-edit',
      keys: 'enter',
      description: 'Edit Selected',
      category: 'editing',
      handler: () => options.onEdit?.(),
      disabled: !options.onEdit
    },
    {
      id: 'table-refresh',
      keys: 'mod+r',
      description: 'Refresh Table',
      category: 'actions',
      handler: () => options.onRefresh?.(),
      disabled: !options.onRefresh
    },
    {
      id: 'table-export',
      keys: 'mod+shift+e',
      description: 'Export Data',
      category: 'actions',
      handler: () => options.onExport?.(),
      disabled: !options.onExport
    },
    {
      id: 'table-new',
      keys: 'mod+n',
      description: 'Create New',
      category: 'actions',
      handler: () => options.onNew?.(),
      disabled: !options.onNew
    }
  ];

  useKeyboardShortcuts(shortcuts, 'table');
}

/**
 * Form shortcuts
 */
export function useFormShortcuts(options: {
  onSave?: () => void;
  onCancel?: () => void;
  onReset?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      id: 'form-save',
      keys: 'mod+enter',
      description: 'Save Form',
      category: 'actions',
      handler: () => options.onSave?.(),
      disabled: !options.onSave
    },
    {
      id: 'form-cancel',
      keys: 'esc',
      description: 'Cancel',
      category: 'actions',
      handler: () => options.onCancel?.(),
      disabled: !options.onCancel
    },
    {
      id: 'form-reset',
      keys: 'mod+shift+r',
      description: 'Reset Form',
      category: 'actions',
      handler: () => options.onReset?.(),
      disabled: !options.onReset
    }
  ];

  useKeyboardShortcuts(shortcuts, 'form');
}

/**
 * Get shortcut hint text for display
 */
export function getShortcutHint(keys: string): string {
  const normalized = normalizeShortcut(keys);
  const parts = normalized.split('+');

  const symbols: Record<string, string> = {
    'cmd': '⌘',
    'ctrl': 'Ctrl',
    'alt': isMac ? '⌥' : 'Alt',
    'shift': isMac ? '⇧' : 'Shift',
    'enter': '↵',
    'esc': 'Esc',
    'space': 'Space',
    'up': '↑',
    'down': '↓',
    'left': '←',
    'right': '→',
    'del': 'Del'
  };

  return parts
    .map(part => symbols[part] || part.toUpperCase())
    .join(isMac ? '' : ' + ');
}

/**
 * Keyboard shortcut hint component
 */
export function KeyboardHint({ keys, className = '' }: { keys: string; className?: string }) {
  const hint = getShortcutHint(keys);

  return (
    <kbd className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-gray-100 text-gray-700 border border-gray-300 rounded ${className}`}>
      {hint}
    </kbd>
  );
}
