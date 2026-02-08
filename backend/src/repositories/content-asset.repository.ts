import { Pool } from 'pg';
import { pool } from '../config/database';

export interface ContentAsset {
    id: string;
    key: string;
    url: string;
    description?: string;
    section?: string;
    page?: string;
    alt_text?: string;
    image_type?: string;
    width?: number;
    height?: number;
    file_size?: number;
    mime_type?: string;
    is_external?: boolean;
    sort_order?: number;
    created_at: Date;
    updated_at: Date;
    updated_by?: string;
}

export class ContentAssetRepository {
    private pool: Pool;

    constructor() {
        this.pool = pool;
    }

    async findAll(): Promise<ContentAsset[]> {
        const result = await this.pool.query(
            'SELECT * FROM content_assets ORDER BY page, section, sort_order, key'
        );
        return result.rows;
    }

    async findByKey(key: string): Promise<ContentAsset | null> {
        const result = await this.pool.query(
            'SELECT * FROM content_assets WHERE key = $1',
            [key]
        );
        return result.rows[0] || null;
    }

    async findById(id: string): Promise<ContentAsset | null> {
        const result = await this.pool.query(
            'SELECT * FROM content_assets WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    async findByPage(page: string): Promise<ContentAsset[]> {
        const result = await this.pool.query(
            'SELECT * FROM content_assets WHERE page = $1 ORDER BY section, sort_order, key',
            [page]
        );
        return result.rows;
    }

    async findByPageAndSection(page: string, section: string): Promise<ContentAsset[]> {
        const result = await this.pool.query(
            'SELECT * FROM content_assets WHERE page = $1 AND section = $2 ORDER BY sort_order, key',
            [page, section]
        );
        return result.rows;
    }

    async create(asset: Omit<ContentAsset, 'id' | 'created_at' | 'updated_at'>): Promise<ContentAsset> {
        const result = await this.pool.query(
            `INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, width, height, file_size, mime_type, is_external, sort_order, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
            [asset.key, asset.url, asset.description, asset.section, asset.page, asset.alt_text, asset.image_type, asset.width, asset.height, asset.file_size, asset.mime_type, asset.is_external ?? false, asset.sort_order ?? 0, asset.updated_by]
        );
        return result.rows[0];
    }

    async update(id: string, asset: Partial<ContentAsset>): Promise<ContentAsset> {
        const updatableFields: (keyof ContentAsset)[] = [
            'url', 'description', 'section', 'page', 'alt_text', 'image_type',
            'width', 'height', 'file_size', 'mime_type', 'is_external', 'sort_order', 'updated_by'
        ];

        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        for (const field of updatableFields) {
            if (asset[field] !== undefined) {
                updates.push(`${field} = $${paramIndex++}`);
                values.push(asset[field]);
            }
        }

        if (updates.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(id);
        const query = `
      UPDATE content_assets
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async delete(id: string): Promise<void> {
        await this.pool.query('DELETE FROM content_assets WHERE id = $1', [id]);
    }
}
