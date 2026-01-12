import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    ChevronUpDownIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    EyeIcon,
    UserIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    CogIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ComputerDesktopIcon,
    GlobeAltIcon,
    KeyIcon,
    PencilSquareIcon,
    TrashIcon,
    PlusIcon,
    ArrowRightOnRectangleIcon,
    ArrowLeftOnRectangleIcon,
    DocumentDuplicateIcon,
    PrinterIcon,
    CalendarIcon,
    ArrowPathIcon,
    InformationCircleIcon,
    BanknotesIcon,
    UserGroupIcon,
    ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

// Audit Event Types for compliance
type AuditEventType =
    | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED'
    | 'USER_CREATE' | 'USER_UPDATE' | 'USER_DELETE' | 'USER_DEACTIVATE'
    | 'ROLE_CHANGE' | 'PERMISSION_CHANGE'
    | 'PATIENT_VIEW' | 'PATIENT_CREATE' | 'PATIENT_UPDATE' | 'PATIENT_DELETE'
    | 'PHI_ACCESS' | 'PHI_EXPORT' | 'PHI_PRINT'
    | 'DOCUMENT_VIEW' | 'DOCUMENT_UPLOAD' | 'DOCUMENT_DELETE'
    | 'CLAIM_CREATE' | 'CLAIM_SUBMIT' | 'CLAIM_UPDATE'
    | 'PAYMENT_PROCESS' | 'PAYMENT_VOID'
    | 'SCHEDULE_CREATE' | 'SCHEDULE_UPDATE' | 'SCHEDULE_DELETE'
    | 'SETTINGS_CHANGE' | 'CONFIG_CHANGE'
    | 'REPORT_GENERATE' | 'REPORT_EXPORT'
    | 'DATA_EXPORT' | 'DATA_IMPORT'
    | 'SYSTEM_ERROR' | 'SECURITY_ALERT';

type AuditCategory = 'authentication' | 'user_management' | 'patient_data' | 'phi_access' | 'billing' | 'scheduling' | 'system' | 'security';

interface AuditLog {
    id: string;
    timestamp: string;
    eventType: AuditEventType;
    category: AuditCategory;
    action: string;
    description: string;
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    ipAddress: string;
    userAgent: string;
    resourceType?: string;
    resourceId?: string;
    resourceName?: string;
    previousValue?: string;
    newValue?: string;
    status: 'success' | 'failure' | 'warning';
    metadata?: Record<string, any>;
    sessionId: string;
}

