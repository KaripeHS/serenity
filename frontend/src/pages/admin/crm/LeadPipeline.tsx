import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../../lib/api';

interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    serviceInterest: string;
    status: 'new' | 'contacted' | 'assessment_scheduled' | 'contract_sent' | 'converted' | 'lost';
    source: string;
    estimatedValue?: number;
    notes?: string;
    createdAt: string;
}

const STATUS_COLORS = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    assessment_scheduled: 'bg-purple-100 text-purple-800',
    contract_sent: 'bg-indigo-100 text-indigo-800',
    converted: 'bg-green-100 text-green-800',
    lost: 'bg-gray-100 text-gray-800'
};

const STATUS_LABELS = {
    new: 'New Lead',
    contacted: 'Contacted',
    assessment_scheduled: 'Assessment Scheduled',
    contract_sent: 'Contract Sent',
    converted: 'Converted',
    lost: 'Lost'
};

export const LeadPipeline: React.FC = () => {
    const queryClient = useQueryClient();
    const [view, setView] = useState<'leads' | 'proposals'>('leads');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Fetch Leads with proper auth
    const { data: leads, isLoading: isLoadingLeads, error: leadsError } = useQuery({
        queryKey: ['leads', filterStatus],
        queryFn: async () => {
            const params = filterStatus ? `?status=${filterStatus}` : '';
            const response = await api.get<{ success: boolean; data: Lead[] }>(`/admin/leads${params}`);
            return response.data || [];
        },
        enabled: view === 'leads',
        retry: 1,
        staleTime: 30000, // 30 seconds
    });

    // Fetch Proposals with proper auth
    const { data: proposals, isLoading: isLoadingProposals, error: proposalsError } = useQuery({
        queryKey: ['proposals'],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: any[] }>('/admin/proposals');
            return response.data || [];
        },
        enabled: view === 'proposals',
        retry: 1,
    });

    // Fetch Stats with proper auth
    const { data: stats, error: statsError } = useQuery({
        queryKey: ['lead-stats'],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: any }>('/admin/leads/stats');
            return response.data;
        },
        retry: 1,
    });

    // Update Lead Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            return api.patch(`/admin/leads/${id}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
        }
    });

    // Approve Proposal Mutation
    const approveProposalMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.patch(`/admin/proposals/${id}/status`, { status: 'approved' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['proposals'] });
            alert('Proposal Approved! Notification sent to Director.');
        }
    });

    // Filter leads by search query
    const filteredLeads = useMemo(() => {
        if (!leads || !searchQuery.trim()) return leads;
        const query = searchQuery.toLowerCase().trim();
        return leads.filter((lead: Lead) =>
            lead.firstName.toLowerCase().includes(query) ||
            lead.lastName.toLowerCase().includes(query) ||
            `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(query) ||
            lead.email.toLowerCase().includes(query) ||
            lead.phone.includes(query) ||
            lead.serviceInterest.toLowerCase().includes(query)
        );
    }, [leads, searchQuery]);

    // Loading state with timeout protection
    if (isLoadingLeads && view === 'leads') {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading pipeline...</p>
            </div>
        );
    }

    // Error state
    if (leadsError && view === 'leads') {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h3 className="text-red-800 font-semibold mb-2">Unable to load leads</h3>
                    <p className="text-red-600 text-sm mb-4">{(leadsError as Error).message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Private Client Pipeline</h1>
                    <p className="text-gray-500">Manage high-net-worth leads and inquiries</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-white border rounded-lg shadow-sm">
                        <span className="text-sm text-gray-500 block">Total Leads</span>
                        <span className="text-xl font-bold">{stats?.totalLeads || 0}</span>
                    </div>
                    <div className="px-4 py-2 bg-white border rounded-lg shadow-sm">
                        <span className="text-sm text-gray-500 block">Conversion Rate</span>
                        <span className="text-xl font-bold text-green-600">{stats?.conversionRate || '0%'}</span>
                    </div>
                </div>
            </div>

            {/* View Toggle */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setView('leads')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${view === 'leads'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Leads Pipeline
                    </button>
                    <button
                        onClick={() => setView('proposals')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${view === 'proposals'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Pending Proposals
                    </button>
                </nav>
            </div>

            {view === 'leads' ? (
                <>
                    {/* Search and Filters */}
                    <div className="mb-6 space-y-4">
                        {/* Search Input */}
                        <div className="relative max-w-md">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, phone, or service..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                        {searchQuery && (
                            <p className="text-sm text-gray-500">
                                Found {filteredLeads?.length || 0} result{filteredLeads?.length !== 1 ? 's' : ''} for "{searchQuery}"
                            </p>
                        )}

                        {/* Status Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            <button
                                onClick={() => setFilterStatus('')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition ${filterStatus === '' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                All Leads
                            </button>
                            {Object.keys(STATUS_LABELS).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${filterStatus === status ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Leads List */}
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Interest</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredLeads?.map((lead: Lead) => (
                                    <tr key={lead.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                    {lead.firstName[0]}{lead.lastName[0]}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{lead.firstName} {lead.lastName}</div>
                                                    <div className="text-sm text-gray-500">{lead.email}</div>
                                                    <div className="text-xs text-gray-400">{lead.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900">{lead.serviceInterest}</span>
                                            <span className="block text-xs text-gray-500">{lead.source}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[lead.status]}`}>
                                                {STATUS_LABELS[lead.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-4">
                                            <select
                                                value={lead.status}
                                                onChange={(e) => updateStatusMutation.mutate({ id: lead.id, status: e.target.value })}
                                                className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            >
                                                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                                    <option key={value} value={value}>{label}</option>
                                                ))}
                                            </select>
                                            <a
                                                href={`/dashboard/intake/new?leadId=${lead.id}`}
                                                className="text-indigo-600 hover:text-indigo-900 font-bold text-xs uppercase tracking-wide border border-indigo-200 px-3 py-1 rounded-full hover:bg-indigo-50 transition"
                                            >
                                                Create Proposal
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                                {filteredLeads?.length === 0 && searchQuery && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <p className="font-medium">No leads match "{searchQuery}"</p>
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm"
                                            >
                                                Clear search
                                            </button>
                                        </td>
                                    </tr>
                                )}
                                {filteredLeads?.length === 0 && !searchQuery && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No leads found. Waiting for new inquiries...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                /* Proposals List */
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposal ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {proposals?.map((proposal: any) => (
                                <tr key={proposal.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {proposal.id.slice(0, 8)}...
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                        ${proposal.totalWeeklyCost.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            proposal.status === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {proposal.status.toUpperCase().replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(proposal.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {proposal.status === 'draft' && (
                                            <button
                                                onClick={() => approveProposalMutation.mutate(proposal.id)}
                                                className="text-indigo-600 hover:text-indigo-900 font-bold"
                                            >
                                                Approve & Send
                                            </button>
                                        )}
                                        {proposal.status === 'approved' && (
                                            <span className="text-green-600 font-medium">Sent</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {proposals?.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No pending proposals.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
