/**
 * Private Billing Service
 * Handles generation of PDF invoices, visit logs, and billing packages for private pay clients.
 *
 * @module modules/billing/private-billing
 */

import PDFDocument from 'pdfkit';
import archiver from 'archiver';
import { DatabaseClient } from '../../database/client';
import { createLogger } from '../../utils/logger';
import { BillingService, Claim } from './billing.service';
import { UserContext } from '../../auth/access-control';
import { PassThrough } from 'stream';

const logger = createLogger('private-billing');

export class PrivateBillingService {
    private db: DatabaseClient;
    private billingService: BillingService;

    constructor(db: DatabaseClient, billingService: BillingService) {
        this.db = db;
        this.billingService = billingService;
    }

    /**
     * Generate a complete billing package (ZIP) for a set of claims
     * Includes:
     * - Individual Invoices (PDF)
     * - Visit Logs (PDF)
     * - Summary Manifest (TXT)
     */
    async generateBillingPackage(claimIds: string[], userContext: UserContext): Promise<PassThrough> {
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        const stream = new PassThrough();
        archive.pipe(stream);

        try {
            // Fetch all claims
            const claimsData = await Promise.all(
                claimIds.map(async (id) => {
                    const claim = await this.billingService['getClaimById'](id, userContext); // Accessing private method via string index or need to make public
                    return claim;
                })
            );

            // Group by Client
            const claimsByClient = this.groupBy(claimsData, 'clientId') as Record<string, Claim[]>;

            for (const [clientId, claims] of Object.entries(claimsByClient)) {
                const clientName = await this.getClientName(clientId);
                const safeClientName = clientName.replace(/[^a-z0-9]/gi, '_');

                // 1. Generate Invoice PDF
                const invoiceDoc = await this.generateInvoicePDF(claims, clientName);
                archive.append(invoiceDoc as any, { name: `${safeClientName}/Invoice_${new Date().toISOString().split('T')[0]}.pdf` });

                // 2. Generate Visit Logs PDF
                const visitLogDoc = await this.generateVisitLogPDF(claims, clientName);
                archive.append(visitLogDoc as any, { name: `${safeClientName}/Visit_Logs.pdf` });
            }

            archive.finalize();
            return stream;

        } catch (error) {
            logger.error('Failed to generate billing package', { error });
            throw error;
        }
    }

    /**
     * Generate Invoice PDF
     */
    private async generateInvoicePDF(claims: Claim[], clientName: string): Promise<NodeJS.ReadableStream> {
        const doc = new PDFDocument();
        const stream = new PassThrough();
        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('INVOICE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text('Serenity Care Partners', { align: 'right' });
        doc.text('123 Care Lane', { align: 'right' });
        doc.text('Columbus, OH 43215', { align: 'right' });
        doc.moveDown();

        // Client Info
        doc.text(`Bill To: ${clientName}`, { align: 'left' });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'left' });
        doc.moveDown();

        // Table Header
        const tableTop = 200;
        doc.font('Helvetica-Bold');
        doc.text('Date', 50, tableTop);
        doc.text('Service', 150, tableTop);
        doc.text('Hours', 300, tableTop);
        doc.text('Rate', 350, tableTop);
        doc.text('Total', 450, tableTop);
        doc.font('Helvetica');

        // Table Rows
        let y = tableTop + 25;
        let totalAmount = 0;

        claims.forEach((claim) => {
            doc.text(new Date(claim.serviceDate).toLocaleDateString(), 50, y);
            doc.text(claim.serviceCode, 150, y);
            doc.text(claim.unitsProvided.toString(), 300, y);
            doc.text(`$${claim.unitRate.toFixed(2)}`, 350, y);
            doc.text(`$${claim.totalAmount.toFixed(2)}`, 450, y);

            totalAmount += claim.totalAmount;
            y += 20;
        });

        // Total
        doc.moveDown();
        doc.font('Helvetica-Bold');
        doc.text(`Grand Total: $${totalAmount.toFixed(2)}`, 350, y + 20);

        doc.end();
        return stream;
    }

    /**
     * Generate Visit Log PDF (Timesheet)
     */
    private async generateVisitLogPDF(claims: Claim[], clientName: string): Promise<NodeJS.ReadableStream> {
        const doc = new PDFDocument();
        const stream = new PassThrough();
        doc.pipe(stream);

        doc.fontSize(18).text('VISIT LOGS / TIMESHEET', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Client: ${clientName}`);
        doc.moveDown();

        claims.forEach((claim) => {
            doc.font('Helvetica-Bold').text(`Date: ${new Date(claim.serviceDate).toLocaleDateString()}`);
            doc.font('Helvetica').text(`Service: ${claim.serviceCode}`);
            doc.text(`Caregiver ID: ${claim.caregiverId}`); // In real app, fetch name
            doc.text(`Hours: ${claim.unitsProvided}`);
            doc.text('Notes: __________________________________________________');
            doc.text('_________________________________________________________');
            doc.moveDown();
            doc.text('Caregiver Signature: __________________________');
            doc.text('Client Signature: _____________________________');
            doc.moveDown(2);
        });

        doc.end();
        return stream;
    }

    private groupBy(array: any[], key: string) {
        return array.reduce((result, currentValue) => {
            (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
            return result;
        }, {});
    }

    private async getClientName(clientId: string): Promise<string> {
        const result = await this.db.query('SELECT first_name, last_name FROM clients WHERE id = $1', [clientId]);
        if (result.rows.length > 0) {
            return `${result.rows[0].first_name} ${result.rows[0].last_name}`;
        }
        return 'Unknown Client';
    }
}
