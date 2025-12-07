
import { Router } from 'express';
import { bankAccountsService } from '../../services/finance/bank-accounts.service'; // Ensure correct import
import { accountingService } from '../../services/finance/accounting.service';
import { financialWorkflowsService } from '../../services/finance/financial-workflows.service';
    } catch (error: any) {
    res.status(500).json({ error: error.message });
}
});

router.put('/bank-accounts/:id', async (req, res) => {
    try {
        const account = await bankAccountsService.update(req.params.id, req.user!.organizationId, req.body);
        res.json(account);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/bank-accounts/:id', async (req, res) => {
    try {
        await bankAccountsService.delete(req.params.id, req.user!.organizationId);
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Reports ---

router.get('/reports/balance-sheet', async (req, res) => {
    try {
        const report = await accountingService.getBalanceSheet(req.user!.organizationId);
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Vendors ---
router.post('/vendors', async (req, res) => {
    try {
        const vendor = await financialWorkflowsService.createVendor({
            ...req.body,
            organizationId: req.user!.organizationId
        });
        res.json(vendor.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create vendor' });
    }
});

router.get('/vendors', async (req, res) => {
    const vendors = await financialWorkflowsService.getVendors(req.user!.organizationId);
    res.json(vendors.rows);
});

// --- Bills ---
router.post('/bills', async (req, res) => {
    try {
        const bill = await financialWorkflowsService.createBill({
            ...req.body,
            organizationId: req.user!.organizationId,
            createdBy: req.user!.userId
        });
        res.json(bill);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create bill' });
    }
});

router.post('/approvals/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const { action, reason } = req.body;

        const result = await financialWorkflowsService.approveItem(
            req.user!.organizationId,
            type as 'bill' | 'expense',
            id,
            req.user!.userId,
            action,
            reason
        );
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// --- Plaid ---
router.post('/plaid/link-token', async (req, res) => {
    const token = await plaidService.createLinkToken(req.user!.userId);
    res.json(token);
});

router.post('/plaid/exchange', async (req, res) => {
    const result = await plaidService.exchangePublicToken(req.user!.organizationId, req.body.publicToken);
    res.json(result);
});

import { financialIntelligenceService } from '../../services/finance/financial-intelligence.service';

// --- Intelligence ---

router.get('/reports/gross-margin', async (req, res) => {
    try {
        const start = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().getFullYear(), 0, 1);
        const end = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

        const report = await financialIntelligenceService.getGrossMarginAnalysis(req.user!.organizationId, start, end);
        res.json(report);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/reports/unbilled-revenue', async (req, res) => {
    try {
        const report = await financialIntelligenceService.getUnbilledRevenue(req.user!.organizationId);
        res.json(report);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
