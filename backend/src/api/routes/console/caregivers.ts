/**
 * Console Caregivers Routes
 * Manages caregiver profiles, certifications, and scheduling
 *
 * @module api/routes/console/caregivers
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getSandataRepository } from '../../../services/sandata/repositories/sandata.repository';
import { getDbClient } from '../../../database/client';

const router = Router();
const repository = getSandataRepository(getDbClient());

/**
 * GET /api/console/caregivers/:organizationId
 * Get all caregivers for organization
 */
router.get('/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;
    const { podId, status = 'active', search } = req.query;

    let caregivers = await repository.getActiveUsers(organizationId, 'caregiver');

    // Filter by status
    if (status !== 'all') {
      caregivers = caregivers.filter((c: any) => c.status === status);
    }

    // Filter by pod
    if (podId) {
      caregivers = caregivers.filter((c: any) => c.pod_id === podId);
    }

    // Search by name
    if (search) {
      const searchLower = (search as string).toLowerCase();
      caregivers = caregivers.filter(
        (c: any) =>
          c.first_name.toLowerCase().includes(searchLower) ||
          c.last_name.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      organizationId,
      filters: { podId, status, search },
      caregivers: caregivers.map((caregiver: any) => ({
        id: caregiver.id,
        firstName: caregiver.first_name,
        lastName: caregiver.last_name,
        email: caregiver.email,
        phoneNumber: caregiver.phone_number,
        status: caregiver.status,
        role: caregiver.role,
        podId: caregiver.pod_id,
        podName: caregiver.pod_name,
        sandataEmployeeId: caregiver.sandata_employee_id,
        hireDate: caregiver.hire_date,
        createdAt: caregiver.created_at,
      })),
      count: caregivers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/caregivers/:organizationId/:caregiverId
 * Get detailed caregiver profile
 */
router.get(
  '/:organizationId/:caregiverId',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, caregiverId } = req.params;

      const caregiver = await repository.getUser(caregiverId);

      if (!caregiver) {
        throw ApiErrors.notFound('Caregiver');
      }

      if (caregiver.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Caregiver does not belong to this organization');
      }

      // Get certifications
      const certifications = await repository.getUserCertifications(caregiverId);

      // Get assigned clients (through pod or direct assignment)
      const clients = await repository.getCaregiverClients(caregiverId);

      // Get recent shifts
      const recentShifts = await repository.getCaregiverRecentShifts(caregiverId, 10);

      // Get performance metrics
      const metrics = await repository.getCaregiverMetrics(caregiverId);

      res.json({
        id: caregiver.id,
        firstName: caregiver.first_name,
        lastName: caregiver.last_name,
        email: caregiver.email,
        phoneNumber: caregiver.phone_number,
        dateOfBirth: caregiver.date_of_birth,
        status: caregiver.status,
        role: caregiver.role,
        hireDate: caregiver.hire_date,
        terminationDate: caregiver.termination_date,
        address: {
          line1: caregiver.address_line1,
          line2: caregiver.address_line2,
          city: caregiver.city,
          state: caregiver.state,
          zipCode: caregiver.zip_code,
        },
        podId: caregiver.pod_id,
        podName: caregiver.pod_name,
        sandataEmployeeId: caregiver.sandata_employee_id,
        certifications: certifications.map((cert: any) => ({
          id: cert.id,
          type: cert.certification_type,
          number: cert.certification_number,
          issuingAuthority: cert.issuing_authority,
          issueDate: cert.issue_date,
          expirationDate: cert.expiration_date,
          status: cert.status,
        })),
        clients: clients.map((client: any) => ({
          id: client.id,
          name: `${client.first_name} ${client.last_name}`,
          status: client.status,
        })),
        recentShifts: recentShifts.map((shift: any) => ({
          id: shift.id,
          clientName: shift.client_name,
          scheduledStartTime: shift.scheduled_start_time,
          scheduledEndTime: shift.scheduled_end_time,
          status: shift.status,
        })),
        metrics: {
          totalShiftsCompleted: metrics.total_shifts_completed,
          totalHoursWorked: metrics.total_hours_worked,
          evvComplianceRate: metrics.evv_compliance_rate,
          onTimeRate: metrics.on_time_rate,
        },
        createdAt: caregiver.created_at,
        updatedAt: caregiver.updated_at,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/console/caregivers/:organizationId
 * Create a new caregiver
 */
router.post('/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      dateOfBirth,
      addressLine1,
      city,
      state,
      zipCode,
      hireDate,
      podId,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      throw ApiErrors.badRequest('firstName, lastName, and email are required');
    }

    // Validate email uniqueness
    const existingUser = await repository.getUserByEmail(email);
    if (existingUser) {
      throw ApiErrors.conflict('Email already exists');
    }

    // Validate pod if provided
    if (podId) {
      const pod = await repository.getPod(podId);
      if (!pod || pod.organization_id !== organizationId) {
        throw ApiErrors.badRequest('Invalid pod for this organization');
      }
    }

    const caregiverId = await repository.createUser({
      organizationId,
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber || null,
      dateOfBirth: dateOfBirth || null,
      addressLine1: addressLine1 || null,
      city: city || null,
      state: state || null,
      zipCode: zipCode || null,
      hireDate: hireDate || new Date().toISOString(),
      role: 'caregiver',
      status: 'active',
      podId: podId || null,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      id: caregiverId,
      firstName,
      lastName,
      email,
      organizationId,
      message: 'Caregiver created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/caregivers/:organizationId/:caregiverId
 * Update caregiver profile
 */
router.put(
  '/:organizationId/:caregiverId',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, caregiverId } = req.params;
      const {
        firstName,
        lastName,
        email,
        phoneNumber,
        dateOfBirth,
        addressLine1,
        addressLine2,
        city,
        state,
        zipCode,
        status,
        podId,
        terminationDate,
      } = req.body;

      const caregiver = await repository.getUser(caregiverId);
      if (!caregiver) {
        throw ApiErrors.notFound('Caregiver');
      }

      if (caregiver.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Caregiver does not belong to this organization');
      }

      // If email is changing, validate uniqueness
      if (email && email !== caregiver.email) {
        const existingUser = await repository.getUserByEmail(email);
        if (existingUser) {
          throw ApiErrors.conflict('Email already exists');
        }
      }

      // Validate pod if provided
      if (podId) {
        const pod = await repository.getPod(podId);
        if (!pod || pod.organization_id !== organizationId) {
          throw ApiErrors.badRequest('Invalid pod for this organization');
        }
      }

      await repository.updateUser(caregiverId, {
        firstName,
        lastName,
        email,
        phoneNumber,
        dateOfBirth,
        addressLine1,
        addressLine2,
        city,
        state,
        zipCode,
        status,
        podId,
        terminationDate,
        updatedBy: req.user?.id,
      });

      res.json({
        id: caregiverId,
        message: 'Caregiver updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/console/caregivers/:organizationId/:caregiverId/certifications
 * Add certification to caregiver
 */
router.post(
  '/:organizationId/:caregiverId/certifications',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, caregiverId } = req.params;
      const {
        certificationType,
        certificationNumber,
        issuingAuthority,
        issueDate,
        expirationDate,
      } = req.body;

      const caregiver = await repository.getUser(caregiverId);
      if (!caregiver) {
        throw ApiErrors.notFound('Caregiver');
      }

      if (caregiver.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Caregiver does not belong to this organization');
      }

      // Validate required fields
      if (
        !certificationType ||
        !certificationNumber ||
        !issuingAuthority ||
        !issueDate ||
        !expirationDate
      ) {
        throw ApiErrors.badRequest(
          'certificationType, certificationNumber, issuingAuthority, issueDate, and expirationDate are required'
        );
      }

      // Validate expiration is in future
      if (new Date(expirationDate) < new Date()) {
        throw ApiErrors.badRequest('Expiration date must be in the future');
      }

      const certificationId = await repository.createCertification({
        userId: caregiverId,
        certificationType,
        certificationNumber,
        issuingAuthority,
        issueDate,
        expirationDate,
        status: 'active',
        createdBy: req.user?.id,
      });

      res.status(201).json({
        id: certificationId,
        caregiverId,
        certificationType,
        message: 'Certification added successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/console/caregivers/:organizationId/:caregiverId/certifications/:certificationId
 * Remove/expire certification
 */
router.delete(
  '/:organizationId/:caregiverId/certifications/:certificationId',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, caregiverId, certificationId } = req.params;

      const caregiver = await repository.getUser(caregiverId);
      if (!caregiver || caregiver.organization_id !== organizationId) {
        throw ApiErrors.notFound('Caregiver');
      }

      const certification = await repository.getCertification(certificationId);
      if (!certification || certification.user_id !== caregiverId) {
        throw ApiErrors.notFound('Certification');
      }

      // Mark as expired rather than deleting
      await repository.updateCertification(certificationId, {
        status: 'expired',
        updatedBy: req.user?.id,
      });

      res.json({
        id: certificationId,
        message: 'Certification expired successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/console/caregivers/:organizationId/:caregiverId/schedule
 * Get caregiver's upcoming schedule
 */
router.get(
  '/:organizationId/:caregiverId/schedule',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, caregiverId } = req.params;
      const { startDate, endDate, days = '7' } = req.query;

      const caregiver = await repository.getUser(caregiverId);
      if (!caregiver) {
        throw ApiErrors.notFound('Caregiver');
      }

      if (caregiver.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Caregiver does not belong to this organization');
      }

      const start = startDate
        ? new Date(startDate as string)
        : new Date();
      const end = endDate
        ? new Date(endDate as string)
        : new Date(start.getTime() + parseInt(days as string) * 24 * 60 * 60 * 1000);

      const shifts = await repository.getCaregiverShiftsByDateRange(
        caregiverId,
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0]
      );

      res.json({
        caregiverId,
        caregiverName: `${caregiver.first_name} ${caregiver.last_name}`,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        shifts: shifts.map((shift: any) => ({
          id: shift.id,
          clientName: shift.client_name,
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
