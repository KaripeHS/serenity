/**
 * Sandata Console API Routes
 * Endpoints for managing Sandata integration in Console
 *
 * @module api/routes/console/sandata
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getOhioSubmissionOrchestrator } from '../../../services/sandata/ohio-submission-orchestrator.service';
import { getSandataCorrectionsService } from '../../../services/sandata/corrections.service';
import { getSandataRepository } from '../../../services/sandata/repositories/sandata.repository';
import { getDbClient } from '../../../database/client';
import type { ClientData } from '../../../services/sandata/ohio-patient-builder.service';
import type { StaffData } from '../../../services/sandata/ohio-staff-builder.service';
import type { EVVRecordData, PatientData, StaffData as VisitStaffData } from '../../../services/sandata/ohio-visit-builder.service';

const router = Router();
const orchestrator = getOhioSubmissionOrchestrator();
const correctionsService = getSandataCorrectionsService();
const repository = getSandataRepository(getDbClient());

/**
 * POST /api/console/sandata/patients/sync
 * Sync a patient to Sandata using Ohio Alt-EVV v4.3 spec
 */
router.post('/patients/sync', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { clientId, forceUpdate } = req.body;

    if (!clientId) {
      throw ApiErrors.badRequest('clientId is required');
    }

    // Fetch client from database
    const client = await repository.getClient(clientId);
    if (!client) {
      throw ApiErrors.notFound('Client');
    }

    // Map to Ohio ClientData structure
    const clientData: ClientData = {
      id: client.id,
      organizationId: client.organization_id,
      firstName: client.first_name,
      lastName: client.last_name,
      middleName: client.middle_name || undefined,
      dateOfBirth: new Date(client.date_of_birth),
      gender: (client.gender as 'M' | 'F' | 'U') || undefined,
      medicaidNumber: client.medicaid_number || undefined,
      addressLine1: client.address_line_1 || undefined,
      addressLine2: client.address_line_2 || undefined,
      city: client.city || undefined,
      state: client.state || undefined,
      zipCode: client.zip_code || undefined,
      phoneNumber: client.phone_number || undefined,
      email: client.email || undefined,
    };

    // Submit to Sandata using Ohio orchestrator
    const result = await orchestrator.submitPatient(clientData, {
      generateNewSequenceId: forceUpdate,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/sandata/staff/sync
 * Sync a staff member to Sandata using Ohio Alt-EVV v4.3 spec
 */
router.post('/staff/sync', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { userId, forceUpdate } = req.body;

    if (!userId) {
      throw ApiErrors.badRequest('userId is required');
    }

    // Fetch user from database
    const user = await repository.getUser(userId);
    if (!user) {
      throw ApiErrors.notFound('User');
    }

    // Map to Ohio StaffData structure
    const staffData: StaffData = {
      id: user.id,
      organizationId: user.organization_id,
      firstName: user.first_name,
      lastName: user.last_name,
      middleName: user.middle_name || undefined,
      dateOfBirth: user.date_of_birth ? new Date(user.date_of_birth) : undefined,
      gender: (user.gender as 'M' | 'F' | 'U') || undefined,
      ssnEncrypted: user.ssn_encrypted || undefined,
      hireDate: user.hire_date ? new Date(user.hire_date) : undefined,
      terminationDate: user.termination_date ? new Date(user.termination_date) : undefined,
      addressLine1: user.address_line_1 || undefined,
      addressLine2: user.address_line_2 || undefined,
      city: user.city || undefined,
      state: user.state || undefined,
      zipCode: user.zip_code || undefined,
      phoneNumber: user.phone_number || undefined,
      email: user.email || undefined,
    };

    // Submit to Sandata using Ohio orchestrator
    const result = await orchestrator.submitStaff(staffData, {
      generateNewSequenceId: forceUpdate,
      generateStaffPin: !user.sandata_staff_pin,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/sandata/visits/submit
 * Submit a visit to Sandata using Ohio Alt-EVV v4.3 spec (with Calls[] array)
 */
router.post('/visits/submit', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { evvRecordId, skipValidation } = req.body;

    if (!evvRecordId) {
      throw ApiErrors.badRequest('evvRecordId is required');
    }

    // Fetch EVV record from database
    const evvRecord = await repository.getEVVRecord(evvRecordId);
    if (!evvRecord) {
      throw ApiErrors.notFound('EVV Record');
    }

    // Fetch client and caregiver
    const client = await repository.getClient(evvRecord.client_id);
    const caregiver = await repository.getUser(evvRecord.caregiver_id);

    if (!client || !caregiver) {
      throw ApiErrors.badRequest('Client or caregiver not found');
    }

    // Map to Ohio EVVRecordData structure
    const evvData: EVVRecordData = {
      id: evvRecord.id,
      clientId: evvRecord.client_id,
      caregiverId: evvRecord.caregiver_id,
      organizationId: evvRecord.organization_id,
      clockInTime: new Date(evvRecord.clock_in_time),
      clockOutTime: new Date(evvRecord.clock_out_time),
      clockInLatitude: evvRecord.clock_in_latitude || undefined,
      clockInLongitude: evvRecord.clock_in_longitude || undefined,
      clockOutLatitude: evvRecord.clock_out_latitude || undefined,
      clockOutLongitude: evvRecord.clock_out_longitude || undefined,
      serviceDate: new Date(evvRecord.service_date),
      serviceCode: evvRecord.service_code,
      modifiers: evvRecord.modifiers ? (typeof evvRecord.modifiers === 'string' ? [evvRecord.modifiers] : evvRecord.modifiers) : [],
      units: evvRecord.billable_units || undefined,
      authorizationNumber: evvRecord.authorization_number || undefined,
      payer: evvRecord.payer || undefined,
      payerProgram: evvRecord.payer_program || undefined,
      clockMethod: (evvRecord.clock_method as any) || 'mobile',
      locationType: (evvRecord.location_type as any) || 'home',
    };

    // Map patient data
    const patientData: PatientData = {
      id: client.id,
      sandataOtherId: client.sandata_other_id || undefined,
      medicaidNumber: client.medicaid_number || undefined,
    };

    // Map staff data
    const staffData: VisitStaffData = {
      id: caregiver.id,
      sandataOtherId: caregiver.sandata_other_id || undefined,
    };

    // Submit to Sandata using Ohio orchestrator
    // CRITICAL: This builds the Calls[] array with Call In and Call Out
    const result = await orchestrator.submitVisit(evvData, patientData, staffData, undefined, {
      skipAppendixGValidation: skipValidation,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/sandata/visits/correct
 * Submit a visit correction to Sandata
 */
router.post('/visits/correct', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { originalEVVRecordId, correctionType, correctionReason, correctedFields, correctedBy } = req.body;

    if (!originalEVVRecordId || !correctionReason || !correctedFields) {
      throw ApiErrors.badRequest('originalEVVRecordId, correctionReason, and correctedFields are required');
    }

    const result = await correctionsService.correctVisit({
      originalEVVRecordId,
      correctionType,
      correctionReason,
      correctedFields,
      correctedBy: correctedBy || req.user?.userId || 'unknown',
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/sandata/visits/void
 * Void a visit in Sandata
 */
router.post('/visits/void', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { evvRecordId, voidReason, voidReasonDescription, voidedBy } = req.body;

    if (!evvRecordId || !voidReason) {
      throw ApiErrors.badRequest('evvRecordId and voidReason are required');
    }

    const result = await correctionsService.voidVisit({
      evvRecordId,
      voidReason,
      voidReasonDescription,
      voidedBy: voidedBy || req.user?.userId || 'unknown',
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/sandata/transactions
 * Get Sandata transaction history (audit trail)
 */
router.get('/transactions', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { evvRecordId, organizationId } = req.query;

    if (evvRecordId) {
      const transactions = await repository.getTransactionsByEVVRecord(evvRecordId as string);
      return res.json({ transactions });
    }

    if (organizationId) {
      const transactions = await repository.getRetryableTransactions(organizationId as string);
      return res.json({ transactions });
    }

    throw ApiErrors.badRequest('Either evvRecordId or organizationId is required');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/sandata/config/:organizationId
 * Get Sandata configuration for an organization
 */
router.get('/config/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;

    const config = await repository.getConfig(organizationId);
    if (!config) {
      throw ApiErrors.notFound('Sandata configuration');
    }

    res.json(config);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/sandata/pending-visits/:organizationId
 * Get EVV records pending Sandata submission
 */
router.get('/pending-visits/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const pendingVisits = await repository.getPendingEVVRecords(organizationId, limit);

    res.json({
      count: pendingVisits.length,
      visits: pendingVisits,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/sandata/rejected-visits/:organizationId
 * Get rejected EVV records that need fixing
 */
router.get('/rejected-visits/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;

    const rejectedVisits = await repository.getRejectedEVVRecords(organizationId);

    res.json({
      count: rejectedVisits.length,
      visits: rejectedVisits,
    });
  } catch (error) {
    next(error);
  }
});

export { router as sandataRouter };
