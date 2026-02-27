import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeftIcon, PrinterIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import type { UploadedFile, AuditEntry } from '@/pages/compliance/forms/useFormPersistence';
import { FormShell } from '@/pages/compliance/forms/FormShell';
import { useHiringFormData } from './useHiringFormData';
import { getHiringFormBySlug, type HiringFormDefinition } from './hiring-form-registry';

interface HiringFormShellProps {
  formDef: HiringFormDefinition;
  employeeId: string;
  employeeName: string;
  children: React.ReactNode;
  onReset: () => void;
  lastSaved: string | null;
  uploadedFiles?: UploadedFile[];
  onAddUploadedFile?: (file: UploadedFile) => void;
  onRemoveUploadedFile?: (index: number) => void;
  auditTrail?: AuditEntry[];
}

export function HiringFormShell({
  formDef,
  employeeId,
  employeeName,
  children,
  onReset,
  lastSaved,
  uploadedFiles,
  onAddUploadedFile,
  onRemoveUploadedFile,
  auditTrail,
}: HiringFormShellProps) {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Branded Header (shows on screen and print) ── */}
      <div className="print-header mb-6">
        <div className="flex items-center justify-between border-b-2 border-gray-800 pb-3 mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Serenity Care Partners LLC</h1>
            <p className="text-xs text-gray-500">Home Health Care Services — Ohio</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-700">Form {formDef.id}</div>
            <div className="text-xs text-gray-500">{formDef.title}</div>
          </div>
        </div>
        {/* Employee context bar */}
        {employeeName && (
          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg text-sm no-print">
            <span className="text-gray-500">Employee:</span>
            <span className="font-medium text-gray-900">{employeeName}</span>
            {formDef.isHROnly && (
              <Badge variant="default" className="bg-purple-100 text-purple-700 text-[10px]">HR Only</Badge>
            )}
            <span className="text-gray-400 text-xs ml-auto">Gate {formDef.gate}</span>
          </div>
        )}
      </div>

      {/* ── Form Content (wrapped in FormShell for audit trail, upload, etc.) ── */}
      <FormShell
        formId={`hiring_${employeeId}_${formDef.slug}`}
        title={formDef.title}
        onReset={onReset}
        lastSaved={lastSaved}
        uploadedFiles={uploadedFiles}
        onAddUploadedFile={onAddUploadedFile}
        onRemoveUploadedFile={onRemoveUploadedFile}
        auditTrail={auditTrail}
      >
        {children}
      </FormShell>

      {/* ── Print Footer ── */}
      <div className="print-footer hidden print:block mt-8 pt-3 border-t border-gray-400 text-[9px] text-gray-500">
        <div className="flex justify-between">
          <span>Form {formDef.id} — {formDef.title}</span>
          <span>Confidential — Serenity Care Partners LLC</span>
        </div>
      </div>

      {/* ── Print Styles ── */}
      <style>{`
        @media print {
          /* Hide navigation and screen-only elements */
          nav, .no-print, [data-sidebar], header:not(.print-header),
          button:not(.print-visible), .print\\:hidden {
            display: none !important;
          }
          /* Show print-only elements */
          .print-footer, .print-header {
            display: block !important;
          }
          /* Page setup */
          @page {
            size: letter;
            margin: 0.75in;
          }
          body {
            font-size: 11pt;
            line-height: 1.4;
          }
          /* Ensure backgrounds print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
