import { ContentAsset, ContentAssetRepository } from '../repositories/content-asset.repository';
import fs from 'fs';
import path from 'path';

export class ContentAssetService {
    private repository: ContentAssetRepository;
    private uploadDir: string;

    constructor() {
        this.repository = new ContentAssetRepository();
        // Ensure upload directory exists
        this.uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async getAllAssets(): Promise<ContentAsset[]> {
        return this.repository.findAll();
    }

    async getAssetByKey(key: string): Promise<ContentAsset | null> {
        return this.repository.findByKey(key);
    }

    async getAssetById(id: string): Promise<ContentAsset | null> {
        return this.repository.findById(id);
    }

    async getAssetsByPage(page: string): Promise<ContentAsset[]> {
        return this.repository.findByPage(page);
    }

    async getAssetsByPageAndSection(page: string, section: string): Promise<ContentAsset[]> {
        return this.repository.findByPageAndSection(page, section);
    }

    async createOrUpdateAsset(
        key: string,
        file: Express.Multer.File,
        description?: string,
        section?: string,
        userId?: string
    ): Promise<ContentAsset> {
        // 1. Move file to upload directory with a unique name
        const fileExtension = path.extname(file.originalname);
        const uniqueFilename = `${key}_${Date.now()}${fileExtension}`;
        const filePath = path.join(this.uploadDir, uniqueFilename);
        const publicUrl = `/uploads/${uniqueFilename}`;

        // Write file
        fs.writeFileSync(filePath, file.buffer);

        // 2. Check if asset exists
        const existingAsset = await this.repository.findByKey(key);

        if (existingAsset) {
            // Delete old file if it exists and is local
            this.deleteLocalFile(existingAsset.url);

            // Update DB
            return this.repository.update(existingAsset.id, {
                url: publicUrl,
                description,
                section,
                is_external: false,
                file_size: file.size,
                mime_type: file.mimetype,
                updated_by: userId
            });
        } else {
            // Create new
            return this.repository.create({
                key,
                url: publicUrl,
                description,
                section,
                is_external: false,
                file_size: file.size,
                mime_type: file.mimetype,
                updated_by: userId
            });
        }
    }

    async updateAssetMetadata(
        id: string,
        updates: Partial<Pick<ContentAsset, 'alt_text' | 'description' | 'section' | 'page' | 'image_type' | 'sort_order'>>,
        userId?: string
    ): Promise<ContentAsset> {
        return this.repository.update(id, { ...updates, updated_by: userId });
    }

    async updateAssetUrl(
        id: string,
        url: string,
        userId?: string
    ): Promise<ContentAsset> {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new Error('Asset not found');
        }

        // If replacing a local file with an external URL, clean up
        if (!existing.is_external) {
            this.deleteLocalFile(existing.url);
        }

        const isExternal = url.startsWith('http://') || url.startsWith('https://');

        return this.repository.update(id, {
            url,
            is_external: isExternal,
            updated_by: userId
        });
    }

    async replaceAssetFile(
        id: string,
        file: Express.Multer.File,
        userId?: string
    ): Promise<ContentAsset> {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new Error('Asset not found');
        }

        // Write new file
        const fileExtension = path.extname(file.originalname);
        const uniqueFilename = `${existing.key}_${Date.now()}${fileExtension}`;
        const filePath = path.join(this.uploadDir, uniqueFilename);
        const publicUrl = `/uploads/${uniqueFilename}`;
        fs.writeFileSync(filePath, file.buffer);

        // Delete old local file
        if (!existing.is_external) {
            this.deleteLocalFile(existing.url);
        }

        return this.repository.update(id, {
            url: publicUrl,
            is_external: false,
            file_size: file.size,
            mime_type: file.mimetype,
            updated_by: userId
        });
    }

    async deleteAsset(id: string): Promise<void> {
        const existing = await this.repository.findById(id);
        if (existing && !existing.is_external) {
            this.deleteLocalFile(existing.url);
        }
        await this.repository.delete(id);
    }

    private deleteLocalFile(url: string): void {
        if (url.startsWith('/uploads/')) {
            const oldFilename = path.basename(url);
            const oldFilePath = path.join(this.uploadDir, oldFilename);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }
    }
}
