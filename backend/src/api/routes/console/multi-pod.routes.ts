/**
 * Multi-Pod Operations Routes
 * API endpoints for pod dashboards, cross-pod sharing, and regional compliance
 *
 * Phase 3, Months 7-8 - Multi-Pod Operations
 */

import { Router, Request, Response } from 'express';
import { podDashboardService } from '../../../services/pod-dashboard.service';
import { crossPodService } from '../../../services/cross-pod.service';
import { regionalComplianceService } from '../../../services/regional-compliance.service';

const router = Router();

// ============================================
// POD DASHBOARD ROUTES
// ============================================

/**
 * GET /api/console/pods/dashboard
 * Get pod dashboard overview for organization
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const dashboard = await podDashboardService.getPodsDashboard(organizationId);
    res.json(dashboard);
  } catch (error) {
    console.error('Error fetching pod dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch pod dashboard' });
  }
});

/**
 * GET /api/console/pods/:podId/detail
 * Get detailed performance for a specific pod
 */
router.get('/:podId/detail', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const { podId } = req.params;
    const detail = await podDashboardService.getPodDetail(podId, organizationId);

    if (!detail) {
      return res.status(404).json({ error: 'Pod not found' });
    }

    res.json(detail);
  } catch (error) {
    console.error('Error fetching pod detail:', error);
    res.status(500).json({ error: 'Failed to fetch pod detail' });
  }
});

/**
 * GET /api/console/pods/comparison
 * Get pod comparison across organization
 */
router.get('/comparison', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const { month } = req.query;
    const targetMonth = month ? new Date(month as string) : undefined;

    const comparison = await podDashboardService.getPodComparison(
      organizationId,
      targetMonth
    );
    res.json(comparison);
  } catch (error) {
    console.error('Error fetching pod comparison:', error);
    res.status(500).json({ error: 'Failed to fetch pod comparison' });
  }
});

/**
 * PATCH /api/console/pods/:podId/targets
 * Update pod targets
 */
router.patch('/:podId/targets', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const { podId } = req.params;
    const { targetClientCount, targetCaregiverCount } = req.body;

    const updated = await podDashboardService.updatePodTargets(
      podId,
      organizationId,
      { targetClientCount, targetCaregiverCount }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Pod not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating pod targets:', error);
    res.status(500).json({ error: 'Failed to update pod targets' });
  }
});

/**
 * POST /api/console/pods/:podId/snapshots/daily
 * Generate daily performance snapshot for a pod
 */
router.post('/:podId/snapshots/daily', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const { podId } = req.params;
    const result = await podDashboardService.generateDailySnapshot(podId);
    res.json(result);
  } catch (error) {
    console.error('Error generating daily snapshot:', error);
    res.status(500).json({ error: 'Failed to generate daily snapshot' });
  }
});

/**
 * POST /api/console/pods/snapshots/all
 * Generate daily snapshots for all pods
 */
router.post('/snapshots/all', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const result = await podDashboardService.generateAllDailySnapshots(
      organizationId
    );
    res.json(result);
  } catch (error) {
    console.error('Error generating all snapshots:', error);
    res.status(500).json({ error: 'Failed to generate snapshots' });
  }
});

// ============================================
// REGION ROUTES
// ============================================

/**
 * GET /api/console/pods/regions
 * Get all regions for organization
 */
router.get('/regions', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const regions = await podDashboardService.getRegions(organizationId);
    res.json(regions);
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Failed to fetch regions' });
  }
});

/**
 * POST /api/console/pods/regions
 * Create a new region
 */
router.post('/regions', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const { name, description, counties, zipCodes, regionalManagerId } =
      req.body;

    if (!name) {
      return res.status(400).json({ error: 'Region name is required' });
    }

    const region = await podDashboardService.createRegion(organizationId, {
      name,
      description,
      counties,
      zipCodes,
      regionalManagerId,
    });

    res.status(201).json(region);
  } catch (error) {
    console.error('Error creating region:', error);
    res.status(500).json({ error: 'Failed to create region' });
  }
});

