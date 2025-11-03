/**
 * Dashboard Layout Component
 * Provides consistent navigation and layout for all dashboard pages
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  BanknotesIcon,
  TruckIcon,
  HeartIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  BuildingOffice2Icon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { Badge } from '../ui/Badge';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
  description: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation: NavigationItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: HomeIcon,
    description: 'Main dashboard'
  },
  {
    name: 'Executive',
    href: '/dashboard/executive',
    icon: ChartBarIcon,
    description: 'Strategic overview and KPIs'
  },
  {
    name: 'HR & Talent',
    href: '/dashboard/hr',
    icon: UsersIcon,
    badge: '8',
    description: 'Workforce management'
  },
  {
    name: 'Tax Compliance',
    href: '/dashboard/tax',
    icon: BanknotesIcon,
    badge: '3',
    description: 'Tax management and compliance'
  },
  {
    name: 'Operations',
    href: '/dashboard/operations',
    icon: TruckIcon,
    description: 'Daily operations and scheduling'
  },
  {
    name: 'Clinical',
    href: '/dashboard/clinical',
    icon: HeartIcon,
    description: 'Patient care and clinical oversight'
  },
  {
    name: 'Billing',
    href: '/dashboard/billing',
    icon: CurrencyDollarIcon,
    badge: '12',
    description: 'Revenue cycle management'
  },
  {
    name: 'Compliance',
    href: '/dashboard/compliance',
    icon: ShieldCheckIcon,
    description: 'HIPAA and regulatory compliance'
  },
  {
    name: 'Training',
    href: '/dashboard/training',
    icon: AcademicCapIcon,
    description: 'Staff training and development'
  },
  {
    name: 'Family Portal',
    href: '/family-portal',
    icon: BuildingOffice2Icon,
    description: 'Family engagement portal'
  }
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center">
            <HeartIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">Serenity ERP</h1>
              <p className="text-xs text-gray-500">Home Health Management</p>
            </div>
          </div>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  active
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${
                  active ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t p-4">
          {user && (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-1">
            <button className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
              <CogIcon className="mr-3 h-4 w-4" />
              Settings
            </button>
            <button className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
              <QuestionMarkCircleIcon className="mr-3 h-4 w-4" />
              Help & Support
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Top navigation */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-6 w-6 text-gray-400" />
              </button>

              <div className="ml-4 lg:ml-0">
                <nav className="flex space-x-4">
                  <span className="text-sm text-gray-500">
                    {navigation.find(item => isActive(item.href))?.description || 'Dashboard'}
                  </span>
                </nav>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* System status indicator */}
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 hidden sm:block">Live Data</span>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
              </button>

              {/* User menu */}
              <div className="relative">
                {user && (
                  <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}