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
import podsRouter from './pods';
import morningCheckInRouter from './morning-check-in';
import shiftsRouter from './shifts';
import caregiversRouter from './caregivers';
import clientsRouter from './clients';
import operationsRouter from './operations';

const router = Router();

// All Console routes require authentication
router.use(requireAuth);

// Dashboard routes
router.use('/dashboard', dashboardRouter);

// Pods management routes
router.use('/pods', podsRouter);

// Morning check-in routes
router.use('/morning-check-in', morningCheckInRouter);

// Operations dashboard routes
router.use('/operations', operationsRouter);

// Shifts management routes
router.use('/shifts', shiftsRouter);

// Caregivers management routes
router.use('/caregivers', caregiversRouter);

// Clients management routes
router.use('/clients', clientsRouter);

// Sandata integration routes
router.use('/sandata', sandataRouter);

// TODO: Add more Console routes
// router.use('/spi', spiRouter);
// router.use('/hr', hrRouter);

export { router as consoleRouter };