/**
 * PATCH /api/console/pods/regions/:regionId
 * Update a region
 */
router.patch('/regions/:regionId', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const { regionId } = req.params;
    const updated = await podDashboardService.updateRegion(
      regionId,
      organizationId,
      req.body
    );

    if (!updated) {
      return res.status(404).json({ error: 'Region not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating region:', error);
    res.status(500).json({ error: 'Failed to update region' });
  }
});

/**
 * PUT /api/console/pods/:podId/region
 * Assign pod to region
 */
router.put('/:podId/region', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const { podId } = req.params;
    const { regionId } = req.body;

    const updated = await podDashboardService.assignPodToRegion(
      podId,
      regionId || null,
      organizationId
    );

    if (!updated) {
      return res.status(404).json({ error: 'Pod not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error assigning pod to region:', error);
    res.status(500).json({ error: 'Failed to assign pod to region' });
  }
});

// ============================================
// CROSS-POD ASSIGNMENT ROUTES
// ============================================

/**
 * GET /api/console/pods/cross-pod/assignments
 * Get all cross-pod assignments
 */
router.get('/cross-pod/assignments', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const {
      status,
      assignmentType,
      primaryPodId,
      assignedPodId,
      fromDate,
      toDate,
    } = req.query;

    const assignments = await crossPodService.getAssignments(organizationId, {
      status: status as string,
      assignmentType: assignmentType as string,
      primaryPodId: primaryPodId as string,
      assignedPodId: assignedPodId as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
    });

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching cross-pod assignments:', error);
    res.status(500).json({ error: 'Failed to fetch cross-pod assignments' });
  }
});

/**
 * GET /api/console/pods/:podId/cross-pod
 * Get cross-pod assignments for a specific pod
 */
router.get('/:podId/cross-pod', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const { podId } = req.params;
    const { direction } = req.query;

    const assignments = await crossPodService.getPodAssignments(
      podId,
      organizationId,
      (direction as 'incoming' | 'outgoing') || 'incoming'
    );

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching pod cross-pod assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

/**
 * POST /api/console/pods/cross-pod/assignments
 * Create a cross-pod assignment request
 */
router.post('/cross-pod/assignments', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      caregiverId,
      primaryPodId,
      assignedPodId,
      assignmentType,
      reason,
      startDate,
      endDate,
      maxHoursPerWeek,
      allowedShiftTypes,
    } = req.body;

    if (!caregiverId || !primaryPodId || !assignedPodId || !startDate) {
      return res
        .status(400)
        .json({
          error:
            'caregiverId, primaryPodId, assignedPodId, and startDate are required',
        });
    }

    const assignment = await crossPodService.createAssignment(organizationId, {
      caregiverId,
      primaryPodId,
      assignedPodId,
      assignmentType: assignmentType || 'temporary',
      reason,
      startDate,
      endDate,
      maxHoursPerWeek,
      allowedShiftTypes,
      requestedBy: userId,
    });

    res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Error creating cross-pod assignment:', error);
    res
      .status(400)
      .json({ error: error.message || 'Failed to create assignment' });
  }
});

/**
 * POST /api/console/pods/cross-pod/assignments/:id/review
 * Approve or reject an assignment
 */
router.post(
  '/cross-pod/assignments/:id/review',
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.userId;
      if (!organizationId || !userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      const { approved, notes } = req.body;

      if (approved === undefined) {
        return res.status(400).json({ error: 'approved is required' });
      }

      const result = await crossPodService.reviewAssignment(
        id,
        organizationId,
        approved,
        userId,
        notes
      );

      if (!result) {
        return res.status(404).json({ error: 'Assignment not found or already reviewed' });
      }

      res.json(result);
    } catch (error) {
      console.error('Error reviewing assignment:', error);
      res.status(500).json({ error: 'Failed to review assignment' });
    }
  }
);

