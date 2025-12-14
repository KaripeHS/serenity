/**
 * EHR Integration Adapter
 * Integrates with PointClickCare and MatrixCare for care plan sync
 *
 * Features:
 * - Care plan import/export
 * - ADL/IADL assessment sync
 * - Medication reconciliation
 * - Progress note sync
 * - Vital signs exchange
 * - Bi-directional HL7/FHIR integration
 */

import axios from 'axios';
import { pool } from '../../config/database';


import { createLogger } from '../../utils/logger';

const logger = createLogger('ehr');
interface CarePlan {
  clientId: string;
  assessmentDate: Date;
  planStartDate: Date;
  planEndDate?: Date;
  goals: Array<{
    category: string;
    description: string;
    targetDate?: Date;
    status: 'active' | 'completed' | 'discontinued';
  }>;
  interventions: Array<{
    category: string;
    intervention: string;
    frequency: string;
    notes?: string;
  }>;
  adlAssessment: {
    bathing: number; // 0-5 scale
    dressing: number;
    toileting: number;
    transferring: number;
    eating: number;
    mobility: number;
  };
  iadlAssessment: {
    meal_preparation: number;
    housekeeping: number;
    medication_management: number;
    shopping: number;
    transportation: number;
  };
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    route: string;
    indication: string;
  }>;
}

interface ProgressNote {
  clientId: string;
  visitId?: string;
  noteDate: Date;
  author: string;
  noteType: 'progress' | 'skilled_nursing' | 'therapy' | 'aide';
  subjectiveFindings: string;
  objectiveFindings: string;
  assessment: string;
  plan: string;
  vitalSigns?: {
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    respiratoryRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    weight?: number;
  };
}

export class EHRAdapter {
  private provider: 'pointclickcare' | 'matrixcare';
  private apiKey: string;
  private facilityId: string;
  private baseUrl: string;

  constructor(provider: 'pointclickcare' | 'matrixcare' = 'pointclickcare') {
    this.provider = provider;

    switch (provider) {
      case 'pointclickcare':
        this.apiKey = process.env.POINTCLICKCARE_API_KEY || '';
        this.facilityId = process.env.POINTCLICKCARE_FACILITY_ID || '';
        this.baseUrl = 'https://api.pointclickcare.com/v1';
        break;
      case 'matrixcare':
        this.apiKey = process.env.MATRIXCARE_API_KEY || '';
        this.facilityId = process.env.MATRIXCARE_FACILITY_ID || '';
        this.baseUrl = 'https://api.matrixcare.com/v1';
        break;
    }

    if (!this.apiKey || !this.facilityId) {
      logger.warn(`[EHR] ${provider} credentials not configured`);
    }
  }

  /**
   * Import care plan from EHR
   */
  async importCarePlan(
    clientExternalId: string,
    organizationId: string
  ): Promise<CarePlan | null> {
    try {
      let carePlan: CarePlan;

      switch (this.provider) {
        case 'pointclickcare':
          carePlan = await this.importPointClickCareCarePlan(clientExternalId);
          break;
        case 'matrixcare':
          carePlan = await this.importMatrixCareCarePlan(clientExternalId);
          break;
      }

      // Save to database
      await this.saveCarePlan(organizationId, carePlan);

      return carePlan;
    } catch (error) {
      logger.error('[EHR] Error importing care plan:', error);
      return null;
    }
  }

