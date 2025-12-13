/**
 * Family Portal Routes
 * API endpoints for family members to access the portal
 *
 * Phase 3, Months 9-10 - Family Portal
 */

import { Router, Request, Response, NextFunction } from 'express';
import { familyAuthService } from '../../../services/family-auth.service';
import { familyVisitsService } from '../../../services/family-visits.service';
import { familyMessagingService } from '../../../services/family-messaging.service';
import { familyDocumentsService } from '../../../services/family-documents.service';

const router = Router();

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

interface FamilyMemberContext {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  clientId: string;
  clientName: string;
  organizationId: string;
  accessLevel: string;
  relationship: string;
}

declare global {
  namespace Express {
    interface Request {
      familyMember?: FamilyMemberContext;
    }
  }
}

/**
 * Middleware to validate family member token
 */
const requireFamilyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const member = await familyAuthService.validateToken(token);

    req.familyMember = member;
    next();
  } catch (error: any) {
    return res.status(401).json({ error: error.message || 'Invalid token' });
  }
};

// ============================================
// PUBLIC AUTH ROUTES
// ============================================

/**
 * POST /api/family/auth/login
 * Login family member
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    };

    const result = await familyAuthService.login(email, password, deviceInfo);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Login failed' });
  }
});

/**
 * POST /api/family/auth/register
 * Complete registration with verification token
 */
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { verificationToken, password } = req.body;

    if (!verificationToken || !password) {
      return res
        .status(400)
        .json({ error: 'Verification token and password are required' });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters' });
    }

    const result = await familyAuthService.completeRegistration(
      verificationToken,
      password
    );
    res.json({ success: true, message: 'Registration complete' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

/**
 * POST /api/family/auth/refresh
 * Refresh access token
 */
router.post('/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const result = await familyAuthService.refreshToken(refreshToken);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Token refresh failed' });
  }
});

/**
 * POST /api/family/auth/forgot-password
 * Request password reset
 */
router.post('/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await familyAuthService.requestPasswordReset(email);
    res.json({
      success: true,
      message: 'If an account exists, a reset link will be sent',
    });
  } catch (error) {
    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists, a reset link will be sent',
    });
  }
});

/**
 * POST /api/family/auth/reset-password
 * Reset password with token
 */
router.post('/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res
        .status(400)
        .json({ error: 'Reset token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters' });
    }

    await familyAuthService.resetPassword(resetToken, newPassword);
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Password reset failed' });
  }
});

// ============================================
// PROTECTED ROUTES (require family auth)
// ============================================

router.use(requireFamilyAuth);

/**
 * POST /api/family/auth/logout
 * Logout current session
 */
router.post('/auth/logout', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.substring(7);
    if (token) {
      await familyAuthService.logout(token);
    }
    res.json({ success: true });
  } catch (error) {
    res.json({ success: true }); // Always succeed
  }
});

/**
 * GET /api/family/me
 * Get current family member profile
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const member = await familyAuthService.getFamilyMember(
      req.familyMember!.id,
      req.familyMember!.organizationId
    );

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(member);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * PATCH /api/family/me
 * Update family member profile
 */
router.patch('/me', async (req: Request, res: Response) => {
  try {
    const updated = await familyAuthService.updateFamilyMember(
      req.familyMember!.id,
      req.familyMember!.organizationId,
      req.body
    );

    if (!updated) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/family/me/change-password
 * Change password
 */
router.post('/me/change-password', async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: 'New password must be at least 8 characters' });
    }

    await familyAuthService.changePassword(
      req.familyMember!.id,
      currentPassword,
      newPassword
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to change password' });
  }
});

// ============================================
// VISIT UPDATES
// ============================================

/**
 * GET /api/family/updates
 * Get visit updates
 */
router.get('/updates', async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate, updateType, unreadOnly } = req.query;

    const updates = await familyVisitsService.getVisitUpdates(
      req.familyMember!.id,
      req.familyMember!.clientId,
      {
        fromDate: fromDate as string,
        toDate: toDate as string,
        updateType: updateType as string,
        unreadOnly: unreadOnly === 'true',
      }
    );

    res.json(updates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get updates' });
  }
});

