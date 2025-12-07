
import { useState, useEffect } from 'react';
import { request, consoleApi } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

interface LiveShift {
    shiftId: string;
    caregiverName: string;
    clientName: string;
    scheduledStart: string;
    scheduledEnd: string;
    status: string;
    commuterStatus: string;
    lastPing?: {
        lat: number;
        lon: number;
        timestamp: string;
        accuracy: number;
    };
    geofenceStatus: 'green' | 'yellow' | 'red' | 'gray';
}

export function LiveOperationsBoard() {
    const [shifts, setShifts] = useState<LiveShift[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        enRoute: 0,
        alerts: 0
    });
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Polling every 30 seconds
    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            // Mock org ID retrieval
            const user = JSON.parse(localStorage.getItem('serenity_user_data') || '{}');
            const orgId = user.organizationId;
            if (!orgId) return;

            const data = await request<LiveShift[]>(`/api/operations/live/${orgId}`);
            setShifts(data);

            // Calculate stats
            setStats({
                total: data.length,
                active: data.filter(s => s.status === 'in_progress').length,
                enRoute: data.filter(s => s.commuterStatus === 'en_route').length,
                alerts: data.filter(s => s.geofenceStatus === 'red').length
            });
            setLastUpdated(new Date());
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const StatusCard = ({ shift }: { shift: LiveShift }) => {
        let borderColor = 'border-gray-200';
        let bgColor = 'bg-white';
        let statusIcon = '⬤';
        let statusText = 'Scheduled';

        if (shift.geofenceStatus === 'green') {
            borderColor = 'border-green-500';
            bgColor = 'bg-green-50';
            statusIcon = '✓';
            statusText = 'On Site';
        } else if (shift.geofenceStatus === 'yellow') {
            borderColor = 'border-yellow-400';
            bgColor = 'bg-yellow-50';
            statusIcon = '➜';
            statusText = 'En Route';
        } else if (shift.geofenceStatus === 'red') {
            borderColor = 'border-red-500';
            bgColor = 'bg-red-50';
            statusIcon = '!';
            statusText = 'Alert';
        }

        return (
            <div className={`border-l-4 ${borderColor} ${bgColor} rounded shadow-sm p-3 relative`}>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 truncate">{shift.caregiverName}</h3>
                    <Badge variant={shift.geofenceStatus === 'green' ? 'success' : shift.geofenceStatus === 'red' ? 'destructive' : 'secondary'}>
                        {statusText}
                    </Badge>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Client:</span> {shift.clientName}
                </div>
                <div className="text-xs text-gray-500 flex justify-between">
                    <span>{new Date(shift.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>
                        {shift.status === 'in_progress' ? 'Clocked In' : shift.commuterStatus === 'en_route' ? 'Commuting' : shift.status}
                    </span>
                </div>
                {shift.geofenceStatus === 'red' && (
                    <div className="mt-2 text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                        ⚠ GPS Mismatch or Late
                    </div>
                )}
                {shift.lastPing && (
                    <div className="mt-2 text-[10px] text-gray-400 text-right">
                        Ping: {new Date(shift.lastPing.timestamp).toLocaleTimeString()}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Live Operations</h1>
                    <p className="text-sm text-gray-500">Real-time situational awareness</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                    <button onClick={loadData} className="p-1 hover:text-primary-600">↻</button>
                    <div className="flex border rounded ml-4">
                        <button onClick={() => setViewMode('grid')} className={`px-3 py-1 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'}`}>Grid</button>
                        <button onClick={() => setViewMode('list')} className={`px-3 py-1 ${viewMode === 'list' ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'}`}>List</button>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Shifts</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.active} / {stats.total}</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            ⚙
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">En Route</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.enRoute}</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                            ➜
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">On Site</p>
                            <p className="text-2xl font-bold text-green-600">
                                {shifts.filter(s => s.geofenceStatus === 'green').length}
                            </p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            ✓
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Critical Alerts</p>
                            <p className="text-2xl font-bold text-red-600">{stats.alerts}</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 animate-pulse">
                            !
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Connecting to satellites...</p>
                </div>
            ) : shifts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">No shifts scheduled for today.</p>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
                    {shifts.map(shift => (
                        <StatusCard key={shift.shiftId} shift={shift} />
                    ))}
                </div>
            )}
        </div>
    );
}
