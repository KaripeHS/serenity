/**
 * Console Dashboard Routes
 * Provides KPIs, metrics, and overview data for pod dashboards
 *
 * @module api/routes/console/dashboard
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getSandataRepository } from '../../../services/sandata/repositories/sandata.repository';
import { getDbClient } from '../../../database/client';

const router = Router();
const repository = getSandataRepository(getDbClient());

/**
 * GET /api/console/dashboard/pod/:podId
 * Get dashboard overview for a specific pod
 */
router.get('/pod/:podId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { podId } = req.params;
    const { organizationId } = req.query;

    if (!organizationId) {
      throw ApiErrors.badRequest('organizationId query parameter is required');
    }

    // TODO: Implement pod-based filtering when pods table is ready
    // For now, return organization-wide metrics

    // Get active caregivers count
    const caregivers = await repository.getActiveUsers(organizationId as string, 'caregiver');

    // Get active clients count
    const clients = await repository.getActiveClients(organizationId as string);

    // Get today's scheduled shifts
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const shifts = await repository.getShiftsByDate(organizationId as string, todayStr);

    // Get EVV compliance metrics for current week
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Sunday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Saturday

    const evvRecords = await repository.getEVVRecordsByDateRange(
      organizationId as string,
      weekStart.toISOString().split('T')[0],
      weekEnd.toISOString().split('T')[0]
    );

    // Calculate EVV compliance
    const totalVisits = evvRecords.length;
    const compliantVisits = evvRecords.filter(
      (record: any) => record.sandata_status === 'accepted'
    ).length;
    const pendingVisits = evvRecords.filter(
      (record: any) => record.sandata_status === 'pending'
    ).length;
    const rejectedVisits = evvRecords.filter(
      (record: any) => record.sandata_status === 'rejected'
    ).length;

    const complianceRate = totalVisits > 0 ? (compliantVisits / totalVisits) * 100 : 0;

    // Get pending Sandata submissions
    const pendingSandataSubmissions = await repository.getPendingEVVRecords(
      organizationId as string
    );

    res.json({
      podId,
      organizationId,
      metrics: {
        caregivers: {
          total: caregivers.length,
          active: caregivers.filter((c: any) => c.status === 'active').length,
          onShiftToday: shifts.filter((s: any) => s.status === 'in_progress').length,
        },
        clients: {
          total: clients.length,
          active: clients.filter((c: any) => c.status === 'active').length,
          scheduledToday: shifts.length,
        },
        shifts: {
          today: shifts.length,
          completed: shifts.filter((s: any) => s.status === 'completed').length,
          inProgress: shifts.filter((s: any) => s.status === 'in_progress').length,
          upcoming: shifts.filter((s: any) => s.status === 'scheduled').length,
          missed: shifts.filter((s: any) => s.status === 'missed').length,
        },
        evvCompliance: {
          weeklyRate: Math.round(complianceRate * 10) / 10, // Round to 1 decimal
          totalVisits,
          compliantVisits,
          pendingVisits,
          rejectedVisits,
          pendingSandataSubmissions: pendingSandataSubmissions.length,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/dashboard/kpis/:organizationId
 * Get high-level KPIs for organization
 */
router.get('/kpis/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;
    const { period = '30' } = req.query; // days

    const daysBack = parseInt(period as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = new Date().toISOString().split('T')[0];

    // Get EVV records for period
    const evvRecords = await repository.getEVVRecordsByDateRange(
      organizationId,
      startDateStr,
      endDateStr
    );

    // Calculate billable hours
    const billableHours = evvRecords.reduce((total: number, record: any) => {
      return total + (record.billable_units || 0) * 0.25; // 15-min units
    }, 0);

    // Get Sandata sync metrics
    const syncedToSandata = evvRecords.filter(
      (r: any) => r.sandata_visit_id !== null
    ).length;
    const sandataSyncRate = evvRecords.length > 0 ? (syncedToSandata / evvRecords.length) * 100 : 0;

    // Get active resources
    const caregivers = await repository.getActiveUsers(organizationId, 'caregiver');
    const clients = await repository.getActiveClients(organizationId);

    // Get certification expirations (next 30 days)
    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
    const expiringCerts = await repository.getExpiringCertifications(
      organizationId,
      thirtyDaysOut.toISOString().split('T')[0]
    );

    res.json({
      organizationId,
      period: `${daysBack} days`,
      kpis: {
        billableHours: Math.round(billableHours * 10) / 10,
        totalVisits: evvRecords.length,
        sandataSyncRate: Math.round(sandataSyncRate * 10) / 10,
        activeCaregivers: caregivers.length,
        activeClients: clients.length,
        expiringCertifications: expiringCerts.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/dashboard/recent-activity/:organizationId
 * Get recent system activity (EVV submissions, corrections, errors)
 */
router.get(
  '/recent-activity/:organizationId',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId } = req.params;
      const { limit = '20' } = req.query;

      // Get recent transactions from Sandata
      const transactions = await repository.getRecentTransactions(
        organizationId,
        parseInt(limit as string)
      );

      // Format activity feed
      const activities = transactions.map((tx: any) => ({
        id: tx.id,
        type: tx.transaction_type,
        timestamp: tx.created_at,
        status: tx.status,
        description: formatActivityDescription(tx),
        transactionId: tx.sandata_transaction_id,
      }));

      res.json({
        organizationId,
        activities,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/console/dashboard/alerts/:organizationId
 * Get system alerts (rejected visits, expiring certs, compliance issues)
 */
router.get('/alerts/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;

    const alerts = [];

    // Check for rejected Sandata visits
    const rejectedVisits = await repository.getRejectedEVVRecords(organizationId);
    if (rejectedVisits.length > 0) {
      alerts.push({
        type: 'error',
        severity: 'high',
        title: 'Rejected Sandata Visits',
        message: `${rejectedVisits.length} visit(s) rejected by Sandata require attention`,
        count: rejectedVisits.length,
        action: '/console/sandata/rejected-visits',
      });
    }

    // Check for pending submissions
    const pendingVisits = await repository.getPendingEVVRecords(organizationId);
    if (pendingVisits.length > 5) {
      // Alert if more than 5 pending
      alerts.push({
        type: 'warning',
        severity: 'medium',
        title: 'Pending EVV Submissions',
        message: `${pendingVisits.length} visit(s) waiting to be submitted to Sandata`,
        count: pendingVisits.length,
        action: '/console/sandata/pending-visits',
      });
    }

    // Check for expiring certifications (next 14 days)
    const twoWeeksOut = new Date();
    twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);
    const expiringCerts = await repository.getExpiringCertifications(
      organizationId,
      twoWeeksOut.toISOString().split('T')[0]
    );

    if (expiringCerts.length > 0) {
      alerts.push({
        type: 'warning',
        severity: 'medium',
        title: 'Expiring Certifications',
        message: `${expiringCerts.length} certification(s) expiring in the next 14 days`,
        count: expiringCerts.length,
        action: '/console/hr/certifications',
      });
    }

    // Check for caregivers without Sandata sync
    const caregivers = await repository.getActiveUsers(organizationId, 'caregiver');
    const unsyncedCaregivers = caregivers.filter((c: any) => !c.sandata_employee_id);
    if (unsyncedCaregivers.length > 0) {
      alerts.push({
        type: 'info',
        severity: 'low',
        title: 'Unsynced Caregivers',
        message: `${unsyncedCaregivers.length} caregiver(s) not yet synced to Sandata`,
        count: unsyncedCaregivers.length,
        action: '/console/sandata/employees',
      });
    }

    res.json({
      organizationId,
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Helper: Format activity description from transaction
 */
function formatActivityDescription(transaction: any): string {
  const type = transaction.transaction_type;
  const status = transaction.status;

  switch (type) {
    case 'visit':
      return status === 'accepted'
        ? 'Visit submitted to Sandata successfully'
        : 'Visit submission failed';
    case 'visit_correction':
      return status === 'accepted'
        ? 'Visit correction accepted by Sandata'
        : 'Visit correction rejected';
    case 'void':
      return status === 'accepted' ? 'Visit voided in Sandata' : 'Void request rejected';
    case 'individual':
      return status === 'accepted' ? 'Client synced to Sandata' : 'Client sync failed';
    case 'employee':
      return status === 'accepted' ? 'Caregiver synced to Sandata' : 'Caregiver sync failed';
    default:
      return `${type} - ${status}`;
  }
}

export default router;
