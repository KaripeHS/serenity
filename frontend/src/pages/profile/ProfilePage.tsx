/**
 * Profile Page
 * Displays user profile information with options to edit
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
  KeyIcon,
  BellIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const profileSections = [
    {
      title: 'Personal Information',
      items: [
        { label: 'Full Name', value: `${user.firstName} ${user.lastName}`, icon: UserCircleIcon },
        { label: 'Email', value: user.email, icon: EnvelopeIcon },
        { label: 'Phone', value: user.phone || 'Not set', icon: PhoneIcon },
      ]
    },
    {
      title: 'Organization',
      items: [
        { label: 'Organization', value: user.organizationName || 'Serenity Care Partners', icon: BuildingOfficeIcon },
        { label: 'Role', value: user.role?.replace(/_/g, ' ') || 'User', icon: ShieldCheckIcon },
        { label: 'Member Since', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A', icon: CalendarIcon },
      ]
    }
  ];

  const quickActions = [
    { label: 'Edit Profile', href: '/profile/edit', icon: PencilSquareIcon, description: 'Update your personal information' },
    { label: 'Change Password', href: '/profile/password', icon: KeyIcon, description: 'Update your password' },
    { label: 'Notification Settings', href: '/admin/settings/communications', icon: BellIcon, description: 'Manage notification preferences' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your account information
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center">
              <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-blue-600">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </span>
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-white">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-blue-100 capitalize">
                  {user.role?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Sections */}
          <div className="divide-y divide-gray-200">
            {profileSections.map((section) => (
              <div key={section.title} className="px-6 py-5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  {section.title}
                </h3>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-start space-x-3">
                        <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <dt className="text-xs text-gray-500">{item.label}</dt>
                          <dd className="text-sm font-medium text-gray-900 capitalize">{item.value}</dd>
                        </div>
                      </div>
                    );
                  })}
                </dl>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  to={action.href}
                  className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-900">{action.label}</p>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                  <div className="ml-4">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
