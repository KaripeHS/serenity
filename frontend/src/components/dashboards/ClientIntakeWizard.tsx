import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserIcon,
  HomeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
  DocumentCheckIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import { clientIntakeService, ClientIntakeData, IntakeSummary } from '../../services/clientIntake.service';

// Step indicator component
function StepIndicator({ steps, currentStep, onStepClick }: {
  steps: { step: number; name: string; complete: boolean }[];
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((s, index) => (
        <div key={s.step} className="flex items-center">
          <button
            onClick={() => onStepClick(s.step)}
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
              ${currentStep === s.step
                ? 'bg-primary-600 border-primary-600 text-white'
                : s.complete
                  ? 'bg-success-100 border-success-500 text-success-700 cursor-pointer hover:bg-success-200'
                  : 'bg-gray-100 border-gray-300 text-gray-500 cursor-pointer hover:bg-gray-200'
              }`}
          >
            {s.complete ? (
              <CheckCircleIcon className="h-6 w-6" />
            ) : (
              <span className="font-semibold">{s.step}</span>
            )}
          </button>
          {index < steps.length - 1 && (
            <div className={`hidden sm:block w-16 lg:w-24 h-1 mx-2 rounded ${s.complete ? 'bg-success-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Step 1: Basic Information
function BasicInfoStep({ data, onChange }: { data: Partial<ClientIntakeData['basicInfo']>; onChange: (data: Partial<ClientIntakeData['basicInfo']>) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary-100 rounded-lg">
          <UserIcon className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          <p className="text-sm text-gray-500">Client demographic and identification details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={data?.firstName || ''}
            onChange={(e) => onChange({ ...data, firstName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter first name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={data?.lastName || ''}
            onChange={(e) => onChange({ ...data, lastName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter last name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth <span className="text-danger-500">*</span>
          </label>
          <input
            type="date"
            value={data?.dateOfBirth || ''}
            onChange={(e) => onChange({ ...data, dateOfBirth: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender <span className="text-danger-500">*</span>
          </label>
          <select
            value={data?.gender || ''}
            onChange={(e) => onChange({ ...data, gender: e.target.value as ClientIntakeData['basicInfo']['gender'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select gender</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SSN (Last 4 digits)
          </label>
          <input
            type="text"
            value={data?.ssn || ''}
            onChange={(e) => onChange({ ...data, ssn: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="XXX-XX-____"
            maxLength={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Language
          </label>
          <select
            value={data?.preferredLanguage || 'English'}
            onChange={(e) => onChange({ ...data, preferredLanguage: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="Somali">Somali</option>
            <option value="Arabic">Arabic</option>
            <option value="Chinese">Chinese</option>
            <option value="Vietnamese">Vietnamese</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marital Status
          </label>
          <select
            value={data?.maritalStatus || ''}
            onChange={(e) => onChange({ ...data, maritalStatus: e.target.value as ClientIntakeData['basicInfo']['maritalStatus'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select status</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
            <option value="separated">Separated</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Step 2: Contact Information
function ContactInfoStep({ data, onChange, counties }: {
  data: Partial<ClientIntakeData['contact']>;
  onChange: (data: Partial<ClientIntakeData['contact']>) => void;
  counties: string[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary-100 rounded-lg">
          <HomeIcon className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
          <p className="text-sm text-gray-500">Address and contact preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Street Address <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={data?.address?.street1 || ''}
            onChange={(e) => onChange({ ...data, address: { ...data?.address, street1: e.target.value } as ClientIntakeData['contact']['address'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="123 Main Street"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apartment/Unit
          </label>
          <input
            type="text"
            value={data?.address?.street2 || ''}
            onChange={(e) => onChange({ ...data, address: { ...data?.address, street2: e.target.value } as ClientIntakeData['contact']['address'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Apt 4B"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={data?.address?.city || ''}
              onChange={(e) => onChange({ ...data, address: { ...data?.address, city: e.target.value } as ClientIntakeData['contact']['address'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Columbus"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value="Ohio"
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={data?.address?.zipCode || ''}
              onChange={(e) => onChange({ ...data, address: { ...data?.address, zipCode: e.target.value } as ClientIntakeData['contact']['address'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="43215"
              maxLength={5}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            County <span className="text-danger-500">*</span>
          </label>
          <select
            value={data?.address?.county || ''}
            onChange={(e) => onChange({ ...data, address: { ...data?.address, county: e.target.value } as ClientIntakeData['contact']['address'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select county</option>
            {counties.map(county => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Phone <span className="text-danger-500">*</span>
            </label>
            <input
              type="tel"
              value={data?.phone || ''}
              onChange={(e) => onChange({ ...data, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="(614) 555-1234"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alternate Phone
            </label>
            <input
              type="tel"
              value={data?.altPhone || ''}
              onChange={(e) => onChange({ ...data, altPhone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="(614) 555-5678"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={data?.email || ''}
              onChange={(e) => onChange({ ...data, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="client@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Contact Method
            </label>
            <select
              value={data?.preferredContactMethod || 'phone'}
              onChange={(e) => onChange({ ...data, preferredContactMethod: e.target.value as ClientIntakeData['contact']['preferredContactMethod'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="phone">Phone Call</option>
              <option value="text">Text Message</option>
              <option value="email">Email</option>
              <option value="mail">Mail</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Emergency Contact
function EmergencyContactStep({ data, onChange }: { data: Partial<ClientIntakeData['emergencyContact']>; onChange: (data: Partial<ClientIntakeData['emergencyContact']>) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-danger-100 rounded-lg">
          <PhoneIcon className="h-6 w-6 text-danger-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Emergency Contact & Responsible Party</h3>
          <p className="text-sm text-gray-500">Primary contact for emergencies and care decisions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Name <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={data?.name || ''}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relationship <span className="text-danger-500">*</span>
          </label>
          <select
            value={data?.relationship || ''}
            onChange={(e) => onChange({ ...data, relationship: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select relationship</option>
            <option value="Spouse">Spouse</option>
            <option value="Son">Son</option>
            <option value="Daughter">Daughter</option>
            <option value="Parent">Parent</option>
            <option value="Sibling">Sibling</option>
            <option value="Grandchild">Grandchild</option>
            <option value="Friend">Friend</option>
            <option value="Neighbor">Neighbor</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-danger-500">*</span>
          </label>
          <input
            type="tel"
            value={data?.phone || ''}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="(614) 555-1234"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={data?.email || ''}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="contact@email.com"
          />
        </div>
      </div>

      <div className="space-y-4 mt-6">
        <h4 className="text-sm font-medium text-gray-700">Legal Authority</h4>

        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={data?.isPowerOfAttorney || false}
            onChange={(e) => onChange({ ...data, isPowerOfAttorney: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <p className="font-medium text-gray-900">Power of Attorney</p>
            <p className="text-sm text-gray-500">This person has legal POA for healthcare decisions</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={data?.isResponsibleParty || false}
            onChange={(e) => onChange({ ...data, isResponsibleParty: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <p className="font-medium text-gray-900">Responsible Party</p>
            <p className="text-sm text-gray-500">Primary contact for billing and service coordination</p>
          </div>
        </label>
      </div>
    </div>
  );
}

// Step 4: Insurance & Payer
function InsuranceStep({ data, onChange, waiverPrograms }: {
  data: Partial<ClientIntakeData['insurance']>;
  onChange: (data: Partial<ClientIntakeData['insurance']>) => void;
  waiverPrograms: { code: string; name: string; description: string; administeredBy: string }[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-success-100 rounded-lg">
          <ShieldCheckIcon className="h-6 w-6 text-success-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Insurance & Payer Information</h3>
          <p className="text-sm text-gray-500">Primary insurance and waiver program details</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primary Payer Type <span className="text-danger-500">*</span>
          </label>
          <select
            value={data?.primaryPayer?.type || ''}
            onChange={(e) => onChange({
              ...data,
              primaryPayer: { ...data?.primaryPayer, type: e.target.value as ClientIntakeData['insurance']['primaryPayer']['type'] } as ClientIntakeData['insurance']['primaryPayer']
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select payer type</option>
            <option value="medicaid">Medicaid</option>
            <option value="medicare">Medicare</option>
            <option value="private_insurance">Private Insurance</option>
            <option value="private_pay">Private Pay</option>
            <option value="va">Veterans Administration (VA)</option>
            <option value="other">Other</option>
          </select>
        </div>

        {data?.primaryPayer?.type === 'medicaid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicaid ID <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={data?.primaryPayer?.medicaidId || ''}
                onChange={(e) => onChange({
                  ...data,
                  primaryPayer: { ...data?.primaryPayer, medicaidId: e.target.value } as ClientIntakeData['insurance']['primaryPayer']
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="OH123456789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Waiver Program
              </label>
              <select
                value={data?.waiverProgram || ''}
                onChange={(e) => onChange({ ...data, waiverProgram: e.target.value as ClientIntakeData['insurance']['waiverProgram'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select waiver program</option>
                {waiverPrograms.map(wp => (
                  <option key={wp.code} value={wp.code}>{wp.name} ({wp.administeredBy})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {data?.primaryPayer?.type === 'medicare' && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicare ID
              </label>
              <input
                type="text"
                value={data?.primaryPayer?.medicareId || ''}
                onChange={(e) => onChange({
                  ...data,
                  primaryPayer: { ...data?.primaryPayer, medicareId: e.target.value } as ClientIntakeData['insurance']['primaryPayer']
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="1EG4-TE5-MK72"
              />
            </div>
          </div>
        )}

        {data?.primaryPayer?.type === 'private_insurance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Carrier
              </label>
              <input
                type="text"
                value={data?.primaryPayer?.insuranceCarrier || ''}
                onChange={(e) => onChange({
                  ...data,
                  primaryPayer: { ...data?.primaryPayer, insuranceCarrier: e.target.value } as ClientIntakeData['insurance']['primaryPayer']
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Anthem Blue Cross"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Policy Number
              </label>
              <input
                type="text"
                value={data?.primaryPayer?.policyNumber || ''}
                onChange={(e) => onChange({
                  ...data,
                  primaryPayer: { ...data?.primaryPayer, policyNumber: e.target.value } as ClientIntakeData['insurance']['primaryPayer']
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Number
              </label>
              <input
                type="text"
                value={data?.primaryPayer?.groupNumber || ''}
                onChange={(e) => onChange({
                  ...data,
                  primaryPayer: { ...data?.primaryPayer, groupNumber: e.target.value } as ClientIntakeData['insurance']['primaryPayer']
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        )}

        {/* Case Manager Info */}
        {(data?.waiverProgram && data.waiverProgram !== 'none') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Case Manager Name
              </label>
              <input
                type="text"
                value={data?.caseManagerName || ''}
                onChange={(e) => onChange({ ...data, caseManagerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Case manager name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Case Manager Phone
              </label>
              <input
                type="tel"
                value={data?.caseManagerPhone || ''}
                onChange={(e) => onChange({ ...data, caseManagerPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="(614) 555-1234"
              />
            </div>
          </div>
        )}

        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={data?.primaryPayer?.authorizationRequired || false}
            onChange={(e) => onChange({
              ...data,
              primaryPayer: { ...data?.primaryPayer, authorizationRequired: e.target.checked } as ClientIntakeData['insurance']['primaryPayer']
            })}
            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <p className="font-medium text-gray-900">Authorization Required</p>
            <p className="text-sm text-gray-500">Services require prior authorization from payer</p>
          </div>
        </label>
      </div>
    </div>
  );
}

// Step 5: Service Needs
function ServiceNeedsStep({ data, onChange, serviceTypes }: {
  data: Partial<ClientIntakeData['serviceNeeds']>;
  onChange: (data: Partial<ClientIntakeData['serviceNeeds']>) => void;
  serviceTypes: { code: string; name: string; description: string }[];
}) {
  const toggleService = (code: string) => {
    const current = data?.requestedServices || [];
    const updated = current.includes(code as typeof current[number])
      ? current.filter(s => s !== code)
      : [...current, code as typeof current[number]];
    onChange({ ...data, requestedServices: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-warning-100 rounded-lg">
          <ClipboardDocumentListIcon className="h-6 w-6 text-warning-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Service Needs Assessment</h3>
          <p className="text-sm text-gray-500">Select services and scheduling preferences</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Requested Services <span className="text-danger-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {serviceTypes.map(service => (
            <label
              key={service.code}
              className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all
                ${data?.requestedServices?.includes(service.code as typeof data.requestedServices[number])
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <input
                type="checkbox"
                checked={data?.requestedServices?.includes(service.code as typeof data.requestedServices[number]) || false}
                onChange={() => toggleService(service.code)}
                className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <p className="font-medium text-gray-900">{service.name}</p>
                <p className="text-sm text-gray-500">{service.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service Frequency
          </label>
          <select
            value={data?.preferredSchedule?.frequency || ''}
            onChange={(e) => onChange({
              ...data,
              preferredSchedule: { ...data?.preferredSchedule, frequency: e.target.value as ClientIntakeData['serviceNeeds']['preferredSchedule']['frequency'] } as ClientIntakeData['serviceNeeds']['preferredSchedule']
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select frequency</option>
            <option value="daily">Daily</option>
            <option value="multiple_per_week">Multiple times per week</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="as_needed">As Needed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Time of Day
          </label>
          <select
            value={data?.preferredSchedule?.preferredTimeOfDay || ''}
            onChange={(e) => onChange({
              ...data,
              preferredSchedule: { ...data?.preferredSchedule, preferredTimeOfDay: e.target.value as ClientIntakeData['serviceNeeds']['preferredSchedule']['preferredTimeOfDay'] } as ClientIntakeData['serviceNeeds']['preferredSchedule']
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select time preference</option>
            <option value="morning">Morning (6am - 12pm)</option>
            <option value="afternoon">Afternoon (12pm - 6pm)</option>
            <option value="evening">Evening (6pm - 10pm)</option>
            <option value="overnight">Overnight (10pm - 6am)</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Hours per Week
          </label>
          <input
            type="number"
            value={data?.preferredSchedule?.estimatedHoursPerWeek || ''}
            onChange={(e) => onChange({
              ...data,
              preferredSchedule: { ...data?.preferredSchedule, estimatedHoursPerWeek: parseInt(e.target.value) || 0 } as ClientIntakeData['serviceNeeds']['preferredSchedule']
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="20"
            min="1"
            max="168"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Caregiver Gender Preference
          </label>
          <select
            value={data?.caregiverPreferences?.genderPreference || 'no_preference'}
            onChange={(e) => onChange({
              ...data,
              caregiverPreferences: { ...data?.caregiverPreferences, genderPreference: e.target.value as 'male' | 'female' | 'no_preference' }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="no_preference">No Preference</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Special Requirements or Notes
        </label>
        <textarea
          value={data?.specialRequirements || ''}
          onChange={(e) => onChange({ ...data, specialRequirements: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows={3}
          placeholder="Any specific needs, preferences, or scheduling constraints..."
        />
      </div>
    </div>
  );
}

// Step 6: Medical Information
function MedicalInfoStep({ data, onChange }: { data: Partial<ClientIntakeData['medical']>; onChange: (data: Partial<ClientIntakeData['medical']>) => void }) {
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  const addDiagnosis = () => {
    if (newDiagnosis.trim()) {
      onChange({ ...data, diagnoses: [...(data?.diagnoses || []), newDiagnosis.trim()] });
      setNewDiagnosis('');
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      onChange({ ...data, allergies: [...(data?.allergies || []), newAllergy.trim()] });
      setNewAllergy('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-danger-100 rounded-lg">
          <HeartIcon className="h-6 w-6 text-danger-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
          <p className="text-sm text-gray-500">Health conditions and care requirements</p>
        </div>
      </div>

      {/* Primary Physician */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Primary Care Physician</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Physician Name</label>
            <input
              type="text"
              value={data?.primaryPhysician?.name || ''}
              onChange={(e) => onChange({ ...data, primaryPhysician: { ...data?.primaryPhysician, name: e.target.value } as ClientIntakeData['medical']['primaryPhysician'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Dr. John Smith"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Phone</label>
            <input
              type="tel"
              value={data?.primaryPhysician?.phone || ''}
              onChange={(e) => onChange({ ...data, primaryPhysician: { ...data?.primaryPhysician, phone: e.target.value } as ClientIntakeData['medical']['primaryPhysician'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="(614) 555-1234"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fax</label>
            <input
              type="tel"
              value={data?.primaryPhysician?.fax || ''}
              onChange={(e) => onChange({ ...data, primaryPhysician: { ...data?.primaryPhysician, fax: e.target.value } as ClientIntakeData['medical']['primaryPhysician'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="(614) 555-1235"
            />
          </div>
        </div>
      </div>

      {/* Diagnoses */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Diagnoses</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newDiagnosis}
            onChange={(e) => setNewDiagnosis(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addDiagnosis()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Type diagnosis and press Enter"
          />
          <button
            type="button"
            onClick={addDiagnosis}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data?.diagnoses?.map((d, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {d}
              <button
                type="button"
                onClick={() => onChange({ ...data, diagnoses: data.diagnoses?.filter((_, idx) => idx !== i) })}
                className="text-gray-500 hover:text-danger-600"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Type allergy and press Enter"
          />
          <button
            type="button"
            onClick={addAllergy}
            className="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data?.allergies?.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-danger-100 text-danger-700 rounded-full text-sm">
              {a}
              <button
                type="button"
                onClick={() => onChange({ ...data, allergies: data.allergies?.filter((_, idx) => idx !== i) })}
                className="text-danger-500 hover:text-danger-700"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Functional Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mobility Status <span className="text-danger-500">*</span>
          </label>
          <select
            value={data?.mobilityStatus || ''}
            onChange={(e) => onChange({ ...data, mobilityStatus: e.target.value as ClientIntakeData['medical']['mobilityStatus'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select mobility status</option>
            <option value="independent">Independent</option>
            <option value="uses_assistive_device">Uses Assistive Device (walker, cane)</option>
            <option value="wheelchair">Wheelchair User</option>
            <option value="bedbound">Bedbound</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cognitive Status <span className="text-danger-500">*</span>
          </label>
          <select
            value={data?.cognitiveStatus || ''}
            onChange={(e) => onChange({ ...data, cognitiveStatus: e.target.value as ClientIntakeData['medical']['cognitiveStatus'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select cognitive status</option>
            <option value="oriented">Fully Oriented</option>
            <option value="mild_impairment">Mild Cognitive Impairment</option>
            <option value="moderate_impairment">Moderate Impairment</option>
            <option value="severe_impairment">Severe Impairment / Dementia</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Step 7: Home Environment
function HomeEnvironmentStep({ data, onChange }: { data: Partial<ClientIntakeData['homeEnvironment']>; onChange: (data: Partial<ClientIntakeData['homeEnvironment']>) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-info-100 rounded-lg">
          <BuildingOffice2Icon className="h-6 w-6 text-info-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Home Environment</h3>
          <p className="text-sm text-gray-500">Living situation and accessibility assessment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Home Type <span className="text-danger-500">*</span>
          </label>
          <select
            value={data?.homeType || ''}
            onChange={(e) => onChange({ ...data, homeType: e.target.value as ClientIntakeData['homeEnvironment']['homeType'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select home type</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="assisted_living">Assisted Living</option>
            <option value="group_home">Group Home</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Living Situation
          </label>
          <select
            value={data?.livesAlone ? 'alone' : 'with_others'}
            onChange={(e) => onChange({ ...data, livesAlone: e.target.value === 'alone' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="alone">Lives Alone</option>
            <option value="with_others">Lives with Others</option>
          </select>
        </div>

        {!data?.livesAlone && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Other Residents
            </label>
            <input
              type="text"
              value={data?.otherResidents || ''}
              onChange={(e) => onChange({ ...data, otherResidents: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Spouse, adult children, etc."
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pets in Home
          </label>
          <input
            type="text"
            value={data?.pets || ''}
            onChange={(e) => onChange({ ...data, pets: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Dog, cat, etc."
          />
        </div>

        <div>
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer h-full">
            <input
              type="checkbox"
              checked={data?.smokingInHome || false}
              onChange={(e) => onChange({ ...data, smokingInHome: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">Smoking in Home</span>
          </label>
        </div>
      </div>

      {/* Accessibility */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Home Accessibility</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: 'hasStairs', label: 'Has Stairs' },
            { key: 'hasRamp', label: 'Has Wheelchair Ramp' },
            { key: 'hasBedOnFirstFloor', label: 'Bedroom on First Floor' },
            { key: 'hasWalkInShower', label: 'Walk-in Shower / Accessible Bath' },
            { key: 'parkingAvailable', label: 'Parking Available' }
          ].map(item => (
            <label
              key={item.key}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={(data?.accessibility as Record<string, boolean>)?.[item.key] || false}
                onChange={(e) => onChange({
                  ...data,
                  accessibility: { ...data?.accessibility, [item.key]: e.target.checked } as ClientIntakeData['homeEnvironment']['accessibility']
                })}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Safety Hazards or Concerns
        </label>
        <textarea
          value={data?.safetyHazards || ''}
          onChange={(e) => onChange({ ...data, safetyHazards: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows={2}
          placeholder="Note any safety concerns, clutter, fall risks, etc."
        />
      </div>
    </div>
  );
}

// Step 8: Consents
function ConsentsStep({ data, onChange }: { data: Partial<ClientIntakeData['consents']>; onChange: (data: Partial<ClientIntakeData['consents']>) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-success-100 rounded-lg">
          <DocumentCheckIcon className="h-6 w-6 text-success-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Consents & Agreements</h3>
          <p className="text-sm text-gray-500">Required authorizations and documentation</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 border-2 border-primary-200 bg-primary-50 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data?.hipaaConsent || false}
              onChange={(e) => onChange({ ...data, hipaaConsent: e.target.checked, hipaaSignedDate: e.target.checked ? new Date().toISOString().split('T')[0] : undefined })}
              className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <p className="font-medium text-gray-900">HIPAA Authorization <span className="text-danger-500">*</span></p>
              <p className="text-sm text-gray-600">Client authorizes use and disclosure of protected health information for treatment, payment, and healthcare operations.</p>
            </div>
          </label>
        </div>

        <div className="p-4 border-2 border-primary-200 bg-primary-50 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data?.serviceAgreement || false}
              onChange={(e) => onChange({ ...data, serviceAgreement: e.target.checked, serviceAgreementDate: e.target.checked ? new Date().toISOString().split('T')[0] : undefined })}
              className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <p className="font-medium text-gray-900">Service Agreement <span className="text-danger-500">*</span></p>
              <p className="text-sm text-gray-600">Client agrees to the terms and conditions of service, including rates, scheduling policies, and cancellation procedures.</p>
            </div>
          </label>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data?.photoRelease || false}
              onChange={(e) => onChange({ ...data, photoRelease: e.target.checked })}
              className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <p className="font-medium text-gray-900">Photo/Video Release</p>
              <p className="text-sm text-gray-500">Optional consent for photos/videos for quality assurance and training purposes.</p>
            </div>
          </label>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data?.advanceDirectivesOnFile || false}
              onChange={(e) => onChange({ ...data, advanceDirectivesOnFile: e.target.checked })}
              className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <p className="font-medium text-gray-900">Advance Directives on File</p>
              <p className="text-sm text-gray-500">Client has provided copy of living will, DNR, or healthcare power of attorney.</p>
            </div>
          </label>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data?.backgroundCheckAuthorization || false}
              onChange={(e) => onChange({ ...data, backgroundCheckAuthorization: e.target.checked })}
              className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <p className="font-medium text-gray-900">Caregiver Background Check Authorization</p>
              <p className="text-sm text-gray-500">Client acknowledges caregivers have undergone required background checks per Ohio law.</p>
            </div>
          </label>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data?.emergencyProtocol || false}
              onChange={(e) => onChange({ ...data, emergencyProtocol: e.target.checked })}
              className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <p className="font-medium text-gray-900">Emergency Protocol Acknowledgment</p>
              <p className="text-sm text-gray-500">Client understands and agrees to emergency procedures including 911 contact protocol.</p>
            </div>
          </label>
        </div>
      </div>

      {(!data?.hipaaConsent || !data?.serviceAgreement) && (
        <Alert variant="warning" title="Required Consents">
          HIPAA Authorization and Service Agreement are required to proceed with intake.
        </Alert>
      )}
    </div>
  );
}

// Main Wizard Component
export function ClientIntakeWizard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('wizard');
  const [currentStep, setCurrentStep] = useState(1);
  const [intakeData, setIntakeData] = useState<Partial<ClientIntakeData>>({});
  const [intakes, setIntakes] = useState<IntakeSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: { field: string; message: string }[]; warnings: { field: string; message: string }[] } | null>(null);

  const counties = clientIntakeService.getOhioCounties();
  const waiverPrograms = clientIntakeService.getWaiverPrograms();
  const serviceTypes = clientIntakeService.getServiceTypes();

  useEffect(() => {
    loadIntakes();
  }, []);

  const loadIntakes = async () => {
    setLoading(true);
    try {
      const data = await clientIntakeService.getIntakes();
      setIntakes(data.intakes);
    } catch (error) {
      console.error('Failed to load intakes:', error);
    } finally {
      setLoading(false);
    }
  };

  const steps = clientIntakeService.getStepCompletion(intakeData);

  const handleSave = async () => {
    setSaving(true);
    try {
      await clientIntakeService.createIntake(intakeData);
      await loadIntakes();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = () => {
    const result = clientIntakeService.validateIntake(intakeData);
    setValidationResult(result);
    if (result.isValid) {
      clientIntakeService.updateIntakeStatus('new', 'pending_review');
    }
  };

  const handleNext = () => {
    if (currentStep < 8) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-10 w-96 mb-3" />
          <Skeleton className="h-6 w-64 mb-8" />
          <div className="flex gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-10 w-10 rounded-full" />
            ))}
          </div>
          <Card>
            <Skeleton className="h-64 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  const tabItems = [
    { id: 'wizard', label: 'New Intake', count: undefined as number | undefined },
    { id: 'pending', label: 'Pending Review', count: intakes.filter(i => i.status === 'pending_review').length },
    { id: 'all', label: 'All Intakes', count: intakes.length }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Client Intake
            </h1>
            <p className="text-gray-600">
              New client registration and service assessment
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {tabItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'wizard' && (
          <>
            {/* Step Indicator */}
            <Card className="mb-6 overflow-x-auto">
              <StepIndicator steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
            </Card>

            {/* Form Content */}
            <Card className="mb-6">
              {currentStep === 1 && (
                <BasicInfoStep
                  data={intakeData.basicInfo || {}}
                  onChange={(data) => setIntakeData({ ...intakeData, basicInfo: data as ClientIntakeData['basicInfo'] })}
                />
              )}
              {currentStep === 2 && (
                <ContactInfoStep
                  data={intakeData.contact || {}}
                  onChange={(data) => setIntakeData({ ...intakeData, contact: data as ClientIntakeData['contact'] })}
                  counties={counties}
                />
              )}
              {currentStep === 3 && (
                <EmergencyContactStep
                  data={intakeData.emergencyContact || {}}
                  onChange={(data) => setIntakeData({ ...intakeData, emergencyContact: data as ClientIntakeData['emergencyContact'] })}
                />
              )}
              {currentStep === 4 && (
                <InsuranceStep
                  data={intakeData.insurance || {}}
                  onChange={(data) => setIntakeData({ ...intakeData, insurance: data as ClientIntakeData['insurance'] })}
                  waiverPrograms={waiverPrograms}
                />
              )}
              {currentStep === 5 && (
                <ServiceNeedsStep
                  data={intakeData.serviceNeeds || {}}
                  onChange={(data) => setIntakeData({ ...intakeData, serviceNeeds: data as ClientIntakeData['serviceNeeds'] })}
                  serviceTypes={serviceTypes}
                />
              )}
              {currentStep === 6 && (
                <MedicalInfoStep
                  data={intakeData.medical || {}}
                  onChange={(data) => setIntakeData({ ...intakeData, medical: data as ClientIntakeData['medical'] })}
                />
              )}
              {currentStep === 7 && (
                <HomeEnvironmentStep
                  data={intakeData.homeEnvironment || {}}
                  onChange={(data) => setIntakeData({ ...intakeData, homeEnvironment: data as ClientIntakeData['homeEnvironment'] })}
                />
              )}
              {currentStep === 8 && (
                <ConsentsStep
                  data={intakeData.consents || {}}
                  onChange={(data) => setIntakeData({ ...intakeData, consents: data as ClientIntakeData['consents'] })}
                />
              )}
            </Card>

            {/* Validation Errors */}
            {validationResult && !validationResult.isValid && (
              <Alert variant="danger" title="Validation Errors" className="mb-6">
                <ul className="list-disc list-inside">
                  {validationResult.errors.map((e, i) => (
                    <li key={i}>{e.message}</li>
                  ))}
                </ul>
              </Alert>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Previous
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>

                {currentStep === 8 ? (
                  <button
                    onClick={handleSubmitForReview}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Submit for Review
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Next
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'pending' && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Review</h3>
            {intakes.filter(i => i.status === 'pending_review').length === 0 ? (
              <p className="text-gray-500 text-center py-8">No intakes pending review</p>
            ) : (
              <div className="space-y-3">
                {intakes.filter(i => i.status === 'pending_review').map(intake => (
                  <div key={intake.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{intake.clientName}</h4>
                        <p className="text-sm text-gray-500">DOB: {intake.dateOfBirth} | Intake: {intake.intakeDate}</p>
                        <div className="flex gap-2 mt-2">
                          {intake.requestedServices.map(s => (
                            <Badge key={s} variant="info" size="sm">{s.replace('_', ' ')}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="warning">Pending Review</Badge>
                        <p className="text-sm text-gray-500 mt-1">{intake.estimatedHours} hrs/week</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="px-3 py-1 bg-success-600 text-white text-sm rounded hover:bg-success-700">
                        Approve
                      </button>
                      <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                        Request Changes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'all' && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Intakes</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Payer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Services</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Hours</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {intakes.map(intake => (
                    <tr key={intake.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{intake.clientName}</p>
                        <p className="text-sm text-gray-500">{intake.intakeDate}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{intake.primaryPayer}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {intake.requestedServices.slice(0, 2).map(s => (
                            <Badge key={s} variant="info" size="sm">{s.replace('_', ' ')}</Badge>
                          ))}
                          {intake.requestedServices.length > 2 && (
                            <Badge variant="secondary" size="sm">+{intake.requestedServices.length - 2}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{intake.estimatedHours}/wk</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            intake.status === 'approved' ? 'success' :
                            intake.status === 'pending_review' ? 'warning' :
                            intake.status === 'draft' ? 'secondary' :
                            intake.status === 'waitlist' ? 'info' : 'danger'
                          }
                        >
                          {intake.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${(intake.completedSteps / intake.totalSteps) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">{intake.completedSteps}/{intake.totalSteps}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default ClientIntakeWizard;
