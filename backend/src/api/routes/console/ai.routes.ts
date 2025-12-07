
import { Router } from 'express';
import { aiService } from '../../../services/ai/ai.service';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';

const router = Router();

router.use(requireAuth); // Strict Authentication

router.post('/chat', async (req: AuthenticatedRequest, res) => {
    try {
        const { messages } = req.body;
        const user = req.user!;

        // Pass user context for Role-Based Guardrails
        const response = await aiService.chat(messages, {
            role: user.role,
            name: user.userId, // Use userId as identifier
            orgId: user.organizationId
        });

        res.json({ content: response });
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ error: 'AI unavailable' });
    }
});

export default router;