/**
 * POST /api/console/pods/cross-pod/assignments/:id/activate
 * Activate an approved assignment
 */
router.post(
  '/cross-pod/assignments/:id/activate',
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { id } = req.params;
      const result = await crossPodService.activateAssignment(id, organizationId);

      if (!result) {
        return res.status(404).json({ error: 'Assignment not found or not ready to activate' });
      }

      res.json(result);
    } catch (error) {
      console.error('Error activating assignment:', error);
      res.status(500).json({ error: 'Failed to activate assignment' });
    }
  }
);

/**
 * POST /api/console/pods/cross-pod/assignments/:id/complete
 * Complete an assignment
 */
router.post(
  '/cross-pod/assignments/:id/complete',
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { id } = req.params;
      const result = await crossPodService.completeAssignment(id, organizationId);

      if (!result) {
        return res.status(404).json({ error: 'Assignment not found or not active' });
      }

      res.json(result);
    } catch (error) {
      console.error('Error completing assignment:', error);
      res.status(500).json({ error: 'Failed to complete assignment' });
    }
  }
);

// ============================================
// FLOATING POOL ROUTES
// ============================================

/**
 * GET /api/console/pods/floating-pool
 * Get floating caregiver pool
 */
router.get('/floating-pool', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const { availableOnly } = req.query;
    const pool = await crossPodService.getFloatingPool(
      organizationId,
      availableOnly === 'true'
    );

    res.json(pool);
  } catch (error) {
    console.error('Error fetching floating pool:', error);
    res.status(500).json({ error: 'Failed to fetch floating pool' });
  }
});

/**
 * POST /api/console/pods/floating-pool
 * Add caregiver to floating pool
 */
router.post('/floating-pool', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const {
      caregiverId,
      isAvailable,
      availablePods,
      excludedPods,
      maxTravelMiles,
      preferredShiftTypes,
      preferredDays,
      minPerformanceScore,
      requiresTransportation,
    } = req.body;

    if (!caregiverId) {
      return res.status(400).json({ error: 'caregiverId is required' });
    }

    const entry = await crossPodService.addToFloatingPool(organizationId, {
      caregiverId,
      isAvailable,
      availablePods,
      excludedPods,
      maxTravelMiles,
      preferredShiftTypes,
      preferredDays,
      minPerformanceScore,
      requiresTransportation,
    });

    res.status(201).json(entry);
  } catch (error: any) {
    console.error('Error adding to floating pool:', error);
    res.status(400).json({ error: error.message || 'Failed to add to pool' });
  }
});

/**
 * PATCH /api/console/pods/floating-pool/:caregiverId
 * Update floating pool entry
 */
router.patch(
  '/floating-pool/:caregiverId',
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { caregiverId } = req.params;
      const updated = await crossPodService.updateFloatingPoolEntry(
        caregiverId,
        organizationId,
        req.body
      );

      if (!updated) {
        return res.status(404).json({ error: 'Pool entry not found' });
      }

      res.json(updated);
    } catch (error) {
      console.error('Error updating floating pool entry:', error);
      res.status(500).json({ error: 'Failed to update pool entry' });
    }
  }
);

/**
 * DELETE /api/console/pods/floating-pool/:caregiverId
 * Remove caregiver from floating pool
 */
router.delete(
  '/floating-pool/:caregiverId',
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { caregiverId } = req.params;
      const removed = await crossPodService.removeFromFloatingPool(
        caregiverId,
        organizationId
      );

      if (!removed) {
        return res.status(404).json({ error: 'Pool entry not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error removing from floating pool:', error);
      res.status(500).json({ error: 'Failed to remove from pool' });
    }
  }
);

/**
 * GET /api/console/pods/floating-pool/match
 * Find available floaters for a coverage gap
 */
