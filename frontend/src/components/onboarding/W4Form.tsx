import { useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ESignature, SignatureDisplay, SignatureData } from './ESignature';
import { cn } from '@/lib/utils';
import {
  DocumentTextIcon,
  UserIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CalculatorIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// US States for select dropdown
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

export interface W4FormData {
  // Step 1: Personal Information
  firstName: string;
  lastName: string;
  ssn: string;
  address: string;
  city: string;
  state: string;
  zip: string;

  // Step 1c: Filing Status
  filingStatus: 'single' | 'married' | 'head_of_household' | '';

  // Step 2: Multiple Jobs
  multipleJobs: boolean;
  multipleJobsWorksheet: number | null;

  // Step 3: Dependents
  qualifyingChildren: number;
  otherDependents: number;

  // Step 4: Other Adjustments
  otherIncome: number;
  deductions: number;
  extraWithholding: number;

  // Signature
  signature?: SignatureData;
}

interface W4FormProps {
  /** Initial form data (for editing) */
  initialData?: Partial<W4FormData>;
  /** Callback when form is submitted */
  onSubmit: (data: W4FormData) => void;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Employee name for signature display */
  employeeName?: string;
  /** Whether the form is in loading state */
  loading?: boolean;
  /** Whether the form is read-only */
  readOnly?: boolean;
}

const STEPS = [
  { step: 1, name: 'Personal Info', icon: UserIcon },
  { step: 2, name: 'Filing Status', icon: DocumentTextIcon },
  { step: 3, name: 'Multiple Jobs', icon: CurrencyDollarIcon },
  { step: 4, name: 'Dependents', icon: UsersIcon },
  { step: 5, name: 'Adjustments', icon: CalculatorIcon },
  { step: 6, name: 'Review & Sign', icon: CheckCircleIcon },
];

const W4_ATTESTATION = 'Under penalties of perjury, I declare that this certificate, to the best of my knowledge and belief, is true, correct, and complete.';

/**
 * W-4 Employee's Withholding Certificate Form
 *
 * A complete digital implementation of IRS Form W-4 with:
 * - Step-by-step wizard interface
 * - IRS-compliant field validation
 * - Dependent tax credit calculations
 * - E-signature integration
 */
export function W4Form({
  initialData,
  onSubmit,
  onCancel,
  employeeName,
  loading = false,
  readOnly = false,
}: W4FormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<W4FormData>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    ssn: initialData?.ssn || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip: initialData?.zip || '',
    filingStatus: initialData?.filingStatus || '',
    multipleJobs: initialData?.multipleJobs || false,
    multipleJobsWorksheet: initialData?.multipleJobsWorksheet || null,
    qualifyingChildren: initialData?.qualifyingChildren || 0,
    otherDependents: initialData?.otherDependents || 0,
    otherIncome: initialData?.otherIncome || 0,
    deductions: initialData?.deductions || 0,
    extraWithholding: initialData?.extraWithholding || 0,
    signature: initialData?.signature,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(<K extends keyof W4FormData>(field: K, value: W4FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.ssn.trim()) {
          newErrors.ssn = 'SSN is required';
        } else if (!/^\d{3}-?\d{2}-?\d{4}$/.test(formData.ssn.replace(/\D/g, '').length === 9 ? formData.ssn : '')) {
          if (formData.ssn.replace(/\D/g, '').length !== 9) {
            newErrors.ssn = 'SSN must be 9 digits';
          }
        }
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state) newErrors.state = 'State is required';
        if (!formData.zip.trim()) {
          newErrors.zip = 'ZIP code is required';
        } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip)) {
          newErrors.zip = 'Invalid ZIP code format';
        }
        break;
      case 2:
        if (!formData.filingStatus) newErrors.filingStatus = 'Filing status is required';
        break;
      case 6:
        if (!formData.signature) newErrors.signature = 'Signature is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const goToNextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  }, [currentStep, validateStep]);

  const goToPrevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(() => {
    if (validateStep(currentStep)) {
      onSubmit(formData);
    }
  }, [currentStep, validateStep, formData, onSubmit]);

  const formatSSN = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate dependent credits
  const qualifyingChildrenCredit = formData.qualifyingChildren * 2000;
  const otherDependentsCredit = formData.otherDependents * 500;
  const totalDependentsCredit = qualifyingChildrenCredit + otherDependentsCredit;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Step 1: Personal Information</h3>
                <p className="text-sm text-gray-500">Enter your name, address, and Social Security number</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    errors.firstName ? 'border-danger-500' : 'border-gray-300'
                  )}
                  placeholder="Enter first name"
                  disabled={readOnly}
                />
                {errors.firstName && <p className="text-sm text-danger-500 mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    errors.lastName ? 'border-danger-500' : 'border-gray-300'
                  )}
                  placeholder="Enter last name"
                  disabled={readOnly}
                />
                {errors.lastName && <p className="text-sm text-danger-500 mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Social Security Number <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ssn}
                  onChange={(e) => updateField('ssn', formatSSN(e.target.value))}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    errors.ssn ? 'border-danger-500' : 'border-gray-300'
                  )}
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                  disabled={readOnly}
                />
                {errors.ssn && <p className="text-sm text-danger-500 mt-1">{errors.ssn}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    errors.address ? 'border-danger-500' : 'border-gray-300'
                  )}
                  placeholder="Street address"
                  disabled={readOnly}
                />
                {errors.address && <p className="text-sm text-danger-500 mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    errors.city ? 'border-danger-500' : 'border-gray-300'
                  )}
                  placeholder="City"
                  disabled={readOnly}
                />
                {errors.city && <p className="text-sm text-danger-500 mt-1">{errors.city}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State <span className="text-danger-500">*</span>
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                      errors.state ? 'border-danger-500' : 'border-gray-300'
                    )}
                    disabled={readOnly}
                  >
                    <option value="">Select state</option>
                    {US_STATES.map(state => (
                      <option key={state.value} value={state.value}>{state.label}</option>
                    ))}
                  </select>
                  {errors.state && <p className="text-sm text-danger-500 mt-1">{errors.state}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => updateField('zip', e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                      errors.zip ? 'border-danger-500' : 'border-gray-300'
                    )}
                    placeholder="12345"
                    maxLength={10}
                    disabled={readOnly}
                  />
                  {errors.zip && <p className="text-sm text-danger-500 mt-1">{errors.zip}</p>}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Step 1(c): Filing Status</h3>
                <p className="text-sm text-gray-500">Check only one box</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { value: 'single', label: 'Single or Married filing separately' },
                { value: 'married', label: 'Married filing jointly (or Qualifying surviving spouse)' },
                { value: 'head_of_household', label: 'Head of household (Check only if you\'re unmarried and pay more than half the costs of keeping up a home for yourself and a qualifying individual)' },
              ].map(option => (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
                    formData.filingStatus === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <input
                    type="radio"
                    name="filingStatus"
                    value={option.value}
                    checked={formData.filingStatus === option.value}
                    onChange={(e) => updateField('filingStatus', e.target.value as W4FormData['filingStatus'])}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                    disabled={readOnly}
                  />
                  <span className="text-gray-900">{option.label}</span>
                </label>
              ))}
            </div>
            {errors.filingStatus && <p className="text-sm text-danger-500 mt-2">{errors.filingStatus}</p>}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Step 2: Multiple Jobs or Spouse Works</h3>
                <p className="text-sm text-gray-500">Complete this step if you (1) hold more than one job at a time, or (2) are married filing jointly and your spouse also works</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <InformationCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  If you (and your spouse) have a total of only two jobs, you may check the box below. The standard deduction and tax brackets will be split equally between the two jobs.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.multipleJobs}
                onChange={(e) => updateField('multipleJobs', e.target.checked)}
                className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
                disabled={readOnly}
              />
              <span className="text-gray-900">
                Check here if there are only two jobs total. This option is accurate for jobs with similar pay.
              </span>
            </label>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Step 2(b): Multiple Jobs Worksheet Result (optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                If you have more than two jobs or the pay is different, use the Multiple Jobs Worksheet on page 3 of the IRS W-4 form and enter the result here.
              </p>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.multipleJobsWorksheet || ''}
                  onChange={(e) => updateField('multipleJobsWorksheet', e.target.value ? Number(e.target.value) : null)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                  min={0}
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary-100 rounded-lg">
                <UsersIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Step 3: Claim Dependents</h3>
                <p className="text-sm text-gray-500">If your total income will be $200,000 or less ($400,000 if married filing jointly)</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of qualifying children under age 17
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Multiply by $2,000 = {formatCurrency(qualifyingChildrenCredit)}
                </p>
                <input
                  type="number"
                  value={formData.qualifyingChildren}
                  onChange={(e) => updateField('qualifyingChildren', Math.max(0, Number(e.target.value)))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min={0}
                  disabled={readOnly}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of other dependents
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Multiply by $500 = {formatCurrency(otherDependentsCredit)}
                </p>
                <input
                  type="number"
                  value={formData.otherDependents}
                  onChange={(e) => updateField('otherDependents', Math.max(0, Number(e.target.value)))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min={0}
                  disabled={readOnly}
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Total dependent tax credits:</span>
                  <span className="text-xl font-bold text-primary-600">{formatCurrency(totalDependentsCredit)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This amount will reduce your tax withholding
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary-100 rounded-lg">
                <CalculatorIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Step 4: Other Adjustments (Optional)</h3>
                <p className="text-sm text-gray-500">Complete for other income, deductions, or extra withholding</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  4(a) Other income (not from jobs)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Include interest, dividends, and retirement income (yearly estimate)
                </p>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.otherIncome || ''}
                    onChange={(e) => updateField('otherIncome', Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                    min={0}
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  4(b) Deductions
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  If you expect to claim deductions other than the standard deduction, use the Deductions Worksheet on page 3 of the IRS W-4 form
                </p>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.deductions || ''}
                    onChange={(e) => updateField('deductions', Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                    min={0}
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  4(c) Extra withholding
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Extra tax you want withheld each pay period
                </p>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.extraWithholding || ''}
                    onChange={(e) => updateField('extraWithholding', Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                    min={0}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-success-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Step 5: Review & Sign</h3>
                <p className="text-sm text-gray-500">Review your information and sign to complete</p>
              </div>
            </div>

            {/* Summary */}
            <Card className="bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-4">Form Summary</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">SSN:</span>
                  <span className="font-medium">XXX-XX-{formData.ssn.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Filing Status:</span>
                  <span className="font-medium capitalize">{formData.filingStatus?.replace('_', ' ') || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dependent Credits:</span>
                  <span className="font-medium">{formatCurrency(totalDependentsCredit)}</span>
                </div>
                {formData.extraWithholding > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Extra Withholding:</span>
                    <span className="font-medium">{formatCurrency(formData.extraWithholding)}/paycheck</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Signature */}
            {formData.signature ? (
              <SignatureDisplay
                signatureData={formData.signature}
                signerName={employeeName || `${formData.firstName} ${formData.lastName}`}
                onClear={readOnly ? undefined : () => updateField('signature', undefined)}
              />
            ) : (
              <ESignature
                onSign={(sig) => updateField('signature', sig)}
                attestationText={W4_ATTESTATION}
                signerName={employeeName || `${formData.firstName} ${formData.lastName}`}
                required
                disabled={readOnly}
              />
            )}
            {errors.signature && <p className="text-sm text-danger-500">{errors.signature}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">W-4 Employee's Withholding Certificate</h2>
          <p className="text-sm text-gray-500">IRS Form W-4 (Rev. December 2020)</p>
        </div>
        <Badge variant="info">Tax Year 2024</Badge>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
        {STEPS.map((step, index) => (
          <div key={step.step} className="flex items-center">
            <button
              onClick={() => step.step < currentStep && setCurrentStep(step.step)}
              disabled={step.step > currentStep}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                currentStep === step.step
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : step.step < currentStep
                    ? 'bg-success-100 border-success-500 text-success-700 cursor-pointer hover:bg-success-200'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
              )}
            >
              {step.step < currentStep ? (
                <CheckCircleIcon className="h-6 w-6" />
              ) : (
                <span className="font-semibold">{step.step}</span>
              )}
            </button>
            {index < STEPS.length - 1 && (
              <div className={cn(
                'hidden sm:block w-8 lg:w-12 h-1 mx-1 rounded',
                step.step < currentStep ? 'bg-success-500' : 'bg-gray-200'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        {renderStepContent()}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={goToPrevStep}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {currentStep < STEPS.length ? (
            <Button onClick={goToNextStep}>
              Next
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || !formData.signature}>
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Submit W-4
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default W4Form;
