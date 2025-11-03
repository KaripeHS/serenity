/**
 * Console Pods Routes
 * Manages pod assignments, pod rosters, and pod-specific operations
 *
 * @module api/routes/console/pods
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getSandataRepository } from '../../../services/sandata/repositories/sandata.repository';
import { getDbClient } from '../../../database/client';

const router = Router();
const repository = getSandataRepository(getDbClient());

/**
 * GET /api/console/pods/:organizationId
 * Get all pods for an organization
 */
router.get('/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;

    const pods = await repository.getPods(organizationId);

    res.json({
      organizationId,
      pods: pods.map((pod: any) => ({
        id: pod.id,
        name: pod.pod_name,
        leadUserId: pod.pod_lead_user_id,
        memberCount: pod.member_count || 0,
        clientCount: pod.client_count || 0,
        status: pod.status,
        createdAt: pod.created_at,
      })),
      count: pods.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/pods/:organizationId/:podId
 * Get detailed pod information
 */
router.get('/:organizationId/:podId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId, podId } = req.params;

    const pod = await repository.getPod(podId);

    if (!pod) {
      throw ApiErrors.notFound('Pod');
    }

    if (pod.organization_id !== organizationId) {
      throw ApiErrors.forbidden('Pod does not belong to this organization');
    }

    // Get pod members (caregivers)
    const members = await repository.getPodMembers(podId);

    // Get pod clients
    const clients = await repository.getPodClients(podId);

    // Get pod lead info
    const podLead = pod.pod_lead_user_id
      ? await repository.getUser(pod.pod_lead_user_id)
      : null;

    res.json({
      id: pod.id,
      name: pod.pod_name,
      organizationId: pod.organization_id,
      podLead: podLead
        ? {
            id: podLead.id,
            name: `${podLead.first_name} ${podLead.last_name}`,
            email: podLead.email,
          }
        : null,
      members: members.map((member: any) => ({
        id: member.id,
        name: `${member.first_name} ${member.last_name}`,
        role: member.role,
        status: member.status,
        sandataEmployeeId: member.sandata_employee_id,
        assignedAt: member.pod_assigned_at,
      })),
      clients: clients.map((client: any) => ({
        id: client.id,
        name: `${client.first_name} ${client.last_name}`,
        status: client.status,
        sandataClientId: client.sandata_client_id,
        assignedAt: client.pod_assigned_at,
      })),
      status: pod.status,
      createdAt: pod.created_at,
      updatedAt: pod.updated_at,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/pods/:organizationId
 * Create a new pod
 */
router.post('/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;
    const { name, podLeadUserId } = req.body;

    if (!name) {
      throw ApiErrors.badRequest('Pod name is required');
    }

    // Validate pod lead if provided
    if (podLeadUserId) {
      const podLead = await repository.getUser(podLeadUserId);
      if (!podLead) {
        throw ApiErrors.badRequest('Pod lead user not found');
      }
      if (podLead.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Pod lead must belong to this organization');
      }
    }

    const podId = await repository.createPod({
      organizationId,
      podName: name,
      podLeadUserId: podLeadUserId || null,
      status: 'active',
    });

    res.status(201).json({
      id: podId,
      name,
      organizationId,
      podLeadUserId,
      status: 'active',
      message: 'Pod created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/pods/:organizationId/:podId
 * Update pod details
 */
router.put('/:organizationId/:podId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId, podId } = req.params;
    const { name, podLeadUserId, status } = req.body;

    const pod = await repository.getPod(podId);
    if (!pod) {
      throw ApiErrors.notFound('Pod');
    }

    if (pod.organization_id !== organizationId) {
      throw ApiErrors.forbidden('Pod does not belong to this organization');
    }

    // Validate pod lead if provided
    if (podLeadUserId) {
      const podLead = await repository.getUser(podLeadUserId);
      if (!podLead) {
        throw ApiErrors.badRequest('Pod lead user not found');
      }
      if (podLead.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Pod lead must belong to this organization');
      }
    }

    await repository.updatePod(podId, {
      podName: name,
      podLeadUserId: podLeadUserId,
      status: status,
    });

    res.json({
      id: podId,
      name,
      podLeadUserId,
      status,
      message: 'Pod updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/pods/:organizationId/:podId/members
 * Assign caregiver(s) to pod
 */
router.post(
  '/:organizationId/:podId/members',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, podId } = req.params;
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw ApiErrors.badRequest('userIds must be a non-empty array');
      }

      const pod = await repository.getPod(podId);
      if (!pod) {
        throw ApiErrors.notFound('Pod');
      }

      if (pod.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Pod does not belong to this organization');
      }

      // Validate all users exist and belong to organization
      for (const userId of userIds) {
        const user = await repository.getUser(userId);
        if (!user) {
          throw ApiErrors.badRequest(`User ${userId} not found`);
        }
        if (user.organization_id !== organizationId) {
          throw ApiErrors.forbidden(`User ${userId} does not belong to this organization`);
        }
      }

      // Assign users to pod
      await repository.assignUsersToPod(podId, userIds);

      res.json({
        podId,
        assignedCount: userIds.length,
        message: `${userIds.length} member(s) assigned to pod successfully`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/console/pods/:organizationId/:podId/members/:userId
 * Remove caregiver from pod
 */
router.delete(
  '/:organizationId/:podId/members/:userId',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, podId, userId } = req.params;

      const pod = await repository.getPod(podId);
      if (!pod) {
        throw ApiErrors.notFound('Pod');
      }

      if (pod.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Pod does not belong to this organization');
      }

      await repository.removeUserFromPod(podId, userId);

      res.json({
        podId,
        userId,
        message: 'Member removed from pod successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/console/pods/:organizationId/:podId/clients
 * Assign client(s) to pod
 */
router.post(
  '/:organizationId/:podId/clients',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, podId } = req.params;
      const { clientIds } = req.body;

      if (!Array.isArray(clientIds) || clientIds.length === 0) {
        throw ApiErrors.badRequest('clientIds must be a non-empty array');
      }

      const pod = await repository.getPod(podId);
      if (!pod) {
        throw ApiErrors.notFound('Pod');
      }

      if (pod.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Pod does not belong to this organization');
      }

      // Validate all clients exist and belong to organization
      for (const clientId of clientIds) {
        const client = await repository.getClient(clientId);
        if (!client) {
          throw ApiErrors.badRequest(`Client ${clientId} not found`);
        }
        if (client.organization_id !== organizationId) {
          throw ApiErrors.forbidden(`Client ${clientId} does not belong to this organization`);
        }
      }

      // Assign clients to pod
      await repository.assignClientsToPod(podId, clientIds);

      res.json({
        podId,
        assignedCount: clientIds.length,
        message: `${clientIds.length} client(s) assigned to pod successfully`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/console/pods/:organizationId/:podId/clients/:clientId
 * Remove client from pod
 */
router.delete(
  '/:organizationId/:podId/clients/:clientId',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, podId, clientId } = req.params;

      const pod = await repository.getPod(podId);
      if (!pod) {
        throw ApiErrors.notFound('Pod');
      }

      if (pod.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Pod does not belong to this organization');
      }

      await repository.removeClientFromPod(podId, clientId);

      res.json({
        podId,
        clientId,
        message: 'Client removed from pod successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
