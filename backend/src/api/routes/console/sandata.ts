/**
 * Sandata Console API Routes
 * Endpoints for managing Sandata integration in Console
 *
 * @module api/routes/console/sandata
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getSandataIndividualsService } from '../../../services/sandata/individuals.service';
import { getSandataEmployeesService } from '../../../services/sandata/employees.service';
import { getSandataVisitsService } from '../../../services/sandata/visits.service';
import { getSandataCorrectionsService } from '../../../services/sandata/corrections.service';
import { getSandataRepository } from '../../../services/sandata/repositories/sandata.repository';
import { getDbClient } from '../../../database/client';

const router = Router();
const individualsService = getSandataIndividualsService();
const employeesService = getSandataEmployeesService();
const visitsService = getSandataVisitsService();
const correctionsService = getSandataCorrectionsService();
const repository = getSandataRepository(getDbClient());

/**
 * POST /api/console/sandata/individuals/sync
 * Sync a client to Sandata Individuals feed
 */
router.post('/individuals/sync', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { clientId, forceUpdate, dryRun } = req.body;

    if (!clientId) {
      throw ApiErrors.badRequest('clientId is required');
    }

    // Fetch client from database
    const client = await repository.getClient(clientId);
    if (!client) {
      throw ApiErrors.notFound('Client');
    }

    // Sync to Sandata
    const result = await individualsService.syncIndividual(
      {
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        dateOfBirth: client.date_of_birth,
        medicaidNumber: client.medicaid_number || undefined,
        sandataClientId: client.sandata_client_id || null,
        evvConsentDate: client.evv_consent_date || null,
        evvConsentStatus: client.evv_consent_status || null,
        addressLine1: client.address_line_1,
        city: client.city,
        state: client.state,
        zipCode: client.zip_code,
        phoneNumber: client.phone_number,
        email: client.email,
        status: client.status,
        organizationId: client.organization_id,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      },
      { forceUpdate, dryRun }
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/sandata/employees/sync
 * Sync a caregiver to Sandata Employees feed
 */
router.post('/employees/sync', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { userId, forceUpdate, dryRun, includeCertifications } = req.body;

    if (!userId) {
      throw ApiErrors.badRequest('userId is required');
    }

    // Fetch user from database
    const user = await repository.getUser(userId);
    if (!user) {
      throw ApiErrors.notFound('User');
    }

    // Sync to Sandata
    const result = await employeesService.syncEmployee(
      {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        dateOfBirth: user.date_of_birth,
        sandataEmployeeId: user.sandata_employee_id || null,
        addressLine1: user.address_line_1,
        city: user.city,
        state: user.state,
        zipCode: user.zip_code,
        phoneNumber: user.phone_number,
        email: user.email,
        hireDate: user.hire_date,
        terminationDate: user.termination_date,
        status: user.status,
        role: user.role,
        organizationId: user.organization_id,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      [], // TODO: Fetch certifications from database
      { forceUpdate, dryRun, includeCertifications }
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/sandata/visits/submit
 * Submit a visit to Sandata Visits feed
 */
router.post('/visits/submit', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { evvRecordId, dryRun, skipValidation } = req.body;

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

    // Submit to Sandata
    const result = await visitsService.submitVisit(
      {
        id: evvRecord.id,
        shiftId: evvRecord.shift_id,
        clientId: evvRecord.client_id,
        caregiverId: evvRecord.caregiver_id,
        serviceCode: evvRecord.service_code,
        serviceDate: evvRecord.service_date,
        clockInTime: evvRecord.clock_in_time,
        clockOutTime: evvRecord.clock_out_time,
        clockInLatitude: evvRecord.clock_in_latitude,
        clockInLongitude: evvRecord.clock_in_longitude,
        clockOutLatitude: evvRecord.clock_out_latitude,
        clockOutLongitude: evvRecord.clock_out_longitude,
        billableUnits: evvRecord.billable_units,
        authorizationNumber: evvRecord.authorization_number,
        visitKey: evvRecord.visit_key,
        sandataVisitId: evvRecord.sandata_visit_id,
        sandataStatus: evvRecord.sandata_status,
        sandataSubmittedAt: evvRecord.sandata_submitted_at,
        sandataRejectedReason: evvRecord.sandata_rejected_reason,
        organizationId: evvRecord.organization_id,
        createdAt: evvRecord.created_at,
        updatedAt: evvRecord.updated_at,
      },
      {
        id: client.id,
        sandataClientId: client.sandata_client_id,
        addressLine1: client.address_line_1,
        city: client.city,
        state: client.state,
        zipCode: client.zip_code,
        evvConsentStatus: client.evv_consent_status,
      },
      {
        id: caregiver.id,
        sandataEmployeeId: caregiver.sandata_employee_id,
      },
      { dryRun, skipValidation }
    );

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
      correctedBy: correctedBy || req.user?.id || 'unknown',
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
      voidedBy: voidedBy || req.user?.id || 'unknown',
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
