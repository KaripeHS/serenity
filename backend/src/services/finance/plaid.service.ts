
import { getDbClient } from '../../database/client';

export class PlaidService {

    // Mock Plaid functionality for now as we don't have real keys in this environment
    // Real implementation would use 'plaid' npm package

    async createLinkToken(userId: string) {
        // Returns a mock link_token for the frontend
        return { link_token: `link-sandbox-${Date.now()}` };
    }

    async exchangePublicToken(organizationId: string, publicToken: string) {
        const db = getDbClient();
        // Mock exchange: In reality, call Plaid API to get access_token
        const accessToken = `access-sandbox-${Date.now()}`;
        const itemId = `item-${Date.now()}`;

        await db.query(
            `INSERT INTO plaid_items (organization_id, item_id, access_token, institution_name, status)
             VALUES ($1, $2, $3, 'Chase Bank (Mock)', 'active')`,
            [organizationId, itemId, accessToken]
        );

        return { success: true, item_id: itemId };
    }

    async syncTransactions(organizationId: string) {
        const db = getDbClient();
        // Mock Sync: Fetch transactions from Plaid
        // Inserting a mock transaction into `bank_transactions`

        const mockTx = {
            amount: 120.50,
            date: new Date(),
            name: 'Uber Technologies',
            merchant_name: 'Uber',
            category: 'Travel',
            account_id: 'acc_123'
        };

        await db.query(
            `INSERT INTO bank_transactions (organization_id, plaid_transaction_id, account_id, amount, date, name, merchant_name, category)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT DO NOTHING`,
            [organizationId, `tx-${Date.now()}`, mockTx.account_id, mockTx.amount, mockTx.date, mockTx.name, mockTx.merchant_name, mockTx.category]
        );

        return { added: 1, modified: 0, removed: 0 };
    }
}

export const plaidService = new PlaidService();
