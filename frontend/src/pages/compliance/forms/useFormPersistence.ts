import { useState, useEffect, useCallback, useRef } from 'react';

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  dataUrl?: string;
}

export interface AuditEntry {
  timestamp: string;
  action: 'FORM_OPENED' | 'FIELD_UPDATED' | 'FORM_SAVED' | 'FORM_RESET' | 'FILE_UPLOADED' | 'FILE_REMOVED' | 'FORM_SIGNED' | 'FORM_SUBMITTED';
  user: string;
  field?: string;
  details?: string;
  clientId?: string;
}

interface FormPersistenceReturn<T> {
  data: T;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  updateNestedField: (path: string, value: unknown) => void;
  resetForm: () => void;
  lastSaved: string | null;
  isDirty: boolean;
  uploadedFiles: UploadedFile[];
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (index: number) => void;
  auditTrail: AuditEntry[];
  addAuditEntry: (action: AuditEntry['action'], details?: string, field?: string) => void;
}

const STORAGE_PREFIX = 'serenity_form_';

function setNestedValue<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const result = JSON.parse(JSON.stringify(obj));
  let current: Record<string, unknown> = result;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (Array.isArray(current[key])) {
      current = current[key] as unknown as Record<string, unknown>;
    } else if (typeof current[key] === 'object' && current[key] !== null) {
      current = current[key] as Record<string, unknown>;
    } else {
      current[key] = {};
      current = current[key] as Record<string, unknown>;
    }
  }
  current[keys[keys.length - 1]] = value;
  return result;
}

const PATIENT_FORMS_INDEX_KEY = 'serenity_patient_forms_index';

interface PatientFormRecord {
  formId: string;
  formTitle: string;
  clientId: string;
  clientName: string;
  lastUpdated: string;
  hasSigned: boolean;
}

/** Maintain a cross-reference index so forms are auto-attached to patient records */
function updatePatientFormIndex(formId: string, data: Record<string, unknown>) {
  const clientId = data.clientId as string | undefined;
  if (!clientId) return;

  try {
    const indexRaw = localStorage.getItem(PATIENT_FORMS_INDEX_KEY);
    const index: Record<string, PatientFormRecord[]> = indexRaw ? JSON.parse(indexRaw) : {};

    if (!index[clientId]) index[clientId] = [];

    const existing = index[clientId].findIndex(r => r.formId === formId);
    const record: PatientFormRecord = {
      formId,
      formTitle: `Form ${formId}`,
      clientId,
      clientName: (data.clientName as string) || '',
      lastUpdated: new Date().toISOString(),
      hasSigned: Object.keys(data).some(k => k.toLowerCase().includes('signature') && data[k] !== null),
    };

    if (existing >= 0) {
      index[clientId][existing] = record;
    } else {
      index[clientId].push(record);
    }

    localStorage.setItem(PATIENT_FORMS_INDEX_KEY, JSON.stringify(index));
  } catch { /* ignore */ }
}

/** Get all forms attached to a specific patient */
export function getPatientForms(clientId: string): PatientFormRecord[] {
  try {
    const indexRaw = localStorage.getItem(PATIENT_FORMS_INDEX_KEY);
    if (indexRaw) {
      const index: Record<string, PatientFormRecord[]> = JSON.parse(indexRaw);
      return index[clientId] || [];
    }
  } catch { /* ignore */ }
  return [];
}

function getCurrentUserFromStorage(): string {
  try {
    const stored = localStorage.getItem('serenity_auth_user');
    if (stored) {
      const u = JSON.parse(stored);
      return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Unknown';
    }
  } catch { /* ignore */ }
  return 'Current User';
}

export function useFormPersistence<T extends object>(
  formId: string,
  defaultData: T
): FormPersistenceReturn<T> {
  const storageKey = `${STORAGE_PREFIX}${formId}`;
  const filesKey = `${storageKey}_files`;
  const auditKey = `${storageKey}_audit`;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  const [data, setData] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultData, ...parsed.data };
      }
    } catch {
      // ignore
    }
    return defaultData;
  });

  const [lastSaved, setLastSaved] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved).lastSaved || null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isDirty, setIsDirty] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(() => {
    try {
      const saved = localStorage.getItem(filesKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>(() => {
    try {
      const saved = localStorage.getItem(auditKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const addAuditEntry = useCallback((action: AuditEntry['action'], details?: string, field?: string) => {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action,
      user: getCurrentUserFromStorage(),
      field,
      details,
    };
    // Attach clientId if present in current form data
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}${formId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data?.clientId) entry.clientId = parsed.data.clientId;
      }
    } catch { /* ignore */ }

    setAuditTrail(prev => {
      const updated = [...prev, entry].slice(-200); // keep last 200 entries
      localStorage.setItem(auditKey, JSON.stringify(updated));
      return updated;
    });
  }, [auditKey, formId]);

  // Log form opened on mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      addAuditEntry('FORM_OPENED', `Form ${formId} opened`);
    }
  }, [addAuditEntry, formId]);

  // Debounced save to localStorage
  useEffect(() => {
    if (!isDirty) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const now = new Date().toISOString();
      localStorage.setItem(storageKey, JSON.stringify({ data, lastSaved: now }));
      setLastSaved(now);
      setIsDirty(false);
      // Auto-attach to patient record if form has a clientId
      updatePatientFormIndex(formId, data as unknown as Record<string, unknown>);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [data, isDirty, storageKey]);

  // Save uploaded files immediately
  useEffect(() => {
    localStorage.setItem(filesKey, JSON.stringify(uploadedFiles));
  }, [uploadedFiles, filesKey]);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Detect signature fields
    const fieldStr = String(field);
    if (fieldStr.toLowerCase().includes('signature') && value !== null) {
      addAuditEntry('FORM_SIGNED', `Signature captured`, fieldStr);
    }
  }, [addAuditEntry]);

  const updateNestedField = useCallback((path: string, value: unknown) => {
    setData(prev => setNestedValue(prev, path, value));
    setIsDirty(true);
  }, []);

  const resetForm = useCallback(() => {
    addAuditEntry('FORM_RESET', 'Form cleared to defaults');
    setData(defaultData);
    setIsDirty(true);
  }, [defaultData, addAuditEntry]);

  const addUploadedFile = useCallback((file: UploadedFile) => {
    setUploadedFiles(prev => [...prev, file]);
    addAuditEntry('FILE_UPLOADED', `Uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
  }, [addAuditEntry]);

  const removeUploadedFile = useCallback((index: number) => {
    setUploadedFiles(prev => {
      const removed = prev[index];
      if (removed) {
        addAuditEntry('FILE_REMOVED', `Removed: ${removed.name}`);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, [addAuditEntry]);

  return {
    data,
    updateField,
    updateNestedField,
    resetForm,
    lastSaved,
    isDirty,
    uploadedFiles,
    addUploadedFile,
    removeUploadedFile,
    auditTrail,
    addAuditEntry,
  };
}
