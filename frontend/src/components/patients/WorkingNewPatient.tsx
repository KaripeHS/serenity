import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

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
    { number: 1, title: 'Demographics', description: 'Basic patient information' },
    { number: 2, title: 'Contact & Address', description: 'Contact details and address' },
    { number: 3, title: 'Emergency Contact', description: 'Emergency contact information' },
    { number: 4, title: 'Insurance', description: 'Insurance and coverage details' },
    { number: 5, title: 'Clinical Information', description: 'Medical history and conditions' },
    { number: 6, title: 'Services', description: 'Required services and scheduling' },
    { number: 7, title: 'Review & Submit', description: 'Review all information' }
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
      // Simulate API call to create patient
      await new Promise(resolve => setTimeout(resolve, 2000));

      alert(`✅ Patient Created Successfully!\n\nPatient: ${patientData.firstName} ${patientData.lastName}\nMedicaid: ${patientData.medicaidNumber}\nServices: ${patientData.servicesNeeded.join(', ')}\n\nRedirecting to patient dashboard...`);

      // In real app, would redirect to patient details page
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                First Name *
              </label>
              <input
                type="text"
                value={patientData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Last Name *
              </label>
              <input
                type="text"
                value={patientData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Date of Birth *
              </label>
              <input
                type="date"
                value={patientData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Gender *
              </label>
              <select
                value={patientData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Social Security Number
              </label>
              <input
                type="text"
                value={patientData.ssn}
                onChange={(e) => handleInputChange('ssn', e.target.value)}
                placeholder="XXX-XX-XXXX"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                value={patientData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Email Address
              </label>
              <input
                type="email"
                value={patientData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Street Address *
              </label>
              <input
                type="text"
                value={patientData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                City *
              </label>
              <input
                type="text"
                value={patientData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                State
              </label>
              <select
                value={patientData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="OH">Ohio</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                ZIP Code *
              </label>
              <input
                type="text"
                value={patientData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Emergency Contact Name *
              </label>
              <input
                type="text"
                value={patientData.emergencyContactName}
                onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Emergency Contact Phone *
              </label>
              <input
                type="tel"
                value={patientData.emergencyContactPhone}
                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                placeholder="(555) 123-4567"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Relationship
              </label>
              <select
                value={patientData.emergencyContactRelation}
                onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">Select Relationship</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Primary Insurance *
              </label>
              <select
                value={patientData.primaryInsurance}
                onChange={(e) => handleInputChange('primaryInsurance', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">Select Insurance</option>
                <option value="Ohio Medicaid">Ohio Medicaid</option>
                <option value="Medicare">Medicare</option>
                <option value="Medicare + Medicaid">Medicare + Medicaid</option>
                <option value="Private Insurance">Private Insurance</option>
                <option value="Self-Pay">Self-Pay</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Medicaid Number
              </label>
              <input
                type="text"
                value={patientData.medicaidNumber}
                onChange={(e) => handleInputChange('medicaidNumber', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Medicare Number
              </label>
              <input
                type="text"
                value={patientData.medicareNumber}
                onChange={(e) => handleInputChange('medicareNumber', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Primary Diagnosis *
                </label>
                <input
                  type="text"
                  value={patientData.primaryDiagnosis}
                  onChange={(e) => handleInputChange('primaryDiagnosis', e.target.value)}
                  placeholder="e.g., Diabetes Type 2"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Physician Name *
                </label>
                <input
                  type="text"
                  value={patientData.physician}
                  onChange={(e) => handleInputChange('physician', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Physician Phone
                </label>
                <input
                  type="tel"
                  value={patientData.physicianPhone}
                  onChange={(e) => handleInputChange('physicianPhone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Known Allergies
              </label>
              <textarea
                value={patientData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                placeholder="List any known allergies..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Current Medications
              </label>
              <textarea
                value={patientData.medications}
                onChange={(e) => handleInputChange('medications', e.target.value)}
                placeholder="List current medications and dosages..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '1rem' }}>
                Services Needed *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {[
                  'Personal Care',
                  'Skilled Nursing',
                  'Physical Therapy',
                  'Occupational Therapy',
                  'Speech Therapy',
                  'Medical Social Work',
                  'Home Health Aide',
                  'Companion Care',
                  'Respite Care',
                  'Medication Management'
                ].map((service) => (
                  <label key={service} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={patientData.servicesNeeded.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{ fontSize: '0.875rem' }}>{service}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Service Frequency *
                </label>
                <select
                  value={patientData.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Select Frequency</option>
                  <option value="Daily">Daily</option>
                  <option value="3x per week">3x per week</option>
                  <option value="2x per week">2x per week</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-weekly">Bi-weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="As needed">As needed</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Service Start Date *
                </label>
                <input
                  type="date"
                  value={patientData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0284c7', marginBottom: '1rem' }}>
                📋 Patient Information Summary
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <strong>Patient:</strong> {patientData.firstName} {patientData.lastName}<br />
                  <strong>DOB:</strong> {patientData.dateOfBirth}<br />
                  <strong>Gender:</strong> {patientData.gender}
                </div>
                <div>
                  <strong>Phone:</strong> {patientData.phone}<br />
                  <strong>Insurance:</strong> {patientData.primaryInsurance}<br />
                  <strong>Medicaid:</strong> {patientData.medicaidNumber || 'N/A'}
                </div>
                <div>
                  <strong>Address:</strong><br />
                  {patientData.address}<br />
                  {patientData.city}, {patientData.state} {patientData.zipCode}
                </div>
                <div>
                  <strong>Emergency Contact:</strong><br />
                  {patientData.emergencyContactName}<br />
                  {patientData.emergencyContactPhone}
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#166534', marginBottom: '1rem' }}>
                🏥 Clinical & Services Summary
              </h3>
              <div style={{ fontSize: '0.875rem' }}>
                <p><strong>Primary Diagnosis:</strong> {patientData.primaryDiagnosis}</p>
                <p><strong>Physician:</strong> {patientData.physician}</p>
                <p><strong>Services:</strong> {patientData.servicesNeeded.join(', ')}</p>
                <p><strong>Frequency:</strong> {patientData.frequency}</p>
                <p><strong>Start Date:</strong> {patientData.startDate}</p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#fefce8',
              border: '1px solid #fde047',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#ca8a04', marginBottom: '0.5rem' }}>
                ⚠️ Important Notes
              </h3>
              <ul style={{ fontSize: '0.875rem', color: '#a16207', paddingLeft: '1.5rem' }}>
                <li>All information has been reviewed for accuracy</li>
                <li>Patient will be assigned to appropriate care team</li>
                <li>Initial care plan will be developed within 48 hours</li>
                <li>HIPAA privacy notice has been provided</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              👤 New Patient Registration
            </h1>
            <p style={{ color: '#6b7280' }}>
              HIPAA-compliant patient intake process
            </p>
          </div>
          <a href="/" style={{
            color: '#2563eb',
            textDecoration: 'underline'
          }}>
            ← Back to Home
          </a>
        </div>

        {/* Progress Steps */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            {steps.map((step, index) => (
              <div key={step.number} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: currentStep >= step.number ? '#3B82F6' : '#e5e7eb',
                  color: currentStep >= step.number ? 'white' : '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {currentStep > step.number ? '✓' : step.number}
                </div>
                {index < steps.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: currentStep > step.number ? '#3B82F6' : '#e5e7eb',
                    marginLeft: '0.5rem',
                    marginRight: '0.5rem'
                  }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
              Step {currentStep}: {steps[currentStep - 1].title}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: currentStep === 1 ? '#f3f4f6' : 'white',
              color: currentStep === 1 ? '#9ca3af' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Previous
          </button>

          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Step {currentStep} of {steps.length}
          </span>

          {currentStep < steps.length ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!isStepValid(currentStep)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: !isStepValid(currentStep) ? '#f3f4f6' : '#3B82F6',
                color: !isStepValid(currentStep) ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: !isStepValid(currentStep) ? 'not-allowed' : 'pointer'
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isStepValid(currentStep)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: isSubmitting || !isStepValid(currentStep) ? '#f3f4f6' : '#10B981',
                color: isSubmitting || !isStepValid(currentStep) ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: isSubmitting || !isStepValid(currentStep) ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? '⏳ Creating Patient...' : '✅ Create Patient'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}