import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

// Utility functions
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Simple API helper
const api = {
    get: async (url: string) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api${url}`);
        return { data: await response.json() };
    },
    post: async (url: string, data: any) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api${url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return { data: await response.json() };
    }
};

// Simple Table components
const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <table className="min-w-full divide-y divide-gray-200">{children}</table>
);
const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <thead className="bg-gray-50">{children}</thead>
);
const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
);
const TableRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <tr>{children}</tr>
);
const TableHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th>
);
const TableCell: React.FC<{ children: React.ReactNode; colSpan?: number; className?: string }> = ({ children, colSpan, className }) => (
    <td colSpan={colSpan} className={`px-6 py-4 whitespace-nowrap text-sm ${className || ''}`}>{children}</td>
);

interface BonusTransaction {
    id: string;
    caregiver_id: string;
    first_name: string;
    last_name: string;
    bonus_type: string;
    amount: number;
    period: string;
    paid_at: string;
}

export const BonusDashboard: React.FC = () => {
    const [bonuses, setBonuses] = useState<BonusTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBonuses();
    }, []);

    const fetchBonuses = async () => {
        try {
            const response = await api.get('/console/bonuses');
            setBonuses(response.data);
        } catch (error) {
            console.error('Failed to fetch bonuses', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunCheck = async (caregiverId: string) => {
        try {
            await api.post('/console/bonuses/run-check', { caregiverId });
            fetchBonuses(); // Refresh list
            alert('Bonus check completed successfully');
        } catch (error) {
            alert('Failed to run bonus check');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Bonus Program</h1>
                <Button onClick={() => fetchBonuses()}>Refresh</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid (YTD)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(bonuses.reduce((sum, b) => sum + Number(b.amount), 0))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Payouts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{bonuses.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Bonus Payouts</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Caregiver</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                                </TableRow>
                            ) : bonuses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">No bonuses found</TableCell>
                                </TableRow>
                            ) : (
                                bonuses.map((bonus) => (
                                    <TableRow key={bonus.id}>
                                        <TableCell>{formatDate(bonus.paid_at)}</TableCell>
                                        <TableCell>{bonus.first_name} {bonus.last_name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {bonus.bonus_type.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{bonus.period}</TableCell>
                                        <TableCell className="font-medium text-green-600">
                                            {formatCurrency(bonus.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-green-500">Paid</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
