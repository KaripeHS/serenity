import { useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ESignature, SignatureDisplay, SignatureData } from './ESignature';
import { cn } from '@/lib/utils';
import {
  BanknotesIcon,
  BuildingLibraryIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DocumentArrowUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export interface DirectDepositFormData {
  // Bank Information
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  confirmAccountNumber: string;
  accountType: 'checking' | 'savings' | '';

  // Deposit Amount
  depositType: 'full' | 'fixed' | 'percentage' | '';
  depositAmount: number | null;
  depositPercentage: number | null;

  // Verification Document
  verificationDocument?: {
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize: number;
  };

  // Signature
  signature?: SignatureData;
}

interface DirectDepositFormProps {
  /** Initial form data (for editing) */
  initialData?: Partial<DirectDepositFormData>;
  /** Callback when form is submitted */
  onSubmit: (data: DirectDepositFormData) => void;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Employee name for signature display */
  employeeName?: string;
  /** Callback for file upload */
  onFileUpload?: (file: File) => Promise<{ fileName: string; fileUrl: string; fileType: string; fileSize: number }>;
  /** Whether the form is in loading state */
  loading?: boolean;
  /** Whether the form is read-only */
  readOnly?: boolean;
}

const DIRECT_DEPOSIT_ATTESTATION = 'I authorize my employer to deposit my pay into the account specified above. I understand that this authorization will remain in effect until I provide written notice to cancel or change it. I also acknowledge that if incorrect account information is provided, it may result in delayed or failed payments.';

/**
 * Validates a US bank routing number using the ABA checksum algorithm
 */
function isValidRoutingNumber(routing: string): boolean {
  if (!/^\d{9}$/.test(routing)) return false;

  const digits = routing.split('').map(Number);
  const checksum =
    3 * (digits[0] + digits[3] + digits[6]) +
    7 * (digits[1] + digits[4] + digits[7]) +
    1 * (digits[2] + digits[5] + digits[8]);

  return checksum % 10 === 0;
}

/**
 * Direct Deposit Authorization Form
 *
 * A digital form for collecting bank account information with:
 * - Routing number validation (ABA checksum)
 * - Account number confirmation
 * - Void check upload option
 * - E-signature integration
 */
export function DirectDepositForm({
  initialData,
  onSubmit,
  onCancel,
  employeeName,
  onFileUpload,
  loading = false,
  readOnly = false,
}: DirectDepositFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<DirectDepositFormData>({
    bankName: initialData?.bankName || '',
    routingNumber: initialData?.routingNumber || '',
    accountNumber: initialData?.accountNumber || '',
    confirmAccountNumber: initialData?.confirmAccountNumber || '',
    accountType: initialData?.accountType || '',
    depositType: initialData?.depositType || '',
    depositAmount: initialData?.depositAmount || null,
    depositPercentage: initialData?.depositPercentage || null,
    verificationDocument: initialData?.verificationDocument,
    signature: initialData?.signature,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const updateField = useCallback(<K extends keyof DirectDepositFormData>(field: K, value: DirectDepositFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Bank Information
    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    if (!formData.routingNumber.trim()) {
      newErrors.routingNumber = 'Routing number is required';
    } else if (!/^\d{9}$/.test(formData.routingNumber)) {
      newErrors.routingNumber = 'Routing number must be 9 digits';
    } else if (!isValidRoutingNumber(formData.routingNumber)) {
      newErrors.routingNumber = 'Invalid routing number (checksum failed)';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (formData.accountNumber.length < 4 || formData.accountNumber.length > 17) {
      newErrors.accountNumber = 'Account number must be 4-17 digits';
    }

    if (formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }

    if (!formData.accountType) {
      newErrors.accountType = 'Account type is required';
    }

    // Deposit Type
    if (!formData.depositType) {
      newErrors.depositType = 'Deposit type is required';
    } else if (formData.depositType === 'fixed' && (!formData.depositAmount || formData.depositAmount <= 0)) {
      newErrors.depositAmount = 'Please enter a valid deposit amount';
    } else if (formData.depositType === 'percentage' && (!formData.depositPercentage || formData.depositPercentage <= 0 || formData.depositPercentage > 100)) {
      newErrors.depositPercentage = 'Please enter a valid percentage (1-100)';
    }

    // Signature
    if (!formData.signature) {
      newErrors.signature = 'Signature is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, verificationDocument: 'File size must be less than 10MB' }));
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, verificationDocument: 'Only images and PDFs are allowed' }));
      return;
    }

    if (onFileUpload) {
      setUploading(true);
      try {
        const result = await onFileUpload(file);
        updateField('verificationDocument', result);
      } catch (err: any) {
        setErrors(prev => ({ ...prev, verificationDocument: err.message || 'Upload failed' }));
      } finally {
        setUploading(false);
      }
    } else {
      // If no upload handler, store file info locally
      updateField('verificationDocument', {
        fileName: file.name,
        fileType: file.type,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
      });
    }
  }, [onFileUpload, updateField]);

  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      onSubmit(formData);
    }
  }, [validateForm, formData, onSubmit]);

  const formatRoutingNumber = (value: string): string => {
    return value.replace(/\D/g, '').slice(0, 9);
  };

  const formatAccountNumber = (value: string): string => {
    return value.replace(/\D/g, '').slice(0, 17);
  };

  const maskAccountNumber = (accountNumber: string): string => {
    if (accountNumber.length <= 4) return accountNumber;
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-100 rounded-lg">
            <BanknotesIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Direct Deposit Authorization</h2>
            <p className="text-sm text-gray-500">Set up automatic paycheck deposits</p>
          </div>
        </div>
        <Badge variant="success">Secure</Badge>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">Your information is secure</p>
            <p className="text-xs text-blue-700 mt-1">
              Account numbers are encrypted and securely stored. Only authorized payroll staff can access this information.
            </p>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        {/* Step 1: Bank Information */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BuildingLibraryIcon className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Bank Account Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => updateField('bankName', e.target.value)}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  errors.bankName ? 'border-danger-500' : 'border-gray-300'
                )}
                placeholder="e.g., Chase, Bank of America, Wells Fargo"
                disabled={readOnly}
              />
              {errors.bankName && <p className="text-sm text-danger-500 mt-1">{errors.bankName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Routing Number <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.routingNumber}
                onChange={(e) => updateField('routingNumber', formatRoutingNumber(e.target.value))}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono',
                  errors.routingNumber ? 'border-danger-500' : 'border-gray-300'
                )}
                placeholder="9 digits"
                maxLength={9}
                disabled={readOnly}
              />
              {errors.routingNumber && <p className="text-sm text-danger-500 mt-1">{errors.routingNumber}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Found at the bottom left of your check
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type <span className="text-danger-500">*</span>
              </label>
              <div className="flex gap-4">
                {[
                  { value: 'checking', label: 'Checking' },
                  { value: 'savings', label: 'Savings' },
                ].map(option => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors',
                      formData.accountType === option.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value={option.value}
                      checked={formData.accountType === option.value}
                      onChange={(e) => updateField('accountType', e.target.value as DirectDepositFormData['accountType'])}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      disabled={readOnly}
                    />
                    <span className="font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.accountType && <p className="text-sm text-danger-500 mt-1">{errors.accountType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => updateField('accountNumber', formatAccountNumber(e.target.value))}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono',
                  errors.accountNumber ? 'border-danger-500' : 'border-gray-300'
                )}
                placeholder="4-17 digits"
                maxLength={17}
                disabled={readOnly}
              />
              {errors.accountNumber && <p className="text-sm text-danger-500 mt-1">{errors.accountNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Account Number <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.confirmAccountNumber}
                onChange={(e) => updateField('confirmAccountNumber', formatAccountNumber(e.target.value))}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono',
                  errors.confirmAccountNumber ? 'border-danger-500' : 'border-gray-300'
                )}
                placeholder="Re-enter account number"
                maxLength={17}
                disabled={readOnly}
              />
              {errors.confirmAccountNumber && <p className="text-sm text-danger-500 mt-1">{errors.confirmAccountNumber}</p>}
            </div>
          </div>
        </div>

        {/* Step 2: Deposit Amount */}
        <div className="space-y-6 mb-8 pt-6 border-t">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BanknotesIcon className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Deposit Amount</h3>
          </div>

          <div className="space-y-4">
            {[
              { value: 'full', label: 'Deposit entire net pay', description: 'Your full paycheck will be deposited' },
              { value: 'fixed', label: 'Deposit a fixed amount', description: 'A specific dollar amount each pay period' },
              { value: 'percentage', label: 'Deposit a percentage', description: 'A percentage of your net pay' },
            ].map(option => (
              <label
                key={option.value}
                className={cn(
                  'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
                  formData.depositType === option.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                <input
                  type="radio"
                  name="depositType"
                  value={option.value}
                  checked={formData.depositType === option.value}
                  onChange={(e) => updateField('depositType', e.target.value as DirectDepositFormData['depositType'])}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                  disabled={readOnly}
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{option.label}</span>
                  <p className="text-sm text-gray-500">{option.description}</p>

                  {/* Conditional input for fixed amount */}
                  {option.value === 'fixed' && formData.depositType === 'fixed' && (
                    <div className="mt-3">
                      <div className="relative max-w-xs">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={formData.depositAmount || ''}
                          onChange={(e) => updateField('depositAmount', Number(e.target.value) || null)}
                          className={cn(
                            'w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                            errors.depositAmount ? 'border-danger-500' : 'border-gray-300'
                          )}
                          placeholder="Amount per paycheck"
                          min={1}
                          disabled={readOnly}
                        />
                      </div>
                      {errors.depositAmount && <p className="text-sm text-danger-500 mt-1">{errors.depositAmount}</p>}
                    </div>
                  )}

                  {/* Conditional input for percentage */}
                  {option.value === 'percentage' && formData.depositType === 'percentage' && (
                    <div className="mt-3">
                      <div className="relative max-w-xs">
                        <input
                          type="number"
                          value={formData.depositPercentage || ''}
                          onChange={(e) => updateField('depositPercentage', Number(e.target.value) || null)}
                          className={cn(
                            'w-full px-3 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                            errors.depositPercentage ? 'border-danger-500' : 'border-gray-300'
                          )}
                          placeholder="Percentage"
                          min={1}
                          max={100}
                          disabled={readOnly}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                      {errors.depositPercentage && <p className="text-sm text-danger-500 mt-1">{errors.depositPercentage}</p>}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
          {errors.depositType && <p className="text-sm text-danger-500">{errors.depositType}</p>}
        </div>

        {/* Step 3: Verification Document (Optional) */}
        <div className="space-y-6 mb-8 pt-6 border-t">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <DocumentArrowUpIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Verification (Recommended)</h3>
              <p className="text-sm text-gray-500">Upload a voided check or bank letter to verify your account</p>
            </div>
          </div>

          {formData.verificationDocument ? (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded border">
                  <DocumentArrowUpIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{formData.verificationDocument.fileName}</p>
                  <p className="text-xs text-gray-500">
                    {(formData.verificationDocument.fileSize / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateField('verificationDocument', undefined)}
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Upload a voided check or bank statement</p>
              <p className="text-xs text-gray-500 mb-4">PNG, JPG, or PDF up to 10MB</p>
              <input
                type="file"
                id="verification-upload"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={readOnly || uploading}
              />
              <label htmlFor="verification-upload">
                <Button
                  variant="outline"
                  disabled={readOnly || uploading}
                  className="cursor-pointer"
                  onClick={() => document.getElementById('verification-upload')?.click()}
                >
                  {uploading ? 'Uploading...' : 'Choose File'}
                </Button>
              </label>
              {errors.verificationDocument && (
                <p className="text-sm text-danger-500 mt-2">{errors.verificationDocument}</p>
              )}
            </div>
          )}
        </div>

        {/* Step 4: Signature */}
        <div className="space-y-6 pt-6 border-t">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Authorization & Signature</h3>
          </div>

          {/* Summary */}
          {formData.bankName && formData.accountNumber && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3">Account Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bank:</span>
                  <span className="font-medium">{formData.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Type:</span>
                  <span className="font-medium capitalize">{formData.accountType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account:</span>
                  <span className="font-medium font-mono">{maskAccountNumber(formData.accountNumber)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Deposit:</span>
                  <span className="font-medium">
                    {formData.depositType === 'full' && 'Entire net pay'}
                    {formData.depositType === 'fixed' && `$${formData.depositAmount?.toFixed(2)} per paycheck`}
                    {formData.depositType === 'percentage' && `${formData.depositPercentage}% of net pay`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {formData.signature ? (
            <SignatureDisplay
              signatureData={formData.signature}
              signerName={employeeName}
              onClear={readOnly ? undefined : () => updateField('signature', undefined)}
            />
          ) : (
            <ESignature
              onSign={(sig) => updateField('signature', sig)}
              attestationText={DIRECT_DEPOSIT_ATTESTATION}
              signerName={employeeName}
              required
              disabled={readOnly}
            />
          )}
          {errors.signature && <p className="text-sm text-danger-500">{errors.signature}</p>}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={loading || !formData.signature}>
          {loading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Submitting...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Submit Direct Deposit
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default DirectDepositForm;
