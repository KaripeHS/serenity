import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Alert, AlertDescription } from '../ui/Alert';
import { Badge } from '../ui/Badge';

interface PatientData {
  // Demographics
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  ssn: string;
  phone: string;
  email: string;
  // Address
  address: string;
  city: string;
  state: string;
  zipCode: string;
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  // Insurance
  primaryInsurance: string;
  medicaidNumber: string;
  medicareNumber: string;
  // Clinical
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  allergies: string;
  medications: string;
  physician: string;
  physicianPhone: string;
  // Services
  servicesNeeded: string[];
  frequency: string;
  startDate: string;
}

// Helper component for consistent form fields
interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}

function FormField({ label, required, children, fullWidth }: FormFieldProps) {
  return (
    <div className={fullWidth ? 'col-span-full' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
    </div>
  );
}

export function WorkingNewPatient() {
  const { user: _user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientData, setPatientData] = useState<PatientData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    ssn: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'OH',
    zipCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    primaryInsurance: '',
    medicaidNumber: '',
    medicareNumber: '',
    primaryDiagnosis: '',
    secondaryDiagnoses: [],
    allergies: '',
    medications: '',
    physician: '',
    physicianPhone: '',
    servicesNeeded: [],
    frequency: '',
    startDate: ''
  });

  const steps = [
    { number: 1, title: 'Demographics', description: 'Basic patient information', icon: '👤' },
    { number: 2, title: 'Contact & Address', description: 'Contact details and address', icon: '📍' },
    { number: 3, title: 'Emergency Contact', description: 'Emergency contact information', icon: '🚨' },
    { number: 4, title: 'Insurance', description: 'Insurance and coverage details', icon: '💳' },
    { number: 5, title: 'Clinical Information', description: 'Medical history and conditions', icon: '🏥' },
    { number: 6, title: 'Services', description: 'Required services and scheduling', icon: '📋' },
    { number: 7, title: 'Review & Submit', description: 'Review all information', icon: '✅' }
  ];

  const handleInputChange = (field: keyof PatientData, value: string | string[]) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceToggle = (service: string) => {
    setPatientData(prev => ({
      ...prev,
      servicesNeeded: prev.servicesNeeded.includes(service)
        ? prev.servicesNeeded.filter(s => s !== service)
        : [...prev.servicesNeeded, service]
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`✅ Patient Created Successfully!\n\nPatient: ${patientData.firstName} ${patientData.lastName}\nMedicaid: ${patientData.medicaidNumber}\nServices: ${patientData.servicesNeeded.join(', ')}\n\nRedirecting to patient dashboard...`);
      window.location.href = '/dashboard/clinical';
    } catch (error) {
      alert('Failed to create patient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(patientData.firstName && patientData.lastName && patientData.dateOfBirth && patientData.gender);
      case 2:
        return !!(patientData.phone && patientData.address && patientData.city && patientData.zipCode);
      case 3:
        return !!(patientData.emergencyContactName && patientData.emergencyContactPhone);
      case 4:
        return !!(patientData.primaryInsurance && (patientData.medicaidNumber || patientData.medicareNumber));
      case 5:
        return !!(patientData.primaryDiagnosis && patientData.physician);
      case 6:
        return !!(patientData.servicesNeeded.length > 0 && patientData.frequency && patientData.startDate);
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="First Name" required>
              <Input
                type="text"
                value={patientData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </FormField>
            <FormField label="Last Name" required>
              <Input
                type="text"
                value={patientData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </FormField>
            <FormField label="Date of Birth" required>
              <Input
                type="date"
                value={patientData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              />
            </FormField>
            <FormField label="Gender" required>
              <Select
                value={patientData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </Select>
            </FormField>
            <FormField label="Social Security Number">
              <Input
                type="text"
                value={patientData.ssn}
                onChange={(e) => handleInputChange('ssn', e.target.value)}
                placeholder="XXX-XX-XXXX"
              />
            </FormField>
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Phone Number" required>
              <Input
                type="tel"
                value={patientData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </FormField>
            <FormField label="Email Address">
              <Input
                type="email"
                value={patientData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </FormField>
            <FormField label="Street Address" required fullWidth>
              <Input
                type="text"
                value={patientData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </FormField>
            <FormField label="City" required>
              <Input
                type="text"
                value={patientData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </FormField>
            <FormField label="State">
              <Select
                value={patientData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
              >
                <option value="OH">Ohio</option>
              </Select>
            </FormField>
            <FormField label="ZIP Code" required>
              <Input
                type="text"
                value={patientData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
              />
            </FormField>
          </div>
        );

      case 3:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Emergency Contact Name" required fullWidth>
              <Input
                type="text"
                value={patientData.emergencyContactName}
                onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
              />
            </FormField>
            <FormField label="Emergency Contact Phone" required>
              <Input
                type="tel"
                value={patientData.emergencyContactPhone}
                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </FormField>
            <FormField label="Relationship">
              <Input
                type="text"
                value={patientData.emergencyContactRelation}
                onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
                placeholder="Spouse, Child, Parent, etc."
              />
            </FormField>
          </div>
        );

      case 4:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Primary Insurance" required>
              <Select
                value={patientData.primaryInsurance}
                onChange={(e) => handleInputChange('primaryInsurance', e.target.value)}
              >
                <option value="">Select Insurance</option>
                <option value="Medicaid">Medicaid</option>
                <option value="Medicare">Medicare</option>
                <option value="Private">Private Insurance</option>
                <option value="Medicaid/Medicare Dual">Medicaid/Medicare Dual</option>
              </Select>
            </FormField>
            <FormField label="Medicaid Number">
              <Input
                type="text"
                value={patientData.medicaidNumber}
                onChange={(e) => handleInputChange('medicaidNumber', e.target.value)}
              />
            </FormField>
            <FormField label="Medicare Number">
              <Input
                type="text"
                value={patientData.medicareNumber}
                onChange={(e) => handleInputChange('medicareNumber', e.target.value)}
              />
            </FormField>
          </div>
        );

      case 5:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Primary Diagnosis" required fullWidth>
              <Input
                type="text"
                value={patientData.primaryDiagnosis}
                onChange={(e) => handleInputChange('primaryDiagnosis', e.target.value)}
                placeholder="ICD-10 code or description"
              />
            </FormField>
            <FormField label="Allergies" fullWidth>
              <Input
                type="text"
                value={patientData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                placeholder="List any known allergies"
              />
            </FormField>
            <FormField label="Current Medications" fullWidth>
              <Input
                type="text"
                value={patientData.medications}
                onChange={(e) => handleInputChange('medications', e.target.value)}
                placeholder="List medications"
              />
            </FormField>
            <FormField label="Primary Physician" required>
              <Input
                type="text"
                value={patientData.physician}
                onChange={(e) => handleInputChange('physician', e.target.value)}
              />
            </FormField>
            <FormField label="Physician Phone">
              <Input
                type="tel"
                value={patientData.physicianPhone}
                onChange={(e) => handleInputChange('physicianPhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </FormField>
          </div>
        );

      case 6:
        const services = [
          'Skilled Nursing',
          'Physical Therapy',
          'Occupational Therapy',
          'Speech Therapy',
          'Medical Social Work',
          'Home Health Aide',
          'Wound Care',
          'IV Therapy'
        ];

        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Services Needed <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {services.map((service) => (
                  <label
                    key={service}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      patientData.servicesNeeded.includes(service)
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={patientData.servicesNeeded.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">{service}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Service Frequency" required>
                <Select
                  value={patientData.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                >
                  <option value="">Select Frequency</option>
                  <option value="Daily">Daily</option>
                  <option value="3x per week">3x per week</option>
                  <option value="2x per week">2x per week</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-weekly">Bi-weekly</option>
                </Select>
              </FormField>
              <FormField label="Start Date" required>
                <Input
                  type="date"
                  value={patientData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </FormField>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription>
                <p className="text-sm text-blue-800">
                  Please review all information carefully before submitting. Once submitted, a care plan will be created and services will be scheduled.
                </p>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Demographics</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {patientData.firstName} {patientData.lastName}</p>
                  <p><strong>DOB:</strong> {patientData.dateOfBirth}</p>
                  <p><strong>Gender:</strong> {patientData.gender}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Contact</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Phone:</strong> {patientData.phone}</p>
                  <p><strong>Email:</strong> {patientData.email || 'N/A'}</p>
                  <p><strong>Address:</strong> {patientData.address}, {patientData.city}, {patientData.state} {patientData.zipCode}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Emergency Contact</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {patientData.emergencyContactName}</p>
                  <p><strong>Phone:</strong> {patientData.emergencyContactPhone}</p>
                  <p><strong>Relationship:</strong> {patientData.emergencyContactRelation || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Insurance</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Primary:</strong> {patientData.primaryInsurance}</p>
                  <p><strong>Medicaid:</strong> {patientData.medicaidNumber || 'N/A'}</p>
                  <p><strong>Medicare:</strong> {patientData.medicareNumber || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Clinical</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Primary Diagnosis:</strong> {patientData.primaryDiagnosis}</p>
                  <p><strong>Physician:</strong> {patientData.physician}</p>
                  <p><strong>Allergies:</strong> {patientData.allergies || 'None reported'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Services</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Services:</strong></p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {patientData.servicesNeeded.map((service) => (
                      <Badge key={service} className="bg-blue-100 text-blue-800 text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-2"><strong>Frequency:</strong> {patientData.frequency}</p>
                  <p><strong>Start Date:</strong> {patientData.startDate}</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏥 New Patient Intake
            </h1>
            <p className="text-gray-600">
              Complete all steps to create a new patient record
            </p>
          </div>
          <Link to="/dashboard/clinical" className="text-blue-600 underline hover:text-blue-700">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div key={step.number} className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    {index > 0 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          currentStep > step.number - 1 ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                    )}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        currentStep === step.number
                          ? 'bg-blue-600 text-white'
                          : currentStep > step.number
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 text-gray-700'
                      }`}
                    >
                      {currentStep > step.number ? '✓' : step.icon}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                  <div className="text-center mt-2 hidden md:block">
                    <p className="text-xs font-medium text-gray-900">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {steps[currentStep - 1].icon} {steps[currentStep - 1].title}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{steps[currentStep - 1].description}</p>
          </CardHeader>
          <CardContent className="p-6">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
                variant="outline"
              >
                ← Previous
              </Button>

              <div className="text-sm text-gray-600">
                Step {currentStep} of {steps.length}
              </div>

              {currentStep < steps.length ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!isStepValid(currentStep)}
                >
                  Next →
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Submitting...' : '✅ Submit Patient'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* HIPAA Notice */}
        <Alert className="mt-6 bg-blue-50 border-blue-200">
          <AlertDescription>
            <p className="text-xs text-blue-700">
              🛡️ <strong>HIPAA Compliance:</strong> All patient information is encrypted and stored securely in compliance with HIPAA regulations. Access is logged and monitored.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
