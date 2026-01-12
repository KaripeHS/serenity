/**
 * Serenity ERP Home Page
 * Main landing page with login form and authenticated dashboard
 */

import React, { useState } from 'react';
import {
  ExclamationTriangleIcon,
  HeartIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { useAuth } from '../contexts/AuthContext';
import { getPortalType, PortalType } from '../App';
import WorkingHomePage from '../components/WorkingHomePage';
import DashboardLayout from '../components/layouts/DashboardLayout';

// Portal configuration for different subdomains
const portalConfig: Record<PortalType, { label: string; color: string; description: string }> = {
  public: { label: '', color: '', description: 'Home Health Management System' },
  console: { label: 'Admin Console', color: 'text-purple-600', description: 'Administrative Dashboard' },
  staff: { label: 'Staff Portal', color: 'text-blue-600', description: 'Employee Access' },
  caregiver: { label: 'Caregiver Portal', color: 'text-green-600', description: 'Caregiver Access' },
};

// Login Form Component
function LoginForm() {
  const { login, error, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Get portal type for styling
  const portalType = getPortalType();
  const portal = portalConfig[portalType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      // Error is handled in AuthContext
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <HeartIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Serenity ERP</h1>
          {portal.label && (
            <p className={`text-lg font-semibold mt-1 ${portal.color}`}>{portal.label}</p>
          )}
          <p className="text-gray-600 mt-2">{portal.description}</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-xl">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {displayError && (
                <Alert className="border-red-500 bg-red-50">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-800">
                    {displayError}
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@serenitycarepartners.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Contact Support */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-500">
                <p>Need help? Contact your administrator</p>
                <p className="mt-1">
                  <a href="mailto:support@serenitycarepartners.com" className="text-primary-600 hover:text-primary-700">
                    support@serenitycarepartners.com
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>HIPAA Compliant Healthcare Management</p>
          <p className="mt-1">Serenity Care Partners</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HeartIcon className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Serenity ERP</h2>
          <p className="text-gray-600">Initializing your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return <LoginForm />;
  }

  // When authenticated, render the role-based WorkingHomePage with DashboardLayout
  return (
    <DashboardLayout>
      <WorkingHomePage />
    </DashboardLayout>
  );
}