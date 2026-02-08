import express, { Request, Response } from 'express';
import multer from 'multer';
import { ContentAssetService } from '../../../services/content-asset.service';
import { requireAuth } from '../../../middleware/auth';
import { createLogger } from '../../../utils/logger';

const router = express.Router();
const logger = createLogger('content-assets-route');
const contentAssetService = new ContentAssetService();

// Configure Multer for memory storage (service handles file writing)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for images
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed'));
        }
    }
});

// GET /api/admin/content-assets
// Optional query params: ?page=home&section=hero
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const { page, section } = req.query;

        let assets;
        if (page && section) {
            assets = await contentAssetService.getAssetsByPageAndSection(page as string, section as string);
        } else if (page) {
            assets = await contentAssetService.getAssetsByPage(page as string);
        } else {
            assets = await contentAssetService.getAllAssets();
        }

        res.json(assets);
    } catch (error) {
        logger.error('Failed to fetch content assets', { error });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/admin/content-assets/:key
router.get('/:key', async (req: Request, res: Response) => {
    try {
        const asset = await contentAssetService.getAssetByKey(req.params.key);
        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        res.json(asset);
    } catch (error) {
        logger.error('Failed to fetch content asset', { error });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/admin/content-assets
// Body: key, description, section, page, alt_text, image_type
// File: image
router.post('/', requireAuth, upload.single('image'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const { key, description, section } = req.body;
        if (!key) {
            return res.status(400).json({ error: 'Key is required' });
        }

        const userId = (req as any).user?.id;

        const asset = await contentAssetService.createOrUpdateAsset(
            key,
            req.file,
            description,
            section,
            userId
        );

        res.json(asset);
    } catch (error) {
        logger.error('Failed to upload content asset', { error });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/admin/content-assets/:id
// Update metadata (alt_text, description, page, section, image_type, sort_order)
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const { alt_text, description, section, page, image_type, sort_order } = req.body;
        const userId = (req as any).user?.id;

        const asset = await contentAssetService.updateAssetMetadata(
            req.params.id,
            { alt_text, description, section, page, image_type, sort_order },
            userId
        );

        res.json(asset);
    } catch (error) {
        logger.error('Failed to update content asset', { error });
        if ((error as Error).message === 'No fields to update') {
            return res.status(400).json({ error: 'No fields provided to update' });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/admin/content-assets/:id/url
// Update the URL (for switching to external URL without file upload)
router.put('/:id/url', requireAuth, async (req: Request, res: Response) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const userId = (req as any).user?.id;
        const asset = await contentAssetService.updateAssetUrl(req.params.id, url, userId);
        res.json(asset);
    } catch (error) {
        logger.error('Failed to update asset URL', { error });
        if ((error as Error).message === 'Asset not found') {
            return res.status(404).json({ error: 'Asset not found' });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/admin/content-assets/:id/upload
// Replace the image file for an existing asset
router.post('/:id/upload', requireAuth, upload.single('image'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const userId = (req as any).user?.id;
        const asset = await contentAssetService.replaceAssetFile(req.params.id, req.file, userId);
        res.json(asset);
    } catch (error) {
        logger.error('Failed to replace asset file', { error });
        if ((error as Error).message === 'Asset not found') {
            return res.status(404).json({ error: 'Asset not found' });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /api/admin/content-assets/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        await contentAssetService.deleteAsset(req.params.id);
        res.json({ success: true });
    } catch (error) {
        logger.error('Failed to delete content asset', { error });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export const contentAssetsRouter = router;
