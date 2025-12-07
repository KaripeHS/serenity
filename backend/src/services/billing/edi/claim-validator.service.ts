/**
 * Claim Validator Service
 * Validates claim data against EDI 837P requirements before generation
 */

import { EdiClaim } from './edi-generator.service';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export class ClaimValidatorService {
    public validate(claim: EdiClaim): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 1. Validate Provider
        if (!claim.billingProvider?.npi) {
            errors.push('Billing Provider NPI is missing');
        } else if (!/^\d{10}$/.test(claim.billingProvider.npi)) {
            errors.push(`Invalid Billing Provider NPI: ${claim.billingProvider.npi}`);
        }

        // 2. Validate Subscriber
        if (!claim.subscriber?.memberId) {
            errors.push('Subscriber Member ID is missing');
        }

        // 3. Validate Diagnoses
        if (!claim.diagnoses || claim.diagnoses.length === 0) {
            errors.push('Claim must have at least one diagnosis code');
        }

        // 4. Validate Services
        if (!claim.services || claim.services.length === 0) {
            errors.push('Claim must have at least one service line');
        } else {
            claim.services.forEach((svc, index) => {
                if (!svc.procedureCode) {
                    errors.push(`Service line ${index + 1}: Missing Procedure Code`);
                }
                if (svc.chargeAmount <= 0) {
                    errors.push(`Service line ${index + 1}: Charge amount must be positive`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}

export const claimValidator = new ClaimValidatorService();
