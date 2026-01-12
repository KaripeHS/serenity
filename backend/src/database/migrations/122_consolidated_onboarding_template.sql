-- ============================================================
-- Migration 122: Consolidated Onboarding Template
-- Serenity Care Partners
--
-- Updates the default onboarding template from 24 items to
-- 12 consolidated smart steps with digital form integration
-- ============================================================

-- Update the default caregiver onboarding template with consolidated 12 steps
UPDATE onboarding_templates
SET
  template_name = 'Caregiver Onboarding Checklist',
  description = 'Streamlined 12-step onboarding checklist with digital forms, document uploads, and e-signatures',
  updated_at = NOW(),
  items = '[
    {
      "order": 1,
      "category": "paperwork",
      "task": "Tax & Payroll Setup",
      "description": "Complete W-4 tax withholding and direct deposit authorization",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 3,
      "itemType": "form",
      "formTypes": ["w4", "direct_deposit"],
      "consolidates": ["W-4 Form", "Direct Deposit Form"]
    },
    {
      "order": 2,
      "category": "paperwork",
      "task": "Employment Verification (I-9)",
      "description": "Complete I-9 form and upload required identity documents (List A or List B+C)",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 3,
      "itemType": "form",
      "formTypes": ["i9_section1"],
      "requiresUpload": true,
      "uploadCategories": ["identity_document", "work_authorization"],
      "consolidates": ["I-9 Form", "Identity Document Upload"]
    },
    {
      "order": 3,
      "category": "paperwork",
      "task": "Policy Acknowledgments",
      "description": "Read and sign Employee Handbook, HIPAA Agreement, and Privacy Policy",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 1,
      "itemType": "signature",
      "requiresSignature": true,
      "documents": ["employee_handbook", "hipaa_agreement", "privacy_policy"],
      "consolidates": ["Employee Handbook Acknowledgment", "HIPAA Confidentiality Agreement"]
    },
    {
      "order": 4,
      "category": "compliance",
      "task": "Background Clearances",
      "description": "HR initiates background check, OIG/SAM exclusion check, drug screen, and TB test",
      "required": true,
      "assignedRole": "hr",
      "daysToComplete": 14,
      "itemType": "task",
      "hrInitiated": true,
      "subItems": ["BCI/FBI Background Check", "OIG/SAM Exclusion Check", "Drug Screening", "TB Test"],
      "consolidates": ["BCI/FBI Background Check", "OIG/SAM Exclusion Check", "Drug Screening", "TB Test"]
    },
    {
      "order": 5,
      "category": "compliance",
      "task": "Licenses & Certifications",
      "description": "Upload copies of professional licenses, certifications, and CPR/First Aid cards",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 7,
      "itemType": "upload",
      "requiresUpload": true,
      "uploadCategories": ["license", "certification", "cpr_first_aid"],
      "hrVerificationRequired": true,
      "consolidates": ["Verify Credentials/Certifications", "CPR/First Aid Training"]
    },
    {
      "order": 6,
      "category": "training",
      "task": "Compliance Training",
      "description": "Complete HIPAA, Abuse/Neglect Reporting, and Infection Control training modules",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 7,
      "itemType": "video",
      "trainingModules": [
        {"id": "hipaa", "name": "HIPAA Basics", "duration": 15, "quizRequired": true},
        {"id": "abuse_neglect", "name": "Abuse & Neglect Reporting", "duration": 20, "quizRequired": true},
        {"id": "infection_control", "name": "Infection Control", "duration": 15, "quizRequired": true}
      ],
      "consolidates": ["HIPAA Training", "Abuse/Neglect Recognition Training", "Infection Control Training"]
    },
    {
      "order": 7,
      "category": "equipment",
      "task": "EVV & App Setup",
      "description": "Install Serenity mobile app, configure EVV, and complete system training",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 3,
      "itemType": "video",
      "trainingModules": [
        {"id": "evv_training", "name": "EVV System Training", "duration": 10, "quizRequired": false}
      ],
      "setupSteps": ["Download app", "Create login", "Enable location", "Complete test clock-in"],
      "consolidates": ["Set Up Mobile App", "EVV Training"]
    },
    {
      "order": 8,
      "category": "equipment",
      "task": "Equipment Issuance",
      "description": "Receive PPE kit and any required equipment",
      "required": true,
      "assignedRole": "hr",
      "daysToComplete": 1,
      "itemType": "task",
      "checklist": ["Gloves (box)", "Masks (pack)", "Hand sanitizer", "Gown (if applicable)", "ID badge"],
      "consolidates": ["Issue PPE Kit"]
    },
    {
      "order": 9,
      "category": "orientation",
      "task": "Orientation Session",
      "description": "Company culture, policies overview, and bonus program explanation",
      "required": true,
      "assignedRole": "hr",
      "daysToComplete": 7,
      "itemType": "meeting",
      "meetingType": "in_person_or_video",
      "agenda": ["Company mission & values", "Policies & procedures", "Bonus program overview", "Benefits information"],
      "consolidates": ["Company Mission & Values Overview", "Review Policies & Procedures", "Explain Bonus Program"]
    },
    {
      "order": 10,
      "category": "introductions",
      "task": "Team Introduction",
      "description": "Meet scheduling coordinators and key team members",
      "required": true,
      "assignedRole": "supervisor",
      "daysToComplete": 7,
      "itemType": "meeting",
      "meetingType": "in_person",
      "keyContacts": ["Scheduling team", "HR contact", "Supervisor", "On-call coordinator"],
      "consolidates": ["Meet Scheduling Team"]
    },
    {
      "order": 11,
      "category": "first_assignment",
      "task": "Field Training",
      "description": "Shadow an experienced caregiver and complete first supervised client visit",
      "required": true,
      "assignedRole": "supervisor",
      "daysToComplete": 21,
      "itemType": "task",
      "milestones": [
        {"name": "Shadow shift completed", "daysToComplete": 7},
        {"name": "First supervised visit completed", "daysToComplete": 14}
      ],
      "consolidates": ["Shadow Experienced Caregiver", "Complete First Supervised Visit"]
    },
    {
      "order": 12,
      "category": "first_assignment",
      "task": "30-Day Review",
      "description": "Performance check-in meeting with supervisor",
      "required": true,
      "assignedRole": "supervisor",
      "daysToComplete": 30,
      "itemType": "meeting",
      "meetingType": "in_person",
      "reviewTopics": ["Performance feedback", "Questions & concerns", "Goals for next 60 days", "Training gaps"],
      "consolidates": ["30-Day Check-In Meeting"]
    }
  ]'::jsonb
