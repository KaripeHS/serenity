import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { getFormBySlug, FORM_REGISTRY } from './form-registry';
import type { UploadedFile, AuditEntry } from './useFormPersistence';
import {
  ArrowLeftIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  DocumentTextIcon,
  ClockIcon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const AUDIT_ACTION_LABELS: Record<AuditEntry['action'], { label: string; color: string }> = {
  FORM_OPENED: { label: 'Opened', color: 'bg-blue-100 text-blue-700' },
  FIELD_UPDATED: { label: 'Updated', color: 'bg-gray-100 text-gray-700' },
  FORM_SAVED: { label: 'Saved', color: 'bg-green-100 text-green-700' },
  FORM_RESET: { label: 'Reset', color: 'bg-red-100 text-red-700' },
  FILE_UPLOADED: { label: 'File Added', color: 'bg-purple-100 text-purple-700' },
  FILE_REMOVED: { label: 'File Removed', color: 'bg-orange-100 text-orange-700' },
  FORM_SIGNED: { label: 'Signed', color: 'bg-emerald-100 text-emerald-700' },
  FORM_SUBMITTED: { label: 'Submitted', color: 'bg-indigo-100 text-indigo-700' },
};

interface FormShellProps {
  formId: string;
  title: string;
  children: React.ReactNode;
  onReset: () => void;
  lastSaved: string | null;
  uploadedFiles?: UploadedFile[];
  onAddUploadedFile?: (file: UploadedFile) => void;
  onRemoveUploadedFile?: (index: number) => void;
  auditTrail?: AuditEntry[];
}

export function FormShell({
  formId,
  title,
  children,
  onReset,
  lastSaved,
  uploadedFiles = [],
  onAddUploadedFile,
  onRemoveUploadedFile,
  auditTrail = [],
}: FormShellProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const formDef = FORM_REGISTRY.find(f => f.id === formId);
  const originalFile = formDef?.originalFile;

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadExcel = useCallback(() => {
    if (!originalFile) return;
    const link = document.createElement('a');
    link.href = `/forms/${originalFile}`;
    link.download = originalFile;
    link.click();
  }, [originalFile]);

  const handleUploadFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAddUploadedFile) return;

    // Read as base64 for files under 5MB
    if (file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        onAddUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          dataUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    } else {
      onAddUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      });
    }

    setShowUploadModal(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [onAddUploadedFile]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header - hidden when printing */}
      <div className="print:hidden mb-6">
        <button
          onClick={() => navigate('/dashboard/operating-forms')}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Operating Forms
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Badge className="bg-gray-100 text-gray-800 font-mono">Form {formId}</Badge>
              {formDef?.policyReference && (
                <Badge className="bg-blue-100 text-blue-800">{formDef.policyReference}</Badge>
              )}
              {formDef?.regulatoryRef && (
                <Badge className="bg-purple-100 text-purple-800">{formDef.regulatoryRef}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {formDef?.description && (
              <p className="text-sm text-gray-600 mt-1">{formDef.description}</p>
            )}
          </div>

          {lastSaved && (
            <div className="flex items-center text-xs text-gray-500">
              <ClockIcon className="h-3.5 w-3.5 mr-1" />
              Saved {new Date(lastSaved).toLocaleString()}
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <Button size="sm" onClick={handlePrint}>
            <PrinterIcon className="h-4 w-4 mr-1" />
            Print / Save PDF
          </Button>
          {originalFile && (
            <Button size="sm" variant="outline" onClick={handleDownloadExcel}>
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Download Excel
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowUploadModal(true)}>
            <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
            Upload Completed
          </Button>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={onReset}>
            <TrashIcon className="h-4 w-4 mr-1" />
            Clear Form
          </Button>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Uploaded Documents</h4>
            <div className="space-y-1">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-800">{file.name}</span>
                    <span className="text-gray-400 text-xs">{formatFileSize(file.size)}</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {onRemoveUploadedFile && (
                    <button
                      onClick={() => onRemoveUploadedFile(idx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Trail */}
        {auditTrail.length > 0 && (
          <div className="mt-3 border rounded-lg overflow-hidden">
            <button
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ClipboardDocumentListIcon className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Audit Trail</span>
                <Badge className="bg-gray-200 text-gray-600 text-[10px]">{auditTrail.length}</Badge>
              </div>
              {showAuditTrail ? <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />}
            </button>
            {showAuditTrail && (
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                {[...auditTrail].reverse().map((entry, idx) => {
                  const actionConfig = AUDIT_ACTION_LABELS[entry.action];
                  return (
                    <div key={idx} className="flex items-center gap-3 px-3 py-1.5 text-xs">
                      <span className="text-gray-400 w-36 flex-shrink-0">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-medium ${actionConfig.color}`}>
                        {actionConfig.label}
                      </span>
                      <span className="text-gray-600 truncate">{entry.details || entry.field || ''}</span>
                      <span className="text-gray-400 ml-auto flex-shrink-0">{entry.user}</span>
                      {entry.clientId && (
                        <Badge className="bg-green-50 text-green-700 text-[10px] flex-shrink-0">Patient Record</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Upload Completed Form</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload a completed version of this form (.xlsx, .pdf, .doc, .docx)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.pdf,.doc,.docx"
                onChange={handleUploadFile}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <div className="flex justify-end mt-4">
                <Button size="sm" variant="outline" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Print Header - only shown when printing */}
      <div className="hidden print:block mb-6">
        <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
          <h1 className="text-xl font-bold">Serenity Care Partners LLC</h1>
          <p className="text-sm text-gray-600">4601 Malsbary Rd, Blue Ash, Ohio 45242</p>
        </div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            {formDef?.policyReference && (
              <p className="text-xs text-gray-600">{formDef.policyReference}</p>
            )}
          </div>
          <div className="text-xs text-gray-600 text-right">
            <p>Form {formId}</p>
            {formDef?.regulatoryRef && <p>{formDef.regulatoryRef}</p>}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

export default FormShell;
