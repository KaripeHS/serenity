import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Assessment Schema
const assessmentSchema = z.object({
    clientName: z.string().min(1, 'Client name is required'),
    age: z.number().min(50, 'Client must be at least 50'),
    diagnosis: z.string().optional(),
    mobility: z.enum(['independent', 'cane', 'walker', 'wheelchair', 'bedbound']),
    transferAssistance: z.enum(['none', 'stand-by', 'one-person', 'two-person', 'hoyt-lift']),
    incontinence: z.enum(['none', 'occasional', 'bladder', 'bowel', 'double']),
    cognitiveStatus: z.enum(['alert', 'forgetful', 'mild-dementia', 'advanced-dementia']),
    medicationManagement: z.enum(['independent', 'reminders', 'administration']),
    // Schedule defaults
    daysPerWeek: z.number().min(1).max(7).default(5)
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

// Care Configuration Schema
const careConfigSchema = z.object({
    rnHours: z.number().min(0).default(0),
    lpnHours: z.number().min(0).default(0),
    cnaHours: z.number().min(0).default(0),
    hhaHours: z.number().min(0).default(0),
});

type CareConfigValues = z.infer<typeof careConfigSchema>;

// Pricing Constants
const RATES = {
    RN: 85,
    LPN: 65,
    CNA: 45,
    HHA: 35
};

export const AssessmentWizard: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<'intake' | 'configuration' | 'proposal'>('intake');
    const [clientData, setClientData] = useState<AssessmentFormValues | null>(null);
    const [careConfig, setCareConfig] = useState<CareConfigValues>({ rnHours: 0, lpnHours: 0, cnaHours: 0, hhaHours: 0 });
    const [quote, setQuote] = useState<{ weeklyCost: number } | null>(null);

    // Forms
    const assessmentForm = useForm<AssessmentFormValues>({
        resolver: zodResolver(assessmentSchema)
    });

    const configForm = useForm<CareConfigValues>({
        resolver: zodResolver(careConfigSchema),
        defaultValues: { rnHours: 0, lpnHours: 0, cnaHours: 0, hhaHours: 0 }
    });

    // Create Proposal Mutation
    const createProposalMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/admin/proposals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to create proposal');
            return res.json();
        },
        onSuccess: () => {
            alert('Proposal saved as draft!');
            navigate('/dashboard/crm'); // Redirect to CRM pipeline
        }
    });

    const onAssessmentSubmit = (data: AssessmentFormValues) => {
        setClientData(data);
        setStep('configuration');
    };

    const onConfigSubmit = (data: CareConfigValues) => {
        setCareConfig(data);

        // Calculate Cost
        const dailyCost =
            (data.rnHours * RATES.RN) +
            (data.lpnHours * RATES.LPN) +
            (data.cnaHours * RATES.CNA) +
            (data.hhaHours * RATES.HHA);

        const weeklyCost = dailyCost * (clientData?.daysPerWeek || 5);
        setQuote({ weeklyCost });
        setStep('proposal');
    };

    const [searchParams] = useSearchParams();
    const leadId = searchParams.get('leadId');

    // Fetch Lead Data if leadId is present
    const { data: lead } = useQuery({
        queryKey: ['lead', leadId],
        queryFn: async () => {
            if (!leadId) return null;
            const res = await fetch(`/api/admin/leads/${leadId}`);
            if (!res.ok) throw new Error('Failed to fetch lead');
            const json = await res.json();
            return json.data;
        },
        enabled: !!leadId
    });

    // Pre-fill form when lead data loads
    useEffect(() => {
        if (lead) {
            assessmentForm.setValue('clientName', `${lead.firstName} ${lead.lastName}`);
        }
    }, [lead, assessmentForm]);

    const handleSaveDraft = () => {
        if (!clientData || !quote) return;

        if (!leadId) {
            alert('Error: No Lead ID found. Please start from the Lead Pipeline.');
            return;
        }

        createProposalMutation.mutate({
            leadId: leadId,
            careConfiguration: { ...careConfig, daysPerWeek: clientData.daysPerWeek },
            totalWeeklyCost: quote.weeklyCost,
            status: 'draft'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Progress Bar */}
                <div className="mb-8 flex items-center justify-between text-sm font-medium text-gray-500">
                    <span className={step === 'intake' ? 'text-indigo-600 font-bold' : ''}>1. Clinical Assessment</span>
                    <span className={step === 'configuration' ? 'text-indigo-600 font-bold' : ''}>2. Care Team Config</span>
                    <span className={step === 'proposal' ? 'text-indigo-600 font-bold' : ''}>3. Review & Save</span>
                </div>

                {step === 'intake' && (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="bg-indigo-600 px-8 py-6">
                            <h1 className="text-2xl font-bold text-white">New Client Assessment</h1>
                            <p className="text-indigo-100">Digital Intake & Acuity Scoring</p>
                        </div>

                        <form onSubmit={assessmentForm.handleSubmit(onAssessmentSubmit)} className="p-8 space-y-8">
                            {/* Demographics */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                                    <input {...assessmentForm.register('clientName')} className="w-full border-gray-300 rounded-lg" />
                                    {assessmentForm.formState.errors.clientName && <p className="text-red-500 text-sm">{assessmentForm.formState.errors.clientName.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                                    <input type="number" {...assessmentForm.register('age', { valueAsNumber: true })} className="w-full border-gray-300 rounded-lg" />
                                </div>
                            </div>

                            {/* Clinical Acuity */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobility Status</label>
                                    <select {...assessmentForm.register('mobility')} className="w-full border-gray-300 rounded-lg">
                                        <option value="independent">Independent</option>
                                        <option value="cane">Cane</option>
                                        <option value="walker">Walker</option>
                                        <option value="wheelchair">Wheelchair</option>
                                        <option value="bedbound">Bedbound (High Acuity)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cognitive Status</label>
                                    <select {...assessmentForm.register('cognitiveStatus')} className="w-full border-gray-300 rounded-lg">
                                        <option value="alert">Alert & Oriented</option>
                                        <option value="forgetful">Forgetful / Mild Confusion</option>
                                        <option value="mild-dementia">Mild Dementia</option>
                                        <option value="advanced-dementia">Advanced Dementia</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Days Per Week Coverage</label>
                                <input type="number" {...assessmentForm.register('daysPerWeek', { valueAsNumber: true })} className="w-full border-gray-300 rounded-lg" />
                            </div>

                            <div className="pt-6">
                                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg">
                                    Next: Configure Care Team
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {step === 'configuration' && (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="bg-indigo-600 px-8 py-6">
                            <h1 className="text-2xl font-bold text-white">Care Team Configuration</h1>
                            <p className="text-indigo-100">Select daily hours for each caregiver tier</p>
                        </div>

                        <form onSubmit={configForm.handleSubmit(onConfigSubmit)} className="p-8 space-y-8">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <h3 className="font-bold text-blue-900">Registered Nurse (RN) - ${RATES.RN}/hr</h3>
                                    <p className="text-sm text-blue-700 mb-2">For medication administration, wound care, and clinical oversight.</p>
                                    <div className="flex items-center gap-4">
                                        <label className="text-sm font-medium">Daily Hours:</label>
                                        <input type="number" {...configForm.register('rnHours', { valueAsNumber: true })} className="w-24 border-gray-300 rounded-lg" />
                                    </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <h3 className="font-bold text-green-900">Licensed Practical Nurse (LPN) - ${RATES.LPN}/hr</h3>
                                    <p className="text-sm text-green-700 mb-2">For routine clinical care and monitoring.</p>
                                    <div className="flex items-center gap-4">
                                        <label className="text-sm font-medium">Daily Hours:</label>
                                        <input type="number" {...configForm.register('lpnHours', { valueAsNumber: true })} className="w-24 border-gray-300 rounded-lg" />
                                    </div>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                    <h3 className="font-bold text-yellow-900">Certified Nursing Assistant (CNA) - ${RATES.CNA}/hr</h3>
                                    <p className="text-sm text-yellow-700 mb-2">For ADLs, bathing, dressing, and transfers.</p>
                                    <div className="flex items-center gap-4">
                                        <label className="text-sm font-medium">Daily Hours:</label>
                                        <input type="number" {...configForm.register('cnaHours', { valueAsNumber: true })} className="w-24 border-gray-300 rounded-lg" />
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="font-bold text-gray-900">Home Health Aide (HHA) - ${RATES.HHA}/hr</h3>
                                    <p className="text-sm text-gray-700 mb-2">For companionship, light housekeeping, and meal prep.</p>
                                    <div className="flex items-center gap-4">
                                        <label className="text-sm font-medium">Daily Hours:</label>
                                        <input type="number" {...configForm.register('hhaHours', { valueAsNumber: true })} className="w-24 border-gray-300 rounded-lg" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={() => setStep('intake')} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition">
                                    Back
                                </button>
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg">
                                    Review Proposal
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {step === 'proposal' && (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border-t-8 border-indigo-600">
                        <div className="p-12 text-center">
                            <div className="mb-8">
                                <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Care Proposal for {clientData?.clientName}</h2>
                                <p className="text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-12 text-left bg-gray-50 p-8 rounded-xl">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Care Configuration</h4>
                                    <ul className="space-y-1 text-gray-700">
                                        {careConfig.rnHours > 0 && <li>• RN: {careConfig.rnHours} hrs/day</li>}
                                        {careConfig.lpnHours > 0 && <li>• LPN: {careConfig.lpnHours} hrs/day</li>}
                                        {careConfig.cnaHours > 0 && <li>• CNA: {careConfig.cnaHours} hrs/day</li>}
                                        {careConfig.hhaHours > 0 && <li>• HHA: {careConfig.hhaHours} hrs/day</li>}
                                    </ul>
                                    <p className="mt-2 text-sm text-gray-500">Coverage: {clientData?.daysPerWeek} days/week</p>
                                </div>
                                <div className="text-right">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Estimated Investment</h4>
                                    <p className="text-4xl font-bold text-indigo-600">${quote?.weeklyCost.toLocaleString()}</p>
                                    <p className="text-sm text-gray-500 mt-1">Weekly Total</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleSaveDraft}
                                    disabled={createProposalMutation.isPending}
                                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition shadow-md"
                                >
                                    {createProposalMutation.isPending ? 'Saving...' : 'Save Draft & Submit for Approval'}
                                </button>
                                <button onClick={() => setStep('configuration')} className="w-full bg-white text-gray-600 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition">
                                    Edit Configuration
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