  /**
   * Import from PointClickCare
   */
  private async importPointClickCareCarePlan(clientExternalId: string): Promise<CarePlan> {
    const response = await axios.get(
      `${this.baseUrl}/facilities/${this.facilityId}/residents/${clientExternalId}/care-plan`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data;

    return {
      clientId: clientExternalId,
      assessmentDate: new Date(data.assessmentDate),
      planStartDate: new Date(data.planStartDate),
      planEndDate: data.planEndDate ? new Date(data.planEndDate) : undefined,
      goals: data.goals.map((g: any) => ({
        category: g.category,
        description: g.description,
        targetDate: g.targetDate ? new Date(g.targetDate) : undefined,
        status: g.status
      })),
      interventions: data.interventions.map((i: any) => ({
        category: i.category,
        intervention: i.description,
        frequency: i.frequency,
        notes: i.notes
      })),
      adlAssessment: {
        bathing: data.adlScores.bathing,
        dressing: data.adlScores.dressing,
        toileting: data.adlScores.toileting,
        transferring: data.adlScores.transferring,
        eating: data.adlScores.eating,
        mobility: data.adlScores.mobility
      },
      iadlAssessment: {
        meal_preparation: data.iadlScores.mealPreparation,
        housekeeping: data.iadlScores.housekeeping,
        medication_management: data.iadlScores.medicationManagement,
        shopping: data.iadlScores.shopping,
        transportation: data.iadlScores.transportation
      },
      medications: data.medications.map((m: any) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        route: m.route,
        indication: m.indication
      }))
    };
  }

  /**
   * Import from MatrixCare
   */
  private async importMatrixCareCarePlan(clientExternalId: string): Promise<CarePlan> {
    const response = await axios.get(
      `${this.baseUrl}/patients/${clientExternalId}/careplan`,
      {
        headers: {
          'API-Key': this.apiKey,
          'Facility-ID': this.facilityId,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data;

    return {
      clientId: clientExternalId,
      assessmentDate: new Date(data.assessmentDate),
      planStartDate: new Date(data.effectiveDate),
      planEndDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
      goals: data.patientGoals.map((g: any) => ({
        category: g.goalCategory,
        description: g.goalText,
        targetDate: g.targetDate ? new Date(g.targetDate) : undefined,
        status: g.goalStatus.toLowerCase()
      })),
      interventions: data.interventions.map((i: any) => ({
        category: i.interventionCategory,
        intervention: i.interventionText,
        frequency: i.frequency,
        notes: i.comments
      })),
      adlAssessment: {
        bathing: data.functionalStatus.bathingScore,
        dressing: data.functionalStatus.dressingScore,
        toileting: data.functionalStatus.toiletingScore,
        transferring: data.functionalStatus.transferScore,
        eating: data.functionalStatus.eatingScore,
        mobility: data.functionalStatus.mobilityScore
      },
      iadlAssessment: {
        meal_preparation: data.functionalStatus.mealPrepScore,
        housekeeping: data.functionalStatus.housekeepingScore,
        medication_management: data.functionalStatus.medicationMgmtScore,
        shopping: data.functionalStatus.shoppingScore,
        transportation: data.functionalStatus.transportScore
      },
      medications: data.medications.map((m: any) => ({
        name: m.medicationName,
        dosage: m.dosageAmount + ' ' + m.dosageUnit,
        frequency: m.frequency,
        route: m.routeOfAdministration,
        indication: m.indication
      }))
    };
  }

  /**
   * Export progress note to EHR
   */
  async exportProgressNote(
    organizationId: string,
    note: ProgressNote
  ): Promise<{ success: boolean; externalId?: string } | null> {
    try {
      let result: { success: boolean; externalId?: string };

      switch (this.provider) {
        case 'pointclickcare':
          result = await this.exportPointClickCareNote(note);
          break;
        case 'matrixcare':
          result = await this.exportMatrixCareNote(note);
          break;
      }

      // Save sync record
      if (result.success && result.externalId) {
        await pool.query(
          `
          INSERT INTO ehr_sync_log (
            organization_id,
            entity_type,
            entity_id,
            provider,
            external_id,
            sync_direction,
            sync_status,
            created_at
          ) VALUES ($1, 'progress_note', $2, $3, $4, 'export', 'success', NOW())
          `,
          [organizationId, note.visitId, this.provider, result.externalId]
        );
      }

      return result;
    } catch (error) {
      logger.error('[EHR] Error exporting progress note:', error);
      return null;
    }
  }

  /**
   * Export to PointClickCare
   */
  private async exportPointClickCareNote(
    note: ProgressNote
  ): Promise<{ success: boolean; externalId?: string }> {
    const payload = {
      residentId: note.clientId,
      noteDate: note.noteDate.toISOString(),
      noteType: note.noteType,
      author: note.author,
      subjective: note.subjectiveFindings,
      objective: note.objectiveFindings,
      assessment: note.assessment,
      plan: note.plan
    };

    if (note.vitalSigns) {
      payload['vitalSigns'] = {
        bloodPressure: note.vitalSigns.bloodPressureSystolic && note.vitalSigns.bloodPressureDiastolic
          ? `${note.vitalSigns.bloodPressureSystolic}/${note.vitalSigns.bloodPressureDiastolic}`
          : undefined,
        pulse: note.vitalSigns.heartRate,
        respirations: note.vitalSigns.respiratoryRate,
        temperature: note.vitalSigns.temperature,
        oxygenSaturation: note.vitalSigns.oxygenSaturation,
        weight: note.vitalSigns.weight
      };
    }

    const response = await axios.post(
      `${this.baseUrl}/facilities/${this.facilityId}/notes`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      externalId: response.data.noteId
    };
  }

  /**
   * Export to MatrixCare
   */
  private async exportMatrixCareNote(
    note: ProgressNote
  ): Promise<{ success: boolean; externalId?: string }> {
    const payload = {
      patientId: note.clientId,
      documentDate: note.noteDate.toISOString(),
      documentType: note.noteType,
      authorName: note.author,
      sections: {
        subjective: note.subjectiveFindings,
        objective: note.objectiveFindings,
        assessment: note.assessment,
        plan: note.plan
      }
    };

    if (note.vitalSigns) {
      payload['vitalSigns'] = {
        systolicBP: note.vitalSigns.bloodPressureSystolic,
        diastolicBP: note.vitalSigns.bloodPressureDiastolic,
        heartRate: note.vitalSigns.heartRate,
        respiratoryRate: note.vitalSigns.respiratoryRate,
        temperature: note.vitalSigns.temperature,
        spO2: note.vitalSigns.oxygenSaturation,
        weight: note.vitalSigns.weight
      };
    }

    const response = await axios.post(
      `${this.baseUrl}/documents`,
      payload,
      {
        headers: {
          'API-Key': this.apiKey,
          'Facility-ID': this.facilityId,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      externalId: response.data.documentId
    };
  }

  /**
   * Save care plan to database
   */
  private async saveCarePlan(organizationId: string, carePlan: CarePlan): Promise<void> {
    await pool.query(
      `
      INSERT INTO care_plans (
        organization_id,
        client_id,
        assessment_date,
        plan_start_date,
        plan_end_date,
        goals,
        interventions,
        adl_assessment,
        iadl_assessment,
        medications,
        source,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (client_id, plan_start_date) DO UPDATE SET
        goals = EXCLUDED.goals,
        interventions = EXCLUDED.interventions,
        adl_assessment = EXCLUDED.adl_assessment,
        iadl_assessment = EXCLUDED.iadl_assessment,
        medications = EXCLUDED.medications,
        updated_at = NOW()
      `,
      [
        organizationId,
        carePlan.clientId,
        carePlan.assessmentDate,
        carePlan.planStartDate,
        carePlan.planEndDate,
        JSON.stringify(carePlan.goals),
        JSON.stringify(carePlan.interventions),
        JSON.stringify(carePlan.adlAssessment),
        JSON.stringify(carePlan.iadlAssessment),
        JSON.stringify(carePlan.medications),
        this.provider
      ]
    );
  }

  /**
   * Get sync history
   */
  async getSyncHistory(
    organizationId: string,
    entityType?: string,
    limit: number = 50
  ): Promise<
    Array<{
      id: string;
      entityType: string;
      syncDirection: string;
      syncStatus: string;
      createdAt: Date;
    }>
  > {
    const queryParts = [
      'SELECT * FROM ehr_sync_log WHERE organization_id = $1'
    ];
    const params: any[] = [organizationId];

    if (entityType) {
      queryParts.push('AND entity_type = $2');
      params.push(entityType);
    }

    queryParts.push('ORDER BY created_at DESC LIMIT $' + (params.length + 1));
    params.push(limit);

    const result = await pool.query(queryParts.join(' '), params);

    return result.rows.map(row => ({
      id: row.id,
      entityType: row.entity_type,
      syncDirection: row.sync_direction,
      syncStatus: row.sync_status,
      createdAt: row.created_at
    }));
  }

  /**
   * Test EHR connection
   */
  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      switch (this.provider) {
        case 'pointclickcare':
          await axios.get(`${this.baseUrl}/facilities/${this.facilityId}`, {
            headers: {
              Authorization: `Bearer ${this.apiKey}`
            }
          });
          break;
        case 'matrixcare':
          await axios.get(`${this.baseUrl}/health`, {
            headers: {
              'API-Key': this.apiKey
            }
          });
          break;
      }

      return { connected: true };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

export const ehrAdapter = new EHRAdapter();
