/**
 * Verify EDI 837P Generation
 * Run with: npx tsx scripts/verify_edi.ts
 */

import { EdiGeneratorService, EdiClaim } from '../src/services/billing/edi/edi-generator.service.ts';
import { claimValidator } from '../src/services/billing/edi/claim-validator.service.ts';

const mockClaim: EdiClaim = {
    id: "CLM-2023-001",
    billingProvider: {
        name: "SERENITY CARE PARTNERS",
        npi: "1234567890",
        taxId: "999999999",
        address: "123 HEALTH WAY",
        city: "COLUMBUS",
        state: "OH",
        zip: "43215"
    },
    subscriber: {
        firstName: "JANE",
        lastName: "DOE",
        memberId: "M12345678",
        dob: "1950-01-01",
        gender: "F",
        address: "456 MAIN ST",
        city: "COLUMBUS",
        state: "OH",
        zip: "43215"
    },
    payer: {
        name: "MEDICAID OHIO",
        id: "OHMED"
    },
    diagnoses: ["I10", "E11.9"],
    services: [
        {
            procedureCode: "T1000",
            chargeAmount: 150.00,
            date: new Date(),
            units: 1
        },
        {
            procedureCode: "T1001",
            chargeAmount: 75.50,
            date: new Date(),
            units: 2
        }
    ],
    totalCharge: 301.00
};

async function main() {
    console.log("Starting EDI Verification...");

    // 1. Validate
    console.log("Validating claim...");
    const validation = claimValidator.validate(mockClaim);
    if (!validation.isValid) {
        console.error("Validation failed:", validation.errors);
        process.exit(1);
    }
    console.log("Validation Passed.");

    // 2. Generate
    const generator = new EdiGeneratorService({
        senderId: "SUBMITTER_ID",
        receiverId: "RECEIVER_ID",
        controlNumber: 1,
        isTest: true
    });

    console.log("Generating EDI content...");
    const content = generator.generate837P(mockClaim);

    console.log("\n--- EDI OUTPUT START ---");
    console.log(content);
    console.log("--- EDI OUTPUT END ---\n");

    // 3. Simple Assertions
    if (!content.startsWith("ISA*")) throw new Error("Missing ISA Header");
    if (!content.includes("CLM*CLM-2023-001")) throw new Error("Missing Claim Segment");
    if (!content.includes("NM1*41*")) throw new Error("Missing Submitter Name");

    console.log("SUCCESS: EDI Content generated and valid structure detected.");
}

main().catch(console.error);
