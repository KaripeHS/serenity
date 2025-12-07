
import { SandataEmployeesService } from '../src/services/sandata/employees.service';
import { SandataRepository } from '../src/services/sandata/repositories/sandata.repository';

// Mock dependencies
const mockRepo = {
    decryptSSN: async (encrypted: string) => {
        if (encrypted === 'encrypted-valid-ssn') return '123456789';
        return null;
    },
    getConfig: async () => ({ sandata_provider_id: '12345' }),
    createTransaction: async () => ({}),
    updateUserSandataId: async () => { },
    getExpiringCertifications: async () => [],
} as unknown as SandataRepository;

const mockClient = {
    get: async () => ({}),
    put: async () => ({}),
    post: async () => ({}),
} as any;

const mockValidator = {
    validate: () => [],
} as any;

// Test Runner
async function runTests() {
    console.log('Starting EVV Compliance Verification...\n');

    const service = new SandataEmployeesService();
    // Inject mocks
    (service as any).repository = mockRepo;
    (service as any).client = mockClient;
    (service as any).validator = mockValidator;

    const validUser = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1980-01-01',
        role: 'caregiver',
        status: 'active',
        organizationId: 'org-1',
        ssnEncrypted: 'encrypted-valid-ssn',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const invalidUser = {
        ...validUser,
        id: 'user-2',
        ssnEncrypted: undefined, // Missing SSN
    };

    // Test 1: User with SSN
    console.log('Test 1: Verifying User WITH SSN details...');
    const result1 = await service.syncEmployee(validUser as any, [], { dryRun: true });

    if (result1.success) {
        console.log('✅ Success: User with SSN passed validation.');
    } else {
        console.error('❌ Failed: User with SSN failed validation:', result1.errors);
    }

    // Test 2: User WITHOUT SSN
    console.log('\nTest 2: Verifying User WITHOUT SSN details...');
    const result2 = await service.syncEmployee(invalidUser as any, [], { dryRun: true });

    const missingSSNError = result2.errors?.find(e => e.includes('Social Security Number is required'));

    if (!result2.success && missingSSNError) {
        console.log('✅ Success: User without SSN correctly failed validation.');
        console.log(`   Error found: "${missingSSNError}"`);
    } else {
        console.error('❌ Failed: Strict SSN validation validation did not trigger.');
        console.log('   Result:', result2);
    }

    // Summary
    if (result1.success && !result2.success && missingSSNError) {
        console.log('\nPASSED: All EVV compliance checks passed.');
        process.exit(0);
    } else {
        console.error('\nFAILED: Compliance checks failed.');
        process.exit(1);
    }
}

runTests().catch(console.error);
