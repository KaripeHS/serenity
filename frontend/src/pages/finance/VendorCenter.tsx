
import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/layouts/SidebarLayout';
import { financeService, Vendor } from '../../services/finance.service';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';

export function VendorCenter() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [newItem, setNewItem] = useState({ name: '', email: '', taxId: '' });

    useEffect(() => {
        loadVendors();
    }, []);

    async function loadVendors() {
        try {
            const data = await financeService.getVendors();
            setVendors(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await financeService.createVendor(newItem);
            toast({ title: 'Success', description: 'Vendor added' });
            setNewItem({ name: '', email: '', taxId: '' });
            loadVendors();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    }

    return (
        <SidebarLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Vendor Center</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Add New */}
                    <div className="bg-white p-6 rounded-lg shadow h-fit">
                        <h2 className="text-lg font-semibold mb-4">Add Vendor</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Company Name</Label>
                                <input
                                    className="w-full mt-1 border rounded p-2"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Email (for remittances)</Label>
                                <input
                                    className="w-full mt-1 border rounded p-2"
                                    type="email"
                                    value={newItem.email}
                                    onChange={e => setNewItem({ ...newItem, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Tax ID / EIN</Label>
                                <input
                                    className="w-full mt-1 border rounded p-2"
                                    value={newItem.taxId}
                                    onChange={e => setNewItem({ ...newItem, taxId: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700">Add Vendor</button>
                        </form>
                    </div>

                    {/* List */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-4">Active Vendors</h2>
                        <div className="space-y-2">
                            {loading ? <p>Loading...</p> : vendors.length === 0 ? <p className="text-gray-500">No vendors found.</p> : (
                                vendors.map(v => (
                                    <div key={v.id} className="border-b last:border-0 pb-2 mb-2">
                                        <h3 className="font-medium">{v.name}</h3>
                                        <p className="text-sm text-gray-500">EIN: {v.taxId || 'N/A'} • {v.email}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
