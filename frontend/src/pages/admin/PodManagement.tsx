/**
 * Pod Management Page
 * Manage care teams (pods), their members, and assignments
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import {
    PlusIcon,
    TrashIcon,
    UserGroupIcon,
    MagnifyingGlassIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';

interface Pod {
    id: string;
    name: string;
    description?: string;
    region?: string;
    status: 'active' | 'inactive';
    memberCount?: number;
    leaderId?: string;
    leaderName?: string;
    createdAt?: string;
}

const PODS_STORAGE_KEY = 'serenity_pods';

// Initialize default pods if none exist
const getDefaultPods = (): Pod[] => [
    {
        id: '1',
        name: 'North Columbus Pod',
        description: 'Serving North Columbus and surrounding areas',
        region: 'North Columbus',
        status: 'active',
        memberCount: 8,
        leaderName: 'Sarah Johnson',
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Downtown Pod',
        description: 'Downtown and central Columbus coverage',
        region: 'Downtown Columbus',
        status: 'active',
        memberCount: 12,
        leaderName: 'Michael Chen',
        createdAt: new Date().toISOString()
    },
    {
        id: '3',
        name: 'West Side Pod',
        description: 'West Columbus and Hilliard area',
        region: 'West Columbus',
        status: 'active',
        memberCount: 6,
        leaderName: 'Jessica Williams',
        createdAt: new Date().toISOString()
    }
];

export function PodManagement() {
    const navigate = useNavigate();
    const [pods, setPods] = useState<Pod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchPods();
    }, []);

    const fetchPods = async () => {
        try {
            setLoading(true);
            setError('');

            // TODO: Replace with actual API call
            // const response = await fetch('/api/console/admin/pods');
            // const data = await response.json();

            // For now, use localStorage to persist pods across page reloads
            const storedPods = localStorage.getItem(PODS_STORAGE_KEY);
            let loadedPods: Pod[];

            if (storedPods) {
                loadedPods = JSON.parse(storedPods);
            } else {
                // Initialize with default pods
                loadedPods = getDefaultPods();
                localStorage.setItem(PODS_STORAGE_KEY, JSON.stringify(loadedPods));
            }

            setPods(loadedPods);
        } catch (err: any) {
            console.error('Failed to fetch pods:', err);
            setError(err?.message || 'Failed to load pods');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePod = async (pod: Pod, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click from triggering
        if (!confirm(`Delete pod "${pod.name}"? This action cannot be undone.`)) return;

        try {
            // TODO: Implement API call
            // await fetch(`/api/console/admin/pods/${pod.id}`, {
            //     method: 'DELETE'
            // });

            // Update localStorage
            const updatedPods = pods.filter(p => p.id !== pod.id);
            localStorage.setItem(PODS_STORAGE_KEY, JSON.stringify(updatedPods));
            setPods(updatedPods);

            alert('Pod deleted successfully! (Using localStorage until API is implemented)');
        } catch (err: any) {
            alert(err?.message || 'Failed to delete pod');
        }
    };

    const handlePodClick = (podId: string) => {
        navigate(`/admin/pods/${podId}`);
    };

    const handleCreatePod = () => {
        navigate('/admin/pods/new');
    };

    const filteredPods = pods.filter(pod =>
        pod.name.toLowerCase().includes(search.toLowerCase()) ||
        pod.description?.toLowerCase().includes(search.toLowerCase()) ||
        pod.region?.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        return status === 'active'
            ? <Badge variant="success">Active</Badge>
            : <Badge variant="default">Inactive</Badge>;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Pod Management</h1>
                        <p className="text-gray-500">Manage care teams and their members</p>
                    </div>
                    <button
                        onClick={handleCreatePod}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Create Pod
                    </button>
                </div>

                {/* Search */}
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="relative max-w-md">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search pods..."
                            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Pods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading pods...</p>
                    </div>
                ) : error ? (
                    <div className="col-span-full text-center py-12">
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={fetchPods}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    </div>
                ) : filteredPods.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No pods found
                    </div>
                ) : (
                    filteredPods.map((pod) => (
                        <div
                            key={pod.id}
                            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => handlePodClick(pod.id)}
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <UserGroupIcon className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{pod.name}</h3>
                                            {getStatusBadge(pod.status)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeletePod(pod, e)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        title="Delete"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {pod.description && (
                                    <p className="text-sm text-gray-600 mb-4">{pod.description}</p>
                                )}

                                <div className="space-y-2">
                                    {pod.region && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPinIcon className="h-4 w-4" />
                                            {pod.region}
                                        </div>
                                    )}
                                    {pod.leaderName && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <UserGroupIcon className="h-4 w-4" />
                                            Led by {pod.leaderName}
                                        </div>
                                    )}
                                    <div className="text-sm font-medium text-blue-600">
                                        {pod.memberCount || 0} members
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
