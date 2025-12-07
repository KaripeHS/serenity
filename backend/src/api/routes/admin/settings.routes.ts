
import { Router } from 'express';
import { settingsService } from '../../../services/admin/settings.service';

const router = Router();

// Middleware to get org ID (mocked for now if auth middleware not fully strict)
// In production, extract from JWT req.user.organizationId

router.get('/:category', async (req, res) => {
    try {
        const { category } = req.params;
        // hardcode org for single-tenant founder mode
        const orgId = "550e8400-e29b-41d4-a716-446655440000";

        const settings = await settingsService.getSettings(orgId, category);
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.put('/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const settings = req.body;
        const orgId = "550e8400-e29b-41d4-a716-446655440000";
        // mock user
        const userId = "550e8400-e29b-41d4-a716-446655440001";

        const updated = await settingsService.updateSettings(orgId, category, settings, userId);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
