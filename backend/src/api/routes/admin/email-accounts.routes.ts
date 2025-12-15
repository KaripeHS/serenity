/**
 * Email Accounts Routes
 * Admin endpoints for managing organization email accounts
 *
 * @module api/routes/admin/email-accounts
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { emailAccountService } from '../../../services/email-account.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('email-accounts-routes');

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/admin/email-accounts
 * Get all email accounts for the organization
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const accounts = await emailAccountService.getEmailAccounts(organizationId);

    res.json({
      success: true,
      accounts,
      count: accounts.length,
    });
  } catch (error) {
    logger.error('Failed to get email accounts', { error });
    next(error);
  }
});

/**
 * GET /api/admin/email-accounts/:id
 * Get a specific email account
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const account = await emailAccountService.getEmailAccountById(id, organizationId);

    if (!account) {
      throw ApiErrors.notFound('Email account');
    }

    res.json({
      success: true,
      account,
    });
  } catch (error) {
    logger.error('Failed to get email account', { error });
    next(error);
  }
});

/**
 * POST /api/admin/email-accounts
 * Create a new email account
 */
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const {
      emailAddress,
      displayName,
      description,
      purpose,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      isActive,
      isDefault,
    } = req.body;

    if (!emailAddress || !purpose) {
      throw ApiErrors.badRequest('emailAddress and purpose are required');
    }

    const account = await emailAccountService.createEmailAccount(
      organizationId,
      {
        emailAddress,
        displayName,
        description,
        purpose,
        smtpHost,
        smtpPort,
        smtpSecure,
        smtpUser,
        isActive,
        isDefault,
      },
      userId
    );

    res.status(201).json({
      success: true,
      account,
    });
  } catch (error) {
    logger.error('Failed to create email account', { error });
    next(error);
  }
});

/**
 * PUT /api/admin/email-accounts/:id
 * Update an email account
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const account = await emailAccountService.updateEmailAccount(id, organizationId, req.body);

    if (!account) {
      throw ApiErrors.notFound('Email account');
    }

    res.json({
      success: true,
      account,
    });
  } catch (error) {
    logger.error('Failed to update email account', { error });
    next(error);
  }
});

/**
 * DELETE /api/admin/email-accounts/:id
 * Delete an email account
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const deleted = await emailAccountService.deleteEmailAccount(id, organizationId);

    if (!deleted) {
      throw ApiErrors.notFound('Email account');
    }

    res.json({
      success: true,
      message: 'Email account deleted',
    });
  } catch (error) {
    logger.error('Failed to delete email account', { error });
    next(error);
  }
});

/**
 * POST /api/admin/email-accounts/:id/set-default
 * Set an email account as the default
 */
router.post('/:id/set-default', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const account = await emailAccountService.updateEmailAccount(id, organizationId, { isDefault: true });

    if (!account) {
      throw ApiErrors.notFound('Email account');
    }

    res.json({
      success: true,
      account,
    });
  } catch (error) {
    logger.error('Failed to set default email account', { error });
    next(error);
  }
});

export default router;
