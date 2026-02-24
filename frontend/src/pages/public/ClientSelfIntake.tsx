/**
 * Client Self-Service Intake Form
 * Public-facing form for clients/families to submit their information
 * Data is validated and flagged for inconsistencies before being used in internal intake
 *
 * Features:
 * - Secure access code verification gate
 * - Multi-step wizard for better UX
 * - Field validation with helpful error messages
 * - Progress saving (localStorage)
 * - Secure token-based submission
 * - Data inconsistency detection
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  UserIcon,
  PhoneIcon,
  HomeIcon,
  HeartIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ClipboardDocumentCheckIcon,
  LockClosedIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'https://serenity-api-959836324579.us-east4.run.app';

// Form step definitions - now includes 'verify' step
type FormStep = 'verify' | 'welcome' | 'contact' | 'address' | 'emergency' | 'medical' | 'preferences' | 'consent' | 'review' | 'submitted';

// Access code verification state
interface AccessCodeState {
  verified: boolean;
  code: string;
  codeType: 'email' | 'phone' | null;
  codeId: string | null;
  clientName: string | null;
  clientEmail: string | null;
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  preferredName: string;
  dateOfBirth: string;
  gender: string;
  primaryPhone: string;
  alternatePhone: string;
  email: string;
  preferredContactMethod: string;
  bestTimeToCall: string;
}

interface AddressInfo {
  streetAddress: string;
  apartmentUnit: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  residenceType: string;
  accessInstructions: string;
  hasPets: boolean;
  petDetails: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone: string;
  email: string;
  isAuthorizedRepresentative: boolean;
  canMakeMedicalDecisions: boolean;
}

interface MedicalInfo {
  primaryPhysician: string;
  physicianPhone: string;
  primaryDiagnosis: string;
  otherConditions: string;
  allergies: string;
  currentMedications: string;
  mobilityStatus: string;
  cognitiveStatus: string;
  hearingStatus: string;
  visionStatus: string;
  specialEquipment: string;
}

interface CarePreferences {
  servicesNeeded: string[];
  preferredSchedule: string;
  caregiverGenderPreference: string;
  languagePreference: string;
  culturalConsiderations: string;
  additionalNotes: string;
}

interface ConsentInfo {
  consentToServices: boolean;
  consentToShareInfo: boolean;
  acknowledgePrivacyPolicy: boolean;
  acknowledgePatientRights: boolean;
  electronicSignature: string;
  signatureDate: string;
  relationshipToPatient: string;
}

interface ClientIntakeData {
  contact: ContactInfo;
  address: AddressInfo;
  emergencyContacts: EmergencyContact[];
  medical: MedicalInfo;
  preferences: CarePreferences;
  consent: ConsentInfo;
  submissionToken?: string;
  submittedAt?: string;
}

const STORAGE_KEY = 'serenity_client_intake_draft';

// Initial empty form data
const initialFormData: ClientIntakeData = {
  contact: {
    firstName: '',
    lastName: '',
    preferredName: '',
    dateOfBirth: '',
    gender: '',
    primaryPhone: '',
    alternatePhone: '',
    email: '',
    preferredContactMethod: 'phone',
    bestTimeToCall: '',
  },
  address: {
    streetAddress: '',
    apartmentUnit: '',
    city: '',
    state: 'OH',
    zipCode: '',
    county: '',
    residenceType: '',
    accessInstructions: '',
    hasPets: false,
    petDetails: '',
  },
  emergencyContacts: [
    {
      name: '',
      relationship: '',
      phone: '',
      alternatePhone: '',
      email: '',
      isAuthorizedRepresentative: false,
      canMakeMedicalDecisions: false,
    },
  ],
  medical: {
    primaryPhysician: '',
    physicianPhone: '',
    primaryDiagnosis: '',
    otherConditions: '',
    allergies: '',
    currentMedications: '',
    mobilityStatus: '',
    cognitiveStatus: '',
    hearingStatus: '',
    visionStatus: '',
    specialEquipment: '',
  },
  preferences: {
    servicesNeeded: [],
    preferredSchedule: '',
    caregiverGenderPreference: 'no_preference',
    languagePreference: 'English',
    culturalConsiderations: '',
    additionalNotes: '',
  },
  consent: {
    consentToServices: false,
    consentToShareInfo: false,
    acknowledgePrivacyPolicy: false,
    acknowledgePatientRights: false,
    electronicSignature: '',
    signatureDate: new Date().toISOString().split('T')[0],
    relationshipToPatient: '',
  },
};

// Validation types
interface ValidationError {
  field: string;
  message: string;
}

interface DataFlag {
  field: string;
  type: 'warning' | 'info';
  message: string;
}

export default function ClientSelfIntake() {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<FormStep>('verify');
  const [formData, setFormData] = useState<ClientIntakeData>(initialFormData);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [dataFlags, setDataFlags] = useState<DataFlag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  // Access code state
  const [accessCode, setAccessCode] = useState<AccessCodeState>({
    verified: false,
    code: '',
    codeType: null,
    codeId: null,
    clientName: null,
    clientEmail: null,
  });
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Check for code in URL and auto-verify on mount
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setCodeInput(codeFromUrl);
      verifyAccessCode(codeFromUrl);
    }
  }, [searchParams]);

  // Load saved draft on mount (only if verified)
  useEffect(() => {
    if (accessCode.verified) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormData(parsed);
          setHasSavedDraft(true);
        }
      } catch (e) {
        console.error('Failed to load saved draft:', e);
      }
    }
  }, [accessCode.verified]);

  // Verify access code with backend
  const verifyAccessCode = async (code: string) => {
    if (!code.trim()) {
      setCodeError('Please enter your access code');
      return;
    }

    setIsVerifying(true);
    setCodeError(null);

    try {
      const response = await fetch(`${API_BASE}/api/public/intake/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setAccessCode({
          verified: true,
          code: code.trim().toUpperCase(),
          codeType: data.codeType,
          codeId: data.codeId || null,
          clientName: data.clientName || null,
          clientEmail: data.clientEmail || null,
        });

        // Pre-populate name and email if provided
        if (data.clientName || data.clientEmail) {
          setFormData(prev => ({
            ...prev,
            contact: {
              ...prev.contact,
              firstName: data.clientName?.split(' ')[0] || prev.contact.firstName,
              lastName: data.clientName?.split(' ').slice(1).join(' ') || prev.contact.lastName,
              email: data.clientEmail || prev.contact.email,
            },
          }));
        }

        setCurrentStep('welcome');
      } else {
        setCodeError(data.error || 'Invalid access code');
      }
    } catch (error) {
      console.error('Failed to verify access code:', error);
      setCodeError('Unable to verify code. Please try again or call us at (513) 400-5113.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyAccessCode(codeInput);
  };

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      setHasSavedDraft(true);
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  }, [formData]);

  // Auto-save draft when form data changes
  useEffect(() => {
    if (currentStep !== 'welcome' && currentStep !== 'submitted') {
      const timer = setTimeout(saveDraft, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, currentStep, saveDraft]);

  // Clear saved draft
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(initialFormData);
    setHasSavedDraft(false);
    setCurrentStep('welcome');
  };

  // Validate current step
  const validateStep = (step: FormStep): ValidationError[] => {
    const stepErrors: ValidationError[] = [];

    switch (step) {
      case 'contact':
        if (!formData.contact.firstName.trim()) {
          stepErrors.push({ field: 'firstName', message: 'First name is required' });
        }
        if (!formData.contact.lastName.trim()) {
          stepErrors.push({ field: 'lastName', message: 'Last name is required' });
        }
        if (!formData.contact.dateOfBirth) {
          stepErrors.push({ field: 'dateOfBirth', message: 'Date of birth is required' });
        }
        if (!formData.contact.primaryPhone.trim()) {
          stepErrors.push({ field: 'primaryPhone', message: 'Primary phone is required' });
        } else if (!/^\d{10}$/.test(formData.contact.primaryPhone.replace(/\D/g, ''))) {
          stepErrors.push({ field: 'primaryPhone', message: 'Please enter a valid 10-digit phone number' });
        }
        if (formData.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.email)) {
          stepErrors.push({ field: 'email', message: 'Please enter a valid email address' });
        }
        break;

      case 'address':
        if (!formData.address.streetAddress.trim()) {
          stepErrors.push({ field: 'streetAddress', message: 'Street address is required' });
        }
        if (!formData.address.city.trim()) {
          stepErrors.push({ field: 'city', message: 'City is required' });
        }
        if (!formData.address.zipCode.trim()) {
          stepErrors.push({ field: 'zipCode', message: 'ZIP code is required' });
        } else if (!/^\d{5}(-\d{4})?$/.test(formData.address.zipCode)) {
          stepErrors.push({ field: 'zipCode', message: 'Please enter a valid ZIP code' });
        }
        break;

      case 'emergency':
        if (!formData.emergencyContacts[0]?.name.trim()) {
          stepErrors.push({ field: 'emergencyName', message: 'Emergency contact name is required' });
        }
        if (!formData.emergencyContacts[0]?.phone.trim()) {
          stepErrors.push({ field: 'emergencyPhone', message: 'Emergency contact phone is required' });
        }
        if (!formData.emergencyContacts[0]?.relationship.trim()) {
          stepErrors.push({ field: 'emergencyRelationship', message: 'Relationship is required' });
        }
        break;

      case 'consent':
        if (!formData.consent.consentToServices) {
          stepErrors.push({ field: 'consentToServices', message: 'Consent to services is required' });
        }
        if (!formData.consent.acknowledgePrivacyPolicy) {
          stepErrors.push({ field: 'acknowledgePrivacyPolicy', message: 'Privacy policy acknowledgment is required' });
        }
        if (!formData.consent.electronicSignature.trim()) {
          stepErrors.push({ field: 'electronicSignature', message: 'Electronic signature is required' });
        }
        break;
    }

    return stepErrors;
  };

  // Check for data inconsistencies
  const checkDataInconsistencies = (): DataFlag[] => {
    const flags: DataFlag[] = [];

    // Check age vs services
    if (formData.contact.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(formData.contact.dateOfBirth).getFullYear();
      if (age < 18 && !formData.emergencyContacts[0]?.canMakeMedicalDecisions) {
        flags.push({
          field: 'dateOfBirth',
          type: 'warning',
          message: 'Client is under 18 - please ensure a guardian is designated for medical decisions',
        });
      }
      if (age > 100) {
        flags.push({
          field: 'dateOfBirth',
          type: 'warning',
          message: 'Please verify date of birth - age appears to be over 100',
        });
      }
    }

    // Check phone number formats
    const primaryDigits = formData.contact.primaryPhone.replace(/\D/g, '');
    const emergencyDigits = formData.emergencyContacts[0]?.phone.replace(/\D/g, '') || '';
    if (primaryDigits && emergencyDigits && primaryDigits === emergencyDigits) {
      flags.push({
        field: 'emergencyPhone',
        type: 'warning',
        message: 'Emergency contact phone is the same as primary phone - please provide a different contact',
      });
    }

    // Check for Ohio service area
    if (formData.address.state && formData.address.state !== 'OH') {
      flags.push({
        field: 'state',
        type: 'warning',
        message: 'Serenity Care Partners currently serves Ohio only - please verify address',
      });
    }

    // Check ZIP code matches Ohio
    if (formData.address.zipCode) {
      const zip = parseInt(formData.address.zipCode.substring(0, 5));
      if (zip < 43001 || zip > 45999) {
        flags.push({
          field: 'zipCode',
          type: 'info',
          message: 'ZIP code may be outside Ohio - our team will verify service area',
        });
      }
    }

    return flags;
  };

  // Navigate to next step
  const goToNextStep = () => {
    const stepErrors = validateStep(currentStep);
    setErrors(stepErrors);

    if (stepErrors.length > 0) {
      return;
    }

    const steps: FormStep[] = ['welcome', 'contact', 'address', 'emergency', 'medical', 'preferences', 'consent', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
      window.scrollTo(0, 0);
    }
  };

  // Navigate to previous step
  const goToPrevStep = () => {
    const steps: FormStep[] = ['welcome', 'contact', 'address', 'emergency', 'medical', 'preferences', 'consent', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      window.scrollTo(0, 0);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    // Validate consent step
    const stepErrors = validateStep('consent');
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      setCurrentStep('consent');
      return;
    }

    // Check for data flags
    const flags = checkDataInconsistencies();
    setDataFlags(flags);

    setIsSubmitting(true);

    try {
      // Submit to backend API
      const response = await fetch(`${API_BASE}/api/public/intake/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: accessCode.code,
          formData: formData,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Submission failed');
      }

      // Update form data with submission info
      const submittedData = {
        ...formData,
        submissionToken: data.referenceToken,
        submittedAt: new Date().toISOString(),
        dataFlags: flags,
      };

      // Store submission reference locally
      localStorage.setItem(`${STORAGE_KEY}_submitted_${data.referenceToken}`, JSON.stringify(submittedData));

      // Clear the draft
      localStorage.removeItem(STORAGE_KEY);

      // Move to submitted step
      setFormData(submittedData);
      setCurrentStep('submitted');
    } catch (error) {
      console.error('Submission failed:', error);
      setErrors([{ field: 'submit', message: 'Failed to submit form. Please try again.' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update contact info
  const updateContact = (field: keyof ContactInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
    setErrors(prev => prev.filter(e => e.field !== field));
  };

  // Update address info
  const updateAddress = (field: keyof AddressInfo, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
    setErrors(prev => prev.filter(e => e.field !== field));
  };

  // Update emergency contact
  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string | boolean) => {
    setFormData(prev => {
      const contacts = [...prev.emergencyContacts];
      contacts[index] = { ...contacts[index], [field]: value };
      return { ...prev, emergencyContacts: contacts };
    });
  };

  // Update medical info
  const updateMedical = (field: keyof MedicalInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      medical: { ...prev.medical, [field]: value },
    }));
  };

  // Update preferences
  const updatePreferences = (field: keyof CarePreferences, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value },
    }));
  };

  // Update consent
  const updateConsent = (field: keyof ConsentInfo, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      consent: { ...prev.consent, [field]: value },
    }));
    setErrors(prev => prev.filter(e => e.field !== field));
  };

  // Get field error
  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  // Progress indicator
  const steps = [
    { id: 'contact', label: 'Contact', icon: UserIcon },
    { id: 'address', label: 'Address', icon: HomeIcon },
    { id: 'emergency', label: 'Emergency', icon: PhoneIcon },
    { id: 'medical', label: 'Medical', icon: HeartIcon },
    { id: 'preferences', label: 'Preferences', icon: ClipboardDocumentCheckIcon },
    { id: 'consent', label: 'Consent', icon: ShieldCheckIcon },
    { id: 'review', label: 'Review', icon: DocumentTextIcon },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'verify':
        return (
          <div className="text-center py-8">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <LockClosedIcon className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Secure Access Required
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              To protect your privacy, please enter the access code you received to continue.
            </p>

            <form onSubmit={handleCodeSubmit} className="max-w-sm mx-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                  Access Code
                </label>
                <div className="relative">
                  <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={codeInput}
                    onChange={e => {
                      setCodeInput(e.target.value.toUpperCase());
                      setCodeError(null);
                    }}
                    placeholder="Enter your access code"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg text-center font-mono text-lg tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      codeError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    autoFocus
                  />
                </div>
                {codeError && (
                  <p className="mt-2 text-sm text-red-600">{codeError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifying || !codeInput.trim()}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="h-5 w-5" />
                    Verify Access Code
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg max-w-md mx-auto text-left">
              <h3 className="font-medium text-gray-900 mb-2">Don't have an access code?</h3>
              <p className="text-sm text-gray-600 mb-3">
                Access codes are sent via email when you request our services. If you haven't received one:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check your email inbox and spam folder</li>
                <li>• Call us at <a href="tel:+15134005113" className="text-blue-600 hover:underline font-medium">(513) 400-5113</a></li>
                <li>• Request a new code from our office</li>
              </ul>
            </div>

            <p className="mt-6 text-xs text-gray-400">
              <LockClosedIcon className="inline h-3 w-3 mr-1" />
              Your information is protected with HIPAA-compliant security
            </p>
          </div>
        );

      case 'welcome':
        return (
          <div className="text-center py-8">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircleIcon className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Serenity Care Partners
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Thank you for choosing us for your home health care needs. This form helps us understand how we can best serve you or your loved one.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-md mx-auto text-left">
              <h3 className="font-medium text-blue-900 mb-2">What you'll need:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>- Client's personal information</li>
                <li>- Emergency contact details</li>
                <li>- Medical history & current medications</li>
                <li>- Insurance information (optional)</li>
              </ul>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Your progress is automatically saved. You can return anytime to complete the form.
            </p>
            {hasSavedDraft && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-md mx-auto">
                <p className="text-amber-800 font-medium">You have a saved draft</p>
                <div className="mt-2 flex gap-2 justify-center">
                  <button
                    onClick={() => setCurrentStep('contact')}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Continue Draft
                  </button>
                  <button
                    onClick={clearDraft}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Start Fresh
                  </button>
                </div>
              </div>
            )}
            {!hasSavedDraft && (
              <button
                onClick={() => setCurrentStep('contact')}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Begin Intake Form
              </button>
            )}
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Client Information</h2>
              <p className="text-gray-600">Please provide the client's contact details.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contact.firstName}
                  onChange={e => updateContact('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getError('firstName') ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {getError('firstName') && (
                  <p className="mt-1 text-sm text-red-600">{getError('firstName')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contact.lastName}
                  onChange={e => updateContact('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getError('lastName') ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {getError('lastName') && (
                  <p className="mt-1 text-sm text-red-600">{getError('lastName')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Name
                </label>
                <input
                  type="text"
                  value={formData.contact.preferredName}
                  onChange={e => updateContact('preferredName', e.target.value)}
                  placeholder="What would you like us to call you?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.contact.dateOfBirth}
                  onChange={e => updateContact('dateOfBirth', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getError('dateOfBirth') ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {getError('dateOfBirth') && (
                  <p className="mt-1 text-sm text-red-600">{getError('dateOfBirth')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={formData.contact.gender}
                  onChange={e => updateContact('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.contact.primaryPhone}
                  onChange={e => updateContact('primaryPhone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getError('primaryPhone') ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {getError('primaryPhone') && (
                  <p className="mt-1 text-sm text-red-600">{getError('primaryPhone')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alternate Phone
                </label>
                <input
                  type="tel"
                  value={formData.contact.alternatePhone}
                  onChange={e => updateContact('alternatePhone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.contact.email}
                  onChange={e => updateContact('email', e.target.value)}
                  placeholder="email@example.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getError('email') ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {getError('email') && (
                  <p className="mt-1 text-sm text-red-600">{getError('email')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Contact Method
                </label>
                <select
                  value={formData.contact.preferredContactMethod}
                  onChange={e => updateContact('preferredContactMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="phone">Phone Call</option>
                  <option value="text">Text Message</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Best Time to Call
                </label>
                <select
                  value={formData.contact.bestTimeToCall}
                  onChange={e => updateContact('bestTimeToCall', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any time</option>
                  <option value="morning">Morning (8am - 12pm)</option>
                  <option value="afternoon">Afternoon (12pm - 5pm)</option>
                  <option value="evening">Evening (5pm - 8pm)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'address':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Home Address</h2>
              <p className="text-gray-600">Where will care be provided?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address.streetAddress}
                  onChange={e => updateAddress('streetAddress', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getError('streetAddress') ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {getError('streetAddress') && (
                  <p className="mt-1 text-sm text-red-600">{getError('streetAddress')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apartment/Unit #
                </label>
                <input
                  type="text"
                  value={formData.address.apartmentUnit}
                  onChange={e => updateAddress('apartmentUnit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={e => updateAddress('city', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getError('city') ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {getError('city') && (
                  <p className="mt-1 text-sm text-red-600">{getError('city')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  value={formData.address.state}
                  onChange={e => updateAddress('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="OH">Ohio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address.zipCode}
                  onChange={e => updateAddress('zipCode', e.target.value)}
                  placeholder="43215"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getError('zipCode') ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {getError('zipCode') && (
                  <p className="mt-1 text-sm text-red-600">{getError('zipCode')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  County
                </label>
                <input
                  type="text"
                  value={formData.address.county}
                  onChange={e => updateAddress('county', e.target.value)}
                  placeholder="e.g., Franklin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Residence Type
                </label>
                <select
                  value={formData.address.residenceType}
                  onChange={e => updateAddress('residenceType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="house">Single Family Home</option>
                  <option value="apartment">Apartment</option>
                  <option value="condo">Condo/Townhouse</option>
                  <option value="assisted_living">Assisted Living</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Instructions
                </label>
                <textarea
                  value={formData.address.accessInstructions}
                  onChange={e => updateAddress('accessInstructions', e.target.value)}
                  placeholder="Gate code, doorbell location, parking instructions, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.address.hasPets}
                    onChange={e => updateAddress('hasPets', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">There are pets in the home</span>
                </label>
              </div>

              {formData.address.hasPets && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pet Details
                  </label>
                  <input
                    type="text"
                    value={formData.address.petDetails}
                    onChange={e => updateAddress('petDetails', e.target.value)}
                    placeholder="Type, name, temperament..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'emergency':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Emergency Contact</h2>
              <p className="text-gray-600">Who should we contact in case of emergency?</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-4">Primary Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContacts[0]?.name || ''}
                    onChange={e => updateEmergencyContact(0, 'name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      getError('emergencyName') ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {getError('emergencyName') && (
                    <p className="mt-1 text-sm text-red-600">{getError('emergencyName')}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.emergencyContacts[0]?.relationship || ''}
                    onChange={e => updateEmergencyContact(0, 'relationship', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      getError('emergencyRelationship') ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select...</option>
                    <option value="spouse">Spouse</option>
                    <option value="child">Adult Child</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="friend">Friend</option>
                    <option value="neighbor">Neighbor</option>
                    <option value="other">Other</option>
                  </select>
                  {getError('emergencyRelationship') && (
                    <p className="mt-1 text-sm text-red-600">{getError('emergencyRelationship')}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContacts[0]?.phone || ''}
                    onChange={e => updateEmergencyContact(0, 'phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      getError('emergencyPhone') ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {getError('emergencyPhone') && (
                    <p className="mt-1 text-sm text-red-600">{getError('emergencyPhone')}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.emergencyContacts[0]?.email || ''}
                    onChange={e => updateEmergencyContact(0, 'email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.emergencyContacts[0]?.isAuthorizedRepresentative || false}
                      onChange={e => updateEmergencyContact(0, 'isAuthorizedRepresentative', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      This person is authorized to receive information about the client's care
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.emergencyContacts[0]?.canMakeMedicalDecisions || false}
                      onChange={e => updateEmergencyContact(0, 'canMakeMedicalDecisions', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      This person has healthcare power of attorney or can make medical decisions
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'medical':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Medical Information</h2>
              <p className="text-gray-600">Help us understand the client's health needs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Physician
                </label>
                <input
                  type="text"
                  value={formData.medical.primaryPhysician}
                  onChange={e => updateMedical('primaryPhysician', e.target.value)}
                  placeholder="Dr. Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Physician Phone
                </label>
                <input
                  type="tel"
                  value={formData.medical.physicianPhone}
                  onChange={e => updateMedical('physicianPhone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Diagnosis / Reason for Care
                </label>
                <textarea
                  value={formData.medical.primaryDiagnosis}
                  onChange={e => updateMedical('primaryDiagnosis', e.target.value)}
                  placeholder="What is the main reason home care is needed?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Medical Conditions
                </label>
                <textarea
                  value={formData.medical.otherConditions}
                  onChange={e => updateMedical('otherConditions', e.target.value)}
                  placeholder="List any other health conditions..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergies
                </label>
                <textarea
                  value={formData.medical.allergies}
                  onChange={e => updateMedical('allergies', e.target.value)}
                  placeholder="List any allergies (medications, food, environmental)..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Medications
                </label>
                <textarea
                  value={formData.medical.currentMedications}
                  onChange={e => updateMedical('currentMedications', e.target.value)}
                  placeholder="List current medications and dosages..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobility Status
                </label>
                <select
                  value={formData.medical.mobilityStatus}
                  onChange={e => updateMedical('mobilityStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="independent">Independent</option>
                  <option value="supervision">Needs Supervision</option>
                  <option value="assistance">Needs Assistance</option>
                  <option value="dependent">Fully Dependent</option>
                  <option value="wheelchair">Wheelchair Bound</option>
                  <option value="bedridden">Bedridden</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cognitive Status
                </label>
                <select
                  value={formData.medical.cognitiveStatus}
                  onChange={e => updateMedical('cognitiveStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="alert">Alert and Oriented</option>
                  <option value="mild_impairment">Mild Impairment</option>
                  <option value="moderate_impairment">Moderate Impairment</option>
                  <option value="severe_impairment">Severe Impairment</option>
                  <option value="dementia">Dementia/Alzheimer's</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Equipment in Use
                </label>
                <input
                  type="text"
                  value={formData.medical.specialEquipment}
                  onChange={e => updateMedical('specialEquipment', e.target.value)}
                  placeholder="Walker, oxygen, hospital bed, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Care Preferences</h2>
              <p className="text-gray-600">Help us match you with the right caregiver.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services Needed (select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Personal Care (bathing, dressing)',
                    'Meal Preparation',
                    'Medication Reminders',
                    'Light Housekeeping',
                    'Companionship',
                    'Transportation',
                    'Grocery Shopping',
                    'Laundry',
                  ].map(service => (
                    <label key={service} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.preferences.servicesNeeded.includes(service)}
                        onChange={e => {
                          const services = e.target.checked
                            ? [...formData.preferences.servicesNeeded, service]
                            : formData.preferences.servicesNeeded.filter(s => s !== service);
                          updatePreferences('servicesNeeded', services);
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Schedule
                </label>
                <textarea
                  value={formData.preferences.preferredSchedule}
                  onChange={e => updatePreferences('preferredSchedule', e.target.value)}
                  placeholder="e.g., Monday-Friday 8am-12pm, or weekends only..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Caregiver Gender Preference
                  </label>
                  <select
                    value={formData.preferences.caregiverGenderPreference}
                    onChange={e => updatePreferences('caregiverGenderPreference', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="no_preference">No Preference</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language Preference
                  </label>
                  <select
                    value={formData.preferences.languagePreference}
                    onChange={e => updatePreferences('languagePreference', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Somali">Somali</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cultural or Religious Considerations
                </label>
                <textarea
                  value={formData.preferences.culturalConsiderations}
                  onChange={e => updatePreferences('culturalConsiderations', e.target.value)}
                  placeholder="Any cultural, religious, or dietary preferences we should know about?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.preferences.additionalNotes}
                  onChange={e => updatePreferences('additionalNotes', e.target.value)}
                  placeholder="Anything else you'd like us to know?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 'consent':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Consent & Authorization</h2>
              <p className="text-gray-600">Please review and acknowledge the following to proceed with your intake request.</p>
            </div>

            {/* Informational notice about intake process */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This intake form allows us to learn about your care needs. After submission, a care coordinator will contact you to discuss services, answer questions, and if you decide to proceed, present a formal Service Agreement for your review and signature.
              </p>
            </div>

            <div className="space-y-4">
              <div className={`p-4 border rounded-lg ${getError('consentToServices') ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consent.consentToServices}
                    onChange={e => updateConsent('consentToServices', e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Consent to Be Contacted <span className="text-red-500">*</span></p>
                    <p className="text-sm text-gray-600">
                      I consent to be contacted by Serenity Care Partners to discuss my care needs. I understand this is an intake request and not a commitment to services. A care coordinator will contact me to discuss options and next steps.
                    </p>
                  </div>
                </label>
                {getError('consentToServices') && (
                  <p className="mt-2 text-sm text-red-600">{getError('consentToServices')}</p>
                )}
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consent.consentToShareInfo}
                    onChange={e => updateConsent('consentToShareInfo', e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Authorization to Share Information</p>
                    <p className="text-sm text-gray-600">
                      I authorize Serenity Care Partners to share information with my healthcare providers, insurance companies, and emergency contacts as necessary to evaluate and coordinate care.
                    </p>
                  </div>
                </label>
              </div>

              <div className={`p-4 border rounded-lg ${getError('acknowledgePrivacyPolicy') ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consent.acknowledgePrivacyPolicy}
                    onChange={e => updateConsent('acknowledgePrivacyPolicy', e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">HIPAA Privacy Acknowledgment <span className="text-red-500">*</span></p>
                    <p className="text-sm text-gray-600">
                      I acknowledge that my personal health information will be protected in accordance with HIPAA regulations. I have had the opportunity to review the{' '}
                      <Link to="/privacy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</Link>
                      {' '}and{' '}
                      <Link to="/hipaa" target="_blank" className="text-blue-600 hover:underline">HIPAA Notice of Privacy Practices</Link>.
                    </p>
                  </div>
                </label>
                {getError('acknowledgePrivacyPolicy') && (
                  <p className="mt-2 text-sm text-red-600">{getError('acknowledgePrivacyPolicy')}</p>
                )}
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consent.acknowledgePatientRights}
                    onChange={e => updateConsent('acknowledgePatientRights', e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Information Accuracy</p>
                    <p className="text-sm text-gray-600">
                      I confirm that the information I have provided is accurate to the best of my knowledge. I understand that providing accurate information helps ensure appropriate care recommendations.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Electronic Signature <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.consent.electronicSignature}
                      onChange={e => updateConsent('electronicSignature', e.target.value)}
                      placeholder="Type your full legal name"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-serif italic ${
                        getError('electronicSignature') ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {getError('electronicSignature') && (
                      <p className="mt-1 text-sm text-red-600">{getError('electronicSignature')}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship to Client
                    </label>
                    <select
                      value={formData.consent.relationshipToPatient}
                      onChange={e => updateConsent('relationshipToPatient', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="self">Self (I am the client)</option>
                      <option value="spouse">Spouse</option>
                      <option value="child">Adult Child</option>
                      <option value="parent">Parent</option>
                      <option value="guardian">Legal Guardian</option>
                      <option value="poa">Power of Attorney</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.consent.signatureDate}
                      onChange={e => updateConsent('signatureDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Review & Submit</h2>
              <p className="text-gray-600">Please review your information before submitting.</p>
            </div>

            {/* Summary sections */}
            <div className="space-y-4">
              {/* Contact Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Client Information</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Name:</span> {formData.contact.firstName} {formData.contact.lastName}</p>
                  <p><span className="font-medium">DOB:</span> {formData.contact.dateOfBirth}</p>
                  <p><span className="font-medium">Phone:</span> {formData.contact.primaryPhone}</p>
                  {formData.contact.email && <p><span className="font-medium">Email:</span> {formData.contact.email}</p>}
                </div>
              </div>

              {/* Address Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Address</h3>
                <p className="text-sm text-gray-600">
                  {formData.address.streetAddress}
                  {formData.address.apartmentUnit && `, ${formData.address.apartmentUnit}`}
                  <br />
                  {formData.address.city}, {formData.address.state} {formData.address.zipCode}
                </p>
              </div>

              {/* Emergency Contact Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Emergency Contact</h3>
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Name:</span> {formData.emergencyContacts[0]?.name}</p>
                  <p><span className="font-medium">Relationship:</span> {formData.emergencyContacts[0]?.relationship}</p>
                  <p><span className="font-medium">Phone:</span> {formData.emergencyContacts[0]?.phone}</p>
                </div>
              </div>

              {/* Services Summary */}
              {formData.preferences.servicesNeeded.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Services Requested</h3>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {formData.preferences.servicesNeeded.map(service => (
                      <li key={service}>{service}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Data flags/warnings */}
            {dataFlags.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  Items to Review
                </h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  {dataFlags.map((flag, i) => (
                    <li key={i}>• {flag.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                By submitting this form, you confirm that the information provided is accurate to the best of your knowledge. A care coordinator will contact you within 1-2 business days to discuss next steps.
              </p>
            </div>
          </div>
        );

      case 'submitted':
        return (
          <div className="text-center py-8">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircleIcon className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Thank You!
            </h2>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Your intake form has been successfully submitted. A member of our team will contact you within 1-2 business days.
            </p>
            <div className="inline-block p-4 bg-gray-100 rounded-lg mb-8">
              <p className="text-sm text-gray-600">Reference Number:</p>
              <p className="text-lg font-mono font-bold text-gray-900">{formData.submissionToken}</p>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Please save this reference number for your records.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <HeartSolid className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Serenity Care Partners</h1>
              <p className="text-xs text-gray-500">Client Intake Form</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Progress bar */}
      {currentStep !== 'welcome' && currentStep !== 'submitted' && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(((currentStepIndex + 1) / steps.length) * 100)}% complete
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isComplete = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center ${
                      isCurrent ? 'text-blue-600' : isComplete ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    <StepIcon className="h-4 w-4" />
                    <span className="text-xs mt-1 hidden sm:block">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          {renderStepContent()}
        </div>

        {/* Navigation buttons */}
        {currentStep !== 'welcome' && currentStep !== 'submitted' && (
          <div className="flex justify-between mt-6">
            <button
              onClick={goToPrevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>

            {currentStep === 'review' ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    Submit Form
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={goToNextStep}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Continue
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Auto-save indicator */}
        {currentStep !== 'welcome' && currentStep !== 'submitted' && hasSavedDraft && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Progress automatically saved
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          <p>Questions? Call us at <a href="tel:+15134005113" className="text-blue-600 hover:underline">(513) 400-5113</a></p>
          <p className="mt-1">
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            {' · '}
            <Link to="/hipaa" className="hover:underline">HIPAA Notice</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
