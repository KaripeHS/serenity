/**
 * Email Accounts Manager
 * Admin page for managing organization email accounts and their purposes
 */

import { useState, useEffect } from 'react';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/label';
import { Select, SelectOption } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Mail, Plus, Edit2, Trash2, Star, Check, X, ArrowLeft } from 'lucide-react';

interface EmailAccount {
  id: string;
  emailAddress: string;
  displayName: string | null;
  description: string | null;
  purpose: string;
  smtpHost: string | null;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string | null;
  isActive: boolean;
  isDefault: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EmailAccountFormData {
  emailAddress: string;
  displayName: string;
  description: string;
  purpose: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  isActive: boolean;
  isDefault: boolean;
}

const PURPOSE_OPTIONS = [
  { value: 'hr', label: 'Human Resources', description: 'Recruiting, onboarding, employee communications' },
  { value: 'billing', label: 'Billing', description: 'Invoices, payment notifications, billing inquiries' },
  { value: 'care', label: 'Care Coordination', description: 'Client communications, care updates' },
  { value: 'support', label: 'Support', description: 'Technical support, help desk' },
  { value: 'general', label: 'General', description: 'General communications, inquiries' },
  { value: 'ceo', label: 'CEO', description: 'Executive communications' },
  { value: 'cfo', label: 'CFO', description: 'Financial executive communications' },
  { value: 'coo', label: 'COO', description: 'Operations executive communications' },
  { value: 'marketing', label: 'Marketing', description: 'Marketing campaigns, newsletters' },
];

const emptyFormData: EmailAccountFormData = {
  emailAddress: '',
  displayName: '',
  description: '',
  purpose: 'general',
  smtpHost: 'smtp.hostinger.com',
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: '',
  isActive: true,
  isDefault: false,
};

export default function EmailAccountsManager() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [formData, setFormData] = useState<EmailAccountFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/email-accounts');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to load');
      setAccounts(data.accounts || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load email accounts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (account?: EmailAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        emailAddress: account.emailAddress,
        displayName: account.displayName || '',
        description: account.description || '',
        purpose: account.purpose,
        smtpHost: account.smtpHost || 'smtp.hostinger.com',
        smtpPort: account.smtpPort || 465,
        smtpSecure: account.smtpSecure,
        smtpUser: account.smtpUser || '',
        isActive: account.isActive,
        isDefault: account.isDefault,
      });
    } else {
      setEditingAccount(null);
      setFormData(emptyFormData);
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAccount(null);
    setFormData(emptyFormData);
  };

  const handleSave = async () => {
    if (!formData.emailAddress || !formData.purpose) {
      toast({
        title: 'Validation Error',
        description: 'Email address and purpose are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const url = editingAccount
        ? `/api/admin/email-accounts/${editingAccount.id}`
        : '/api/admin/email-accounts';
      const method = editingAccount ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save');

      toast({ title: 'Success', description: editingAccount ? 'Email account updated' : 'Email account created' });
      handleCloseForm();
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save email account',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/email-accounts/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete');
      toast({ title: 'Success', description: 'Email account deleted' });
      setDeleteConfirm(null);
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete email account',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (account: EmailAccount) => {
    try {
      const response = await fetch(`/api/admin/email-accounts/${account.id}/set-default`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to set default');
      toast({ title: 'Success', description: `${account.emailAddress} is now the default` });
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set default',
        variant: 'destructive',
      });
    }
  };

  const getPurposeLabel = (purpose: string) => {
    return PURPOSE_OPTIONS.find(p => p.value === purpose)?.label || purpose;
  };

  const getPurposeBadgeColor = (purpose: string) => {
    const colors: Record<string, string> = {
      hr: 'bg-orange-100 text-orange-800',
      billing: 'bg-green-100 text-green-800',
      care: 'bg-blue-100 text-blue-800',
      support: 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800',
      ceo: 'bg-red-100 text-red-800',
      cfo: 'bg-yellow-100 text-yellow-800',
      coo: 'bg-indigo-100 text-indigo-800',
      marketing: 'bg-pink-100 text-pink-800',
    };
    return colors[purpose] || 'bg-gray-100 text-gray-800';
  };

  if (showForm) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button
          onClick={handleCloseForm}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Email Accounts
        </button>

        <Card>
          <CardHeader>
            <CardTitle>
              {editingAccount ? 'Edit Email Account' : 'Add Email Account'}
            </CardTitle>
            <CardDescription>
              Configure an email account for organization communications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailAddress">Email Address *</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  value={formData.emailAddress}
                  onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                  placeholder="hr@serenitycarepartners.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Serenity Care HR"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose *</Label>
                <Select
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                >
                  {PURPOSE_OPTIONS.map((option) => (
                    <SelectOption key={option.value} value={option.value}>
                      {option.label}
                    </SelectOption>
                  ))}
                </Select>
                <p className="text-sm text-gray-500">
                  {PURPOSE_OPTIONS.find(p => p.value === formData.purpose)?.description}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Used for applicant confirmations and HR notifications"
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-3">SMTP Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={formData.smtpHost}
                      onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                      placeholder="smtp.hostinger.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={formData.smtpPort}
                      onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username (if different from email)</Label>
                  <Input
                    id="smtpUser"
                    value={formData.smtpUser}
                    onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                    placeholder="Leave blank to use email address"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Set as default</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleCloseForm} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? 'Saving...' : editingAccount ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Email Accounts
          </h1>
          <p className="text-gray-600 mt-1">
            Manage organization email accounts and their purposes
          </p>
        </div>
        <Button onClick={() => handleOpenForm()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Email Account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Email Accounts</CardTitle>
          <CardDescription>
            These email accounts are used for different types of organization communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No email accounts configured yet</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenForm()}>
                Add your first email account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{account.emailAddress}</span>
                      {account.isDefault && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                      {account.isActive ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600 text-xs">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      {account.displayName && <span>{account.displayName}</span>}
                      <Badge className={`${getPurposeBadgeColor(account.purpose)} text-xs`}>
                        {getPurposeLabel(account.purpose)}
                      </Badge>
                    </div>
                    {account.description && (
                      <p className="text-sm text-gray-500 mt-1">{account.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Last used: {account.lastUsedAt
                        ? new Date(account.lastUsedAt).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {deleteConfirm === account.id ? (
                      <>
                        <span className="text-sm text-red-600 mr-2">Delete?</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(account.id)}
                          className="text-red-600"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {!account.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(account)}
                            title="Set as default"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenForm(account)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(account.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
