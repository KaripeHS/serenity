import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Calendar,
    DollarSign,
    Award,
    Clock,
    MapPin,
    ChevronRight,
    Star,
    TrendingUp,
    Shield
} from 'lucide-react';

// Mock Data Types
interface Shift {
    id: string;
    clientName: string;
    date: string;
    time: string;
    duration: number;
    earnings: number;
    status: 'upcoming' | 'completed' | 'cancelled';
    address: string;
}

interface CaregiverStats {
    weeklyEarnings: number;
    projectedEarnings: number;
    reliabilityScore: number;
    rank: string;
    nextLevelProgress: number;
    totalVisits: number;
    onTimeRate: number;
}

export const CaregiverPortal: React.FC = () => {
    // Mock Data - In real app, fetch from API
    const stats: CaregiverStats = {
        weeklyEarnings: 840.50,
        projectedEarnings: 1250.00,
        reliabilityScore: 98,
        rank: 'Elite Caregiver',
        nextLevelProgress: 85,
        totalVisits: 142,
        onTimeRate: 100
    };

    const upcomingShifts: Shift[] = [
        {
            id: '1',
            clientName: 'Eleanor R.',
            date: 'Today',
            time: '09:00 AM - 05:00 PM',
            duration: 8,
            earnings: 200,
            status: 'upcoming',
            address: '123 Maple Ave, Columbus, OH'
        },
        {
            id: '2',
            clientName: 'Robert M.',
            date: 'Tomorrow',
            time: '08:00 AM - 02:00 PM',
            duration: 6,
            earnings: 150,
            status: 'upcoming',
            address: '456 Oak St, Dublin, OH'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900">My Dashboard</h1>
                    <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                            JS
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

                {/* 1. Reliability Score (Gamification) */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                        <Award size={140} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Current Rank</p>
                                <h2 className="text-3xl font-bold flex items-center gap-2">
                                    {stats.rank} <Star className="fill-yellow-400 text-yellow-400" size={24} />
                                </h2>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold">{stats.reliabilityScore}%</div>
                                <div className="text-blue-100 text-xs">Reliability Score</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-blue-100">
                                <span>Next Level: Master Caregiver</span>
                                <span>{stats.nextLevelProgress}%</span>
                            </div>
                            <div className="w-full bg-blue-900/30 rounded-full h-2">
                                <div
                                    className="bg-yellow-400 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${stats.nextLevelProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-blue-200 mt-2">
                                🏆 Top 5% of caregivers this month! Keep it up to earn a $50 bonus.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Earnings Dashboard (Financial Wellness) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <DollarSign className="text-green-600" size={20} />
                            My Earnings
                        </h3>
                        <span className="text-xs text-gray-500">This Week</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                            <p className="text-sm text-green-700 mb-1">Earned So Far</p>
                            <p className="text-2xl font-bold text-green-800">${stats.weeklyEarnings.toFixed(2)}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-600 mb-1">Projected Total</p>
                            <p className="text-2xl font-bold text-gray-900">${stats.projectedEarnings.toFixed(2)}</p>
                        </div>
                    </div>

                    <button className="w-full mt-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1">
                        View Pay Stubs <ChevronRight size={16} />
                    </button>
                </div>

                {/* 3. Upcoming Schedule */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 px-1">
                        <Calendar className="text-blue-600" size={20} />
                        Upcoming Shifts
                    </h3>

                    {upcomingShifts.map((shift) => (
                        <div key={shift.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-gray-900">{shift.clientName}</h4>
                                    <div className="flex items-center text-gray-500 text-sm mt-1">
                                        <MapPin size={14} className="mr-1" />
                                        {shift.address}
                                    </div>
                                </div>
                                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                    ${shift.earnings} est.
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm border-t border-gray-100 pt-3 mt-2">
                                <div className="flex items-center text-gray-700">
                                    <Clock size={16} className="mr-1.5 text-gray-400" />
                                    {shift.time}
                                </div>
                                <div className="flex items-center text-gray-700">
                                    <TrendingUp size={16} className="mr-1.5 text-gray-400" />
                                    {shift.duration} hrs
                                </div>
                            </div>

                            {shift.date === 'Today' && (
                                <button className="w-full mt-4 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                                    Start Shift
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* 4. Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                        <Shield className="text-indigo-600" size={24} />
                        <span className="text-sm font-medium text-gray-700">Report Issue</span>
                    </button>
                    <button className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                        <DollarSign className="text-green-600" size={24} />
                        <span className="text-sm font-medium text-gray-700">Request Advance</span>
                    </button>
                </div>

            </div>
        </div>
    );
};