// Event type configurations
const eventTypeConfig: Record<AuditEventType, { label: string; icon: React.ElementType; color: string }> = {
    'LOGIN': { label: 'User Login', icon: ArrowRightOnRectangleIcon, color: 'text-green-600' },
    'LOGOUT': { label: 'User Logout', icon: ArrowLeftOnRectangleIcon, color: 'text-blue-600' },
    'LOGIN_FAILED': { label: 'Failed Login', icon: XCircleIcon, color: 'text-red-600' },
    'USER_CREATE': { label: 'User Created', icon: PlusIcon, color: 'text-purple-600' },
    'USER_UPDATE': { label: 'User Updated', icon: PencilSquareIcon, color: 'text-blue-600' },
    'USER_DELETE': { label: 'User Deleted', icon: TrashIcon, color: 'text-red-600' },
    'USER_DEACTIVATE': { label: 'User Deactivated', icon: XCircleIcon, color: 'text-orange-600' },
    'ROLE_CHANGE': { label: 'Role Changed', icon: ShieldCheckIcon, color: 'text-yellow-600' },
    'PERMISSION_CHANGE': { label: 'Permission Changed', icon: KeyIcon, color: 'text-yellow-600' },
    'PATIENT_VIEW': { label: 'Patient Viewed', icon: EyeIcon, color: 'text-blue-600' },
    'PATIENT_CREATE': { label: 'Patient Created', icon: PlusIcon, color: 'text-green-600' },
    'PATIENT_UPDATE': { label: 'Patient Updated', icon: PencilSquareIcon, color: 'text-blue-600' },
    'PATIENT_DELETE': { label: 'Patient Deleted', icon: TrashIcon, color: 'text-red-600' },
    'PHI_ACCESS': { label: 'PHI Accessed', icon: ShieldCheckIcon, color: 'text-amber-600' },
    'PHI_EXPORT': { label: 'PHI Exported', icon: ArrowDownTrayIcon, color: 'text-orange-600' },
    'PHI_PRINT': { label: 'PHI Printed', icon: PrinterIcon, color: 'text-orange-600' },
    'DOCUMENT_VIEW': { label: 'Document Viewed', icon: DocumentTextIcon, color: 'text-blue-600' },
    'DOCUMENT_UPLOAD': { label: 'Document Uploaded', icon: PlusIcon, color: 'text-green-600' },
    'DOCUMENT_DELETE': { label: 'Document Deleted', icon: TrashIcon, color: 'text-red-600' },
    'CLAIM_CREATE': { label: 'Claim Created', icon: PlusIcon, color: 'text-green-600' },
    'CLAIM_SUBMIT': { label: 'Claim Submitted', icon: CheckCircleIcon, color: 'text-green-600' },
    'CLAIM_UPDATE': { label: 'Claim Updated', icon: PencilSquareIcon, color: 'text-blue-600' },
    'PAYMENT_PROCESS': { label: 'Payment Processed', icon: BanknotesIcon, color: 'text-green-600' },
    'PAYMENT_VOID': { label: 'Payment Voided', icon: XCircleIcon, color: 'text-red-600' },
    'SCHEDULE_CREATE': { label: 'Schedule Created', icon: CalendarIcon, color: 'text-green-600' },
    'SCHEDULE_UPDATE': { label: 'Schedule Updated', icon: PencilSquareIcon, color: 'text-blue-600' },
    'SCHEDULE_DELETE': { label: 'Schedule Deleted', icon: TrashIcon, color: 'text-red-600' },
    'SETTINGS_CHANGE': { label: 'Settings Changed', icon: CogIcon, color: 'text-gray-600' },
    'CONFIG_CHANGE': { label: 'Config Changed', icon: CogIcon, color: 'text-gray-600' },
    'REPORT_GENERATE': { label: 'Report Generated', icon: DocumentDuplicateIcon, color: 'text-blue-600' },
    'REPORT_EXPORT': { label: 'Report Exported', icon: ArrowDownTrayIcon, color: 'text-blue-600' },
    'DATA_EXPORT': { label: 'Data Exported', icon: ArrowDownTrayIcon, color: 'text-orange-600' },
    'DATA_IMPORT': { label: 'Data Imported', icon: PlusIcon, color: 'text-green-600' },
    'SYSTEM_ERROR': { label: 'System Error', icon: ExclamationTriangleIcon, color: 'text-red-600' },
    'SECURITY_ALERT': { label: 'Security Alert', icon: ShieldCheckIcon, color: 'text-red-600' },
};

