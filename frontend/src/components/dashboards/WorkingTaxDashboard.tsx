import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  CalculatorIcon,
  DocumentCheckIcon,
  FolderIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

// Types
type TabType = 'overview' | 'calendar' | 'filings' | 'deductions' | 'optimization' | 'compliance' | 'reports';

interface TaxMetrics {
  q1Revenue: number;
  q2Revenue: number;
  q3Revenue: number;
  q4Revenue: number;
  annualRevenue: number;
  taxLiability: number;
  payrollTaxes: number;
  salesTax: number;
  nextFilingDate: string;
  pendingDeductions: number;
}

interface TaxFiling {
  id: string;
  formType: string;
  formName: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'filed' | 'overdue' | 'upcoming';
  amount: number;
  filedDate?: string;
  confirmationNumber?: string;
  category: 'federal' | 'state' | 'local' | 'payroll';
}

interface TaxDeduction {
  id: string;
  category: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  taxYear: number;
  documentation: boolean;
}

interface TaxOptimization {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  difficulty: 'easy' | 'medium' | 'complex';
  category: string;
  implemented: boolean;
}

// Mock Data for comprehensive tax management
const mockFilings: TaxFiling[] = [
  {
    id: '1',
    formType: 'Form 941',
    formName: 'Quarterly Federal Tax Return',
    description: 'Employer\'s Quarterly Federal Tax Return - Q4 2025',
    dueDate: '2026-01-31',
    status: 'pending',
    amount: 32450.00,
    category: 'federal',
  },
  {
    id: '2',
    formType: 'Form 940',
    formName: 'Annual FUTA Tax Return',
    description: 'Federal Unemployment Tax - Annual Return 2025',
    dueDate: '2026-01-31',
    status: 'pending',
    amount: 8420.00,
    category: 'federal',
  },
  {
    id: '3',
    formType: 'IT-1040',
    formName: 'Ohio State Income Tax',
    description: 'Ohio State Quarterly Estimated Tax - Q4 2025',
    dueDate: '2026-01-15',
    status: 'overdue',
    amount: 24865.75,
    category: 'state',
  },
  {
    id: '4',
    formType: 'UST-1',
    formName: 'Ohio Sales Tax Return',
    description: 'Monthly Sales Tax Filing - December 2025',
    dueDate: '2026-01-23',
    status: 'pending',
    amount: 12000.00,
    category: 'state',
  },
  {
    id: '5',
    formType: 'Form W-2',
    formName: 'Wage and Tax Statements',
    description: 'Employee W-2s - Must be distributed by Jan 31',
    dueDate: '2026-01-31',
    status: 'upcoming',
    amount: 0,
    category: 'payroll',
  },
  {
    id: '6',
    formType: 'Form 1099-NEC',
    formName: 'Nonemployee Compensation',
    description: '1099s for contractors - Due Jan 31',
    dueDate: '2026-01-31',
    status: 'upcoming',
    amount: 0,
    category: 'payroll',
  },
  {
    id: '7',
    formType: 'Form 941',
    formName: 'Quarterly Federal Tax Return',
    description: 'Employer\'s Quarterly Federal Tax Return - Q3 2025',
    dueDate: '2025-10-31',
    status: 'filed',
    amount: 29800.00,
    filedDate: '2025-10-28',
    confirmationNumber: 'FED-2025-Q3-48291',
    category: 'federal',
  },
];

