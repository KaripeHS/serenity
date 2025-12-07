
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { request } from '../../services/api';

export function CommuterCheckIn() {
    const { shiftId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [shiftData, setShiftData] = useState<any>(null);

    useEffect(() => {
        // Load partial shift data for context
        // This endpoint would need to be public or we rely on token if authenticated
        // For 'Wake-Up' links, typically we want a magic token or require login.
        // Assuming user is logged in for MVP.
        const load = async () => {
            try {
                // We'd fetch shift details here
                // const res = await request(/api/console/shifts/details/${shiftId});
                // setShiftData(res);
            } catch (e) { }
        };
        load();
    }, [shiftId]);

    const handleCheckIn = () => {
        setStatus('locating');
        if (!navigator.geolocation) {
            setStatus('error');
            setErrorMsg('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    setLoading(true);
                    await request('/api/operations/commute/start', {
                        method: 'POST',
                        body: JSON.stringify({
                            shiftId,
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        })
                    });
                    setStatus('success');
                    setTimeout(() => navigate('/dashboard'), 2000);
                } catch (err: any) {
                    setStatus('error');
                    setErrorMsg(err.message || 'Failed to sync with server');
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                setStatus('error');
                setErrorMsg('Location access denied. Please enable GPS.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Shift Check-In</CardTitle>
                    <p className="text-sm text-gray-500">Confirm you are en-route to client</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {status === 'success' ? (
                        <div className="text-center py-8 text-green-600">
                            <div className="text-4xl mb-2">✓</div>
                            <h3 className="font-bold">You are checked in!</h3>
                            <p className="text-sm">Drive safely.</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm">
                                <strong>Safety First:</strong> Only click this button before you start driving.
                                GPS Location will be logged.
                            </div>

                            {status === 'error' && (
                                <div className="bg-red-50 p-3 rounded text-red-700 text-sm">
                                    {errorMsg}
                                </div>
                            )}

                            <Button
                                onClick={handleCheckIn}
                                disabled={status === 'locating' || loading}
                                className="w-full h-16 text-lg font-bold bg-teal-600 hover:bg-teal-700"
                            >
                                {status === 'locating' ? 'Locating...' : 'I AM ON MY WAY'}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
