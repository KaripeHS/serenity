/**
 * Console Clients Routes
 * Manages client/patient profiles, care plans, and service authorization
 *
 * @module api/routes/console/clients
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getSandataRepository } from '../../../services/sandata/repositories/sandata.repository';
import { getDbClient } from '../../../database/client';

const router = Router();
const repository = getSandataRepository(getDbClient());

/**
 * GET /api/console/clients/:organizationId
 * Get all clients for organization
 */
router.get('/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;
    const { podId, status = 'active', search } = req.query;

    let clients = await repository.getActiveClients(organizationId);

    // Filter by status
    if (status !== 'all') {
      clients = clients.filter((c: any) => c.status === status);
    }

    // Filter by pod
    if (podId) {
      clients = clients.filter((c: any) => c.pod_id === podId);
    }

    // Search by name or Medicaid number
    if (search) {
      const searchLower = (search as string).toLowerCase();
      clients = clients.filter(
        (c: any) =>
          c.first_name.toLowerCase().includes(searchLower) ||
          c.last_name.toLowerCase().includes(searchLower) ||
          (c.medicaid_number && c.medicaid_number.includes(searchLower))
      );
    }

    res.json({
      organizationId,
      filters: { podId, status, search },
      clients: clients.map((client: any) => ({
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        dateOfBirth: client.date_of_birth,
        medicaidNumber: client.medicaid_number,
        status: client.status,
        podId: client.pod_id,
        podName: client.pod_name,
        sandataClientId: client.sandata_client_id,
        evvConsentStatus: client.evv_consent_status,
        createdAt: client.created_at,
      })),
      count: clients.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/clients/:organizationId/:clientId
 * Get detailed client profile
 */
router.get(
  '/:organizationId/:clientId',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, clientId } = req.params;

      const client = await repository.getClient(clientId);

      if (!client) {
        throw ApiErrors.notFound('Client');
      }

      if (client.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Client does not belong to this organization');
      }

      // Get assigned caregivers (through pod or direct assignment)
      const caregivers = await repository.getClientCaregivers(clientId);

      // Get recent shifts
      const recentShifts = await repository.getClientRecentShifts(clientId, 10);

      // Get service authorizations
      const authorizations = await repository.getClientAuthorizations(clientId);

      // Get care plan if exists
      const carePlan = await repository.getClientCarePlan(clientId);

      res.json({
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        dateOfBirth: client.date_of_birth,
        medicaidNumber: client.medicaid_number,
        status: client.status,
        email: client.email,
        phoneNumber: client.phone_number,
        address: {
          line1: client.address_line_1,
          line2: client.address_line_2,
          city: client.city,
          state: client.state,
          zipCode: client.zip_code,
        },
        podId: client.pod_id,
        podName: client.pod_name,
        sandataClientId: client.sandata_client_id,
        evvConsent: {
          status: client.evv_consent_status,
          date: client.evv_consent_date,
          signedBy: client.evv_consent_signed_by,
        },
        emergencyContact: {
          name: client.emergency_contact_name,
          relationship: client.emergency_contact_relationship,
          phone: client.emergency_contact_phone,
        },
        caregivers: caregivers.map((caregiver: any) => ({
          id: caregiver.id,
          name: `${caregiver.first_name} ${caregiver.last_name}`,
          status: caregiver.status,
        })),
        recentShifts: recentShifts.map((shift: any) => ({
          id: shift.id,
          caregiverName: shift.caregiver_name,
          scheduledStartTime: shift.scheduled_start_time,
          scheduledEndTime: shift.scheduled_end_time,
          status: shift.status,
        })),
        authorizations: authorizations.map((auth: any) => ({
          id: auth.id,
          authorizationNumber: auth.authorization_number,
          serviceCode: auth.service_code,
          unitsApproved: auth.units_approved,
          unitsUsed: auth.units_used,
          startDate: auth.start_date,
          endDate: auth.end_date,
          status: auth.status,
        })),
        carePlan: carePlan
          ? {
            id: carePlan.id,
            goals: carePlan.goals,
            specialInstructions: carePlan.special_instructions,
            updatedAt: carePlan.updated_at,
          }
          : null,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/console/clients/:organizationId
 * Create a new client
 */
router.post('/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;
    const {
      firstName,
      lastName,
      dateOfBirth,
      medicaidNumber,
      email,
      phoneNumber,
      addressLine1,
      city,
      state,
      zipCode,
      podId,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !medicaidNumber) {
      throw ApiErrors.badRequest(
        'firstName, lastName, dateOfBirth, and medicaidNumber are required'
      );
    }

    // Validate Medicaid number format (Ohio = 10 digits)
    if (!/^\d{10}$/.test(medicaidNumber)) {
      throw ApiErrors.badRequest('Medicaid number must be 10 digits');
    }

    // Check for duplicate Medicaid number
    const existingClient = await repository.getClientByMedicaidNumber(medicaidNumber, organizationId);
    if (existingClient) {
      throw ApiErrors.conflict('Client with this Medicaid number already exists');
    }

    // Validate pod if provided
    if (podId) {
      const pod = await repository.getPod(podId);
      if (!pod || pod.organization_id !== organizationId) {
        throw ApiErrors.badRequest('Invalid pod for this organization');
      }
    }

    const clientId = await repository.createClient({
      organization_id: organizationId,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      medicaid_number: medicaidNumber,
      email: email || null,
      phone_number: phoneNumber || null,
      address_line_1: addressLine1 || null,
      city: city || null,
      state: state || null,
      zip_code: zipCode || null,
      status: 'active',
      pod_id: podId || null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_phone: emergencyContactPhone || null,
      emergency_contact_relationship: emergencyContactRelationship || null,
      evv_consent_status: 'pending',
      created_by: req.user?.userId,
    });

    res.status(201).json({
      id: clientId,
      firstName,
      lastName,
      medicaidNumber,
      organizationId,
      message: 'Client created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/clients/:organizationId/:clientId
 * Update client profile
 */
router.put(
  '/:organizationId/:clientId',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, clientId } = req.params;
      const {
        firstName,
        lastName,
        dateOfBirth,
        medicaidNumber,
        email,
        phoneNumber,
        addressLine1,
        addressLine2,
        city,
        state,
        zipCode,
        status,
        podId,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelationship,
      } = req.body;

      const client = await repository.getClient(clientId);
      if (!client) {
        throw ApiErrors.notFound('Client');
      }

      if (client.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Client does not belong to this organization');
      }

      // If Medicaid number is changing, validate uniqueness
      if (medicaidNumber && medicaidNumber !== client.medicaid_number) {
        const existingClient = await repository.getClientByMedicaidNumber(medicaidNumber, organizationId);
        if (existingClient) {
          throw ApiErrors.conflict('Client with this Medicaid number already exists');
        }

        // Validate format
        if (!/^\d{10}$/.test(medicaidNumber)) {
          throw ApiErrors.badRequest('Medicaid number must be 10 digits');
        }
      }

      // Validate pod if provided
      if (podId) {
        const pod = await repository.getPod(podId);
        if (!pod || pod.organization_id !== organizationId) {
          throw ApiErrors.badRequest('Invalid pod for this organization');
        }
      }

      await repository.updateClient(clientId, {
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        medicaid_number: medicaidNumber,
        email,
        phone_number: phoneNumber,
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        city,
        state,
        zip_code: zipCode,
        status,
        pod_id: podId,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        emergency_contact_relationship: emergencyContactRelationship,
        updated_by: req.user?.userId,
      });

      res.json({
        id: clientId,
        message: 'Client updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/console/clients/:organizationId/:clientId/evv-consent
 * Record EVV consent
 */
router.post(
  '/:organizationId/:clientId/evv-consent',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, clientId } = req.params;
      const { consentStatus, signedBy } = req.body;

      const client = await repository.getClient(clientId);
      if (!client) {
        throw ApiErrors.notFound('Client');
      }

      if (client.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Client does not belong to this organization');
      }

      if (!['signed', 'declined'].includes(consentStatus)) {
        throw ApiErrors.badRequest('consentStatus must be either "signed" or "declined"');
      }

      await repository.updateClient(clientId, {
        evv_consent_status: consentStatus,
        evv_consent_date: new Date(),
        evv_consent_signed_by: signedBy || req.user?.userId,
        updated_by: req.user?.userId,
      });

      res.json({
        clientId,
        consentStatus,
        consentDate: new Date().toISOString(),
        message: 'EVV consent recorded successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/console/clients/:organizationId/:clientId/authorizations
 * Add service authorization
 */
router.post(
  '/:organizationId/:clientId/authorizations',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, clientId } = req.params;
      const { authorizationNumber, serviceCode, unitsApproved, startDate, endDate } = req.body;

      const client = await repository.getClient(clientId);
      if (!client) {
        throw ApiErrors.notFound('Client');
      }

      if (client.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Client does not belong to this organization');
      }

      // Validate required fields
      if (!authorizationNumber || !serviceCode || !unitsApproved || !startDate || !endDate) {
        throw ApiErrors.badRequest(
          'authorizationNumber, serviceCode, unitsApproved, startDate, and endDate are required'
        );
      }

      // Validate date range
      if (new Date(endDate) <= new Date(startDate)) {
        throw ApiErrors.badRequest('End date must be after start date');
      }

      const authId = await repository.createAuthorization({
        clientId,
        organizationId,
        authorizationNumber,
        serviceCode,
        unitsApproved,
        unitsUsed: 0,
        startDate,
        endDate,
        status: 'active',
        createdBy: req.user?.userId,
      });

      res.status(201).json({
        id: authId,
        clientId,
        authorizationNumber,
        message: 'Authorization added successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/console/clients/:organizationId/:clientId/care-plan
 * Update client care plan
 */
router.put(
  '/:organizationId/:clientId/care-plan',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, clientId } = req.params;
      const { goals, specialInstructions } = req.body;

      const client = await repository.getClient(clientId);
      if (!client) {
        throw ApiErrors.notFound('Client');
      }

      if (client.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Client does not belong to this organization');
      }

      const carePlan = await repository.getClientCarePlan(clientId);

      if (carePlan) {
        // Update existing
        await repository.updateCarePlan(carePlan.id, {
          goals,
          specialInstructions,
          updatedBy: req.user?.userId,
        });
      } else {
        // Create new
        await repository.createCarePlan({
          clientId,
          organizationId,
          goals: goals || '',
          specialInstructions: specialInstructions || '',
          createdBy: req.user?.userId,
        });
      }

      res.json({
        clientId,
        message: 'Care plan updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/console/clients/:organizationId/:clientId/schedule
 * Get client's upcoming schedule
 */
router.get(
  '/:organizationId/:clientId/schedule',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, clientId } = req.params;
      const { startDate, endDate, days = '7' } = req.query;

      const client = await repository.getClient(clientId);
      if (!client) {
        throw ApiErrors.notFound('Client');
      }

      if (client.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Client does not belong to this organization');
      }

      const start = startDate ? new Date(startDate as string) : new Date();
      const end = endDate
        ? new Date(endDate as string)
        : new Date(start.getTime() + parseInt(days as string) * 24 * 60 * 60 * 1000);

      const shifts = await repository.getClientShiftsByDateRange(
        clientId,
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0]
      );

      res.json({
        clientId,
        clientName: `${client.first_name} ${client.last_name}`,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        shifts: shifts.map((shift: any) => ({
          id: shift.id,
          caregiverName: shift.caregiver_name,
          scheduledStartTime: shift.scheduled_start_time,
          scheduledEndTime: shift.scheduled_end_time,
          status: shift.status,
          serviceCode: shift.service_code,
        })),
        count: shifts.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