router.get('/floating-pool/match', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const { targetPodId, shiftDate, shiftType } = req.query;

    if (!targetPodId || !shiftDate) {
      return res
        .status(400)
        .json({ error: 'targetPodId and shiftDate are required' });
    }

    const floaters = await crossPodService.findAvailableFloaters(
      organizationId,
      targetPodId as string,
      shiftDate as string,
      shiftType as string
    );

    res.json(floaters);
  } catch (error) {
    console.error('Error finding available floaters:', error);
    res.status(500).json({ error: 'Failed to find floaters' });
  }
});

/**
 * GET /api/console/pods/cross-pod/summary
 * Get cross-pod activity summary
 */
router.get('/cross-pod/summary', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const summary = await crossPodService.getActivitySummary(organizationId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching cross-pod summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// ============================================
// REGIONAL COMPLIANCE ROUTES
// ============================================

/**
 * GET /api/console/pods/compliance/dashboard
 * Get organization-wide compliance dashboard
 */
router.get('/compliance/dashboard', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const dashboard = await regionalComplianceService.getComplianceDashboard(
      organizationId
    );
    res.json(dashboard);
  } catch (error) {
    console.error('Error fetching compliance dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch compliance dashboard' });
  }
});

/**
 * GET /api/console/pods/compliance/alerts
 * Get compliance alerts
 */
router.get('/compliance/alerts', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const alerts = await regionalComplianceService.getComplianceAlerts(
      organizationId
    );
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching compliance alerts:', error);
    res.status(500).json({ error: 'Failed to fetch compliance alerts' });
  }
});

/**
 * GET /api/console/pods/compliance/trend
 * Get compliance trend over time
 */
router.get('/compliance/trend', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const { days } = req.query;
    const trend = await regionalComplianceService.getComplianceTrend(
      organizationId,
      days ? parseInt(days as string) : 30
    );

    res.json(trend);
  } catch (error) {
    console.error('Error fetching compliance trend:', error);
    res.status(500).json({ error: 'Failed to fetch compliance trend' });
  }
});

/**
 * GET /api/console/pods/regions/:regionId/compliance
 * Get detailed compliance for a region
 */
router.get(
  '/regions/:regionId/compliance',
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { regionId } = req.params;
      const detail = await regionalComplianceService.getRegionComplianceDetail(
        regionId,
        organizationId
      );

      if (!detail) {
        return res.status(404).json({ error: 'Region not found' });
      }

      res.json(detail);
    } catch (error) {
      console.error('Error fetching region compliance:', error);
      res.status(500).json({ error: 'Failed to fetch region compliance' });
    }
  }
);

/**
 * GET /api/console/pods/:podId/compliance
 * Get detailed compliance for a pod
 */
router.get('/:podId/compliance', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const { podId } = req.params;
    const detail = await regionalComplianceService.getPodComplianceDetail(
      podId,
      organizationId
    );

    if (!detail) {
      return res.status(404).json({ error: 'Pod not found' });
    }

    res.json(detail);
  } catch (error) {
    console.error('Error fetching pod compliance:', error);
    res.status(500).json({ error: 'Failed to fetch pod compliance' });
  }
});

/**
 * POST /api/console/pods/compliance/snapshots
 * Generate compliance snapshots for all pods
 */
router.post('/compliance/snapshots', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const result = await regionalComplianceService.generateAllComplianceSnapshots(
      organizationId
    );
    res.json(result);
  } catch (error) {
    console.error('Error generating compliance snapshots:', error);
    res.status(500).json({ error: 'Failed to generate snapshots' });
  }
});

/**
 * GET /api/console/pods/compliance/export
 * Export compliance report
 */
router.get('/compliance/export', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const { format } = req.query;
    const report = await regionalComplianceService.exportComplianceReport(
      organizationId,
      (format as 'summary' | 'detailed') || 'summary'
    );

    res.json(report);
  } catch (error) {
    console.error('Error exporting compliance report:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

export default router;
