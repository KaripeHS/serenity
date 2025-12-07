
import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/layouts/SidebarLayout';
import { financeService, BankAccount } from '../../services/finance.service';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';

export default function BankAccounts() {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [newItem, setNewItem] = useState({ name: '', institutionName: '', accountNumberLast4: '', routingNumber: '' });

    useEffect(() => {
        loadAccounts();
    }, []);

    async function loadAccounts() {
        try {
            const data = await financeService.getBankAccounts();
            setAccounts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await financeService.createBankAccount({
                ...newItem,
                isPrimary: accounts.length === 0
            });
            toast({ title: 'Success', description: 'Bank account added' });
            setNewItem({ name: '', institutionName: '', accountNumberLast4: '', routingNumber: '' });
            loadAccounts();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure?')) return;
        try {
            await financeService.deleteBankAccount(id);
            toast({ title: 'Success', description: 'Account removed' });
            loadAccounts();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    }

    return (
        <SidebarLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Bank Accounts</h1>

                {/* List */}
                <div className="grid gap-4 mb-8">
                    {loading ? <p>Loading...</p> : accounts.length === 0 ? <p className="text-gray-500">No accounts linked.</p> : (
                        accounts.map(acc => (
                            <div key={acc.id} className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold">{acc.name}</h3>
                                    <p className="text-sm text-gray-600">{acc.institutionName} •••• {acc.accountNumberLast4}</p>
                                </div>
                                <button onClick={() => handleDelete(acc.id)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                            </div>
                        ))
                    )}
                </div>

                {/* Add New */}
                <div className="bg-white p-6 rounded-lg shadow max-w-lg">
                    <h2 className="text-lg font-semibold mb-4">Link New Account</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Account Nickname</Label>
                            <input
                                className="w-full mt-1 border rounded p-2"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label>Institution Name</Label>
                            <input
                                className="w-full mt-1 border rounded p-2"
                                value={newItem.institutionName}
                                onChange={e => setNewItem({ ...newItem, institutionName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Routing Number</Label>
                                <input
                                    className="w-full mt-1 border rounded p-2"
                                    value={newItem.routingNumber}
                                    onChange={e => setNewItem({ ...newItem, routingNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Last 4 Digits</Label>
                                <input
                                    className="w-full mt-1 border rounded p-2"
                                    value={newItem.accountNumberLast4}
                                    onChange={e => setNewItem({ ...newItem, accountNumberLast4: e.target.value })}
                                    maxLength={4}
                                />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Add Account</button>
                    </form>
                </div>
            </div>
        </SidebarLayout>
    );
}
