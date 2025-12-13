
import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { messagingService } from '../../../services/messaging.service';
import { ApiErrors } from '../../middleware/error-handler';

const router = Router();

/**
 * GET /api/mobile/messaging/conversations
 * List all conversations for the authenticated user
 */
router.get('/conversations', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) throw ApiErrors.unauthorized();

        const conversations = await messagingService.getConversations(userId);
        res.json(conversations);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/mobile/messaging/conversations/:id/messages
 * Get message history for a conversation
 */
router.get('/conversations/:id/messages', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const conversationId = req.params.id;
        if (!userId) throw ApiErrors.unauthorized();

        const messages = await messagingService.getMessages(conversationId, userId);
        res.json(messages);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/mobile/messaging/messages
 * Send a new message
 */
router.post('/messages', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { conversationId, content, recipientId } = req.body;

        if (!userId) throw ApiErrors.unauthorized();
        if (!content) throw ApiErrors.badRequest('Content is required');

        let targetConversationId = conversationId;

        // If no conversationId, assume we're starting a new one with recipientId
        if (!targetConversationId) {
            if (!recipientId) throw ApiErrors.badRequest('Either conversationId or recipientId is required');

            targetConversationId = await messagingService.createDirectConversation(
                userId,
                recipientId,
                req.user?.organizationId || ''
            );
        }

        const message = await messagingService.sendMessage(userId, targetConversationId, content);
        res.json(message);
    } catch (error) {
        next(error);
    }
});

export const messagingRouter = router;
