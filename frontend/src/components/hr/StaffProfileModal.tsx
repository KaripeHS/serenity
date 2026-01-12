import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ClockIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { Badge } from '../ui/Badge';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: string;
  hireDate: string;
  certifications: string[];
  trainingDue: string[];
}

interface StaffProfileModalProps {
  staff: StaffMember;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onSendMessage?: () => void;
  onViewSchedule?: () => void;
  onManageCredentials?: () => void;
}

export function StaffProfileModal({
  staff,
  isOpen,
  onClose,
  onEdit,
  onSendMessage,
  onViewSchedule,
  onManageCredentials
}: StaffProfileModalProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateTenure = (hireDate: string) => {
    if (!hireDate) return 'N/A';
    const hire = new Date(hireDate);
    const now = new Date();
    const years = Math.floor((now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor(((now.getTime() - hire.getTime()) % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));

    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${months} month${months !== 1 ? 's' : ''}`;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-white relative">
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>

                  <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center">
                      <UserCircleIcon className="h-16 w-16 text-white/80" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold">
                        {staff.name}
                      </Dialog.Title>
                      <p className="text-primary-100 text-lg mt-1">{staff.position}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant={staff.status === 'active' ? 'success' : 'warning'}
                          size="sm"
                          className="bg-white/20 text-white border-white/30"
                        >
                          {staff.status}
                        </Badge>
                        {staff.trainingDue.length > 0 && (
                          <Badge variant="danger" size="sm" className="bg-danger-500 text-white">
                            Training Due
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium text-gray-900">
                            {staff.email || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm font-medium text-gray-900">
                            {staff.phone || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Employment Details */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Employment Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Department</p>
                          <p className="text-sm font-medium text-gray-900">
                            {staff.department || 'General'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Hire Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(staff.hireDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                        <ClockIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Tenure</p>
                          <p className="text-sm font-medium text-gray-900">
                            {calculateTenure(staff.hireDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Certifications */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      <AcademicCapIcon className="h-4 w-4 inline mr-1" />
                      Certifications & Training
                    </h3>
                    {staff.certifications.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {staff.certifications.map((cert, index) => (
                          <Badge
                            key={index}
                            variant={staff.trainingDue.includes(cert) ? 'danger' : 'success'}
                            size="sm"
                          >
                            {cert}
                            {staff.trainingDue.includes(cert) && ' (Due)'}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No certifications on file</p>
                    )}
                  </div>

                  {/* Training Alerts */}
                  {staff.trainingDue.length > 0 && (
                    <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-danger-800 mb-2">
                        Training Renewal Required
                      </h3>
                      <p className="text-sm text-danger-700 mb-3">
                        The following certifications are expiring or have expired:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {staff.trainingDue.map((training, index) => (
                          <Badge key={index} variant="danger" size="sm">
                            {training}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="bg-gray-50 px-6 py-4 flex flex-wrap gap-3 justify-end border-t">
                  {onEdit && (
                    <button
                      onClick={onEdit}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit Profile
                    </button>
                  )}
                  {onViewSchedule && (
                    <button
                      onClick={onViewSchedule}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <CalendarDaysIcon className="h-4 w-4" />
                      View Schedule
                    </button>
                  )}
                  {onManageCredentials && (
                    <button
                      onClick={onManageCredentials}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <AcademicCapIcon className="h-4 w-4" />
                      Manage Credentials
                    </button>
                  )}
                  {onSendMessage && (
                    <button
                      onClick={onSendMessage}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      <EnvelopeIcon className="h-4 w-4" />
                      Send Message
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
