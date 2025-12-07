
import { request } from './api';

// Bank Account Interface
export interface BankAccount {
    id: string;
    organizationId: string;
    name: string;
    institutionName?: string;
    accountNumberLast4?: string;
    routingNumber?: string;
    glAccountId?: string;
    isPrimary: boolean;
    createdAt: Date;
}

// Vendor Interface
export interface Vendor {
    id: string;
    organizationId: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    paymentTerms?: string;
    createdAt: Date;
}

// Bill Interface
export interface Bill {
    id: string;
    organizationId: string;
    vendorId: string;
    invoiceNumber?: string;
    amount: number;
    dueDate: Date;
    status: 'pending' | 'approved' | 'paid' | 'rejected';
    description?: string;
    createdAt: Date;
}

export interface GrossMarginReport {
    period: { start: string; end: string };
    totalRevenue: number;
    totalCOGS: number;
    grossMargin: number;
    grossMarginPercent: number;
    breakdown: {
        revenueByPayer: Record<string, number>;
        revenueByDiscipline: Record<string, number>;
        costByDiscipline: Record<string, number>;
    };
}

export interface UnbilledRevenue {
    count: number;
    estimatedAmount: number;
}

// Extend class functionality
class FinanceService {
    private readonly baseUrl = '/api/console/finance';

    // ... (Existing methods)
    // --- Bank Accounts ---

    async getBankAccounts(): Promise<any[]> {
        return request<any[]>(`${this.baseUrl}/bank-accounts`);
    }

    async createBankAccount(data: any): Promise<any> {
        return request<any>(`${this.baseUrl}/bank-accounts`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateBankAccount(id: string, data: any): Promise<any> {
        return request<any>(`${this.baseUrl}/bank-accounts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteBankAccount(id: string): Promise<void> {
        await request(`${this.baseUrl}/bank-accounts/${id}`, {
            method: 'DELETE'
        });
    }

    // --- Reports ---

    async getBalanceSheet(): Promise<any[]> {
        return request<any[]>(`${this.baseUrl}/reports/balance-sheet`);
    }

    async getGrossMarginReport(startDate?: string, endDate?: string): Promise<GrossMarginReport> {
        const query = new URLSearchParams();
        if (startDate) query.append('startDate', startDate);
        if (endDate) query.append('endDate', endDate);

        return request<GrossMarginReport>(`${this.baseUrl}/reports/gross-margin?${query.toString()}`);
    }

    async getUnbilledRevenue(): Promise<UnbilledRevenue> {
        return request<UnbilledRevenue>(`${this.baseUrl}/reports/unbilled-revenue`);
    }

    // --- Vendors ---
    async getVendors(): Promise<any[]> {
        return request<any[]>(`${this.baseUrl}/vendors`);
    }

    async createVendor(data: any): Promise<any> {
        return request<any>(`${this.baseUrl}/vendors`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // --- Bills ---
    async createBill(data: any): Promise<any> {
        return request<any>(`${this.baseUrl}/bills`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async approveItem(type: 'bill' | 'expense', id: string, action: 'approve' | 'reject' | 'override', reason?: string): Promise<any> {
        return request(`${this.baseUrl}/approvals/${type}/${id}`, {
            method: 'POST',
            body: JSON.stringify({ action, reason })
        });
    }

    // --- Plaid ---
    async getLinkToken(): Promise<{ link_token: string }> {
        return request<{ link_token: string }>(`${this.baseUrl}/plaid/link-token`, { method: 'POST' });
    }

    async exchangePublicToken(publicToken: string): Promise<any> {
        return request(`${this.baseUrl}/plaid/exchange`, {
            method: 'POST',
            body: JSON.stringify({ publicToken })
        });
    }

    // --- Payroll ---

    async calculatePayroll(periodStart: Date, periodEnd: Date): Promise<{ runId: string }> {
        return request<{ runId: string }>(`${this.baseUrl}/payroll/calculate`, {
            method: 'POST',
            body: JSON.stringify({ periodStart, periodEnd })
        });
    }

    async commitPayroll(runId: string): Promise<void> {
        return request(`${this.baseUrl}/payroll/commit/${runId}`, {
            method: 'POST'
        });
    }

    async setPayRate(data: { userId: string, rateType: string, amount: number }): Promise<void> {
        return request(`${this.baseUrl}/payroll/rates`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

export const financeService = new FinanceService();
