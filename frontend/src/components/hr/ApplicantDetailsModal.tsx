import { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  XMarkIcon,
  PrinterIcon,
  EnvelopeIcon,
  DocumentArrowDownIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface ApplicantDetails {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position: string;
  status: string;
  experience: string;
  location: string;
  applied: string;
  resume?: string;
  coverLetter?: string;
  skills?: string[];
  education?: string;
  references?: { name: string; phone: string; relationship: string }[];
}

interface ApplicantDetailsModalProps {
  applicant: ApplicantDetails;
  isOpen: boolean;
  onClose: () => void;
  onMoveToInterview?: () => void;
  onReject?: () => void;
}

export function ApplicantDetailsModal({
  applicant,
  isOpen,
  onClose,
  onMoveToInterview,
  onReject
}: ApplicantDetailsModalProps) {
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'primary'> = {
      new: 'info',
      reviewing: 'warning',
      interview: 'success',
      scheduled: 'primary',
      rejected: 'danger',
      hired: 'success'
    };
    return <Badge variant={variants[status] || 'info'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const handlePrint = () => {
    const printContent = `
      APPLICANT DETAILS
      =================

      Name: ${applicant.name}
      Position: ${applicant.position}
      Status: ${applicant.status}

      Contact Information:
      - Email: ${applicant.email || 'Not provided'}
      - Phone: ${applicant.phone || 'Not provided'}
      - Location: ${applicant.location}

      Application Details:
      - Applied: ${applicant.applied}
      - Experience: ${applicant.experience}
      ${applicant.education ? `- Education: ${applicant.education}` : ''}
      ${applicant.skills?.length ? `- Skills: ${applicant.skills.join(', ')}` : ''}

      Generated: ${new Date().toLocaleString()}
      Serenity Care Partners
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Applicant: ${applicant.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
              h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
              .section { margin: 20px 0; }
              .label { font-weight: bold; color: #374151; }
              .value { margin-left: 10px; }
              .footer { margin-top: 40px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            </style>
          </head>
          <body>
            <h1>Applicant Details</h1>
            <div class="section">
              <h2>${applicant.name}</h2>
              <p><span class="label">Position:</span><span class="value">${applicant.position}</span></p>
              <p><span class="label">Status:</span><span class="value">${applicant.status}</span></p>
            </div>
            <div class="section">
              <h3>Contact Information</h3>
              <p><span class="label">Email:</span><span class="value">${applicant.email || 'Not provided'}</span></p>
              <p><span class="label">Phone:</span><span class="value">${applicant.phone || 'Not provided'}</span></p>
              <p><span class="label">Location:</span><span class="value">${applicant.location}</span></p>
            </div>
            <div class="section">
              <h3>Application Details</h3>
              <p><span class="label">Applied:</span><span class="value">${applicant.applied}</span></p>
              <p><span class="label">Experience:</span><span class="value">${applicant.experience}</span></p>
              ${applicant.education ? `<p><span class="label">Education:</span><span class="value">${applicant.education}</span></p>` : ''}
              ${applicant.skills?.length ? `<p><span class="label">Skills:</span><span class="value">${applicant.skills.join(', ')}</span></p>` : ''}
            </div>
            <div class="footer">
              <p>Generated: ${new Date().toLocaleString()}</p>
              <p>Serenity Care Partners - Human Resources</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportPDF = () => {
    // For now, use print which allows saving as PDF
    handlePrint();
  };

  const handleSendEmail = async () => {
    if (!applicant.email) {
      alert('No email address available for this applicant.');
      return;
    }

    setSending(true);
    try {
      // Open email client with pre-filled content
      const subject = encodeURIComponent(`Regarding Your Application for ${applicant.position} - Serenity Care Partners`);
      const body = encodeURIComponent(`Dear ${applicant.name},

Thank you for your interest in the ${applicant.position} position at Serenity Care Partners.

[Your message here]

Best regards,
Serenity Care Partners HR Team`);

      window.location.href = `mailto:${applicant.email}?subject=${subject}&body=${body}`;
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{applicant.name}</h2>
                <p className="text-primary-100 text-sm">{applicant.position}</p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(applicant.status)}
                <button
                  onClick={onClose}
                  className="text-white hover:bg-primary-500 rounded-full p-1 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Contact Info */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{applicant.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{applicant.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium text-gray-900">{applicant.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Applied</p>
                    <p className="text-sm font-medium text-gray-900">{applicant.applied}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Experience & Skills */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Qualifications</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <BriefcaseIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Experience Level</p>
                    <p className="text-sm font-medium text-gray-900">{applicant.experience}</p>
                  </div>
                </div>
                {applicant.education && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <AcademicCapIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Education</p>
                      <p className="text-sm font-medium text-gray-900">{applicant.education}</p>
                    </div>
                  </div>
                )}
                {applicant.skills && applicant.skills.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {applicant.skills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Documents</h3>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Resume
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Cover Letter
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Export Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="flex items-center gap-2"
                >
                  <PrinterIcon className="h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  className="flex items-center gap-2"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendEmail}
                  disabled={sending || !applicant.email}
                  className="flex items-center gap-2"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                  Email
                </Button>
              </div>

              {/* Status Actions */}
              {applicant.status === 'new' && (
                <div className="flex gap-2">
                  {onMoveToInterview && (
                    <Button
                      onClick={() => { onMoveToInterview(); onClose(); }}
                      className="bg-success-600 hover:bg-success-700"
                      size="sm"
                    >
                      Move to Interview
                    </Button>
                  )}
                  {onReject && (
                    <Button
                      onClick={() => { onReject(); onClose(); }}
                      className="bg-danger-600 hover:bg-danger-700"
                      size="sm"
                    >
                      Reject
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