WHERE template_name = 'Caregiver Onboarding Checklist';

-- Also create a version for existing organizations that may have the old template
-- This will update any organization's default template
UPDATE onboarding_templates
SET
  description = 'Streamlined 12-step onboarding checklist with digital forms, document uploads, and e-signatures',
  updated_at = NOW(),
  items = '[
    {
      "order": 1,
      "category": "paperwork",
      "task": "Tax & Payroll Setup",
      "description": "Complete W-4 tax withholding and direct deposit authorization",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 3,
      "itemType": "form",
      "formTypes": ["w4", "direct_deposit"]
    },
    {
      "order": 2,
      "category": "paperwork",
      "task": "Employment Verification (I-9)",
      "description": "Complete I-9 form and upload required identity documents (List A or List B+C)",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 3,
      "itemType": "form",
      "formTypes": ["i9_section1"],
      "requiresUpload": true,
      "uploadCategories": ["identity_document", "work_authorization"]
    },
    {
      "order": 3,
      "category": "paperwork",
      "task": "Policy Acknowledgments",
      "description": "Read and sign Employee Handbook, HIPAA Agreement, and Privacy Policy",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 1,
      "itemType": "signature",
      "requiresSignature": true,
      "documents": ["employee_handbook", "hipaa_agreement", "privacy_policy"]
    },
    {
      "order": 4,
      "category": "compliance",
      "task": "Background Clearances",
      "description": "HR initiates background check, OIG/SAM exclusion check, drug screen, and TB test",
      "required": true,
      "assignedRole": "hr",
      "daysToComplete": 14,
      "itemType": "task",
      "hrInitiated": true,
      "subItems": ["BCI/FBI Background Check", "OIG/SAM Exclusion Check", "Drug Screening", "TB Test"]
    },
    {
      "order": 5,
      "category": "compliance",
      "task": "Licenses & Certifications",
      "description": "Upload copies of professional licenses, certifications, and CPR/First Aid cards",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 7,
      "itemType": "upload",
      "requiresUpload": true,
      "uploadCategories": ["license", "certification", "cpr_first_aid"],
      "hrVerificationRequired": true
    },
    {
      "order": 6,
      "category": "training",
      "task": "Compliance Training",
      "description": "Complete HIPAA, Abuse/Neglect Reporting, and Infection Control training modules",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 7,
      "itemType": "video",
      "trainingModules": [
        {"id": "hipaa", "name": "HIPAA Basics", "duration": 15, "quizRequired": true},
        {"id": "abuse_neglect", "name": "Abuse & Neglect Reporting", "duration": 20, "quizRequired": true},
        {"id": "infection_control", "name": "Infection Control", "duration": 15, "quizRequired": true}
      ]
    },
    {
      "order": 7,
      "category": "equipment",
      "task": "EVV & App Setup",
      "description": "Install Serenity mobile app, configure EVV, and complete system training",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 3,
      "itemType": "video",
      "trainingModules": [
        {"id": "evv_training", "name": "EVV System Training", "duration": 10, "quizRequired": false}
      ],
      "setupSteps": ["Download app", "Create login", "Enable location", "Complete test clock-in"]
    },
    {
      "order": 8,
      "category": "equipment",
      "task": "Equipment Issuance",
      "description": "Receive PPE kit and any required equipment",
      "required": true,
      "assignedRole": "hr",
      "daysToComplete": 1,
      "itemType": "task",
      "checklist": ["Gloves (box)", "Masks (pack)", "Hand sanitizer", "Gown (if applicable)", "ID badge"]
    },
    {
      "order": 9,
      "category": "orientation",
      "task": "Orientation Session",
      "description": "Company culture, policies overview, and bonus program explanation",
      "required": true,
      "assignedRole": "hr",
      "daysToComplete": 7,
      "itemType": "meeting",
      "meetingType": "in_person_or_video",
      "agenda": ["Company mission & values", "Policies & procedures", "Bonus program overview", "Benefits information"]
    },
    {
      "order": 10,
      "category": "introductions",
      "task": "Team Introduction",
      "description": "Meet scheduling coordinators and key team members",
      "required": true,
      "assignedRole": "supervisor",
      "daysToComplete": 7,
      "itemType": "meeting",
      "meetingType": "in_person",
      "keyContacts": ["Scheduling team", "HR contact", "Supervisor", "On-call coordinator"]
    },
    {
      "order": 11,
      "category": "first_assignment",
      "task": "Field Training",
      "description": "Shadow an experienced caregiver and complete first supervised client visit",
      "required": true,
      "assignedRole": "supervisor",
      "daysToComplete": 21,
      "itemType": "task",
      "milestones": [
        {"name": "Shadow shift completed", "daysToComplete": 7},
        {"name": "First supervised visit completed", "daysToComplete": 14}
      ]
    },
    {
      "order": 12,
      "category": "first_assignment",
      "task": "30-Day Review",
      "description": "Performance check-in meeting with supervisor",
      "required": true,
      "assignedRole": "supervisor",
      "daysToComplete": 30,
      "itemType": "meeting",
      "meetingType": "in_person",
      "reviewTopics": ["Performance feedback", "Questions & concerns", "Goals for next 60 days", "Training gaps"]
    }
  ]'::jsonb
WHERE template_name LIKE '%Caregiver%'
  AND template_name LIKE '%Onboarding%';

-- Add a comment to document the change
COMMENT ON TABLE onboarding_templates IS 'Onboarding templates with consolidated 12-step checklist supporting digital forms, uploads, videos, and e-signatures';
