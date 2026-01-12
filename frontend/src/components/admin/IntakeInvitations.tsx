/**
 * Intake Invitations Admin Panel
 * Manage client intake access codes and invitations
 *
 * Features:
 * - Send email invitations with unique access codes
 * - View and manage phone code for verbal sharing
 * - Track invitation status (pending, sent, used, expired)
 * - Review submitted intake forms
 */

import React, { useState, useEffect } from 'react';
import {
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import api from '../../lib/api';

interface AccessCode {
  id: string;
  code: string;
  code_type: 'email' | 'phone';
  client_email: string | null;
  client_name: string | null;
  client_phone: string | null;
  status: 'pending' | 'sent' | 'used' | 'expired' | 'revoked';
  expires_at: string;
  used_at: string | null;
  created_at: string;
  created_by_name: string | null;
}

interface Submission {
  id: string;
  reference_token: string;
  form_data: any;
  data_flags: any[];
  status: 'pending' | 'reviewed' | 'imported' | 'rejected';
  created_at: string;
  client_email: string | null;
  client_name: string | null;
  access_code: string | null;
}

interface PhoneCode {
  code: string;
  expires_at: string | null;
}

interface DashboardStats {
  codes: {
    pending_codes: number;
    sent_codes: number;
    used_codes: number;
    expired_codes: number;
    total_codes: number;
  };
  submissions: {
    pending_submissions: number;
    reviewed_submissions: number;
    imported_submissions: number;
    total_submissions: number;
  };
}

export function IntakeInvitations() {
  const [activeTab, setActiveTab] = useState<'invitations' | 'submissions' | 'settings'>('invitations');
  const [invitations, setInvitations] = useState<AccessCode[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [phoneCode, setPhoneCode] = useState<PhoneCode | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Send invitation modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({
    clientEmail: '',
    clientName: '',
    clientPhone: '',
  });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  // Phone code modal
  const [showPhoneCodeModal, setShowPhoneCodeModal] = useState(false);
  const [newPhoneCode, setNewPhoneCode] = useState('');
  const [savingPhoneCode, setSavingPhoneCode] = useState(false);

  // View submission modal
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Load data
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<any>('/console/intake/dashboard');
      if (response.success) {
        setStats(response.stats);
        setInvitations(response.recentInvitations || []);
        setSubmissions(response.pendingSubmissions || []);
        setPhoneCode(response.phoneCode);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      const response = await api.post<any>('/console/intake/send-invitation', {
        clientEmail: sendForm.clientEmail,
        clientName: sendForm.clientName || undefined,
        clientPhone: sendForm.clientPhone || undefined,
      });

      if (response.success) {
        setSendSuccess(response.message || 'Invitation sent successfully!');
        setSendForm({ clientEmail: '', clientName: '', clientPhone: '' });
        loadDashboard();

        // Auto-close after success
        setTimeout(() => {
          setShowSendModal(false);
          setSendSuccess(null);
        }, 2000);
      }
    } catch (err: any) {
      setSendError(err.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      await api.post(`/console/intake/resend/${id}`);
      loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to resend invitation');
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this access code?')) return;

    try {
      await api.post(`/console/intake/revoke/${id}`);
      loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke access code');
    }
  };

  const handleSavePhoneCode = async () => {
    if (!newPhoneCode || newPhoneCode.length < 6) {
      alert('Phone code must be at least 6 characters');
      return;
    }

    setSavingPhoneCode(true);
    try {
      await api.post('/console/intake/phone-code', {
        code: newPhoneCode,
      });
      loadDashboard();
      setShowPhoneCodeModal(false);
      setNewPhoneCode('');
    } catch (err: any) {
      alert(err.message || 'Failed to update phone code');
    } finally {
      setSavingPhoneCode(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'sent':
        return <Badge variant="primary">Sent</Badge>;
      case 'used':
        return <Badge variant="success">Used</Badge>;
      case 'expired':
        return <Badge variant="gray">Expired</Badge>;
      case 'revoked':
        return <Badge variant="danger">Revoked</Badge>;
      case 'reviewed':
        return <Badge variant="info">Reviewed</Badge>;
      case 'imported':
        return <Badge variant="success">Imported</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intake Invitations</h1>
          <p className="text-gray-600">Manage client intake form access codes</p>
        </div>
        <button
          onClick={() => setShowSendModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Send Invitation
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <EnvelopeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Invitations Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.codes.sent_codes}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Codes Used</p>
                <p className="text-2xl font-bold text-gray-900">{stats.codes.used_codes}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.submissions.pending_submissions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DocumentDuplicateIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.submissions.total_submissions}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Phone Code Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <PhoneIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Universal Phone Code</h3>
              <p className="text-sm text-gray-600">
                Share this code verbally with clients who don't have email
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {phoneCode ? (
              <>
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold text-blue-600 tracking-wider">
                    {phoneCode.code}
                  </p>
                  {phoneCode.expires_at && (
                    <p className="text-xs text-gray-500">
                      Expires: {formatDate(phoneCode.expires_at)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => copyToClipboard(phoneCode.code)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Copy code"
                >
                  <DocumentDuplicateIcon className="h-5 w-5" />
                </button>
              </>
            ) : (
              <span className="text-gray-500">No phone code set</span>
            )}
            <button
              onClick={() => {
                setNewPhoneCode(phoneCode?.code || '');
                setShowPhoneCodeModal(true);
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {phoneCode ? 'Change' : 'Set Code'}
            </button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'invitations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Recent Invitations
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'submissions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending Submissions
            {stats && stats.submissions.pending_submissions > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                {stats.submissions.pending_submissions}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'invitations' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invitations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No invitations yet. Click "Send Invitation" to get started.
                    </td>
                  </tr>
                ) : (
                  invitations.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {inv.code}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          {inv.client_name && (
                            <p className="font-medium text-gray-900">{inv.client_name}</p>
                          )}
                          {inv.client_email && (
                            <p className="text-sm text-gray-600">{inv.client_email}</p>
                          )}
                          {!inv.client_name && !inv.client_email && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(inv.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(inv.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(inv.expires_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {(inv.status === 'pending' || inv.status === 'sent') && (
                            <>
                              <button
                                onClick={() => handleResend(inv.id)}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                                title="Resend invitation"
                              >
                                <ArrowPathIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRevoke(inv.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                title="Revoke code"
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => copyToClipboard(inv.code)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            title="Copy code"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'submissions' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flags</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No pending submissions.
                    </td>
                  </tr>
                ) : (
                  submissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {sub.reference_token}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {sub.form_data?.contact?.firstName} {sub.form_data?.contact?.lastName}
                          </p>
                          {sub.form_data?.contact?.email && (
                            <p className="text-sm text-gray-600">{sub.form_data.contact.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {sub.data_flags && sub.data_flags.length > 0 ? (
                          <span className="flex items-center gap-1 text-amber-600">
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            {sub.data_flags.length}
                          </span>
                        ) : (
                          <span className="text-green-600">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(sub.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(sub.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedSubmission(sub)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <EyeIcon className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Send Invitation Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Send Intake Invitation</h2>
              <p className="text-sm text-gray-600 mt-1">
                Send a secure access code to a client's email
              </p>
            </div>

            <form onSubmit={handleSendInvitation} className="p-6 space-y-4">
              {sendError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {sendError}
                </div>
              )}

              {sendSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  {sendSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={sendForm.clientEmail}
                  onChange={e => setSendForm(prev => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder="client@email.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name (optional)
                </label>
                <input
                  type="text"
                  value={sendForm.clientName}
                  onChange={e => setSendForm(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="John Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Phone (optional)
                </label>
                <input
                  type="tel"
                  value={sendForm.clientPhone}
                  onChange={e => setSendForm(prev => ({ ...prev, clientPhone: e.target.value }))}
                  placeholder="(614) 555-1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSendModal(false);
                    setSendError(null);
                    setSendSuccess(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || !sendForm.clientEmail}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Phone Code Modal */}
      {showPhoneCodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Set Phone Code</h2>
              <p className="text-sm text-gray-600 mt-1">
                This code can be shared verbally with clients who don't have email
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Universal Phone Code
                </label>
                <input
                  type="text"
                  value={newPhoneCode}
                  onChange={e => setNewPhoneCode(e.target.value.toUpperCase())}
                  placeholder="e.g., SERENITY2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-center text-lg tracking-wider"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 6 characters. Make it easy to say over the phone.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPhoneCodeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePhoneCode}
                  disabled={savingPhoneCode || newPhoneCode.length < 6}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingPhoneCode ? 'Saving...' : 'Save Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Submission Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 my-8">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Intake Submission</h2>
                <p className="text-sm text-gray-600">
                  Ref: {selectedSubmission.reference_token}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircleIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              {/* Data Flags */}
              {selectedSubmission.data_flags && selectedSubmission.data_flags.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    Data Flags
                  </h3>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {selectedSubmission.data_flags.map((flag: any, i: number) => (
                      <li key={i}>• {flag.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Contact Info */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Contact Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                  <p><span className="font-medium">Name:</span> {selectedSubmission.form_data?.contact?.firstName} {selectedSubmission.form_data?.contact?.lastName}</p>
                  <p><span className="font-medium">Phone:</span> {selectedSubmission.form_data?.contact?.primaryPhone}</p>
                  <p><span className="font-medium">Email:</span> {selectedSubmission.form_data?.contact?.email || 'Not provided'}</p>
                  <p><span className="font-medium">DOB:</span> {selectedSubmission.form_data?.contact?.dateOfBirth}</p>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Address</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <p>{selectedSubmission.form_data?.address?.streetAddress}</p>
                  <p>{selectedSubmission.form_data?.address?.city}, {selectedSubmission.form_data?.address?.state} {selectedSubmission.form_data?.address?.zipCode}</p>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Emergency Contact</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                  <p><span className="font-medium">Name:</span> {selectedSubmission.form_data?.emergencyContacts?.[0]?.name}</p>
                  <p><span className="font-medium">Relationship:</span> {selectedSubmission.form_data?.emergencyContacts?.[0]?.relationship}</p>
                  <p><span className="font-medium">Phone:</span> {selectedSubmission.form_data?.emergencyContacts?.[0]?.phone}</p>
                </div>
              </div>

              {/* Services Needed */}
              {selectedSubmission.form_data?.preferences?.servicesNeeded?.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Services Requested</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="text-sm space-y-1">
                      {selectedSubmission.form_data.preferences.servicesNeeded.map((service: string, i: number) => (
                        <li key={i}>• {service}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // TODO: Implement import to client intake
                  alert('Import feature coming soon!');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Import to Client Intake
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntakeInvitations;