/**
 * GET /api/family/updates/recent
 * Get recent updates
 */
router.get('/updates/recent', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;

    const updates = await familyVisitsService.getRecentUpdates(
      req.familyMember!.id,
      req.familyMember!.clientId,
      limit ? parseInt(limit as string) : undefined
    );

    res.json(updates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get recent updates' });
  }
});

/**
 * GET /api/family/updates/unread-count
 * Get unread update count
 */
router.get('/updates/unread-count', async (req: Request, res: Response) => {
  try {
    const count = await familyVisitsService.getUnreadCount(
      req.familyMember!.id,
      req.familyMember!.clientId
    );

    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

/**
 * POST /api/family/updates/:updateId/read
 * Mark update as read
 */
router.post('/updates/:updateId/read', async (req: Request, res: Response) => {
  try {
    await familyVisitsService.markAsRead(
      req.familyMember!.id,
      req.params.updateId
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

/**
 * POST /api/family/updates/mark-all-read
 * Mark all updates as read
 */
router.post('/updates/mark-all-read', async (req: Request, res: Response) => {
  try {
    const count = await familyVisitsService.markAllAsRead(
      req.familyMember!.id,
      req.familyMember!.clientId
    );

    res.json({ success: true, markedCount: count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// ============================================
// SCHEDULE VIEW
// ============================================

/**
 * GET /api/family/schedule/upcoming
 * Get upcoming schedule
 */
router.get('/schedule/upcoming', async (req: Request, res: Response) => {
  try {
    const { days } = req.query;

    const schedule = await familyVisitsService.getUpcomingSchedule(
      req.familyMember!.clientId,
      days ? parseInt(days as string) : undefined
    );

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get schedule' });
  }
});

/**
 * GET /api/family/schedule/past
 * Get past visits
 */
router.get('/schedule/past', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;

    const visits = await familyVisitsService.getPastVisits(
      req.familyMember!.clientId,
      limit ? parseInt(limit as string) : undefined
    );

    res.json(visits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get past visits' });
  }
});

/**
 * GET /api/family/schedule/today
 * Get today's visit status
 */
router.get('/schedule/today', async (req: Request, res: Response) => {
  try {
    const status = await familyVisitsService.getTodayStatus(
      req.familyMember!.clientId
    );

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get today status' });
  }
});

/**
 * GET /api/family/care-team
 * Get care team
 */
router.get('/care-team', async (req: Request, res: Response) => {
  try {
    const team = await familyVisitsService.getCareTeam(
      req.familyMember!.clientId
    );

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get care team' });
  }
});

// ============================================
// MESSAGING
// ============================================

/**
 * GET /api/family/conversations
 * Get conversations
 */
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const { status, conversationType, priority } = req.query;

    const conversations = await familyMessagingService.getFamilyConversations(
      req.familyMember!.id,
      req.familyMember!.clientId,
      {
        status: status as string,
        conversationType: conversationType as string,
        priority: priority as string,
      }
    );

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

/**
 * POST /api/family/conversations
 * Create new conversation
 */
router.post('/conversations', async (req: Request, res: Response) => {
  try {
    const { subject, conversationType, priority, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const conversation = await familyMessagingService.createConversation(
      req.familyMember!.organizationId,
      {
        clientId: req.familyMember!.clientId,
        subject,
        conversationType,
        priority,
        initialMessage: message,
        familyMemberId: req.familyMember!.id,
      }
    );

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

/**
 * GET /api/family/conversations/:id
 * Get conversation with messages
 */
router.get('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const conversation = await familyMessagingService.getConversation(
      req.params.id,
      req.familyMember!.id,
      false
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

/**
 * POST /api/family/conversations/:id/messages
 * Send message in conversation
 */
router.post(
  '/conversations/:id/messages',
  async (req: Request, res: Response) => {
    try {
      const { content, messageType, attachments, metadata } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      const message = await familyMessagingService.sendFamilyMessage(
        req.familyMember!.id,
        {
          conversationId: req.params.id,
          content,
          messageType,
          attachments,
          metadata,
        }
      );

      res.status(201).json(message);
    } catch (error: any) {
      res
        .status(400)
        .json({ error: error.message || 'Failed to send message' });
    }
  }
);

/**
 * GET /api/family/messages/unread-count
 * Get unread message count
 */
router.get('/messages/unread-count', async (req: Request, res: Response) => {
  try {
    const count = await familyMessagingService.getFamilyUnreadCount(
      req.familyMember!.id,
      req.familyMember!.clientId
    );

    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// ============================================
// DOCUMENTS
// ============================================

/**
 * GET /api/family/documents
 * Get shared documents
 */
router.get('/documents', async (req: Request, res: Response) => {
  try {
    const { categoryId, fromDate, toDate } = req.query;

    const documents = await familyDocumentsService.getFamilyDocuments(
      req.familyMember!.id,
      req.familyMember!.clientId,
      {
        categoryId: categoryId as string,
        fromDate: fromDate as string,
        toDate: toDate as string,
      }
    );

    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

/**
 * GET /api/family/documents/categories
 * Get document categories
 */
router.get('/documents/categories', async (req: Request, res: Response) => {
  try {
    const categories = await familyDocumentsService.getCategories(
      req.familyMember!.organizationId
    );

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

/**
 * GET /api/family/documents/:id
 * Get document for viewing
 */
router.get('/documents/:id', async (req: Request, res: Response) => {
  try {
    const document = await familyDocumentsService.getDocumentForFamily(
      req.params.id,
      req.familyMember!.id,
      req.familyMember!.clientId,
      'view',
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error: any) {
    if (error.message === 'HIPAA consent required to access this document') {
      return res.status(403).json({
        error: error.message,
        requiresConsent: true,
        consentType: 'phi_access',
      });
    }
    res.status(500).json({ error: 'Failed to get document' });
  }
});

/**
 * POST /api/family/documents/:id/download
 * Record document download
 */
router.post('/documents/:id/download', async (req: Request, res: Response) => {
  try {
    const document = await familyDocumentsService.getDocumentForFamily(
      req.params.id,
      req.familyMember!.id,
      req.familyMember!.clientId,
      'download',
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error: any) {
    if (error.message === 'HIPAA consent required to access this document') {
      return res.status(403).json({
        error: error.message,
        requiresConsent: true,
        consentType: 'phi_access',
      });
    }
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// ============================================
// HIPAA CONSENT
// ============================================

/**
 * GET /api/family/consent/status
 * Get consent status
 */
router.get('/consent/status', async (req: Request, res: Response) => {
  try {
    const status = await familyDocumentsService.getConsentStatus(
      req.familyMember!.id,
      req.familyMember!.clientId
    );

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get consent status' });
  }
});

/**
 * POST /api/family/consent
 * Record consent
 */
router.post('/consent', async (req: Request, res: Response) => {
  try {
    const { consentType, consentVersion, consentText, signatureData } = req.body;

    if (!consentType || !consentVersion || !consentText) {
      return res
        .status(400)
        .json({ error: 'Consent type, version, and text are required' });
    }

    const consent = await familyDocumentsService.recordHipaaConsent(
      req.familyMember!.organizationId,
      {
        familyMemberId: req.familyMember!.id,
        clientId: req.familyMember!.clientId,
        consentType,
        consentVersion,
        consentText,
        signatureData,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );

    res.status(201).json(consent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record consent' });
  }
});

/**
 * POST /api/family/consent/:type/revoke
 * Revoke consent
 */
router.post('/consent/:type/revoke', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    await familyDocumentsService.revokeConsent(
      req.familyMember!.id,
      req.familyMember!.clientId,
      req.params.type,
      reason || 'Revoked by user'
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke consent' });
  }
});

export { router as familyRouter };
