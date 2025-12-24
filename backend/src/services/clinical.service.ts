/**
 * Clinical Service
 * Handles Clinical Data (Care Plans, Meds, ADLs) for Mobile App and Console
 * Complete CRUD for care plans, medical info, and care tasks
 *
 * @module services/clinical
 */
import { createLogger } from '../utils/logger';
import { getDbClient } from '../database/client';

const logger = createLogger('clinical-service');

// Care task templates based on Ohio Non-Medical Home Health services
export const CARE_TASK_TEMPLATES = {
  PERSONAL_CARE: [
    { id: 'pc_bathing', category: 'personal_care', name: 'Bathing/Showering', serviceCode: 'T1019' },
    { id: 'pc_dressing', category: 'personal_care', name: 'Dressing Assistance', serviceCode: 'T1019' },
    { id: 'pc_grooming', category: 'personal_care', name: 'Grooming (hair, nails)', serviceCode: 'T1019' },
    { id: 'pc_toileting', category: 'personal_care', name: 'Toileting Assistance', serviceCode: 'T1019' },
    { id: 'pc_oral_care', category: 'personal_care', name: 'Oral Hygiene', serviceCode: 'T1019' },
    { id: 'pc_ambulation', category: 'personal_care', name: 'Ambulation/Transfer', serviceCode: 'T1019' },
    { id: 'pc_positioning', category: 'personal_care', name: 'Positioning/Turning', serviceCode: 'T1019' },
    { id: 'pc_skin_care', category: 'personal_care', name: 'Skin Care', serviceCode: 'T1019' },
  ],
  HOMEMAKER: [
    { id: 'hm_cleaning', category: 'homemaker', name: 'Light Housekeeping', serviceCode: 'S5130' },
    { id: 'hm_laundry', category: 'homemaker', name: 'Laundry', serviceCode: 'S5130' },
    { id: 'hm_meal_prep', category: 'homemaker', name: 'Meal Preparation', serviceCode: 'S5130' },
    { id: 'hm_dishes', category: 'homemaker', name: 'Dishwashing', serviceCode: 'S5130' },
    { id: 'hm_trash', category: 'homemaker', name: 'Trash Disposal', serviceCode: 'S5130' },
    { id: 'hm_bed_making', category: 'homemaker', name: 'Bed Making', serviceCode: 'S5130' },
  ],
  RESPITE: [
    { id: 'rs_supervision', category: 'respite', name: 'Supervision', serviceCode: 'S5150' },
    { id: 'rs_companionship', category: 'respite', name: 'Companionship', serviceCode: 'S5150' },
    { id: 'rs_activities', category: 'respite', name: 'Engagement Activities', serviceCode: 'S5150' },
    { id: 'rs_safety', category: 'respite', name: 'Safety Monitoring', serviceCode: 'S5150' },
  ],
  MEDICATION: [
    { id: 'med_reminder', category: 'medication', name: 'Medication Reminder', serviceCode: 'T1019' },
    { id: 'med_assist', category: 'medication', name: 'Self-Administration Assist', serviceCode: 'T1019' },
  ],
  ERRANDS: [
    { id: 'er_grocery', category: 'errands', name: 'Grocery Shopping', serviceCode: 'ERRANDS' },
    { id: 'er_pharmacy', category: 'errands', name: 'Pharmacy Pickup', serviceCode: 'ERRANDS' },
    { id: 'er_escort', category: 'errands', name: 'Escort to Appointment', serviceCode: 'ERRANDS' },
  ],
};

export interface CarePlanTask {
  id: string;
  category: string;
  name: string;
  serviceCode: string;
  frequency?: string;
  instructions?: string;
  required?: boolean;
}

