import { useState } from 'react';

interface InsuranceFormProps {
  data: any;
  onSave: (data: any, completedFields: string[]) => void;
  onClose: () => void;
}

export function InsuranceForm({ data, onSave, onClose }: InsuranceFormProps) {
  const [formData, setFormData] = useState({
    insuranceType: data?.insuranceType || '',
    medicaidNumber: data?.medicaidNumber || '',
    medicareNumber: data?.medicareNumber || '',
    primaryInsurance: data?.primaryInsurance || '',
    policyNumber: data?.policyNumber || '',
    groupNumber: data?.groupNumber || '',
    policyHolderName: data?.policyHolderName || '',
    policyHolderDOB: data?.policyHolderDOB || '',
    policyHolderRelation: data?.policyHolderRelation || 'self',
    eligibilityStatus: data?.eligibilityStatus || '',
    eligibilityVerifiedDate: data?.eligibilityVerifiedDate || '',
    eligibilityRejectionReason: data?.eligibilityRejectionReason || '',
    eligibilityNotes: data?.eligibilityNotes || '',
    priorAuthRequired: data?.priorAuthRequired || '',
    priorAuthNumber: data?.priorAuthNumber || '',
    priorAuthStartDate: data?.priorAuthStartDate || '',
    priorAuthEndDate: data?.priorAuthEndDate || '',
    secondaryInsurance: data?.secondaryInsurance || '',
    secondaryPolicyNumber: data?.secondaryPolicyNumber || '',
    // Private Pay fields
    privatePayRate: data?.privatePayRate || '',
    privatePayRateType: data?.privatePayRateType || 'hourly',
    privatePayBillingContact: data?.privatePayBillingContact || '',
    privatePayBillingPhone: data?.privatePayBillingPhone || '',
    privatePayBillingEmail: data?.privatePayBillingEmail || '',
    privatePayNotes: data?.privatePayNotes || '',
  });

  // Check if Private Pay is selected
  const isPrivatePay = formData.insuranceType === 'Private Pay';

  // Dynamic required fields based on insurance type
  const getRequiredFieldMapping = () => {
    if (isPrivatePay) {
      return {
        'Insurance Type': ['insuranceType'],
        'Pay Rate': ['privatePayRate'],
        'Billing Contact': ['privatePayBillingContact'],
      };
    }
    return {
      'Insurance Type': ['insuranceType'],
      'Policy Number': ['policyNumber'],
      'Group Number': ['groupNumber'],
      'Eligibility Status': ['eligibilityStatus'],
      'Prior Auth': ['priorAuthRequired'],
    };
  };

  const requiredFieldMapping = getRequiredFieldMapping();

  const getCompletedFields = () => {
    const completed: string[] = [];
    for (const [fieldName, keys] of Object.entries(requiredFieldMapping)) {
      if (fieldName === 'Eligibility Status') {
        // Status is complete if a status is selected (verified also needs date, rejected needs reason)
        if (formData.eligibilityStatus === 'verified' && formData.eligibilityVerifiedDate) {
          completed.push(fieldName);
        } else if (formData.eligibilityStatus === 'rejected' && formData.eligibilityRejectionReason) {
          completed.push(fieldName);
        } else if (['not_started', 'in_process', 'pending_review'].includes(formData.eligibilityStatus)) {
          completed.push(fieldName);
        }
      } else if (fieldName === 'Prior Auth') {
        if (formData.priorAuthRequired === 'no' ||
            (formData.priorAuthRequired === 'yes' && formData.priorAuthNumber)) {
          completed.push(fieldName);
        }
      } else {
        const allFilled = keys.every((key: string) => formData[key as keyof typeof formData]?.toString().trim());
        if (allFilled) {
          completed.push(fieldName);
        }
      }
    }
    return completed;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSave = () => {
    const completedFields = getCompletedFields();
    onSave(formData, completedFields);
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Insurance Type Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Insurance Type <span className="text-danger-500">*</span></h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['Medicaid', 'Medicare', 'Dual (Medicaid/Medicare)', 'Private Insurance', 'Private Pay'].map((type) => (
            <label
              key={type}
              className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                formData.insuranceType === type
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-primary-200'
              }`}
            >
              <input
                type="radio"
                name="insuranceType"
                value={type}
                checked={formData.insuranceType === type}
                onChange={handleChange}
                className="sr-only"
              />
              <span className="text-sm font-medium text-center">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Medicaid/Medicare Numbers */}
      {(formData.insuranceType === 'Medicaid' || formData.insuranceType === 'Dual (Medicaid/Medicare)') && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Medicaid Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicaid Number
              </label>
              <input
                type="text"
                name="medicaidNumber"
                value={formData.medicaidNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter Medicaid number"
              />
            </div>
          </div>
        </div>
      )}

      {(formData.insuranceType === 'Medicare' || formData.insuranceType === 'Dual (Medicaid/Medicare)') && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Medicare Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicare Beneficiary Identifier (MBI)
              </label>
              <input
                type="text"
                name="medicareNumber"
                value={formData.medicareNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter Medicare number"
              />
            </div>
          </div>
        </div>
      )}

      {/* Private Pay Section */}
      {isPrivatePay && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Private Pay Information</h3>
          <p className="text-sm text-amber-700 mb-4">
            This patient will pay out-of-pocket for services. Please enter the agreed-upon rate and billing contact information.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pay Rate <span className="text-danger-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="privatePayRate"
                    value={formData.privatePayRate}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                </div>
                <select
                  name="privatePayRateType"
                  value={formData.privatePayRateType}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="hourly">Per Hour</option>
                  <option value="daily">Per Day</option>
                  <option value="weekly">Per Week</option>
                  <option value="monthly">Per Month</option>
                  <option value="visit">Per Visit</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Contact Name <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                name="privatePayBillingContact"
                value={formData.privatePayBillingContact}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Person responsible for payment"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Phone
              </label>
              <input
                type="tel"
                name="privatePayBillingPhone"
                value={formData.privatePayBillingPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Email
              </label>
              <input
                type="email"
                name="privatePayBillingEmail"
                value={formData.privatePayBillingEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="billing@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Notes
              </label>
              <input
                type="text"
                name="privatePayNotes"
                value={formData.privatePayNotes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Invoice monthly, due net 30"
              />
            </div>
          </div>
        </div>
      )}

      {/* Primary Insurance Details - Hidden for Private Pay */}
      {!isPrivatePay && <>
        <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Insurance Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Insurance Company
            </label>
            <input
              type="text"
              name="primaryInsurance"
              value={formData.primaryInsurance}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., CareSource, Molina, UnitedHealthcare"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Policy Number <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              name="policyNumber"
              value={formData.policyNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter policy number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Number <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              name="groupNumber"
              value={formData.groupNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter group number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Policy Holder Relationship
            </label>
            <select
              name="policyHolderRelation"
              value={formData.policyHolderRelation}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="self">Self</option>
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {formData.policyHolderRelation !== 'self' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Policy Holder Name
              </label>
              <input
                type="text"
                name="policyHolderName"
                value={formData.policyHolderName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Full name of policy holder"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Policy Holder DOB
              </label>
              <input
                type="date"
                name="policyHolderDOB"
                value={formData.policyHolderDOB}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Eligibility Verification */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Eligibility Verification <span className="text-danger-500">*</span></h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Status
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { value: 'not_started', label: 'Not Started', color: 'gray' },
                { value: 'in_process', label: 'In Process', color: 'primary' },
                { value: 'pending_review', label: 'Pending Review', color: 'warning' },
                { value: 'verified', label: 'Verified', color: 'success' },
                { value: 'rejected', label: 'Rejected', color: 'danger' },
              ].map((status) => (
                <label
                  key={status.value}
                  className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                    formData.eligibilityStatus === status.value
                      ? status.color === 'success'
                        ? 'border-success-500 bg-success-50 text-success-700'
                        : status.color === 'danger'
                        ? 'border-danger-500 bg-danger-50 text-danger-700'
                        : status.color === 'warning'
                        ? 'border-warning-500 bg-warning-50 text-warning-700'
                        : status.color === 'primary'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-500 bg-gray-50 text-gray-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="eligibilityStatus"
                    value={status.value}
                    checked={formData.eligibilityStatus === status.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Verification Date - shown for Verified status */}
          {formData.eligibilityStatus === 'verified' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-success-50 rounded-lg border border-success-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Date <span className="text-danger-500">*</span>
                </label>
                <input
                  type="date"
                  name="eligibilityVerifiedDate"
                  value={formData.eligibilityVerifiedDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="eligibilityNotes"
                  value={formData.eligibilityNotes}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Reference number, contact person, etc."
                />
              </div>
            </div>
          )}

          {/* Rejection Reason - shown for Rejected status */}
          {formData.eligibilityStatus === 'rejected' && (
            <div className="p-4 bg-danger-50 rounded-lg border border-danger-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason <span className="text-danger-500">*</span>
                  </label>
                  <select
                    name="eligibilityRejectionReason"
                    value={formData.eligibilityRejectionReason}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select reason...</option>
                    <option value="coverage_terminated">Coverage Terminated</option>
                    <option value="not_enrolled">Not Enrolled in Plan</option>
                    <option value="service_not_covered">Service Not Covered</option>
                    <option value="out_of_network">Out of Network</option>
                    <option value="missing_info">Missing Information</option>
                    <option value="invalid_member_id">Invalid Member ID</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Details
                  </label>
                  <textarea
                    name="eligibilityNotes"
                    value={formData.eligibilityNotes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Explain the rejection and next steps..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes - shown for In Process or Pending Review */}
          {['in_process', 'pending_review'].includes(formData.eligibilityStatus) && (
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Notes
                </label>
                <textarea
                  name="eligibilityNotes"
                  value={formData.eligibilityNotes}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={formData.eligibilityStatus === 'in_process'
                    ? "Date submitted, expected response time, contact info..."
                    : "What additional documentation is needed..."}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prior Authorization */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Prior Authorization <span className="text-danger-500">*</span></h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Is prior authorization required?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="priorAuthRequired"
                  value="yes"
                  checked={formData.priorAuthRequired === 'yes'}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="priorAuthRequired"
                  value="no"
                  checked={formData.priorAuthRequired === 'no'}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">No</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="priorAuthRequired"
                  value="pending"
                  checked={formData.priorAuthRequired === 'pending'}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Pending Review</span>
              </label>
            </div>
          </div>

          {formData.priorAuthRequired === 'yes' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authorization Number
                </label>
                <input
                  type="text"
                  name="priorAuthNumber"
                  value={formData.priorAuthNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Auth number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="priorAuthStartDate"
                  value={formData.priorAuthStartDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="priorAuthEndDate"
                  value={formData.priorAuthEndDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Insurance */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Secondary Insurance (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secondary Insurance Company
            </label>
            <input
              type="text"
              name="secondaryInsurance"
              value={formData.secondaryInsurance}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Insurance company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Policy Number
            </label>
            <input
              type="text"
              name="secondaryPolicyNumber"
              value={formData.secondaryPolicyNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Secondary policy number"
            />
          </div>
        </div>
      </div>
      </>}

      {/* Progress Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Completion Progress</span>
          <span className="text-sm text-gray-600">
            {getCompletedFields().length} of {Object.keys(requiredFieldMapping).length} required sections
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${(getCompletedFields().length / Object.keys(requiredFieldMapping).length) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.keys(requiredFieldMapping).map((field) => (
            <span
              key={field}
              className={`text-xs px-2 py-1 rounded-full ${
                getCompletedFields().includes(field)
                  ? 'bg-success-100 text-success-700'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {field}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Save Progress
        </button>
      </div>
    </div>
  );
}
