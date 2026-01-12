import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PrinterIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CreditCardIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  HeartIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

interface PatientBinderProps {
  patientId?: string;
}

// Format date for display
const formatDate = (dateStr: string) => {
  if (!dateStr) return 'Not provided';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Section header component
function SectionHeader({ icon: Icon, title, completed }: { icon: any; title: string; completed: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-primary-500 print:border-gray-400">
      <div className="p-2 bg-primary-100 rounded-lg print:bg-gray-100">
        <Icon className="h-6 w-6 text-primary-600 print:text-gray-700" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {completed ? (
        <CheckCircleIcon className="h-5 w-5 text-success-500 ml-auto" />
      ) : (
        <XCircleIcon className="h-5 w-5 text-gray-300 ml-auto" />
      )}
    </div>
  );
}

// Field display component
function Field({ label, value, highlight = false }: { label: string; value: any; highlight?: boolean }) {
  const displayValue = value === true ? 'Yes' : value === false ? 'No' : value || 'Not provided';
  return (
    <div className={`${highlight ? 'bg-primary-50 p-2 rounded-lg print:bg-gray-50' : ''}`}>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-gray-900">{displayValue}</dd>
    </div>
  );
}

// Demographics section
function DemographicsSection({ data }: { data: any }) {
  if (!data) return null;
  return (
    <section className="mb-8 page-break-inside-avoid">
      <SectionHeader icon={UserIcon} title="Patient Demographics" completed={!!data.firstName} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="First Name" value={data.firstName} highlight />
        <Field label="Last Name" value={data.lastName} highlight />
        <Field label="Date of Birth" value={formatDate(data.dateOfBirth)} highlight />
        <Field label="Gender" value={data.gender} />
        <Field label="SSN (Last 4)" value={data.ssn ? `***-**-${data.ssn.slice(-4)}` : ''} />
        <Field label="Phone" value={data.phone} />
        <Field label="Email" value={data.email} />
        <Field label="Preferred Language" value={data.preferredLanguage} />
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Address</h4>
          <p className="text-sm text-gray-900">
            {data.address1 || 'Not provided'}<br />
            {data.address2 && <>{data.address2}<br /></>}
            {data.city}, {data.state} {data.zipCode}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Emergency Contact</h4>
          <p className="text-sm text-gray-900">
            {data.emergencyContactName || 'Not provided'}<br />
            {data.emergencyContactRelation}<br />
            {data.emergencyContactPhone}
          </p>
        </div>
      </div>
    </section>
  );
}

// Insurance section
function InsuranceSection({ data }: { data: any }) {
  if (!data) return null;
  const isPrivatePay = data.insuranceType === 'Private Pay';

  return (
    <section className="mb-8 page-break-inside-avoid">
      <SectionHeader icon={CreditCardIcon} title="Insurance Information" completed={!!data.insuranceType} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Insurance Type" value={data.insuranceType} highlight />
        {isPrivatePay ? (
          <>
            <Field label="Pay Rate" value={data.privatePayRate ? `$${data.privatePayRate} ${data.privatePayRateType}` : ''} />
            <Field label="Billing Contact" value={data.privatePayBillingContact} />
            <Field label="Billing Phone" value={data.privatePayBillingPhone} />
          </>
        ) : (
          <>
            <Field label="Policy Number" value={data.policyNumber} />
            <Field label="Group Number" value={data.groupNumber} />
            <Field label="Insurance Company" value={data.primaryInsurance} />
          </>
        )}
      </div>
      {!isPrivatePay && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Medicaid Number" value={data.medicaidNumber} />
          <Field label="Medicare Number" value={data.medicareNumber} />
          <Field label="Eligibility Status" value={
            data.eligibilityStatus === 'verified' ? 'Verified' :
            data.eligibilityStatus === 'rejected' ? 'Rejected' :
            data.eligibilityStatus === 'in_process' ? 'In Process' :
            data.eligibilityStatus === 'pending_review' ? 'Pending Review' :
            data.eligibilityStatus === 'not_started' ? 'Not Started' :
            data.eligibilityVerified ? 'Verified' : 'Not Verified'
          } />
          {data.eligibilityStatus === 'verified' && (
            <Field label="Verification Date" value={formatDate(data.eligibilityVerifiedDate)} />
          )}
          {data.eligibilityStatus === 'rejected' && (
            <Field label="Rejection Reason" value={
              data.eligibilityRejectionReason === 'coverage_terminated' ? 'Coverage Terminated' :
              data.eligibilityRejectionReason === 'not_enrolled' ? 'Not Enrolled in Plan' :
              data.eligibilityRejectionReason === 'service_not_covered' ? 'Service Not Covered' :
              data.eligibilityRejectionReason === 'out_of_network' ? 'Out of Network' :
              data.eligibilityRejectionReason === 'missing_info' ? 'Missing Information' :
              data.eligibilityRejectionReason === 'invalid_member_id' ? 'Invalid Member ID' :
              data.eligibilityRejectionReason || 'Other'
            } />
          )}
        </div>
      )}
      {!isPrivatePay && data.priorAuthRequired === 'yes' && (
        <div className="mt-4 p-4 bg-warning-50 rounded-lg print:bg-gray-50 print:border print:border-gray-200">
          <h4 className="text-sm font-semibold text-warning-800 mb-2">Prior Authorization</h4>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Auth Number" value={data.priorAuthNumber} />
            <Field label="Start Date" value={formatDate(data.priorAuthStartDate)} />
            <Field label="End Date" value={formatDate(data.priorAuthEndDate)} />
          </div>
        </div>
      )}
    </section>
  );
}