const mockDeductions: TaxDeduction[] = [
  { id: '1', category: 'Business Expenses', description: 'Office supplies and equipment', amount: 12500, status: 'approved', taxYear: 2025, documentation: true },
  { id: '2', category: 'Vehicle/Mileage', description: 'Business mileage (45,230 miles @ $0.67/mi)', amount: 30304.10, status: 'approved', taxYear: 2025, documentation: true },
  { id: '3', category: 'Healthcare', description: 'Employer health insurance contributions', amount: 89600, status: 'approved', taxYear: 2025, documentation: true },
  { id: '4', category: 'Retirement', description: 'Employer 401(k) matching contributions', amount: 42000, status: 'approved', taxYear: 2025, documentation: true },
  { id: '5', category: 'Depreciation', description: 'Vehicle fleet depreciation', amount: 18500, status: 'pending', taxYear: 2025, documentation: true },
  { id: '6', category: 'Professional Services', description: 'Legal and accounting fees', amount: 24000, status: 'approved', taxYear: 2025, documentation: true },
  { id: '7', category: 'Training', description: 'Employee training and certification costs', amount: 15800, status: 'approved', taxYear: 2025, documentation: true },
  { id: '8', category: 'Insurance', description: 'Business liability and workers comp', amount: 35200, status: 'approved', taxYear: 2025, documentation: true },
];

const mockOptimizations: TaxOptimization[] = [
  {
    id: '1',
    title: 'Section 179 Vehicle Deduction',
    description: 'Immediate expensing for qualifying vehicles used 100% for business. Consider timing new vehicle purchases before year-end.',
    potentialSavings: 15000,
    difficulty: 'easy',
    category: 'Depreciation',
    implemented: false,
  },
  {
    id: '2',
    title: 'Retirement Plan Contribution Maximization',
    description: 'Increase employer 401(k) matching to reduce taxable income while improving employee retention.',
    potentialSavings: 12000,
    difficulty: 'medium',
    category: 'Retirement',
    implemented: true,
  },
  {
    id: '3',
    title: 'Ohio Job Creation Tax Credit',
    description: 'Apply for Ohio\'s job creation tax credit for new full-time positions created in Ohio.',
    potentialSavings: 8500,
    difficulty: 'complex',
    category: 'State Credits',
    implemented: false,
  },
  {
    id: '4',
    title: 'Work Opportunity Tax Credit (WOTC)',
    description: 'Claim federal tax credit for hiring individuals from targeted groups (veterans, long-term unemployed, etc.).',
    potentialSavings: 9600,
    difficulty: 'medium',
    category: 'Employment Credits',
    implemented: false,
  },
  {
    id: '5',
    title: 'Home Health Care Services Exemption',
    description: 'Review Ohio sales tax exemption for qualifying home health care services.',
    potentialSavings: 5200,
    difficulty: 'easy',
    category: 'Sales Tax',
    implemented: true,
  },
  {
    id: '6',
    title: 'Qualified Business Income (QBI) Deduction',
    description: 'Ensure proper entity structure to maximize pass-through deduction under Section 199A.',
    potentialSavings: 22000,
    difficulty: 'complex',
    category: 'Business Structure',
    implemented: false,
  },
];

// Tax Calendar data
const taxCalendar2026 = [
  { date: '2026-01-15', event: 'Q4 2025 Estimated Tax Due', forms: ['Form 1040-ES', 'IT-1040ES'], type: 'payment' },
  { date: '2026-01-31', event: 'W-2 and 1099 Distribution Deadline', forms: ['Form W-2', 'Form 1099-NEC'], type: 'filing' },
  { date: '2026-01-31', event: 'Q4 2025 Federal Tax Return', forms: ['Form 941', 'Form 940'], type: 'filing' },
  { date: '2026-02-28', event: 'Form 1096 (1099 Summary) Due', forms: ['Form 1096'], type: 'filing' },
  { date: '2026-03-15', event: 'S-Corp/Partnership Tax Return', forms: ['Form 1120-S', 'Form 1065'], type: 'filing' },
  { date: '2026-04-15', event: 'Q1 2026 Estimated Tax Due', forms: ['Form 1040-ES'], type: 'payment' },
  { date: '2026-04-15', event: 'Corporate Tax Return Due', forms: ['Form 1120'], type: 'filing' },
  { date: '2026-04-30', event: 'Q1 2026 Federal Tax Return', forms: ['Form 941'], type: 'filing' },
  { date: '2026-06-15', event: 'Q2 2026 Estimated Tax Due', forms: ['Form 1040-ES'], type: 'payment' },
  { date: '2026-07-31', event: 'Q2 2026 Federal Tax Return', forms: ['Form 941'], type: 'filing' },
  { date: '2026-09-15', event: 'Q3 2026 Estimated Tax Due', forms: ['Form 1040-ES'], type: 'payment' },
  { date: '2026-10-31', event: 'Q3 2026 Federal Tax Return', forms: ['Form 941'], type: 'filing' },
];

