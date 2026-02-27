import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { GATE_DEFINITIONS } from './hiring-form-registry';

interface GatePipelineTrackerProps {
  role: 'nurse' | 'caregiver';
  getGateStatus: (gate: number, role: 'nurse' | 'caregiver') => {
    complete: boolean;
    total: number;
    completed: number;
  };
  conditionalEmployment: {
    cleared: boolean;
    daysPassed?: number;
    daysRemaining?: number;
    alertLevel?: 'normal' | 'warning' | 'critical';
    clearanceDate?: string;
    startDate?: string;
  } | null;
}

export function GatePipelineTracker({ role, getGateStatus, conditionalEmployment }: GatePipelineTrackerProps) {
  const gates = GATE_DEFINITIONS.map(g => ({
    ...g,
    status: getGateStatus(g.gate, role),
  }));

  // Find current gate (first incomplete)
  const currentGateIndex = gates.findIndex(g => !g.status.complete);

  return (
    <div className="space-y-4">
      {/* Pipeline visualization */}
      <div className="flex items-center gap-1">
        {gates.map((gate, idx) => {
          const isComplete = gate.status.complete;
          const isCurrent = idx === currentGateIndex;
          const isPast = idx < currentGateIndex;

          return (
            <div key={gate.gate} className="flex items-center flex-1">
              {/* Gate circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    isComplete
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : isCurrent
                        ? 'bg-blue-100 border-blue-500 text-blue-700 ring-2 ring-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    gate.gate
                  )}
                </div>
                <div className={`mt-1 text-[10px] text-center leading-tight max-w-[80px] ${
                  isComplete ? 'text-green-700 font-medium' : isCurrent ? 'text-blue-700 font-medium' : 'text-gray-400'
                }`}>
                  {gate.name}
                </div>
                {isCurrent && gate.status.total > 0 && (
                  <div className="text-[9px] text-blue-500 mt-0.5">
                    {gate.status.completed}/{gate.status.total}
                  </div>
                )}
              </div>
              {/* Connector line */}
              {idx < gates.length - 1 && (
                <div className={`h-0.5 w-full min-w-[8px] mt-[-20px] ${
                  isPast || isComplete ? 'bg-green-400' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Conditional Employment Alert (Policy 11) */}
      {conditionalEmployment && !conditionalEmployment.cleared && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          conditionalEmployment.alertLevel === 'critical'
            ? 'bg-red-50 border border-red-200 text-red-800'
            : conditionalEmployment.alertLevel === 'warning'
              ? 'bg-amber-50 border border-amber-200 text-amber-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          {conditionalEmployment.alertLevel === 'critical' ? (
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 shrink-0" />
          ) : conditionalEmployment.alertLevel === 'warning' ? (
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0" />
          ) : (
            <ClockIcon className="w-5 h-5 text-blue-600 shrink-0" />
          )}
          <div>
            <span className="font-medium">Conditional Employment (Policy 11):</span>{' '}
            Day {conditionalEmployment.daysPassed} of 60 — {conditionalEmployment.daysRemaining} days remaining for BCI/FBI clearance
          </div>
        </div>
      )}
      {conditionalEmployment?.cleared && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-green-50 border border-green-200 text-green-800">
          <CheckCircleIcon className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <span className="font-medium">BCI Cleared:</span>{' '}
            {conditionalEmployment.clearanceDate} — Next recertification in 5 years
          </div>
        </div>
      )}
    </div>
  );
}