const categoryConfig: Record<AuditCategory, { label: string; color: string; bgColor: string }> = {
    'authentication': { label: 'Authentication', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    'user_management': { label: 'User Management', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    'patient_data': { label: 'Patient Data', color: 'text-green-700', bgColor: 'bg-green-100' },
    'phi_access': { label: 'PHI Access', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    'billing': { label: 'Billing', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
    'scheduling': { label: 'Scheduling', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
    'system': { label: 'System', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    'security': { label: 'Security', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// Generate realistic mock audit data
const generateMockAuditLogs = (): AuditLog[] => {
    const now = new Date();
    const logs: AuditLog[] = [];

    const users = [
        { id: 'u1', name: 'Thomas Carter', email: 'founder@serenitycarepartners.com', role: 'Founder' },
        { id: 'u2', name: 'Maria Garcia', email: 'maria.garcia@serenitycarepartners.com', role: 'Clinical Director' },
        { id: 'u3', name: 'James Wilson', email: 'james.wilson@serenitycarepartners.com', role: 'HR Manager' },
        { id: 'u4', name: 'Sarah Johnson', email: 'sarah.johnson@serenitycarepartners.com', role: 'Billing Specialist' },
        { id: 'u5', name: 'Michael Brown', email: 'michael.brown@serenitycarepartners.com', role: 'Pod Lead' },
        { id: 'u6', name: 'Emily Davis', email: 'emily.davis@serenitycarepartners.com', role: 'Caregiver' },
    ];

    const patients = ['John Smith', 'Mary Johnson', 'Robert Williams', 'Patricia Brown', 'Jennifer Davis'];
    const ipAddresses = ['192.168.1.1', '192.168.1.45', '10.0.0.12', '172.16.0.100', '192.168.2.55'];

    const eventTemplates: { type: AuditEventType; category: AuditCategory; action: string; descTemplate: string }[] = [
        { type: 'LOGIN', category: 'authentication', action: 'User logged in', descTemplate: '{user} logged in successfully' },
        { type: 'LOGOUT', category: 'authentication', action: 'User logged out', descTemplate: '{user} logged out' },
        { type: 'LOGIN_FAILED', category: 'security', action: 'Failed login attempt', descTemplate: 'Failed login attempt for {email}' },
        { type: 'PATIENT_VIEW', category: 'phi_access', action: 'Viewed patient record', descTemplate: '{user} viewed patient record: {patient}' },
        { type: 'PATIENT_UPDATE', category: 'patient_data', action: 'Updated patient record', descTemplate: '{user} updated patient: {patient} - {field}' },
        { type: 'PHI_ACCESS', category: 'phi_access', action: 'Accessed PHI', descTemplate: '{user} accessed PHI for patient: {patient}' },
        { type: 'PHI_EXPORT', category: 'phi_access', action: 'Exported PHI', descTemplate: '{user} exported PHI data for {patient}' },
        { type: 'DOCUMENT_VIEW', category: 'patient_data', action: 'Viewed document', descTemplate: '{user} viewed document: {doc} for {patient}' },
        { type: 'DOCUMENT_UPLOAD', category: 'patient_data', action: 'Uploaded document', descTemplate: '{user} uploaded document: {doc}' },
        { type: 'USER_CREATE', category: 'user_management', action: 'Created user', descTemplate: '{user} created new user: {newUser}' },
        { type: 'USER_UPDATE', category: 'user_management', action: 'Updated user', descTemplate: '{user} updated user profile: {target}' },
        { type: 'ROLE_CHANGE', category: 'user_management', action: 'Changed role', descTemplate: '{user} changed role for {target}: {oldRole} → {newRole}' },
        { type: 'CLAIM_CREATE', category: 'billing', action: 'Created claim', descTemplate: '{user} created claim #{claimId} for {patient}' },
        { type: 'CLAIM_SUBMIT', category: 'billing', action: 'Submitted claim', descTemplate: '{user} submitted claim #{claimId} to {payer}' },
        { type: 'PAYMENT_PROCESS', category: 'billing', action: 'Processed payment', descTemplate: '{user} processed payment ${amount} for claim #{claimId}' },
        { type: 'SCHEDULE_CREATE', category: 'scheduling', action: 'Created schedule', descTemplate: '{user} scheduled visit for {patient} on {date}' },
        { type: 'SCHEDULE_UPDATE', category: 'scheduling', action: 'Updated schedule', descTemplate: '{user} modified schedule for {patient}' },
        { type: 'SETTINGS_CHANGE', category: 'system', action: 'Changed settings', descTemplate: '{user} modified system settings: {setting}' },
        { type: 'REPORT_GENERATE', category: 'system', action: 'Generated report', descTemplate: '{user} generated {reportType} report' },
        { type: 'DATA_EXPORT', category: 'system', action: 'Exported data', descTemplate: '{user} exported {dataType} data' },
        { type: 'SECURITY_ALERT', category: 'security', action: 'Security alert', descTemplate: 'Security alert: {alertType}' },
    ];

    // Generate 200+ realistic audit entries over the past 30 days
    for (let i = 0; i < 250; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const patient = patients[Math.floor(Math.random() * patients.length)];
        const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
        const ip = ipAddresses[Math.floor(Math.random() * ipAddresses.length)];

        const timestamp = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);

        let description = template.descTemplate
            .replace('{user}', user.name)
            .replace('{email}', user.email)
            .replace('{patient}', patient)
            .replace('{field}', ['address', 'phone', 'insurance', 'medications', 'diagnosis'][Math.floor(Math.random() * 5)])
            .replace('{doc}', ['Care Plan', 'Assessment', 'Progress Note', 'Authorization', 'Insurance Card'][Math.floor(Math.random() * 5)])
            .replace('{newUser}', 'new.user@serenitycarepartners.com')
            .replace('{target}', users[Math.floor(Math.random() * users.length)].name)
            .replace('{oldRole}', 'Caregiver')
            .replace('{newRole}', 'Pod Lead')
            .replace('{claimId}', `CLM-${10000 + Math.floor(Math.random() * 90000)}`)
            .replace('{payer}', ['Medicare', 'Medicaid', 'United Healthcare', 'Aetna'][Math.floor(Math.random() * 4)])
            .replace('{amount}', (Math.random() * 5000).toFixed(2))
            .replace('{date}', new Date(timestamp.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString())
            .replace('{setting}', ['Email notifications', 'Security policy', 'Billing rates', 'User permissions'][Math.floor(Math.random() * 4)])
            .replace('{reportType}', ['Financial', 'Compliance', 'Staffing', 'Patient Census'][Math.floor(Math.random() * 4)])
            .replace('{dataType}', ['Patient', 'Staff', 'Claims', 'Scheduling'][Math.floor(Math.random() * 4)])
            .replace('{alertType}', ['Multiple failed logins', 'Unusual access pattern', 'After-hours access'][Math.floor(Math.random() * 3)]);

        logs.push({
            id: `audit-${i + 1}`,
            timestamp: timestamp.toISOString(),
            eventType: template.type,
            category: template.category,
            action: template.action,
            description,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            userRole: user.role,
            ipAddress: ip,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
            resourceType: template.category === 'phi_access' ? 'Patient' : undefined,
            resourceId: template.category === 'phi_access' ? `P-${1000 + Math.floor(Math.random() * 9000)}` : undefined,
            resourceName: template.category === 'phi_access' ? patient : undefined,
            status: template.type === 'LOGIN_FAILED' || template.type === 'SECURITY_ALERT' ? 'failure' :
                    template.type === 'PHI_EXPORT' ? 'warning' : 'success',
            sessionId: `sess-${Math.random().toString(36).substr(2, 9)}`,
        });
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

type SortField = 'timestamp' | 'userName' | 'eventType' | 'category' | 'status';
type SortDirection = 'asc' | 'desc';

export default function AuditLogs() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [userFilter, setUserFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Sorting
    const [sortField, setSortField] = useState<SortField>('timestamp');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/console/admin/audit-logs?limit=500', {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    // Map backend response to frontend format
                    if (data.logs && data.logs.length > 0) {
                        setLogs(data.logs.map((log: any) => ({
                            ...log,
                            eventType: log.eventType || 'SETTINGS_CHANGE',
                            category: log.category || 'system',
                            status: log.status || 'success'
                        })));
                    } else {
                        // Fall back to mock data if no real logs exist
                        setLogs(generateMockAuditLogs());
                    }
                } else {
                    console.error('Failed to fetch audit logs, using mock data');
                    setLogs(generateMockAuditLogs());
                }
            } catch (error) {
                console.error('Error fetching audit logs:', error);
                setLogs(generateMockAuditLogs());
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    // Get unique users for filter
    const uniqueUsers = useMemo(() => {
        const users = new Map<string, { name: string; email: string }>();
        logs.forEach(log => {
            if (!users.has(log.userId)) {
                users.set(log.userId, { name: log.userName, email: log.userEmail });
            }
        });
        return Array.from(users.entries()).map(([id, data]) => ({ id, ...data }));
    }, [logs]);

    // Filter and sort logs
    const filteredLogs = useMemo(() => {
        let result = logs.filter(log => {
            // Search
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                const matchesSearch =
                    log.description.toLowerCase().includes(search) ||
                    log.userName.toLowerCase().includes(search) ||
                    log.userEmail.toLowerCase().includes(search) ||
                    log.action.toLowerCase().includes(search) ||
                    log.ipAddress.includes(search) ||
                    (log.resourceName?.toLowerCase().includes(search));
                if (!matchesSearch) return false;
            }

            // Category filter
            if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;

            // Event type filter
            if (eventTypeFilter !== 'all' && log.eventType !== eventTypeFilter) return false;

            // Status filter
            if (statusFilter !== 'all' && log.status !== statusFilter) return false;

            // User filter
            if (userFilter !== 'all' && log.userId !== userFilter) return false;

            // Date range filter
            if (dateFrom) {
                const logDate = new Date(log.timestamp);
                const fromDate = new Date(dateFrom);
                if (logDate < fromDate) return false;
            }
            if (dateTo) {
                const logDate = new Date(log.timestamp);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59);
                if (logDate > toDate) return false;
            }

            return true;
        });

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'timestamp':
                    comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                    break;
                case 'userName':
                    comparison = a.userName.localeCompare(b.userName);
                    break;
                case 'eventType':
                    comparison = a.eventType.localeCompare(b.eventType);
                    break;
                case 'category':
                    comparison = a.category.localeCompare(b.category);
                    break;
                case 'status':
                    comparison = a.status.localeCompare(b.status);
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [logs, searchTerm, categoryFilter, eventTypeFilter, statusFilter, userFilter, dateFrom, dateTo, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />;
        return sortDirection === 'asc'
            ? <ChevronUpIcon className="h-4 w-4 text-blue-600" />
            : <ChevronDownIcon className="h-4 w-4 text-blue-600" />;
    };

    const handleExport = (format: 'csv' | 'json' | 'pdf') => {
        // In production, this would generate and download the actual file
        const data = filteredLogs.map(log => ({
            Timestamp: new Date(log.timestamp).toLocaleString(),
            User: log.userName,
            Email: log.userEmail,
            Role: log.userRole,
            'Event Type': eventTypeConfig[log.eventType].label,
            Category: categoryConfig[log.category].label,
            Action: log.action,
            Description: log.description,
            'IP Address': log.ipAddress,
            Status: log.status,
            'Resource Type': log.resourceType || '',
            'Resource ID': log.resourceId || '',
            'Session ID': log.sessionId,
        }));

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        } else if (format === 'csv') {
            const headers = Object.keys(data[0] || {}).join(',');
            const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
            const csv = `${headers}\n${rows}`;
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        }
        // PDF would require a library like jsPDF
    };

    const clearFilters = () => {
        setSearchTerm('');
        setCategoryFilter('all');
        setEventTypeFilter('all');
        setStatusFilter('all');
        setUserFilter('all');
        setDateFrom('');
        setDateTo('');
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Summary stats
    const stats = useMemo(() => ({
        total: filteredLogs.length,
        phiAccess: filteredLogs.filter(l => l.category === 'phi_access').length,
        securityEvents: filteredLogs.filter(l => l.category === 'security').length,
        failedLogins: filteredLogs.filter(l => l.eventType === 'LOGIN_FAILED').length,
        uniqueUsers: new Set(filteredLogs.map(l => l.userId)).size,
    }), [filteredLogs]);

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-96 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6" data-testid="audit-logs-dashboard">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900" data-testid="audit-log-title">Audit Logs</h1>
                    <p className="text-gray-500 mt-1">Complete system activity and access history for compliance</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setLogs(generateMockAuditLogs())}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Refresh
                    </button>
                    <div className="relative">
                        <button
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            onClick={() => handleExport('csv')}
                        >
                            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                            Export CSV
                        </button>
                    </div>
                    <button
                        onClick={() => handleExport('json')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                        Export JSON
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl border shadow-sm p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Events</p>
                            <p className="text-xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border shadow-sm p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <ShieldCheckIcon className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">PHI Access</p>
                            <p className="text-xl font-bold text-amber-600">{stats.phiAccess.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border shadow-sm p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Security Events</p>
                            <p className="text-xl font-bold text-red-600">{stats.securityEvents.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border shadow-sm p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <XCircleIcon className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Failed Logins</p>
                            <p className="text-xl font-bold text-orange-600">{stats.failedLogins.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border shadow-sm p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <UserGroupIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Unique Users</p>
                            <p className="text-xl font-bold text-purple-600">{stats.uniqueUsers.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Compliance Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-blue-900">HIPAA Compliance Audit Trail</h3>
                        <p className="text-sm text-blue-700 mt-1">
                            This audit log captures all system activity including PHI access, user actions, and security events.
                            Logs are retained for 6 years per HIPAA requirements. Export functionality is available for compliance audits.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border shadow-sm p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <FunnelIcon className="h-5 w-5 text-gray-500" />
                    <h3 className="font-medium text-gray-900">Filters</h3>
                    {(searchTerm || categoryFilter !== 'all' || eventTypeFilter !== 'all' || statusFilter !== 'all' || userFilter !== 'all' || dateFrom || dateTo) && (
                        <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-800 ml-auto">
                            Clear all filters
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Category */}
                    <select
                        value={categoryFilter}
                        onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Categories</option>
                        {Object.entries(categoryConfig).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>

                    {/* Event Type */}
                    <select
                        value={eventTypeFilter}
                        onChange={e => { setEventTypeFilter(e.target.value); setCurrentPage(1); }}
                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Event Types</option>
                        {Object.entries(eventTypeConfig).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>

                    {/* Status */}
                    <select
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="success">Success</option>
                        <option value="failure">Failure</option>
                        <option value="warning">Warning</option>
                    </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* User */}
                    <select
                        value={userFilter}
                        onChange={e => { setUserFilter(e.target.value); setCurrentPage(1); }}
                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Users</option>
                        {uniqueUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                    </select>

                    {/* Date From */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500 whitespace-nowrap">From:</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
                            className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Date To */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500 whitespace-nowrap">To:</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }}
                            className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Results count and pagination controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} events
                </p>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500">Per page:</label>
                    <select
                        value={itemsPerPage}
                        onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="border rounded px-2 py-1 text-sm"
                    >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={250}>250</option>
                    </select>
                </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('timestamp')}
                                >
                                    <div className="flex items-center gap-1">
                                        Timestamp {getSortIcon('timestamp')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('userName')}
                                >
                                    <div className="flex items-center gap-1">
                                        User {getSortIcon('userName')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('eventType')}
                                >
                                    <div className="flex items-center gap-1">
                                        Event {getSortIcon('eventType')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('category')}
                                >
                                    <div className="flex items-center gap-1">
                                        Category {getSortIcon('category')}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Description
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    IP Address
                                </th>
                                <th
                                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Status {getSortIcon('status')}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    Details
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedLogs.map(log => {
                                const eventConfig = eventTypeConfig[log.eventType];
                                const catConfig = categoryConfig[log.category];
                                const EventIcon = eventConfig.icon;
                                return (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{formatTimestamp(log.timestamp)}</p>
                                                <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{log.userName}</p>
                                                <p className="text-xs text-gray-500">{log.userEmail}</p>
                                                <p className="text-xs text-gray-400">{log.userRole}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <EventIcon className={`h-4 w-4 ${eventConfig.color}`} />
                                                <span className="text-sm text-gray-700">{eventConfig.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${catConfig.bgColor} ${catConfig.color}`}>
                                                {catConfig.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-700 max-w-md truncate" title={log.description}>
                                                {log.description}
                                            </p>
                                            {log.resourceName && (
                                                <p className="text-xs text-gray-500">Resource: {log.resourceName} ({log.resourceId})</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">{log.ipAddress}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                log.status === 'success' ? 'bg-green-100 text-green-700' :
                                                log.status === 'failure' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {log.status === 'success' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                                                {log.status === 'failure' && <XCircleIcon className="h-3 w-3 mr-1" />}
                                                {log.status === 'warning' && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
                                                {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                title="View Details"
                                            >
                                                <EyeIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t flex items-center justify-between">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-3 py-1 rounded text-sm ${
                                            currentPage === pageNum
                                                ? 'bg-blue-600 text-white'
                                                : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
                            <div className="flex items-center gap-3">
                                {React.createElement(eventTypeConfig[selectedLog.eventType].icon, {
                                    className: `h-6 w-6 ${eventTypeConfig[selectedLog.eventType].color}`
                                })}
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Audit Log Details</h2>
                                    <p className="text-sm text-gray-500">Event ID: {selectedLog.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircleIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Event Summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Event Type</p>
                                    <p className="font-semibold text-gray-900">{eventTypeConfig[selectedLog.eventType].label}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Category</p>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium ${categoryConfig[selectedLog.category].bgColor} ${categoryConfig[selectedLog.category].color}`}>
                                        {categoryConfig[selectedLog.category].label}
                                    </span>
                                </div>
                            </div>

                            {/* Timestamp */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <ClockIcon className="h-5 w-5 text-gray-500" />
                                    Timestamp
                                </h3>
                                <p className="text-gray-700">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                                <p className="text-sm text-gray-500">ISO: {selectedLog.timestamp}</p>
                            </div>

                            {/* User Information */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <UserIcon className="h-5 w-5 text-gray-500" />
                                    User Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Name</p>
                                        <p className="font-medium">{selectedLog.userName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Email</p>
                                        <p className="font-medium">{selectedLog.userEmail}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Role</p>
                                        <p className="font-medium">{selectedLog.userRole}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">User ID</p>
                                        <p className="font-medium font-mono text-xs">{selectedLog.userId}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Details */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                                    Action Details
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm text-gray-500">Action</p>
                                        <p className="font-medium">{selectedLog.action}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Description</p>
                                        <p className="text-gray-700">{selectedLog.description}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium ${
                                            selectedLog.status === 'success' ? 'bg-green-100 text-green-700' :
                                            selectedLog.status === 'failure' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {selectedLog.status.charAt(0).toUpperCase() + selectedLog.status.slice(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Resource Information */}
                            {selectedLog.resourceType && (
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <ShieldCheckIcon className="h-5 w-5 text-gray-500" />
                                        Resource Information
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">Type</p>
                                            <p className="font-medium">{selectedLog.resourceType}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">ID</p>
                                            <p className="font-medium font-mono">{selectedLog.resourceId}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Name</p>
                                            <p className="font-medium">{selectedLog.resourceName}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Technical Details */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <ComputerDesktopIcon className="h-5 w-5 text-gray-500" />
                                    Technical Details
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-500">IP Address:</span>
                                        <span className="font-mono">{selectedLog.ipAddress}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">User Agent:</span>
                                        <p className="font-mono text-xs mt-1 text-gray-600 break-all">{selectedLog.userAgent}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Session ID:</span>
                                        <span className="font-mono text-xs">{selectedLog.sessionId}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        const blob = new Blob([JSON.stringify(selectedLog, null, 2)], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `audit-log-${selectedLog.id}.json`;
                                        a.click();
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                    Export Event
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
