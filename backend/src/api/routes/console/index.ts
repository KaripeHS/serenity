/**
 * Console Routes
 * All authenticated Console/ERP endpoints
 *
 * @module api/routes/console
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { sandataRouter } from './sandata';
import dashboardRouter from './dashboard';
import dashboardsRouter from './dashboards';
import podsRouter from './pods';
import morningCheckInRouter from './morning-check-in';
import shiftsRouter from './shifts';
import caregiversRouter from './caregivers';
import clientsRouter from './clients';
import operationsRouter from './operations';
import hrRouter from './hr';
import spiRouter from './spi';
import credentialsRouter from './credentials';
import dispatchRouter from './dispatch';
import billingRouter from './billing';
import podScorecardRouter from './pod-scorecard';
import otAnalysisRouter from './ot-analysis';
import aiAgentsRouter from './ai-agents';
import accessReviewsRouter from './access-reviews';
import evvHealthRouter from './evv-health';
import adminRouter from './admin';
import systemConfigRouter from './system-config';
import checkInRouter from './check-in';
import gapsRouter from './gaps';
import clearinghouseRouter from './clearinghouse';
import payrollRouter from './payroll';
import financeRouter from '../finance.routes';

const router = Router();

// All Console routes require authentication
router.use(requireAuth);

// Finance & Accounting routes (Phase 11)
router.use('/finance', financeRouter);

// Dashboard builder routes (old)
// router.use('/dashboard', dashboardRouter);

// Dashboard data API routes (new - Phase 5.1)
router.use('/dashboard', dashboardsRouter);

// Pods management routes
router.use('/pods', podsRouter);

// Pod scorecard routes
router.use('/pods', podScorecardRouter);

// Morning check-in routes
router.use('/morning-check-in', morningCheckInRouter);

// Operations dashboard routes
router.use('/operations', operationsRouter);

// EVV Health routes
router.use('/operations', evvHealthRouter);

// Shifts management routes
router.use('/shifts', shiftsRouter);

// Caregivers management routes
router.use('/caregivers', caregiversRouter);

// Clients management routes
router.use('/clients', clientsRouter);

// Sandata integration routes
router.use('/sandata', sandataRouter);

// HR management routes
router.use('/hr', hrRouter);

// OT Analysis routes
router.use('/hr', otAnalysisRouter);

// SPI (Serenity Performance Index) routes
router.use('/spi', spiRouter);

// Credentials management routes
router.use('/credentials', credentialsRouter);

// On-call dispatch routes
router.use('/dispatch', dispatchRouter);

// Billing and claims routes
router.use('/billing', billingRouter);

// AI agents routes
router.use('/ai', aiAgentsRouter);

// Access reviews routes (admin)
router.use('/admin', accessReviewsRouter);

// Admin management routes (users, pods, security)
router.use('/admin', adminRouter);

// System configuration routes
router.use('/config', systemConfigRouter);

// Daily check-in status routes (visit tracking)
router.use('/check-in', checkInRouter);

// Coverage gap detection routes (real-time no-show alerts)
router.use('/gaps', gapsRouter);

// Clearinghouse routes (electronic claims submission)
router.use('/clearinghouse', clearinghouseRouter);

// Payroll routes (Gusto, ADP, etc.)
// Payroll routes (Gusto, ADP, etc.)
router.use('/payroll', payrollRouter);

// Intelligent Scheduling routes (Phase 6)
import { createSchedulingRoutes } from './scheduling';
import { DatabaseClient } from '../../../database/client';
import { AuditLogger } from '../../../audit/logger';

// Instantiate scheduling router dependencies
const db = new DatabaseClient();
const audit = new AuditLogger('api-gateway');
router.use('/scheduling', createSchedulingRoutes(db, audit));

export { router as consoleRouter };
