import { useState } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface AssessmentFormProps {
  data: any;
  onSave: (data: any, completedFields: string[]) => void;
  onClose: () => void;
}

// ADL/IADL scoring levels
const independenceLevel = [
  { value: 'independent', label: 'Independent', score: 0 },
  { value: 'supervision', label: 'Supervision Only', score: 1 },
  { value: 'limited_assist', label: 'Limited Assistance', score: 2 },
  { value: 'extensive_assist', label: 'Extensive Assistance', score: 3 },
  { value: 'total_dependence', label: 'Total Dependence', score: 4 },
];

// Sample assessment questions for each field
const assessmentQuestions: Record<string, string[]> = {
  // Vital Signs
  vitalsBP: [
    "May I take your blood pressure now?",
    "Have you been told your blood pressure is high or low?",
    "Are you taking any blood pressure medications?",
  ],
  vitalsPulse: [
    "Let me check your pulse.",
    "Do you ever feel your heart racing or skipping beats?",
    "Have you been diagnosed with any heart rhythm problems?",
  ],
  vitalsO2Sat: [
    "I'm going to check your oxygen level with this finger clip.",
    "Do you ever feel short of breath at rest?",
    "Do you use supplemental oxygen at home?",
  ],
  vitalsResp: [
    "Let me count your breathing rate.",
    "Do you ever feel short of breath?",
    "Do you have any breathing problems like asthma or COPD?",
  ],
  vitalsTemp: [
    "Let me take your temperature.",
    "Have you had any fever recently?",
    "Do you feel warm or chilled right now?",
  ],
  vitalsHeight: [
    "How tall are you?",
    "Has your height changed recently (shrinking)?",
    "Do you know your height in feet and inches?",
  ],
  vitalsWeight: [
    "How much do you weigh?",
    "Have you lost or gained weight recently without trying?",
    "When did you last weigh yourself?",
  ],
  // Medical History
  primaryDiagnosis: [
    "What is the main health condition you're dealing with?",
    "What did your doctor say is your primary diagnosis?",
    "What health problem brings you to need home care?",
  ],
  allergies: [
    "Are you allergic to any medications?",
    "Do you have any food allergies?",
    "Have you ever had a bad reaction to any medicine?",
    "What happens when you have an allergic reaction?",
  ],
  surgicalHistory: [
    "Have you had any surgeries in your life?",
    "When was your most recent surgery?",
    "Did you have any complications from your surgeries?",
    "Are you planning any upcoming surgeries?",
  ],
  // Medications
  currentMedications: [
    "Can you show me all the medications you're currently taking?",
    "Do you take any over-the-counter medications or supplements?",
    "Are you taking your medications as prescribed?",
    "Do you have trouble affording your medications?",
  ],
  polypharmacyConcern: [
    "Do you see multiple doctors who prescribe medications?",
    "Have you had a medication review recently?",
    "Do you ever skip doses because you have too many pills?",
  ],
  // ADL Assessment
  adlBathing: [
    "Can you describe how you take a bath or shower?",
    "Do you need help getting in or out of the tub/shower?",
    "Can you wash all parts of your body by yourself?",
    "Do you use any bathing equipment like a shower chair?",
  ],
  adlDressing: [
    "Can you pick out your clothes and get dressed by yourself?",
    "Do you have trouble with buttons, zippers, or shoelaces?",
    "Can you put on your socks and shoes independently?",
  ],
  adlToileting: [
    "Can you get to the bathroom by yourself?",
    "Do you need any help using the toilet?",
    "Do you have any accidents or leakage?",
    "Do you use any incontinence products?",
  ],
  adlTransferring: [
    "Can you get in and out of bed by yourself?",
    "Can you stand up from a chair without help?",
    "Do you use any equipment to help you transfer?",
  ],
  adlEating: [
    "Can you feed yourself without assistance?",
    "Do you have any trouble chewing or swallowing?",
    "Do you need your food cut up or modified?",
  ],
  adlContinence: [
    "Do you have control of your bladder?",
    "Do you have control of your bowels?",
    "How often do you have accidents?",
    "Do you use any pads, briefs, or catheters?",
  ],
  // IADL Assessment
  iadlMealPrep: [
    "Can you prepare your own meals?",
    "Can you use the stove safely?",
    "Who does the cooking in your household?",
  ],
  iadlHousekeeping: [
    "Can you do light housework like dishes or dusting?",
    "Can you do heavier tasks like vacuuming or laundry?",
    "Who helps you keep your home clean?",
  ],
  iadlMedManagement: [
    "Do you take your own medications or does someone help you?",
    "Do you use a pill box or reminder system?",
    "Have you ever taken the wrong dose by mistake?",
  ],
  iadlTransportation: [
    "Do you still drive?",
    "How do you get to doctor's appointments?",
    "Can you use public transportation?",
  ],
  iadlLaundry: [
    "Can you do your own laundry?",
    "Can you carry laundry baskets up and down stairs?",
    "Can you fold clothes and put them away?",
    "Do you use a washer and dryer independently?",
  ],
  iadlShopping: [
    "Can you do your own grocery shopping?",
    "Can you make a shopping list and stick to it?",
    "Do you need someone to drive you to the store?",
    "Can you carry your groceries into the house?",
  ],
  // Cognitive Status
  cognitiveStatus: [
    "Have you noticed any changes in your memory?",
    "Do family members worry about your memory?",
    "Have you been diagnosed with any memory problems?",
  ],
  memoryShortTerm: [
    "What did you have for breakfast today?",
    "Can you tell me three words I'm about to say? (apple, table, penny)",
    "What did we talk about at the beginning of our visit?",
  ],
  memoryLongTerm: [
    "Where did you grow up?",
    "What kind of work did you do?",
    "Can you tell me about your family?",
  ],
  orientation: [
    "What is today's date?",
    "What day of the week is it?",
    "Where are we right now?",
    "Who is the current president?",
  ],
  decisionMaking: [
    "Who makes decisions about your healthcare?",
    "Do you understand your medications and why you take them?",
    "Can you manage your own finances?",
  ],
  // Psychosocial
  depressionScreenPHQ2: [
    "Over the past 2 weeks, how often have you felt down, depressed, or hopeless?",
    "Over the past 2 weeks, how often have you had little interest or pleasure in doing things?",
    "Do you feel sad or blue most of the time?",
  ],
  anxietyLevel: [
    "Do you feel nervous or worried a lot?",
    "Do you have trouble relaxing?",
    "Do you ever feel panicky or have panic attacks?",
  ],
  socialSupport: [
    "Who do you have to help you if you need it?",
    "How often do you see family or friends?",
    "Do you feel lonely or isolated?",
  ],
  caregiverAvailable: [
    "Who is your main caregiver?",
    "Does someone live with you or check on you daily?",
    "Who would you call in an emergency?",
  ],
  caregiverStress: [
    "How is your caregiver handling things?",
    "Does your caregiver seem tired or stressed?",
    "Does your caregiver get breaks or respite?",
  ],
  behavioralConcerns: [
    "Do you ever feel confused about where you are?",
    "Have you ever wandered away from home?",
    "Do you sometimes feel agitated or upset?",
    "Do symptoms get worse in the evening (sundowning)?",
  ],
  // Physical Status
  mobility: [
    "How do you get around your home?",
    "Do you use a cane, walker, or wheelchair?",
    "Can you climb stairs?",
    "How far can you walk without resting?",
  ],
  fallRisk: [
    "Have you fallen in the past year?",
    "Do you feel unsteady when walking?",
    "Are you afraid of falling?",
    "Do you hold onto furniture when walking?",
  ],
  visionStatus: [
    "How is your eyesight?",
    "When did you last have your eyes checked?",
    "Do you wear glasses or contacts?",
    "Can you read medication labels?",
  ],
  hearingStatus: [
    "How is your hearing?",
    "Do you wear hearing aids?",
    "Do people tell you that you have the TV too loud?",
    "Do you have trouble hearing on the phone?",
  ],
  speechLanguage: [
    "Do you have any trouble speaking or being understood?",
    "Have you had a stroke that affected your speech?",
    "Do you have trouble finding the right words?",
  ],
  painLevel: [
    "On a scale of 0-10, how would you rate your pain right now?",
    "Is your pain constant or does it come and go?",
    "What makes your pain better or worse?",
  ],
  painLocation: [
    "Where does it hurt?",
    "Can you point to where you feel pain?",
    "Does the pain spread to other areas?",
  ],
  skinCondition: [
    "Do you have any sores or wounds on your skin?",
    "Is your skin dry or fragile?",
    "Have you noticed any rashes or skin changes?",
  ],
  // Home Environment
  homeType: [
    "What type of home do you live in?",
    "Do you live in a house, apartment, or other setting?",
    "Is this your own home or assisted living?",
  ],
  homeAccess: [
    "Are there stairs to get into your home?",
    "How many steps do you have to climb?",
    "Do you have a ramp or elevator?",
  ],
  homeHazards: [
    "Do you have throw rugs that could cause tripping?",
    "Is your home well-lit, especially at night?",
    "Do you have grab bars in the bathroom?",
    "Are there any pets that could cause falls?",
  ],
  dmeInHome: [
    "Do you have a hospital bed or special equipment at home?",
    "Do you use a walker, wheelchair, or other devices?",
    "Do you have a shower chair or toilet riser?",
  ],
  emergencyPlanInPlace: [
    "Do you have a plan for emergencies?",
    "Do you have emergency numbers posted?",
    "Do you have a medical alert device?",
  ],
  // Risk Assessment
  fallRiskScore: [
    "Have you fallen in the past 6 months?",
    "Do you take 4 or more medications?",
    "Do you have balance problems or use an assistive device?",
  ],
  pressureUlcerRisk: [
    "Do you spend most of your time in bed or a chair?",
    "Can you change positions by yourself?",
    "Do you have any skin breakdown or redness?",
  ],
  nutritionRisk: [
    "Have you lost weight without trying?",
    "Do you have a good appetite?",
    "Do you eat at least 2 meals a day?",
  ],
  socialIsolationRisk: [
    "How often do you leave your home?",
    "Do you have regular visitors?",
    "Do you feel connected to your community?",
  ],
  abuseNeglectRisk: [
    "Do you feel safe at home?",
    "Has anyone ever hurt you or threatened you?",
    "Do you have control over your own money?",
    "Does anyone make you feel afraid?",
  ],
  elopementRisk: [
    "Have you ever left home and gotten lost?",
    "Do you sometimes forget where you are?",
    "Do you try to leave the house at night?",
  ],
};