// Assessment section
function AssessmentSection({ data }: { data: any }) {
  if (!data) return null;
  return (
    <section className="mb-8 page-break-inside-avoid">
      <SectionHeader icon={ClipboardDocumentCheckIcon} title="Clinical Assessment" completed={!!data.adlBathing} />
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Activities of Daily Living (ADLs)</h4>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Field label="Bathing" value={data.adlBathing} />
            <Field label="Dressing" value={data.adlDressing} />
            <Field label="Toileting" value={data.adlToileting} />
            <Field label="Transferring" value={data.adlTransferring} />
            <Field label="Continence" value={data.adlContinence} />
            <Field label="Feeding" value={data.adlFeeding} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Instrumental ADLs (IADLs)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Housework" value={data.iadlHousework} />
            <Field label="Meal Prep" value={data.iadlMealPrep} />
            <Field label="Shopping" value={data.iadlShopping} />
            <Field label="Medication Mgmt" value={data.iadlMedication} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cognitive Status" value={data.cognitiveStatus} />
          <Field label="Fall Risk" value={data.fallRisk} />
        </div>
        {data.assessmentNotes && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Assessment Notes</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.assessmentNotes}</p>
          </div>
        )}
      </div>
    </section>
  );
}

// Physician Orders section
function PhysicianOrdersSection({ data }: { data: any }) {
  if (!data) return null;
  return (
    <section className="mb-8 page-break-inside-avoid">
      <SectionHeader icon={DocumentTextIcon} title="Physician Orders" completed={!!data.physicianName} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Physician Name" value={data.physicianName} highlight />
        <Field label="NPI" value={data.physicianNPI} />
        <Field label="Phone" value={data.physicianPhone} />
        <Field label="Fax" value={data.physicianFax} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Field label="Face-to-Face Date" value={formatDate(data.faceToFaceDate)} />
        <Field label="Orders Date" value={formatDate(data.ordersDate)} />
      </div>
      {data.diagnoses && data.diagnoses.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Diagnoses</h4>
          <div className="space-y-1">
            {data.diagnoses.map((dx: any, i: number) => (
              <div key={i} className="text-sm bg-gray-50 p-2 rounded print:border print:border-gray-200">
                <span className="font-medium">{dx.code}</span> - {dx.description}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.ordersText && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg print:border print:border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Orders</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.ordersText}</p>
        </div>
      )}
    </section>
  );
}

// Care Plan section
function CarePlanSection({ data }: { data: any }) {
  if (!data) return null;
  return (
    <section className="mb-8 page-break-inside-avoid">
      <SectionHeader icon={HeartIcon} title="Care Plan" completed={!!data.goals?.length} />
      {data.goals && data.goals.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Goals</h4>
          <ul className="list-disc list-inside space-y-1">
            {data.goals.map((goal: any, i: number) => (
              <li key={i} className="text-sm text-gray-900">{goal.description || goal}</li>
            ))}
          </ul>
        </div>
      )}
      {data.interventions && data.interventions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Interventions</h4>
          <ul className="list-disc list-inside space-y-1">
            {data.interventions.map((int: any, i: number) => (
              <li key={i} className="text-sm text-gray-900">{int.description || int}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Service Schedule" value={data.serviceSchedule} />
        <Field label="Weekly Hours" value={data.weeklyHours} />
      </div>
      {data.emergencyPlan && (
        <div className="mt-4 p-4 bg-danger-50 rounded-lg print:bg-gray-50 print:border print:border-gray-200">
          <h4 className="text-sm font-semibold text-danger-800 mb-1">Emergency Plan</h4>
          <p className="text-sm text-danger-700 whitespace-pre-wrap">{data.emergencyPlan}</p>
        </div>
      )}
    </section>
  );
}

// Caregiver Assignment section
function CaregiverSection({ data }: { data: any }) {
  if (!data) return null;
  return (
    <section className="mb-8 page-break-inside-avoid">
      <SectionHeader icon={UserGroupIcon} title="Caregiver Assignment" completed={!!data.primaryCaregiver} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-primary-50 rounded-lg print:bg-gray-50 print:border print:border-gray-200">
          <h4 className="text-sm font-semibold text-primary-800 mb-3">Primary Caregiver</h4>
          <div className="space-y-2">
            <Field label="Name" value={data.primaryCaregiver?.name || data.primaryCaregiverName} />
            <Field label="Phone" value={data.primaryCaregiver?.phone || data.primaryCaregiverPhone} />
            <Field label="Certifications" value={data.primaryCaregiver?.certifications?.join(', ')} />
          </div>
        </div>
        {(data.backupCaregiver || data.backupCaregiverName) && (
          <div className="p-4 bg-gray-50 rounded-lg print:border print:border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Backup Caregiver</h4>
            <div className="space-y-2">
              <Field label="Name" value={data.backupCaregiver?.name || data.backupCaregiverName} />
              <Field label="Phone" value={data.backupCaregiver?.phone || data.backupCaregiverPhone} />
            </div>
          </div>
        )}
      </div>
      <div className="mt-4">
        <Field label="Introduction Date" value={formatDate(data.introductionDate)} />
      </div>
    </section>
  );
}

// Service Authorization section
function ServiceAuthSection({ data }: { data: any }) {
  if (!data) return null;
  return (
    <section className="mb-8 page-break-inside-avoid">
      <SectionHeader icon={DocumentDuplicateIcon} title="Service Authorization" completed={!!data.authNumber} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Authorization Number" value={data.authNumber} highlight />
        <Field label="Total Approved Hours" value={data.totalApprovedHours} />
        <Field label="Start Date" value={formatDate(data.authStartDate)} />
        <Field label="End Date" value={formatDate(data.authEndDate)} />
      </div>
      {data.approvedServices && data.approvedServices.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Approved Services</h4>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 print:bg-gray-100">
              <tr>
                <th className="text-left p-2">Service</th>
                <th className="text-left p-2">Hours</th>
                <th className="text-left p-2">Frequency</th>
              </tr>
            </thead>
            <tbody>
              {data.approvedServices.map((svc: any, i: number) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{svc.serviceType}</td>
                  <td className="p-2">{svc.hours}</td>
                  <td className="p-2">{svc.frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data.signatureData && (
        <div className="mt-4 p-4 bg-success-50 rounded-lg print:bg-gray-50 print:border print:border-gray-200">
          <h4 className="text-sm font-semibold text-success-800 mb-2">Patient/Representative Signature</h4>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <Field label="Signed By" value={data.signerName} />
            <Field label="Relationship" value={data.signerRelationship} />
            <Field label="Date Signed" value={formatDate(data.signatureDate)} />
          </div>
          {data.signatureMethod === 'electronic' && data.signatureData && (
            <div className="bg-white p-2 rounded border inline-block">
              <img src={data.signatureData} alt="Signature" className="max-h-16" />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// First Visit section
function FirstVisitSection({ data }: { data: any }) {
  if (!data) return null;
  return (
    <section className="mb-8 page-break-inside-avoid">
      <SectionHeader icon={CalendarDaysIcon} title="First Visit" completed={!!data.visitDate} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Visit Date" value={formatDate(data.visitDate)} highlight />
        <Field label="Visit Time" value={data.visitTime} highlight />
        <Field label="Caregiver Confirmed" value={data.caregiverConfirmed} />
        <Field label="Patient Notified" value={data.patientNotified} />
      </div>
      {data.visitNotes && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg print:border print:border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Visit Notes</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.visitNotes}</p>
        </div>
      )}
    </section>
  );
}

export function PatientBinder({ patientId: propPatientId }: PatientBinderProps) {
  const { patientId: paramPatientId } = useParams<{ patientId?: string }>();
  const patientId = propPatientId || paramPatientId;
  const [intakeData, setIntakeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedData = localStorage.getItem(`intake_${patientId || 'new'}`);
    if (savedData) {
      setIntakeData(JSON.parse(savedData));
    }
    setLoading(false);
  }, [patientId]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // For now, use browser print dialog which can save as PDF
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!intakeData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Patient Data Found</h2>
          <p className="text-gray-600 mb-4">There is no intake data to display for this patient.</p>
          <Link
            to={patientId ? `/patients/intake/${patientId}` : '/patients/intake/new'}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Go to Intake Workflow
          </Link>
        </div>
      </div>
    );
  }

  const baseUrl = patientId ? `/patients/intake/${patientId}` : '/patients/intake/new';

  return (
    <div className="min-h-screen bg-white">
      {/* Print Header - Hidden on screen, shown when printing */}
      <div className="hidden print:block mb-8 pb-4 border-b-2 border-gray-300">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PATIENT INTAKE BINDER</h1>
            <p className="text-sm text-gray-600 mt-1">Confidential Medical Record</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Generated: {new Date().toLocaleDateString()}</p>
            <p>Patient ID: {patientId || 'New'}</p>
          </div>
        </div>
      </div>

      {/* Screen Header - Hidden when printing */}
      <div className="print:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to={baseUrl}
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="font-medium">Back to Intake</span>
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <PrinterIcon className="h-5 w-5" />
                Print Binder
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                Save as PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-primary-50 rounded-xl p-6 mb-8 print:bg-gray-50 print:border print:border-gray-300">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {intakeData.patientName || 'New Patient'}
              </h1>
              <p className="text-gray-600 mt-1">
                Client Code: <span className="font-medium">{intakeData.clientCode || 'Pending'}</span>
                <span className="mx-2">|</span>
                Admission Date: <span className="font-medium">{formatDate(intakeData.admissionDate)}</span>
              </p>
            </div>
            <div className="text-center px-4 py-2 bg-white rounded-lg print:border print:border-gray-200">
              <div className="text-3xl font-bold text-primary-600">{intakeData.overallProgress || 0}%</div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>
        </div>

        {/* All Sections */}
        <DemographicsSection data={intakeData.demographics} />
        <InsuranceSection data={intakeData.insurance} />
        <AssessmentSection data={intakeData.assessment} />
        <PhysicianOrdersSection data={intakeData.physicianOrders} />
        <CarePlanSection data={intakeData.carePlan} />
        <CaregiverSection data={intakeData.caregiverAssignment} />
        <ServiceAuthSection data={intakeData.serviceAuthorization} />
        <FirstVisitSection data={intakeData.firstVisit} />

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 print:mt-8">
          <p className="text-xs text-gray-500 text-center">
            <strong>HIPAA NOTICE:</strong> This document contains Protected Health Information (PHI).
            Unauthorized disclosure is prohibited by law. Handle in accordance with HIPAA regulations.
          </p>
          <p className="text-xs text-gray-400 text-center mt-2 print:hidden">
            Document generated by Serenity ERP on {new Date().toLocaleString()}
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 0.75in;
            size: letter;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}

export default PatientBinder;