export interface CarePlan {
  id: string;
  clientId: string;
  goals: string[];
  tasks: CarePlanTask[];
  medicalInfo: {
    allergies: string[];
    diagnoses: string[];
    medications: { name: string; dosage: string; frequency: string; instructions?: string }[];
    physicianName?: string;
    physicianPhone?: string;
  };
  specialInstructions?: string;
  preferences?: {
    preferredTimes?: string;
    culturalConsiderations?: string;
    communicationNotes?: string;
  };
  emergencyProcedures?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export class ClinicalService {
  private db = getDbClient();

  /**
   * Get Clinical Details for a Visit
   * used by Mobile App: GET /api/visits/:id/details
   */
  async getVisitDetails(visitId: string) {
    logger.info(`Fetching clinical details for visit: ${visitId}`);

    // 1. Fetch Visit & Client Details
    const visitResult = await this.db.query(
      `SELECT
          v.id,
          v.scheduled_start,
          v.scheduled_end,
          v.status,
          v.care_tasks,
          c.id as client_id,
          c.first_name,
          c.last_name,
          c.address,
          c.emergency_contacts,
          c.medical_info,
          c.care_plan
       FROM shifts v
       JOIN clients c ON v.client_id = c.id
       WHERE v.id = $1`,
      [visitId]
    );

    if (visitResult.rows.length === 0) {
      // Fallback: Check 'shifts' table if 'visits' is empty
      const shiftResult = await this.db.query(
        `SELECT
            s.id,
            s.scheduled_start,
            s.scheduled_end,
            s.status,
            '[]'::jsonb as care_tasks,
            c.id as client_id,
            c.first_name,
            c.last_name,
            c.address,
            c.emergency_contacts,
            c.medical_info,
            c.care_plan
         FROM shifts s
         JOIN clients c ON s.client_id = c.id
         WHERE s.id = $1`,
        [visitId]
      );

      if (shiftResult.rows.length === 0) {
        throw new Error('Visit not found');
      }
      visitResult.rows[0] = shiftResult.rows[0];
    }

    const row = visitResult.rows[0];

    const medicalInfo = typeof row.medical_info === 'string' ? JSON.parse(row.medical_info) : (row.medical_info || {});
    const carePlan = typeof row.care_plan === 'string' ? JSON.parse(row.care_plan) : (row.care_plan || {});
    const emergencyContacts = typeof row.emergency_contacts === 'string' ? JSON.parse(row.emergency_contacts) : (row.emergency_contacts || []);

    let address = row.address;
    if (typeof address === 'string') {
      try { address = JSON.parse(address); } catch { }
    }
    const addressStr = address ? `${address.street || ''}, ${address.city || ''}` : 'Address Unavailable';

    return {
      id: row.id,
      patient: {
        id: row.client_id,
        name: `${row.first_name} ${row.last_name}`,
        address: addressStr,
        emergencyContact: emergencyContacts[0] || { name: 'None', phone: 'N/A', relationship: 'N/A' },
        allergies: medicalInfo.allergies || [],
        diagnosis: medicalInfo.diagnosis || 'None listed'
      },
      carePlan: {
        id: carePlan.id || 'cp_default',
        tasks: row.care_tasks || carePlan.tasks || [],
        meds: medicalInfo.medications || []
      }
    };
  }

  /**
   * Get full care plan for a client
   */
  async getCarePlan(clientId: string): Promise<CarePlan | null> {
    logger.info(`Fetching care plan for client: ${clientId}`);

    const result = await this.db.query(
      `SELECT
        cp.id,
        cp.client_id,
        cp.goals,
        cp.tasks,
        cp.special_instructions,
        cp.preferences,
        cp.emergency_procedures,
        cp.created_at,
        cp.updated_at,
        cp.created_by,
        cp.updated_by,
        c.medical_info
       FROM care_plans cp
       JOIN clients c ON c.id = cp.client_id
       WHERE cp.client_id = $1 AND cp.status = 'active'
       ORDER BY cp.created_at DESC
       LIMIT 1`,
      [clientId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const medicalInfo = typeof row.medical_info === 'string'
      ? JSON.parse(row.medical_info)
      : (row.medical_info || {});

    return {
      id: row.id,
      clientId: row.client_id,
      goals: row.goals || [],
      tasks: row.tasks || [],
      medicalInfo: {
        allergies: medicalInfo.allergies || [],
        diagnoses: medicalInfo.diagnoses || [],
        medications: medicalInfo.medications || [],
        physicianName: medicalInfo.physician_name,
        physicianPhone: medicalInfo.physician_phone,
      },
      specialInstructions: row.special_instructions,
      preferences: row.preferences || {},
      emergencyProcedures: row.emergency_procedures,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
    };
  }

  /**
   * Create a new care plan
   */
  async createCarePlan(
    clientId: string,
    organizationId: string,
    data: {
      goals?: string[];
      tasks?: CarePlanTask[];
      specialInstructions?: string;
      preferences?: any;
      emergencyProcedures?: string;
    },
    createdBy: string
  ): Promise<string> {
    logger.info(`Creating care plan for client: ${clientId}`);

    // Deactivate any existing care plans
    await this.db.query(
      `UPDATE care_plans SET status = 'superseded', updated_at = NOW()
       WHERE client_id = $1 AND status = 'active'`,
      [clientId]
    );

    const result = await this.db.query(
      `INSERT INTO care_plans (
        client_id,
        organization_id,
        goals,
        tasks,
        special_instructions,
        preferences,
        emergency_procedures,
        status,
        created_by,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, NOW())
      RETURNING id`,
      [
        clientId,
        organizationId,
        JSON.stringify(data.goals || []),
        JSON.stringify(data.tasks || []),
        data.specialInstructions || null,
        JSON.stringify(data.preferences || {}),
        data.emergencyProcedures || null,
        createdBy,
      ]
    );

    logger.info(`Care plan created: ${result.rows[0].id}`);
    return result.rows[0].id;
  }

  /**
   * Update care plan
   */
  async updateCarePlan(
    carePlanId: string,
    data: {
      goals?: string[];
      tasks?: CarePlanTask[];
      specialInstructions?: string;
      preferences?: any;
      emergencyProcedures?: string;
    },
    updatedBy: string
  ): Promise<void> {
    logger.info(`Updating care plan: ${carePlanId}`);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.goals !== undefined) {
      updates.push(`goals = $${paramIndex++}`);
      values.push(JSON.stringify(data.goals));
    }
    if (data.tasks !== undefined) {
      updates.push(`tasks = $${paramIndex++}`);
      values.push(JSON.stringify(data.tasks));
    }
    if (data.specialInstructions !== undefined) {
      updates.push(`special_instructions = $${paramIndex++}`);
      values.push(data.specialInstructions);
    }
    if (data.preferences !== undefined) {
      updates.push(`preferences = $${paramIndex++}`);
      values.push(JSON.stringify(data.preferences));
    }
    if (data.emergencyProcedures !== undefined) {
      updates.push(`emergency_procedures = $${paramIndex++}`);
      values.push(data.emergencyProcedures);
    }

    updates.push(`updated_by = $${paramIndex++}`);
    values.push(updatedBy);
    updates.push(`updated_at = NOW()`);
    values.push(carePlanId);

    await this.db.query(
      `UPDATE care_plans SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    logger.info(`Care plan updated: ${carePlanId}`);
  }

  /**
   * Update client medical info
   */
  async updateMedicalInfo(
    clientId: string,
    medicalInfo: {
      allergies?: string[];
      diagnoses?: string[];
      medications?: { name: string; dosage: string; frequency: string; instructions?: string }[];
      physicianName?: string;
      physicianPhone?: string;
    },
    updatedBy: string
  ): Promise<void> {
    logger.info(`Updating medical info for client: ${clientId}`);

    // Get current medical info
    const current = await this.db.query(
      'SELECT medical_info FROM clients WHERE id = $1',
      [clientId]
    );

    const existingInfo = current.rows[0]?.medical_info || {};
    const mergedInfo = { ...existingInfo, ...medicalInfo };

    await this.db.query(
      `UPDATE clients
       SET medical_info = $1, updated_at = NOW(), updated_by = $2
       WHERE id = $3`,
      [JSON.stringify(mergedInfo), updatedBy, clientId]
    );

    logger.info(`Medical info updated for client: ${clientId}`);
  }

  /**
   * Get care task templates
   */
  getCareTaskTemplates(category?: string): CarePlanTask[] {
    if (category) {
      const key = category.toUpperCase() as keyof typeof CARE_TASK_TEMPLATES;
      return CARE_TASK_TEMPLATES[key] || [];
    }

    // Return all templates
    return Object.values(CARE_TASK_TEMPLATES).flat();
  }

  /**
   * Document visit tasks completion
   */
  async documentVisitTasks(
    visitId: string,
    tasks: { taskId: string; completed: boolean; notes?: string; completedAt?: Date }[],
    caregiverId: string
  ): Promise<void> {
    logger.info(`Documenting tasks for visit: ${visitId}`);

    // Get existing visit tasks
    const visit = await this.db.query(
      'SELECT care_tasks FROM shifts WHERE id = $1',
      [visitId]
    );

    if (visit.rows.length === 0) {
      // Try shifts table
      const shift = await this.db.query(
        'SELECT id FROM shifts WHERE id = $1',
        [visitId]
      );
      if (shift.rows.length === 0) {
        throw new Error('Visit not found');
      }
    }

    // Update with task completion status
    const taskDocs = tasks.map(t => ({
      ...t,
      completedAt: t.completedAt || new Date(),
      documentedBy: caregiverId,
    }));

    await this.db.query(
      `UPDATE shifts
       SET care_tasks = $1, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(taskDocs), visitId]
    );

    // Also update in shifts if exists
    await this.db.query(
      `UPDATE shifts
       SET care_tasks = $1, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(taskDocs), visitId]
    );

    logger.info(`Tasks documented for visit: ${visitId}`, { taskCount: tasks.length });
  }

  /**
   * Get client intake checklist
   */
  getIntakeChecklist(): {
    section: string;
    items: { id: string; name: string; required: boolean; description?: string }[];
  }[] {
    return [
      {
        section: 'Personal Information',
        items: [
          { id: 'name', name: 'Full Legal Name', required: true },
          { id: 'dob', name: 'Date of Birth', required: true },
          { id: 'ssn_last4', name: 'SSN Last 4 Digits', required: true },
          { id: 'medicaid', name: 'Medicaid Number', required: true },
          { id: 'address', name: 'Physical Address', required: true },
          { id: 'phone', name: 'Phone Number', required: true },
          { id: 'email', name: 'Email Address', required: false },
        ],
      },
      {
        section: 'Emergency Contacts',
        items: [
          { id: 'emergency_primary', name: 'Primary Emergency Contact', required: true },
          { id: 'emergency_secondary', name: 'Secondary Emergency Contact', required: false },
          { id: 'power_of_attorney', name: 'Power of Attorney (if applicable)', required: false },
        ],
      },
      {
        section: 'Medical Information',
        items: [
          { id: 'physician', name: 'Primary Care Physician', required: true },
          { id: 'diagnoses', name: 'Medical Diagnoses', required: true },
          { id: 'allergies', name: 'Allergies', required: true },
          { id: 'medications', name: 'Current Medications', required: true },
          { id: 'dnr', name: 'DNR Status', required: true, description: 'Do Not Resuscitate order if applicable' },
        ],
      },
      {
        section: 'Service Assessment',
        items: [
          { id: 'adl_assessment', name: 'ADL Assessment', required: true, description: 'Activities of Daily Living assessment' },
          { id: 'service_needs', name: 'Service Needs Identification', required: true },
          { id: 'schedule_preferences', name: 'Scheduling Preferences', required: true },
          { id: 'cultural_considerations', name: 'Cultural/Religious Considerations', required: false },
        ],
      },
      {
        section: 'Documentation & Consent',
        items: [
          { id: 'evv_consent', name: 'EVV Consent Form', required: true, description: 'Electronic Visit Verification consent' },
          { id: 'hipaa', name: 'HIPAA Authorization', required: true },
          { id: 'service_agreement', name: 'Service Agreement', required: true },
          { id: 'medicaid_auth', name: 'Medicaid Authorization', required: true, description: 'Prior authorization if required' },
          { id: 'photo_id', name: 'Photo ID Copy', required: true },
          { id: 'insurance_card', name: 'Medicaid/Insurance Card Copy', required: true },
        ],
      },
      {
        section: 'Home Safety',
        items: [
          { id: 'home_assessment', name: 'Home Safety Assessment', required: true },
          { id: 'access_instructions', name: 'Home Access Instructions', required: true },
          { id: 'pets', name: 'Pets in Home', required: false },
          { id: 'hazards', name: 'Known Hazards', required: false },
        ],
      },
    ];
  }

  /**
   * Validate client intake completeness
   */
  async validateIntake(clientId: string): Promise<{
    complete: boolean;
    completeness: number;
    missing: string[];
    sections: { section: string; complete: boolean; items: { id: string; name: string; complete: boolean }[] }[];
  }> {
    const client = await this.db.query(
      `SELECT c.*, cp.id as care_plan_id, cp.goals, cp.tasks
       FROM clients c
       LEFT JOIN care_plans cp ON cp.client_id = c.id AND cp.status = 'active'
       WHERE c.id = $1`,
      [clientId]
    );

    if (client.rows.length === 0) {
      throw new Error('Client not found');
    }

    const row = client.rows[0];
    const checklist = this.getIntakeChecklist();
    const missing: string[] = [];
    const sections: any[] = [];

    let totalRequired = 0;
    let completedRequired = 0;

    for (const section of checklist) {
      const sectionItems: any[] = [];
      let sectionComplete = true;

      for (const item of section.items) {
        let complete = false;

        // Check completion based on field mapping
        switch (item.id) {
          case 'name':
            complete = !!(row.first_name && row.last_name);
            break;
          case 'dob':
            complete = !!row.date_of_birth;
            break;
          case 'medicaid':
            complete = !!row.medicaid_number;
            break;
          case 'address':
            complete = !!(row.address_line_1 && row.city && row.state && row.zip_code);
            break;
          case 'phone':
            complete = !!row.phone_number;
            break;
          case 'email':
            complete = !!row.email;
            break;
          case 'emergency_primary':
            complete = !!row.emergency_contact_name;
            break;
          case 'evv_consent':
            complete = row.evv_consent_status === 'signed';
            break;
          case 'physician':
          case 'diagnoses':
          case 'allergies':
          case 'medications':
            const medInfo = row.medical_info || {};
            complete = !!(medInfo[item.id] || (Array.isArray(medInfo[item.id]) && medInfo[item.id].length > 0));
            break;
          case 'adl_assessment':
          case 'service_needs':
            complete = !!row.care_plan_id;
            break;
          default:
            complete = false;
        }

        if (item.required) {
          totalRequired++;
          if (complete) completedRequired++;
          else missing.push(item.name);
        }

        if (item.required && !complete) {
          sectionComplete = false;
        }

        sectionItems.push({ id: item.id, name: item.name, complete });
      }

      sections.push({
        section: section.section,
        complete: sectionComplete,
        items: sectionItems,
      });
    }

    return {
      complete: missing.length === 0,
      completeness: Math.round((completedRequired / totalRequired) * 100),
      missing,
      sections,
    };
  }
}

export const clinicalService = new ClinicalService();