export function WorkingTaxDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<TaxMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [filings, setFilings] = useState<TaxFiling[]>(mockFilings);
  const [deductions, setDeductions] = useState<TaxDeduction[]>(mockDeductions);
  const [optimizations, setOptimizations] = useState<TaxOptimization[]>(mockOptimizations);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/tax/metrics`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('serenity_access_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMetrics({
            q1Revenue: data.q1Revenue || 0,
            q2Revenue: data.q2Revenue || 0,
            q3Revenue: data.q3Revenue || 0,
            q4Revenue: data.q4Revenue || 0,
            annualRevenue: data.annualRevenue || 0,
            taxLiability: data.taxLiability || 0,
            payrollTaxes: data.payrollTaxes || 0,
            salesTax: data.salesTax || 0,
            nextFilingDate: data.nextFilingDate || '',
            pendingDeductions: data.pendingDeductions || 0
          });
        } else {
          // Use default metrics for demo
          setMetrics({
            q1Revenue: 0,
            q2Revenue: 0,
            q3Revenue: 0,
            q4Revenue: 0,
            annualRevenue: 0,
            taxLiability: 77735.75,
            payrollTaxes: 145000,
            salesTax: 12000,
            nextFilingDate: '2026-01-15',
            pendingDeductions: 267904.10
          });
        }
      } catch (error) {
        console.error('Failed to load tax metrics:', error);
        // Use default metrics for demo
        setMetrics({
          q1Revenue: 0,
          q2Revenue: 0,
          q3Revenue: 0,
          q4Revenue: 0,
          annualRevenue: 0,
          taxLiability: 77735.75,
          payrollTaxes: 145000,
          salesTax: 12000,
          nextFilingDate: '2026-01-15',
          pendingDeductions: 267904.10
        });
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    const dueDate = new Date(dateStr);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      filed: 'success',
      pending: 'warning',
      overdue: 'danger',
      upcoming: 'info',
      approved: 'success',
      rejected: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  // Calculate summary stats
  const pendingFilingsCount = filings.filter(f => f.status === 'pending' || f.status === 'overdue').length;
  const overdueFilingsCount = filings.filter(f => f.status === 'overdue').length;
  const totalPendingAmount = filings.filter(f => f.status === 'pending' || f.status === 'overdue').reduce((sum, f) => sum + f.amount, 0);
  const totalDeductions = deductions.filter(d => d.status === 'approved').reduce((sum, d) => sum + d.amount, 0);
  const potentialSavings = optimizations.filter(o => !o.implemented).reduce((sum, o) => sum + o.potentialSavings, 0);
  const implementedSavings = optimizations.filter(o => o.implemented).reduce((sum, o) => sum + o.potentialSavings, 0);

  if (loading) {
    return (
      <div className="bg-gray-50 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-96 mb-3" />
            <Skeleton className="h-6 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-10 w-24" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: ChartBarIcon },
    { id: 'calendar' as TabType, label: 'Tax Calendar', icon: CalendarIcon },
    { id: 'filings' as TabType, label: 'Filings', icon: DocumentTextIcon, badge: overdueFilingsCount > 0 ? overdueFilingsCount : undefined },
    { id: 'deductions' as TabType, label: 'Deductions', icon: CalculatorIcon },
    { id: 'optimization' as TabType, label: 'Tax Optimization', icon: LightBulbIcon },
    { id: 'compliance' as TabType, label: 'Compliance', icon: ShieldCheckIcon },
    { id: 'reports' as TabType, label: 'Reports', icon: FolderIcon },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Tax Management Center
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstName}. Comprehensive tax compliance, planning, and optimization.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.print()}>
              <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>

        {/* Critical Alerts */}
        {overdueFilingsCount > 0 && (
          <Alert variant="danger" title="Overdue Tax Filings" className="mb-6 animate-fade-in">
            <p className="mb-3">
              You have {overdueFilingsCount} overdue filing(s) requiring immediate attention.
              Failure to file may result in penalties and interest.
            </p>
            <Button variant="primary" size="sm" onClick={() => setActiveTab('filings')}>
              Review Overdue Filings
            </Button>
          </Alert>
        )}

        {pendingFilingsCount > 0 && overdueFilingsCount === 0 && (
          <Alert variant="warning" title="Upcoming Tax Deadlines" className="mb-6 animate-fade-in">
            <p className="mb-3">
              You have {pendingFilingsCount} filing(s) due soon totaling {formatCurrency(totalPendingAmount)}.
              Next deadline: {formatDate(metrics.nextFilingDate)} ({getDaysUntil(metrics.nextFilingDate)} days)
            </p>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('calendar')}>
              View Tax Calendar
            </Button>
          </Alert>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-4 overflow-x-auto pb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
                {tab.badge && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-danger-100 text-danger-700 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Key Metrics - Clickable */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card
                hoverable
                clickable
                onClick={() => setActiveTab('filings')}
                className="cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Pending Filings</h3>
                  <div className="p-2 bg-warning-100 rounded-lg">
                    <DocumentTextIcon className="h-5 w-5 text-warning-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-warning-600">{pendingFilingsCount}</p>
                <p className="text-sm text-gray-500 mt-1">{formatCurrency(totalPendingAmount)} due</p>
                <p className="text-xs text-warning-600 mt-2">Click to view →</p>
              </Card>

              <Card
                hoverable
                clickable
                onClick={() => setActiveTab('deductions')}
                className="cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">YTD Deductions</h3>
                  <div className="p-2 bg-success-100 rounded-lg">
                    <CalculatorIcon className="h-5 w-5 text-success-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-success-600">{formatCurrency(totalDeductions)}</p>
                <p className="text-sm text-gray-500 mt-1">{deductions.length} categories</p>
                <p className="text-xs text-success-600 mt-2">Click to manage →</p>
              </Card>

              <Card
                hoverable
                clickable
                onClick={() => setActiveTab('optimization')}
                className="cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Potential Savings</h3>
                  <div className="p-2 bg-info-100 rounded-lg">
                    <LightBulbIcon className="h-5 w-5 text-info-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-info-600">{formatCurrency(potentialSavings)}</p>
                <p className="text-sm text-gray-500 mt-1">{optimizations.filter(o => !o.implemented).length} opportunities</p>
                <p className="text-xs text-info-600 mt-2">Click to explore →</p>
              </Card>

              <Card
                hoverable
                clickable
                onClick={() => setActiveTab('compliance')}
                className="cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Compliance Score</h3>
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-primary-600">{overdueFilingsCount === 0 ? '98%' : '72%'}</p>
                <p className="text-sm text-gray-500 mt-1">{overdueFilingsCount === 0 ? 'Excellent' : 'Needs attention'}</p>
                <p className="text-xs text-primary-600 mt-2">Click to view details →</p>
              </Card>
            </div>

            {/* Quick Actions & Upcoming Deadlines */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveTab('filings')}
                    className="p-4 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors text-left"
                  >
                    <DocumentTextIcon className="h-6 w-6 text-primary-600 mb-2" />
                    <p className="font-medium text-gray-900">File Tax Return</p>
                    <p className="text-sm text-gray-600">Submit pending filings</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('deductions')}
                    className="p-4 bg-success-50 border border-success-200 rounded-lg hover:bg-success-100 transition-colors text-left"
                  >
                    <PlusIcon className="h-6 w-6 text-success-600 mb-2" />
                    <p className="font-medium text-gray-900">Add Deduction</p>
                    <p className="text-sm text-gray-600">Track business expenses</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className="p-4 bg-info-50 border border-info-200 rounded-lg hover:bg-info-100 transition-colors text-left"
                  >
                    <CalendarIcon className="h-6 w-6 text-info-600 mb-2" />
                    <p className="font-medium text-gray-900">View Calendar</p>
                    <p className="text-sm text-gray-600">All 2026 deadlines</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <FolderIcon className="h-6 w-6 text-gray-600 mb-2" />
                    <p className="font-medium text-gray-900">Generate Report</p>
                    <p className="text-sm text-gray-600">Tax summaries & analytics</p>
                  </button>
                </div>
              </Card>

              {/* Upcoming Deadlines */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Next 30 Days</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('calendar')}>
                    View All
                  </Button>
                </div>
                <div className="space-y-3">
                  {filings
                    .filter(f => f.status !== 'filed' && getDaysUntil(f.dueDate) <= 30)
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .slice(0, 4)
                    .map((filing) => {
                      const daysUntil = getDaysUntil(filing.dueDate);
                      return (
                        <div
                          key={filing.id}
                          className={`p-3 rounded-lg border ${
                            daysUntil < 0 ? 'bg-danger-50 border-danger-200' :
                            daysUntil <= 7 ? 'bg-warning-50 border-warning-200' :
                            'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{filing.formType}</p>
                              <p className="text-sm text-gray-600">{filing.formName}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${
                                daysUntil < 0 ? 'text-danger-600' :
                                daysUntil <= 7 ? 'text-warning-600' :
                                'text-gray-600'
                              }`}>
                                {daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` :
                                 daysUntil === 0 ? 'Due today' :
                                 `${daysUntil} days left`}
                              </p>
                              <p className="text-xs text-gray-500">{formatDate(filing.dueDate)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            </div>

            {/* Tax Optimization Summary */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tax Optimization Opportunities</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('optimization')}>
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-success-50 rounded-lg">
                  <p className="text-sm text-success-700 font-medium">Already Implemented</p>
                  <p className="text-2xl font-bold text-success-600">{formatCurrency(implementedSavings)}</p>
                  <p className="text-sm text-gray-600">{optimizations.filter(o => o.implemented).length} strategies</p>
                </div>
                <div className="p-4 bg-info-50 rounded-lg">
                  <p className="text-sm text-info-700 font-medium">Available Savings</p>
                  <p className="text-2xl font-bold text-info-600">{formatCurrency(potentialSavings)}</p>
                  <p className="text-sm text-gray-600">{optimizations.filter(o => !o.implemented).length} opportunities</p>
                </div>
                <div className="p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-700 font-medium">Effective Tax Rate</p>
                  <p className="text-2xl font-bold text-primary-600">17.2%</p>
                  <p className="text-sm text-gray-600">vs 21% statutory</p>
                </div>
              </div>
              <div className="flex gap-2">
                {optimizations.filter(o => !o.implemented).slice(0, 2).map((opt) => (
                  <div key={opt.id} className="flex-1 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <LightBulbIcon className="h-5 w-5 text-info-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{opt.title}</p>
                        <p className="text-xs text-gray-600 line-clamp-2">{opt.description}</p>
                        <p className="text-sm font-medium text-success-600 mt-1">Save {formatCurrency(opt.potentialSavings)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Tax Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">2026 Tax Calendar</h3>
              <div className="space-y-3">
                {taxCalendar2026.map((event, idx) => {
                  const daysUntil = getDaysUntil(event.date);
                  const isPast = daysUntil < 0;
                  const isUrgent = daysUntil >= 0 && daysUntil <= 14;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        isPast ? 'bg-gray-50 border-gray-200 opacity-60' :
                        isUrgent ? 'bg-warning-50 border-warning-300' :
                        'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <div className={`p-3 rounded-lg ${
                            event.type === 'payment' ? 'bg-danger-100' : 'bg-primary-100'
                          }`}>
                            {event.type === 'payment' ? (
                              <BanknotesIcon className={`h-6 w-6 ${isPast ? 'text-gray-400' : 'text-danger-600'}`} />
                            ) : (
                              <DocumentTextIcon className={`h-6 w-6 ${isPast ? 'text-gray-400' : 'text-primary-600'}`} />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{event.event}</p>
                            <p className="text-sm text-gray-600">Forms: {event.forms.join(', ')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${
                            isPast ? 'text-gray-400' :
                            isUrgent ? 'text-warning-600' :
                            'text-gray-900'
                          }`}>
                            {formatDate(event.date)}
                          </p>
                          {!isPast && (
                            <p className={`text-sm ${isUrgent ? 'text-warning-600 font-medium' : 'text-gray-500'}`}>
                              {daysUntil === 0 ? 'Today!' : `${daysUntil} days`}
                            </p>
                          )}
                          {isPast && <p className="text-sm text-gray-400">Completed</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Filings Tab */}
        {activeTab === 'filings' && (
          <div className="space-y-6 animate-fade-in">
            {/* Status Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-danger-50 border-danger-200">
                <p className="text-sm text-danger-700 font-medium">Overdue</p>
                <p className="text-3xl font-bold text-danger-600">{filings.filter(f => f.status === 'overdue').length}</p>
              </Card>
              <Card className="p-4 bg-warning-50 border-warning-200">
                <p className="text-sm text-warning-700 font-medium">Pending</p>
                <p className="text-3xl font-bold text-warning-600">{filings.filter(f => f.status === 'pending').length}</p>
              </Card>
              <Card className="p-4 bg-info-50 border-info-200">
                <p className="text-sm text-info-700 font-medium">Upcoming</p>
                <p className="text-3xl font-bold text-info-600">{filings.filter(f => f.status === 'upcoming').length}</p>
              </Card>
              <Card className="p-4 bg-success-50 border-success-200">
                <p className="text-sm text-success-700 font-medium">Filed</p>
                <p className="text-3xl font-bold text-success-600">{filings.filter(f => f.status === 'filed').length}</p>
              </Card>
            </div>

            {/* Filings List */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tax Filings</h3>
                <Button variant="primary" size="sm">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Filing
                </Button>
              </div>
              <div className="space-y-3">
                {filings.map((filing) => (
                  <div
                    key={filing.id}
                    className={`p-4 rounded-lg border-2 ${
                      filing.status === 'overdue' ? 'border-danger-300 bg-danger-50' :
                      filing.status === 'pending' ? 'border-warning-300 bg-warning-50' :
                      filing.status === 'filed' ? 'border-success-200 bg-success-50' :
                      'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className={`p-3 rounded-lg ${
                          filing.category === 'federal' ? 'bg-primary-100' :
                          filing.category === 'state' ? 'bg-info-100' :
                          filing.category === 'payroll' ? 'bg-success-100' :
                          'bg-gray-100'
                        }`}>
                          {filing.category === 'federal' ? (
                            <BuildingOffice2Icon className="h-6 w-6 text-primary-600" />
                          ) : filing.category === 'state' ? (
                            <DocumentCheckIcon className="h-6 w-6 text-info-600" />
                          ) : (
                            <BanknotesIcon className="h-6 w-6 text-success-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{filing.formType}</p>
                            {getStatusBadge(filing.status)}
                            <Badge variant="outline" className="text-xs">{filing.category}</Badge>
                          </div>
                          <p className="text-sm text-gray-700">{filing.formName}</p>
                          <p className="text-sm text-gray-500">{filing.description}</p>
                          {filing.confirmationNumber && (
                            <p className="text-xs text-success-600 mt-1">
                              Confirmation: {filing.confirmationNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {filing.amount > 0 && (
                          <p className="text-xl font-bold text-gray-900">{formatCurrency(filing.amount)}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {filing.status === 'filed' ? `Filed ${formatDate(filing.filedDate!)}` : `Due ${formatDate(filing.dueDate)}`}
                        </p>
                        {filing.status !== 'filed' && (
                          <Button variant="primary" size="sm" className="mt-2">
                            {filing.status === 'overdue' ? 'File Now' : 'Prepare Filing'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Deductions Tab */}
        {activeTab === 'deductions' && (
          <div className="space-y-6 animate-fade-in">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-sm text-gray-600 font-medium">Total Deductions (2025)</p>
                <p className="text-3xl font-bold text-success-600">{formatCurrency(totalDeductions)}</p>
                <p className="text-sm text-gray-500">{deductions.filter(d => d.status === 'approved').length} approved items</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-600 font-medium">Pending Review</p>
                <p className="text-3xl font-bold text-warning-600">
                  {formatCurrency(deductions.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0))}
                </p>
                <p className="text-sm text-gray-500">{deductions.filter(d => d.status === 'pending').length} items</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-600 font-medium">Estimated Tax Savings</p>
                <p className="text-3xl font-bold text-primary-600">{formatCurrency(totalDeductions * 0.21)}</p>
                <p className="text-sm text-gray-500">At 21% tax rate</p>
              </Card>
            </div>

            {/* Deductions by Category */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Deductions by Category</h3>
                <Button variant="primary" size="sm">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Deduction
                </Button>
              </div>
              <div className="space-y-3">
                {deductions.map((deduction) => (
                  <div key={deduction.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{deduction.category}</p>
                          {getStatusBadge(deduction.status)}
                          {deduction.documentation && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Documented
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{deduction.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(deduction.amount)}</p>
                        <p className="text-sm text-gray-500">Tax Year {deduction.taxYear}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Tax Optimization Tab */}
        {activeTab === 'optimization' && (
          <div className="space-y-6 animate-fade-in">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-success-50 border-success-200">
                <p className="text-sm text-success-700 font-medium">Implemented Savings</p>
                <p className="text-3xl font-bold text-success-600">{formatCurrency(implementedSavings)}</p>
                <p className="text-sm text-gray-600">{optimizations.filter(o => o.implemented).length} strategies active</p>
              </Card>
              <Card className="p-4 bg-info-50 border-info-200">
                <p className="text-sm text-info-700 font-medium">Potential Additional Savings</p>
                <p className="text-3xl font-bold text-info-600">{formatCurrency(potentialSavings)}</p>
                <p className="text-sm text-gray-600">{optimizations.filter(o => !o.implemented).length} opportunities</p>
              </Card>
              <Card className="p-4 bg-primary-50 border-primary-200">
                <p className="text-sm text-primary-700 font-medium">Total Annual Savings</p>
                <p className="text-3xl font-bold text-primary-600">{formatCurrency(implementedSavings + potentialSavings)}</p>
                <p className="text-sm text-gray-600">If fully optimized</p>
              </Card>
            </div>

            {/* Optimization Opportunities */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Optimization Strategies</h3>
              <div className="space-y-4">
                {optimizations.map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-4 rounded-lg border-2 ${
                      opt.implemented ? 'border-success-200 bg-success-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4 flex-1">
                        <div className={`p-3 rounded-lg flex-shrink-0 ${
                          opt.implemented ? 'bg-success-100' : 'bg-info-100'
                        }`}>
                          {opt.implemented ? (
                            <CheckCircleIcon className="h-6 w-6 text-success-600" />
                          ) : (
                            <LightBulbIcon className="h-6 w-6 text-info-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900">{opt.title}</p>
                            <Badge variant={opt.implemented ? 'success' : 'info'}>
                              {opt.implemented ? 'Implemented' : 'Available'}
                            </Badge>
                            <Badge variant="outline">{opt.category}</Badge>
                            <Badge
                              variant={opt.difficulty === 'easy' ? 'success' : opt.difficulty === 'medium' ? 'warning' : 'info'}
                            >
                              {opt.difficulty.charAt(0).toUpperCase() + opt.difficulty.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{opt.description}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xl font-bold text-success-600">{formatCurrency(opt.potentialSavings)}</p>
                        <p className="text-sm text-gray-500">potential savings</p>
                        {!opt.implemented && (
                          <Button variant="primary" size="sm" className="mt-2">
                            Implement
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tax Planning Tips */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <InformationCircleIcon className="h-5 w-5 text-info-500" />
                Tax Planning Tips for Home Healthcare Agencies
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Year-End Planning</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Review deferred compensation plans</li>
                    <li>• Accelerate equipment purchases for Section 179</li>
                    <li>• Maximize retirement plan contributions</li>
                    <li>• Review and write off bad debts</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Industry-Specific Credits</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Work Opportunity Tax Credit (WOTC)</li>
                    <li>• Employee Retention Credits</li>
                    <li>• Disabled Access Credit</li>
                    <li>• Small Employer Health Insurance Credit</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-6 animate-fade-in">
            {/* Compliance Score */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Tax Compliance Score</h3>
                <div className={`text-3xl font-bold ${overdueFilingsCount === 0 ? 'text-success-600' : 'text-warning-600'}`}>
                  {overdueFilingsCount === 0 ? '98%' : '72%'}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {overdueFilingsCount === 0 ? (
                      <CheckCircleIcon className="h-6 w-6 text-success-600" />
                    ) : (
                      <ExclamationTriangleIcon className="h-6 w-6 text-danger-600" />
                    )}
                    <span className="font-medium">Filing Status</span>
                  </div>
                  <span className={overdueFilingsCount === 0 ? 'text-success-600' : 'text-danger-600'}>
                    {overdueFilingsCount === 0 ? 'All current' : `${overdueFilingsCount} overdue`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="h-6 w-6 text-success-600" />
                    <span className="font-medium">Payroll Tax Deposits</span>
                  </div>
                  <span className="text-success-600">On Schedule</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="h-6 w-6 text-success-600" />
                    <span className="font-medium">W-2/1099 Preparation</span>
                  </div>
                  <span className="text-success-600">In Progress</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="h-6 w-6 text-success-600" />
                    <span className="font-medium">Documentation</span>
                  </div>
                  <span className="text-success-600">100% Documented</span>
                </div>
              </div>
            </Card>

            {/* Compliance Checklist */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">2025 Year-End Compliance Checklist</h3>
              <div className="space-y-3">
                {[
                  { task: 'Review employee W-4 forms for accuracy', completed: true },
                  { task: 'Verify 1099 contractor information', completed: true },
                  { task: 'Reconcile payroll tax deposits', completed: true },
                  { task: 'Review healthcare coverage compliance (ACA)', completed: true },
                  { task: 'Verify state unemployment tax rates', completed: false },
                  { task: 'Document all deductions with receipts', completed: true },
                  { task: 'Review retirement plan contribution limits', completed: false },
                  { task: 'Prepare year-end bonus calculations', completed: false },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {item.completed ? (
                      <CheckCircleIcon className="h-5 w-5 text-success-600 flex-shrink-0" />
                    ) : (
                      <div className="h-5 w-5 border-2 border-gray-300 rounded flex-shrink-0" />
                    )}
                    <span className={item.completed ? 'text-gray-600' : 'font-medium text-gray-900'}>
                      {item.task}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Tax Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Annual Tax Summary', description: 'Complete overview of tax obligations and payments', icon: DocumentTextIcon },
                  { name: 'Quarterly Tax Report', description: 'Breakdown of quarterly estimated taxes', icon: ChartBarIcon },
                  { name: 'Payroll Tax Report', description: 'FICA, FUTA, and state unemployment taxes', icon: BanknotesIcon },
                  { name: 'Deduction Summary', description: 'All deductions categorized by type', icon: CalculatorIcon },
                  { name: 'Tax Calendar Export', description: 'Export all deadlines to calendar app', icon: CalendarIcon },
                  { name: 'Compliance Report', description: 'Filing status and compliance checklist', icon: ShieldCheckIcon },
                ].map((report, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <report.icon className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{report.name}</p>
                        <p className="text-sm text-gray-600">{report.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm">
                        <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm">
                        <ChartBarIcon className="h-4 w-4 mr-1" />
                        Excel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