// HelpTooltip component
function HelpTooltip({ fieldName }: { fieldName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const questions = assessmentQuestions[fieldName];

  if (!questions || questions.length === 0) return null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="text-gray-400 hover:text-primary-600 transition-colors ml-1"
        title="Sample assessment questions"
      >
        <QuestionMarkCircleIcon className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute z-50 left-0 top-6 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-left">
          <div className="text-xs font-semibold text-gray-700 mb-2">Sample Questions to Ask:</div>
          <ul className="space-y-1.5">
            {questions.map((q, i) => (
              <li key={i} className="text-xs text-gray-600 flex gap-2">
                <span className="text-primary-500 font-medium shrink-0">{i + 1}.</span>
                <span>"{q}"</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 italic">Click anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function AssessmentForm({ data, onSave, onClose }: AssessmentFormProps) {
  const [formData, setFormData] = useState({
    // Assessment Details
    assessmentDate: data?.assessmentDate || '',
    assessorName: data?.assessorName || '',
    assessorCredentials: data?.assessorCredentials || '',

    // Vital Signs & Measurements
    vitalsBP: data?.vitalsBP || '',
    vitalsBPNA: data?.vitalsBPNA || false,
    vitalsPulse: data?.vitalsPulse || '',
    vitalsPulseNA: data?.vitalsPulseNA || false,
    vitalsResp: data?.vitalsResp || '',
    vitalsRespNA: data?.vitalsRespNA || false,
    vitalsTemp: data?.vitalsTemp || '',
    vitalsTempNA: data?.vitalsTempNA || false,
    vitalsO2Sat: data?.vitalsO2Sat || '',
    vitalsO2SatNA: data?.vitalsO2SatNA || false,
    vitalsHeight: data?.vitalsHeight || '',
    vitalsHeightNA: data?.vitalsHeightNA || false,
    vitalsWeight: data?.vitalsWeight || '',
    vitalsWeightNA: data?.vitalsWeightNA || false,
    vitalsNotes: data?.vitalsNotes || '',

    // Medical History
    primaryDiagnosis: data?.primaryDiagnosis || '',
    primaryDiagnosisCode: data?.primaryDiagnosisCode || '',
    secondaryDiagnoses: data?.secondaryDiagnoses || '',
    surgicalHistory: data?.surgicalHistory || '',
    surgicalHistoryNA: data?.surgicalHistoryNA || false,
    allergies: data?.allergies || '',
    allergiesNKDA: data?.allergiesNKDA || false,
    medicalHistoryNotes: data?.medicalHistoryNotes || '',

    // Medications
    currentMedications: data?.currentMedications || '',
    currentMedicationsNA: data?.currentMedicationsNA || false,
    medicationAllergies: data?.medicationAllergies || '',
    medicationAllergiesNKDA: data?.medicationAllergiesNKDA || false,
    polypharmacyConcern: data?.polypharmacyConcern || '',
    medicationNotes: data?.medicationNotes || '',

    // ADL Assessment
    adlBathing: data?.adlBathing || '',
    adlDressing: data?.adlDressing || '',
    adlToileting: data?.adlToileting || '',
    adlTransferring: data?.adlTransferring || '',
    adlEating: data?.adlEating || '',
    adlContinence: data?.adlContinence || '',
    adlNotes: data?.adlNotes || '',

    // IADL Assessment
    iadlMealPrep: data?.iadlMealPrep || '',
    iadlHousekeeping: data?.iadlHousekeeping || '',
    iadlLaundry: data?.iadlLaundry || '',
    iadlMedManagement: data?.iadlMedManagement || '',
    iadlTransportation: data?.iadlTransportation || '',
    iadlShopping: data?.iadlShopping || '',
    iadlNotes: data?.iadlNotes || '',

    // Cognitive Status
    cognitiveStatus: data?.cognitiveStatus || '',
    memoryShortTerm: data?.memoryShortTerm || '',
    memoryLongTerm: data?.memoryLongTerm || '',
    orientation: data?.orientation || '',
    decisionMaking: data?.decisionMaking || '',
    cognitiveNotes: data?.cognitiveNotes || '',

    // Psychosocial/Behavioral
    depressionScreenPHQ2: data?.depressionScreenPHQ2 || '',
    depressionScreenNA: data?.depressionScreenNA || false,
    anxietyLevel: data?.anxietyLevel || '',
    behavioralConcerns: data?.behavioralConcerns || '',
    behavioralConcernsNA: data?.behavioralConcernsNA || false,
    socialSupport: data?.socialSupport || '',
    caregiverAvailable: data?.caregiverAvailable || '',
    caregiverStress: data?.caregiverStress || '',
    caregiverStressNA: data?.caregiverStressNA || false,
    psychosocialNotes: data?.psychosocialNotes || '',

    // Physical Status
    mobility: data?.mobility || '',
    fallRisk: data?.fallRisk || '',
    visionStatus: data?.visionStatus || '',
    hearingStatus: data?.hearingStatus || '',
    speechLanguage: data?.speechLanguage || '',
    skinCondition: data?.skinCondition || '',
    painLevel: data?.painLevel || '0',
    painLocation: data?.painLocation || '',
    painLocationNA: data?.painLocationNA || false,
    physicalNotes: data?.physicalNotes || '',

    // Home Environment Safety
    homeType: data?.homeType || '',
    homeAccess: data?.homeAccess || '',
    homeHazards: data?.homeHazards || [] as string[],
    homeHazardsNA: data?.homeHazardsNA || false,
    dmeInHome: data?.dmeInHome || '',
    dmeInHomeNA: data?.dmeInHomeNA || false,
    emergencyPlanInPlace: data?.emergencyPlanInPlace || '',
    homeEnvironmentNotes: data?.homeEnvironmentNotes || '',

    // Risk Assessment
    fallRiskScore: data?.fallRiskScore || '',
    pressureUlcerRisk: data?.pressureUlcerRisk || '',
    nutritionRisk: data?.nutritionRisk || '',
    socialIsolationRisk: data?.socialIsolationRisk || '',
    abuseNeglectRisk: data?.abuseNeglectRisk || '',
    elopementRisk: data?.elopementRisk || '',
    elopementRiskNA: data?.elopementRiskNA || false,
    riskNotes: data?.riskNotes || '',
  });

  const requiredFieldMapping: Record<string, string[]> = {
    'Medical History': ['primaryDiagnosis'],
    'ADL Assessment': ['adlBathing', 'adlDressing', 'adlToileting', 'adlTransferring', 'adlEating', 'adlContinence'],
    'IADL Assessment': ['iadlMealPrep', 'iadlHousekeeping', 'iadlMedManagement', 'iadlTransportation'],
    'Cognitive Status': ['cognitiveStatus', 'orientation', 'decisionMaking'],
    'Physical Status': ['mobility', 'fallRisk', 'visionStatus', 'hearingStatus'],
    'Home Safety': ['homeType', 'homeAccess'],
    'Risk Assessment': ['fallRiskScore', 'pressureUlcerRisk', 'nutritionRisk'],
  };

  const getCompletedFields = () => {
    const completed: string[] = [];
    for (const [fieldName, keys] of Object.entries(requiredFieldMapping)) {
      const allFilled = keys.every(key => formData[key as keyof typeof formData]?.toString().trim());
      if (allFilled) {
        completed.push(fieldName);
      }
    }
    return completed;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  // Helper to render field with N/A checkbox
  const renderFieldWithNA = (
    fieldName: string,
    naFieldName: string,
    label: string,
    placeholder: string,
    type: 'text' | 'number' = 'text'
  ) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          {label}
          <HelpTooltip fieldName={fieldName} />
        </label>
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            name={naFieldName}
            checked={formData[naFieldName as keyof typeof formData] as boolean || false}
            onChange={handleChange}
            className="h-3 w-3 rounded border-gray-300 text-gray-500"
          />
          N/A
        </label>
      </div>
      <input
        type={type}
        name={fieldName}
        value={formData[fieldName as keyof typeof formData] as string || ''}
        onChange={handleChange}
        disabled={formData[naFieldName as keyof typeof formData] as boolean}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm ${
          formData[naFieldName as keyof typeof formData] ? 'bg-gray-100 text-gray-400' : ''
        }`}
        placeholder={formData[naFieldName as keyof typeof formData] ? 'N/A' : placeholder}
      />
    </div>
  );

  // Helper to render textarea with N/A checkbox
  const renderTextareaWithNA = (
    fieldName: string,
    naFieldName: string,
    label: string,
    placeholder: string
  ) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          {label}
          <HelpTooltip fieldName={fieldName} />
        </label>
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            name={naFieldName}
            checked={formData[naFieldName as keyof typeof formData] as boolean || false}
            onChange={handleChange}
            className="h-3 w-3 rounded border-gray-300 text-gray-500"
          />
          N/A
        </label>
      </div>
      <textarea
        name={fieldName}
        value={formData[fieldName as keyof typeof formData] as string || ''}
        onChange={handleChange}
        disabled={formData[naFieldName as keyof typeof formData] as boolean}
        rows={2}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm ${
          formData[naFieldName as keyof typeof formData] ? 'bg-gray-100 text-gray-400' : ''
        }`}
        placeholder={formData[naFieldName as keyof typeof formData] ? 'N/A' : placeholder}
      />
    </div>
  );

  const handleSave = () => {
    const completedFields = getCompletedFields();
    onSave(formData, completedFields);
    onClose();
  };

  const renderADLField = (name: string, label: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
        {label}
        <HelpTooltip fieldName={name} />
      </label>
      <select
        name={name}
        value={formData[name as keyof typeof formData] || ''}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
      >
        <option value="">Select level</option>
        {independenceLevel.map((level) => (
          <option key={level.value} value={level.value}>{level.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Assessment Header */}
      <div className="bg-primary-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Date</label>
            <input
              type="date"
              name="assessmentDate"
              value={formData.assessmentDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessor Name</label>
            <input
              type="text"
              name="assessorName"
              value={formData.assessorName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Name of assessor"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credentials</label>
            <input
              type="text"
              name="assessorCredentials"
              value={formData.assessorCredentials}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="RN, LPN, LSW, etc."
            />
          </div>
        </div>
      </div>

      {/* Vital Signs & Measurements */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Vital Signs & Measurements</h3>
        <p className="text-sm text-gray-500 mb-4">Record baseline vital signs. Check N/A if not applicable for this patient.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {renderFieldWithNA('vitalsBP', 'vitalsBPNA', 'Blood Pressure', '120/80 mmHg')}
          {renderFieldWithNA('vitalsPulse', 'vitalsPulseNA', 'Pulse (bpm)', '72')}
          {renderFieldWithNA('vitalsResp', 'vitalsRespNA', 'Respirations', '16/min')}
          {renderFieldWithNA('vitalsTemp', 'vitalsTempNA', 'Temperature', '98.6°F')}
          {renderFieldWithNA('vitalsO2Sat', 'vitalsO2SatNA', 'O2 Saturation', '98%')}
          {renderFieldWithNA('vitalsHeight', 'vitalsHeightNA', 'Height', '5\'8"')}
          {renderFieldWithNA('vitalsWeight', 'vitalsWeightNA', 'Weight', '165 lbs')}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Vitals Notes</label>
          <textarea
            name="vitalsNotes"
            value={formData.vitalsNotes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Any abnormalities or concerns..."
          />
        </div>
      </div>

      {/* Medical History */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Medical History <span className="text-danger-500">*</span></h3>
        <p className="text-sm text-gray-500 mb-4">Document diagnoses, surgical history, and allergies.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              Primary Diagnosis <span className="text-danger-500 ml-1">*</span>
              <HelpTooltip fieldName="primaryDiagnosis" />
            </label>
            <input
              type="text"
              name="primaryDiagnosis"
              value={formData.primaryDiagnosis}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Dementia, COPD, Heart Failure"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ICD-10 Code</label>
            <input
              type="text"
              name="primaryDiagnosisCode"
              value={formData.primaryDiagnosisCode}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., F03.90"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Diagnoses / Comorbidities</label>
          <textarea
            name="secondaryDiagnoses"
            value={formData.secondaryDiagnoses}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="List other diagnoses, one per line..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {renderTextareaWithNA('surgicalHistory', 'surgicalHistoryNA', 'Surgical History', 'List past surgeries with dates...')}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Allergies
                <HelpTooltip fieldName="allergies" />
              </label>
              <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  name="allergiesNKDA"
                  checked={formData.allergiesNKDA}
                  onChange={handleChange}
                  className="h-3 w-3 rounded border-gray-300 text-gray-500"
                />
                NKDA
              </label>
            </div>
            <textarea
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              disabled={formData.allergiesNKDA}
              rows={2}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                formData.allergiesNKDA ? 'bg-gray-100 text-gray-400' : ''
              }`}
              placeholder={formData.allergiesNKDA ? 'No Known Drug Allergies' : 'List allergies and reactions...'}
            />
          </div>
        </div>
      </div>

      {/* Medications */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Medications</h3>
        <p className="text-sm text-gray-500 mb-4">Review current medications and identify concerns.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Current Medications
                <HelpTooltip fieldName="currentMedications" />
              </label>
              <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  name="currentMedicationsNA"
                  checked={formData.currentMedicationsNA}
                  onChange={handleChange}
                  className="h-3 w-3 rounded border-gray-300 text-gray-500"
                />
                None
              </label>
            </div>
            <textarea
              name="currentMedications"
              value={formData.currentMedications}
              onChange={handleChange}
              disabled={formData.currentMedicationsNA}
              rows={4}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm ${
                formData.currentMedicationsNA ? 'bg-gray-100 text-gray-400' : ''
              }`}
              placeholder={formData.currentMedicationsNA ? 'No current medications' : 'List medications with dosages...'}
            />
          </div>
          <div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                Polypharmacy Concern (5+ medications)
                <HelpTooltip fieldName="polypharmacyConcern" />
              </label>
              <select
                name="polypharmacyConcern"
                value={formData.polypharmacyConcern}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select</option>
                <option value="no">No - Less than 5 medications</option>
                <option value="yes_managed">Yes - Managed/Reviewed</option>
                <option value="yes_concern">Yes - Concern identified</option>
              </select>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Medication Notes</label>
              <textarea
                name="medicationNotes"
                value={formData.medicationNotes}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Compliance issues, side effects, interactions..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* ADL Assessment */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Activities of Daily Living (ADL) <span className="text-danger-500">*</span></h3>
        <p className="text-sm text-gray-500 mb-4">Assess the patient's ability to perform basic self-care activities.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {renderADLField('adlBathing', 'Bathing')}
          {renderADLField('adlDressing', 'Dressing')}
          {renderADLField('adlToileting', 'Toileting')}
          {renderADLField('adlTransferring', 'Transferring')}
          {renderADLField('adlEating', 'Eating')}
          {renderADLField('adlContinence', 'Continence')}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">ADL Notes</label>
          <textarea
            name="adlNotes"
            value={formData.adlNotes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Additional notes about ADL assessment..."
          />
        </div>
      </div>

      {/* IADL Assessment */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Instrumental Activities of Daily Living (IADL) <span className="text-danger-500">*</span></h3>
        <p className="text-sm text-gray-500 mb-4">Assess the patient's ability to perform complex daily activities.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {renderADLField('iadlMealPrep', 'Meal Preparation')}
          {renderADLField('iadlHousekeeping', 'Housekeeping')}
          {renderADLField('iadlLaundry', 'Laundry')}
          {renderADLField('iadlMedManagement', 'Medication Management')}
          {renderADLField('iadlTransportation', 'Transportation')}
          {renderADLField('iadlShopping', 'Shopping')}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">IADL Notes</label>
          <textarea
            name="iadlNotes"
            value={formData.iadlNotes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Additional notes about IADL assessment..."
          />
        </div>
      </div>

      {/* Cognitive Status */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Cognitive Status <span className="text-danger-500">*</span></h3>
        <p className="text-sm text-gray-500 mb-4">Assess the patient's cognitive function and mental status.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              Overall Cognitive Status
              <HelpTooltip fieldName="cognitiveStatus" />
            </label>
            <select
              name="cognitiveStatus"
              value={formData.cognitiveStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select status</option>
              <option value="intact">Intact</option>
              <option value="mild_impairment">Mild Impairment</option>
              <option value="moderate_impairment">Moderate Impairment</option>
              <option value="severe_impairment">Severe Impairment</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              Short-term Memory
              <HelpTooltip fieldName="memoryShortTerm" />
            </label>
            <select
              name="memoryShortTerm"
              value={formData.memoryShortTerm}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select status</option>
              <option value="ok">OK - Seems/appears to recall</option>
              <option value="impaired">Impaired - Memory problem</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              Long-term Memory
              <HelpTooltip fieldName="memoryLongTerm" />
            </label>
            <select
              name="memoryLongTerm"
              value={formData.memoryLongTerm}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select status</option>
              <option value="ok">OK - Seems/appears to recall</option>
              <option value="impaired">Impaired - Memory problem</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              Orientation
              <HelpTooltip fieldName="orientation" />
            </label>
            <select
              name="orientation"
              value={formData.orientation}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select status</option>
              <option value="oriented_x4">Oriented x4 (person, place, time, situation)</option>
              <option value="oriented_x3">Oriented x3</option>
              <option value="oriented_x2">Oriented x2</option>
              <option value="oriented_x1">Oriented x1</option>
              <option value="disoriented">Disoriented</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              Decision Making
              <HelpTooltip fieldName="decisionMaking" />
            </label>
            <select
              name="decisionMaking"
              value={formData.decisionMaking}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select status</option>
              <option value="independent">Independent</option>
              <option value="modified_independence">Modified Independence</option>
              <option value="moderately_impaired">Moderately Impaired</option>
              <option value="severely_impaired">Severely Impaired</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cognitive Notes</label>
          <textarea
            name="cognitiveNotes"
            value={formData.cognitiveNotes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Additional notes about cognitive status..."
          />
        </div>
      </div>

      {/* Psychosocial/Behavioral */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Psychosocial & Behavioral</h3>
        <p className="text-sm text-gray-500 mb-4">Assess mental health, social support, and behavioral factors.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                PHQ-2 Depression Screen
                <HelpTooltip fieldName="depressionScreenPHQ2" />
              </label>
              <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  name="depressionScreenNA"
                  checked={formData.depressionScreenNA}
                  onChange={handleChange}
                  className="h-3 w-3 rounded border-gray-300 text-gray-500"
                />
                N/A
              </label>
            </div>
            <select
              name="depressionScreenPHQ2"
              value={formData.depressionScreenPHQ2}
              onChange={handleChange}
              disabled={formData.depressionScreenNA}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                formData.depressionScreenNA ? 'bg-gray-100 text-gray-400' : ''
              }`}
            >
              <option value="">Select score</option>
              <option value="0">0 - Negative</option>
              <option value="1-2">1-2 - Low concern</option>
              <option value="3-4">3-4 - Moderate concern</option>
              <option value="5-6">5-6 - Positive screen - refer</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              Anxiety Level
              <HelpTooltip fieldName="anxietyLevel" />
            </label>
            <select
              name="anxietyLevel"
              value={formData.anxietyLevel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select level</option>
              <option value="none">None observed</option>
              <option value="mild">Mild anxiety</option>
              <option value="moderate">Moderate anxiety</option>
              <option value="severe">Severe anxiety</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              Social Support
              <HelpTooltip fieldName="socialSupport" />
            </label>
            <select
              name="socialSupport"
              value={formData.socialSupport}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select level</option>
              <option value="strong">Strong - Family/friends active</option>
              <option value="adequate">Adequate support</option>
              <option value="limited">Limited support</option>
              <option value="isolated">Socially isolated</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              Primary Caregiver Available
              <HelpTooltip fieldName="caregiverAvailable" />
            </label>
            <select
              name="caregiverAvailable"
              value={formData.caregiverAvailable}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select</option>
              <option value="yes_live_in">Yes - Lives with patient</option>
              <option value="yes_nearby">Yes - Nearby</option>
              <option value="limited">Limited availability</option>
              <option value="no">No caregiver</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Caregiver Stress Level
                <HelpTooltip fieldName="caregiverStress" />
              </label>
              <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  name="caregiverStressNA"
                  checked={formData.caregiverStressNA}
                  onChange={handleChange}
                  className="h-3 w-3 rounded border-gray-300 text-gray-500"
                />
                N/A
              </label>
            </div>
            <select
              name="caregiverStress"
              value={formData.caregiverStress}
              onChange={handleChange}
              disabled={formData.caregiverStressNA}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                formData.caregiverStressNA ? 'bg-gray-100 text-gray-400' : ''
              }`}
            >
              <option value="">Select level</option>
              <option value="low">Low - Managing well</option>
              <option value="moderate">Moderate - Some burden</option>
              <option value="high">High - Significant burden</option>
              <option value="burnout">Burnout - At risk</option>
            </select>
          </div>
          {renderTextareaWithNA('behavioralConcerns', 'behavioralConcernsNA', 'Behavioral Concerns', 'Wandering, aggression, agitation, sundowning...')}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Psychosocial Notes</label>
          <textarea
            name="psychosocialNotes"
            value={formData.psychosocialNotes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Additional notes about psychosocial assessment..."
          />
        </div>
      </div>

      {/* Physical Status */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Physical Status <span className="text-danger-500">*</span></h3>
        <p className="text-sm text-gray-500 mb-4">Assess the patient's physical health and functional status.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              Mobility
              <HelpTooltip fieldName="mobility" />
            </label>
            <select
              name="mobility"
              value={formData.mobility}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select status</option>
              <option value="ambulatory">Ambulatory (walks independently)</option>
              <option value="ambulatory_with_device">Ambulatory with Device</option>
              <option value="wheelchair">Wheelchair</option>
              <option value="bedbound">Bedbound</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              Fall Risk
              <HelpTooltip fieldName="fallRisk" />
            </label>
            <select
              name="fallRisk"
              value={formData.fallRisk}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select level</option>
              <option value="low">Low Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              Vision Status
              <HelpTooltip fieldName="visionStatus" />
            </label>
            <select
              name="visionStatus"
              value={formData.visionStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select status</option>
              <option value="adequate">Adequate</option>
              <option value="impaired">Impaired</option>
              <option value="severely_impaired">Severely Impaired</option>
              <option value="blind">Legally Blind</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              Hearing Status
              <HelpTooltip fieldName="hearingStatus" />
            </label>
            <select
              name="hearingStatus"
              value={formData.hearingStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select status</option>
              <option value="adequate">Adequate</option>
              <option value="impaired">Impaired</option>
              <option value="severely_impaired">Severely Impaired</option>
              <option value="deaf">Deaf</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              Skin Condition
              <HelpTooltip fieldName="skinCondition" />
            </label>
            <select
              name="skinCondition"
              value={formData.skinCondition}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select condition</option>
              <option value="intact">Intact</option>
              <option value="dry">Dry/Fragile</option>
              <option value="wounds">Open Wounds/Lesions</option>
              <option value="pressure_ulcers">Pressure Ulcers Present</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              Speech/Language
              <HelpTooltip fieldName="speechLanguage" />
            </label>
            <select
              name="speechLanguage"
              value={formData.speechLanguage}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select status</option>
              <option value="clear">Clear/Understandable</option>
              <option value="impaired">Impaired but understandable</option>
              <option value="severely_impaired">Severely impaired</option>
              <option value="nonverbal">Nonverbal</option>
              <option value="language_barrier">Language barrier</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">Pain Level (0-10)<HelpTooltip fieldName="painLevel" /></label>
            <input
              type="range"
              name="painLevel"
              min="0"
              max="10"
              value={formData.painLevel}
              onChange={handleChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 (None)</span>
              <span className="font-medium text-lg text-gray-900">{formData.painLevel}</span>
              <span>10 (Severe)</span>
            </div>
          </div>
          {renderFieldWithNA('painLocation', 'painLocationNA', 'Pain Location', 'e.g., Lower back, knees, joints')}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Physical Notes</label>
          <textarea
            name="physicalNotes"
            value={formData.physicalNotes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Additional notes about physical status..."
          />
        </div>
      </div>

      {/* Home Environment Safety */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Home Environment Safety <span className="text-danger-500">*</span></h3>
        <p className="text-sm text-gray-500 mb-4">Assess the patient's living environment for safety and accessibility.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">Home Type<HelpTooltip fieldName="homeType" /></label>
            <select
              name="homeType"
              value={formData.homeType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select type</option>
              <option value="single_family">Single Family Home</option>
              <option value="apartment">Apartment/Condo</option>
              <option value="mobile_home">Mobile Home</option>
              <option value="assisted_living">Assisted Living</option>
              <option value="group_home">Group Home</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">Home Access<HelpTooltip fieldName="homeAccess" /></label>
            <select
              name="homeAccess"
              value={formData.homeAccess}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select access</option>
              <option value="ground_level">Ground Level/No stairs</option>
              <option value="few_steps">Few steps (1-5)</option>
              <option value="multiple_stairs">Multiple stairs</option>
              <option value="elevator">Elevator accessible</option>
              <option value="ramp">Ramp available</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">Emergency Plan in Place<HelpTooltip fieldName="emergencyPlanInPlace" /></label>
            <select
              name="emergencyPlanInPlace"
              value={formData.emergencyPlanInPlace}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select</option>
              <option value="yes">Yes - Plan documented</option>
              <option value="partial">Partial - Needs review</option>
              <option value="no">No - Needs to be created</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center">DME in Home<HelpTooltip fieldName="dmeInHome" /></label>
              <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  name="dmeInHomeNA"
                  checked={formData.dmeInHomeNA}
                  onChange={handleChange}
                  className="h-3 w-3 rounded border-gray-300 text-gray-500"
                />
                None
              </label>
            </div>
            <input
              type="text"
              name="dmeInHome"
              value={formData.dmeInHome}
              onChange={handleChange}
              disabled={formData.dmeInHomeNA}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm ${
                formData.dmeInHomeNA ? 'bg-gray-100 text-gray-400' : ''
              }`}
              placeholder={formData.dmeInHomeNA ? 'No DME in home' : 'Walker, wheelchair, hospital bed...'}
            />
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center">Home Hazards Identified<HelpTooltip fieldName="homeHazards" /></label>
              <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  name="homeHazardsNA"
                  checked={formData.homeHazardsNA}
                  onChange={handleChange}
                  className="h-3 w-3 rounded border-gray-300 text-gray-500"
                />
                None
              </label>
            </div>
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 ${formData.homeHazardsNA ? 'opacity-50' : ''}`}>
              {['Throw rugs', 'Poor lighting', 'Clutter', 'No grab bars', 'Pets', 'Unsafe stairs'].map((hazard) => (
                <label key={hazard} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData.homeHazards as string[]).includes(hazard)}
                    disabled={formData.homeHazardsNA}
                    onChange={(e) => {
                      const current = formData.homeHazards as string[];
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, homeHazards: [...current, hazard] }));
                      } else {
                        setFormData(prev => ({ ...prev, homeHazards: current.filter(h => h !== hazard) }));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600"
                  />
                  {hazard}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Home Environment Notes</label>
          <textarea
            name="homeEnvironmentNotes"
            value={formData.homeEnvironmentNotes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Additional notes about home environment, accessibility concerns, safety recommendations..."
          />
        </div>
      </div>

      {/* Risk Assessment */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Risk Assessment <span className="text-danger-500">*</span></h3>
        <p className="text-sm text-gray-500 mb-4">Identify potential risks and safety concerns.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">Fall Risk Score<HelpTooltip fieldName="fallRiskScore" /></label>
            <select
              name="fallRiskScore"
              value={formData.fallRiskScore}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select score</option>
              <option value="0-24">0-24 (Low Risk)</option>
              <option value="25-44">25-44 (Moderate Risk)</option>
              <option value="45+">45+ (High Risk)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">Pressure Ulcer Risk<HelpTooltip fieldName="pressureUlcerRisk" /></label>
            <select
              name="pressureUlcerRisk"
              value={formData.pressureUlcerRisk}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select risk</option>
              <option value="low">Low Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">Nutrition Risk<HelpTooltip fieldName="nutritionRisk" /></label>
            <select
              name="nutritionRisk"
              value={formData.nutritionRisk}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select risk</option>
              <option value="low">Low Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">Social Isolation Risk<HelpTooltip fieldName="socialIsolationRisk" /></label>
            <select
              name="socialIsolationRisk"
              value={formData.socialIsolationRisk}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select risk</option>
              <option value="low">Low Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">Abuse/Neglect Risk<HelpTooltip fieldName="abuseNeglectRisk" /></label>
            <select
              name="abuseNeglectRisk"
              value={formData.abuseNeglectRisk}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select risk</option>
              <option value="none">No Indicators</option>
              <option value="low">Low Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="high">High Risk - Report Required</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center">Elopement Risk<HelpTooltip fieldName="elopementRisk" /></label>
              <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  name="elopementRiskNA"
                  checked={formData.elopementRiskNA}
                  onChange={handleChange}
                  className="h-3 w-3 rounded border-gray-300 text-gray-500"
                />
                N/A
              </label>
            </div>
            <select
              name="elopementRisk"
              value={formData.elopementRisk}
              onChange={handleChange}
              disabled={formData.elopementRiskNA}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                formData.elopementRiskNA ? 'bg-gray-100 text-gray-400' : ''
              }`}
            >
              <option value="">Select risk</option>
              <option value="none">No history/risk</option>
              <option value="low">Low Risk</option>
              <option value="moderate">Moderate Risk - Monitor</option>
              <option value="high">High Risk - Safety plan needed</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Risk Assessment Notes</label>
          <textarea
            name="riskNotes"
            value={formData.riskNotes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Additional notes about identified risks and mitigation plans..."
          />
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Completion Progress</span>
          <span className="text-sm text-gray-600">
            {getCompletedFields().length} of 7 required sections
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${(getCompletedFields().length / 7) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.keys(requiredFieldMapping).map((field) => (
            <span
              key={field}
              className={`text-xs px-2 py-1 rounded-full ${
                getCompletedFields().includes(field)
                  ? 'bg-success-100 text-success-700'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {field}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Save Progress
        </button>
      </div>
    </div>
  );
}
