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
import bonusRouter from './bonus.routes';
import claimsRouter from './claims.routes';
import calendarRouter from './calendar.routes';
import dispatchAlertsRouter from './dispatch-alerts.routes';
import trainingRouter from './training.routes';
import availabilityRouter from './availability.routes';
import authorizationsRouter from './authorizations.routes';
import backgroundChecksRouter from './background-checks.routes';
import applicantsRouter from './applicants.routes';
import interviewsRouter from './interviews.routes';
import offerLettersRouter from './offer-letters.routes';
import onboardingRouter from './onboarding.routes';
import remittanceRouter from './remittance.routes';
import denialsRouter from './denials.routes';
import arAgingRouter from './ar-aging.routes';
import operationsEfficiencyRouter from './operations-efficiency.routes';
import multiPodRouter from './multi-pod.routes';
import year2Router from './year2.routes';
import financeRouter from '../finance.routes';
import jobBoardRouter from './job-board.routes';
import expensesRouter from './expenses.routes';
import clientBudgetsRouter from './client-budgets.routes';

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
router.use('/payroll', payrollRouter);

// Caregiver Bonus routes (90-day, Show Up, Hours, Loyalty bonuses)
router.use('/bonus', bonusRouter);

// Claims generation and management routes
router.use('/claims', claimsRouter);

// Visual scheduling calendar routes
router.use('/calendar', calendarRouter);

// Dispatch alerts and coverage gap detection
router.use('/dispatch-alerts', dispatchAlertsRouter);

// Training management routes (compliance, certifications, onboarding)
router.use('/training', trainingRouter);

// Caregiver availability management routes (patterns, time-off, preferences)
router.use('/availability', availabilityRouter);

// Authorization management routes (utilization tracking, renewals, alerts)
router.use('/authorizations', authorizationsRouter);

// Background check management routes (BCI, FBI, compliance tracking)
router.use('/background-checks', backgroundChecksRouter);

// HR/Recruiting routes (Phase 2)
// Applicant tracking and recruiting pipeline
router.use('/applicants', applicantsRouter);

// Interview scheduling and feedback
router.use('/interviews', interviewsRouter);

// Offer letter management
router.use('/offer-letters', offerLettersRouter);

// Onboarding checklist management
router.use('/onboarding', onboardingRouter);

// Advanced Billing routes (Phase 2 - Month 5)
// Remittance (835) processing and auto-posting
router.use('/remittance', remittanceRouter);

// Denial management and appeals workflow
router.use('/denials', denialsRouter);

// AR aging reports and KPIs
router.use('/ar-aging', arAgingRouter);

// Operational Efficiency routes (Phase 2 - Month 6)
// Scheduling recommendations, travel optimization, performance, satisfaction
router.use('/operations', operationsEfficiencyRouter);

// Multi-Pod Operations routes (Phase 3 - Months 7-8)
// Pod dashboards, cross-pod sharing, floating pool, regional compliance
router.use('/pods', multiPodRouter);

// Year 2 Preparation routes (Phase 3 - Months 11-12)
// DODD certification, HPC authorizations, Consumer-Directed care, Payroll integration
router.use('/year2', year2Router);

// BIC Feature: Staff Job Board & Shift Bidding System
// Caregivers can self-select open shifts with qualification scoring
router.use('/job-board', jobBoardRouter);

// BIC Feature: Expense & Mileage Tracking
// Caregivers log mileage and expenses with receipt uploads and auto-reimbursement
router.use('/expenses', expensesRouter);

// BIC Feature: Client Budget & Funds Management
// Real-time visibility into client budgets with low-balance alerts
router.use('/client-budgets', clientBudgetsRouter);

// Intelligent Scheduling routes (Phase 6)
import { createSchedulingRoutes } from './scheduling';
import { DatabaseClient } from '../../../database/client';
import { AuditLogger } from '../../../audit/logger';

// Instantiate scheduling router dependencies
const db = new DatabaseClient();
const audit = new AuditLogger('api-gateway');
router.use('/scheduling', createSchedulingRoutes(db, audit));

export { router as consoleRouter };
