/**
 * Test Role Credentials Seed Script
 * Creates test users for ALL system roles for testing purposes
 *
 * Run with: npx tsx src/database/seeds/seed-test-roles.ts
 */

import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  department?: string;
  clinicalRole?: string;
}

// All test users organized by department
const testUsers: TestUser[] = [
  // ============================================================================
  // EXECUTIVE LEADERSHIP
  // ============================================================================
  {
    email: 'founder@test.serenitycare.com',
    password: 'Founder123!',
    firstName: 'Test',
    lastName: 'Founder',
    role: 'founder',
    phone: '+15135550001',
    department: 'EXEC'
  },
  {
    email: 'ceo@test.serenitycare.com',
    password: 'Ceo123456!',
    firstName: 'Test',
    lastName: 'CEO',
    role: 'ceo',
    phone: '+15135550002',
    department: 'EXEC'
  },
  {
    email: 'cfo@test.serenitycare.com',
    password: 'Cfo123456!',
    firstName: 'Test',
    lastName: 'CFO',
    role: 'cfo',
    phone: '+15135550003',
    department: 'FIN'
  },
  {
    email: 'coo@test.serenitycare.com',
    password: 'Coo123456!',
    firstName: 'Test',
    lastName: 'COO',
    role: 'coo',
    phone: '+15135550004',
    department: 'OPS'
  },

  // ============================================================================
  // FINANCE DEPARTMENT
  // ============================================================================
  {
    email: 'finance.director@test.serenitycare.com',
    password: 'FinDir123!',
    firstName: 'Test',
    lastName: 'FinanceDirector',
    role: 'finance_director',
    phone: '+15135550010',
    department: 'FIN'
  },
  {
    email: 'finance.manager@test.serenitycare.com',
    password: 'FinMgr123!',
    firstName: 'Test',
    lastName: 'FinanceManager',
    role: 'finance_manager',
    phone: '+15135550011',
    department: 'FIN'
  },
  {
    email: 'billing.manager@test.serenitycare.com',
    password: 'BillMgr123!',
    firstName: 'Test',
    lastName: 'BillingManager',
    role: 'billing_manager',
    phone: '+15135550012',
    department: 'FIN'
  },
  {
    email: 'rcm.analyst@test.serenitycare.com',
    password: 'Rcm12345!',
    firstName: 'Test',
    lastName: 'RCMAnalyst',
    role: 'rcm_analyst',
    phone: '+15135550013',
    department: 'FIN'
  },
  {
    email: 'insurance.manager@test.serenitycare.com',
    password: 'InsMgr123!',
    firstName: 'Test',
    lastName: 'InsuranceManager',
    role: 'insurance_manager',
    phone: '+15135550014',
    department: 'FIN'
  },
  {
    email: 'billing.coder@test.serenitycare.com',
    password: 'Coder1234!',
    firstName: 'Test',
    lastName: 'BillingCoder',
    role: 'billing_coder',
    phone: '+15135550015',
    department: 'FIN'
  },

  // ============================================================================
  // OPERATIONS DEPARTMENT
  // ============================================================================
  {
    email: 'ops.manager@test.serenitycare.com',
    password: 'OpsMgr123!',
    firstName: 'Test',
    lastName: 'OpsManager',
    role: 'operations_manager',
    phone: '+15135550020',
    department: 'OPS'
  },
  {
    email: 'field.ops.manager@test.serenitycare.com',
    password: 'FieldOps123!',
    firstName: 'Test',
    lastName: 'FieldOpsManager',
    role: 'field_ops_manager',
    phone: '+15135550021',
    department: 'OPS'
  },
  {
    email: 'pod.lead@test.serenitycare.com',
    password: 'PodLead123!',
    firstName: 'Test',
    lastName: 'PodLead',
    role: 'pod_lead',
    phone: '+15135550022',
    department: 'OPS'
  },
  {
    email: 'field.supervisor@test.serenitycare.com',
    password: 'FieldSup123!',
    firstName: 'Test',
    lastName: 'FieldSupervisor',
    role: 'field_supervisor',
    phone: '+15135550023',
    department: 'OPS'
  },
  {
    email: 'scheduling.manager@test.serenitycare.com',
    password: 'SchedMgr123!',
    firstName: 'Test',
    lastName: 'SchedulingManager',
    role: 'scheduling_manager',
    phone: '+15135550024',
    department: 'OPS'
  },
  {
    email: 'scheduler@test.serenitycare.com',
    password: 'Sched12345!',
    firstName: 'Test',
    lastName: 'Scheduler',
    role: 'scheduler',
    phone: '+15135550025',
    department: 'OPS'
  },
  {
    email: 'dispatcher@test.serenitycare.com',
    password: 'Dispatch123!',
    firstName: 'Test',
    lastName: 'Dispatcher',
    role: 'dispatcher',
    phone: '+15135550026',
    department: 'OPS'
  },
  {
    email: 'qa.manager@test.serenitycare.com',
    password: 'QaMgr1234!',
    firstName: 'Test',
    lastName: 'QAManager',
    role: 'qa_manager',
    phone: '+15135550027',
    department: 'OPS'
  },

  // ============================================================================
  // CLINICAL DEPARTMENT
  // ============================================================================
  {
    email: 'don@test.serenitycare.com',
    password: 'Don1234567!',
    firstName: 'Test',
    lastName: 'DirectorOfNursing',
    role: 'director_of_nursing',
    phone: '+15135550030',
    department: 'CLIN',
    clinicalRole: 'rn'
  },
  {
    email: 'clinical.director@test.serenitycare.com',
    password: 'ClinDir123!',
    firstName: 'Test',
    lastName: 'ClinicalDirector',
    role: 'clinical_director',
    phone: '+15135550031',
    department: 'CLIN',
    clinicalRole: 'rn'
  },
  {
    email: 'nursing.supervisor@test.serenitycare.com',
    password: 'NurseSup123!',
    firstName: 'Test',
    lastName: 'NursingSupervisor',
    role: 'nursing_supervisor',
    phone: '+15135550032',
    department: 'CLIN',
    clinicalRole: 'rn'
  },
  {
    email: 'rn.case.manager@test.serenitycare.com',
    password: 'RnCase123!',
    firstName: 'Test',
    lastName: 'RNCaseManager',
    role: 'rn_case_manager',
    phone: '+15135550033',
    department: 'CLIN',
    clinicalRole: 'rn'
  },
  {
    email: 'lpn@test.serenitycare.com',
    password: 'Lpn1234567!',
    firstName: 'Test',
    lastName: 'LPN',
    role: 'lpn_lvn',
    phone: '+15135550034',
    department: 'CLIN',
    clinicalRole: 'lpn'
  },
  {
    email: 'qidp@test.serenitycare.com',
    password: 'Qidp123456!',
    firstName: 'Test',
    lastName: 'QIDP',
    role: 'qidp',
    phone: '+15135550035',
    department: 'CLIN',
    clinicalRole: 'qidp'
  },
  {
    email: 'therapist@test.serenitycare.com',
    password: 'Therapist1!',
    firstName: 'Test',
    lastName: 'Therapist',
    role: 'therapist',
    phone: '+15135550036',
    department: 'CLIN',
    clinicalRole: 'pt'
  },

  // ============================================================================
  // DIRECT CARE STAFF
  // ============================================================================
  {
    email: 'dsp.med@test.serenitycare.com',
    password: 'DspMed123!',
    firstName: 'Test',
    lastName: 'DSPMed',
    role: 'dsp_med',
    phone: '+15135550040',
    department: 'OPS'
  },
  {
    email: 'dsp.basic@test.serenitycare.com',
    password: 'DspBasic123!',
    firstName: 'Test',
    lastName: 'DSPBasic',
    role: 'dsp_basic',
    phone: '+15135550041',
    department: 'OPS'
  },
  {
    email: 'hha@test.serenitycare.com',
    password: 'Hha1234567!',
    firstName: 'Test',
    lastName: 'HHA',
    role: 'hha',
    phone: '+15135550042',
    department: 'CLIN'
  },
  {
    email: 'cna@test.serenitycare.com',
    password: 'Cna1234567!',
    firstName: 'Test',
    lastName: 'CNA',
    role: 'cna',
    phone: '+15135550043',
    department: 'CLIN'
  },
  {
    email: 'caregiver@test.serenitycare.com',
    password: 'Caregiver1!',
    firstName: 'Test',
    lastName: 'Caregiver',
    role: 'caregiver',
    phone: '+15135550044',
    department: 'OPS'
  },

  // ============================================================================
  // HR DEPARTMENT
  // ============================================================================
  {
    email: 'hr.director@test.serenitycare.com',
    password: 'HrDir1234!',
    firstName: 'Test',
    lastName: 'HRDirector',
    role: 'hr_director',
    phone: '+15135550050',
    department: 'HR'
  },
  {
    email: 'hr.manager@test.serenitycare.com',
    password: 'HrMgr1234!',
    firstName: 'Test',
    lastName: 'HRManager',
    role: 'hr_manager',
    phone: '+15135550051',
    department: 'HR'
  },
  {
    email: 'recruiter@test.serenitycare.com',
    password: 'Recruit123!',
    firstName: 'Test',
    lastName: 'Recruiter',
    role: 'recruiter',
    phone: '+15135550052',
    department: 'HR'
  },
  {
    email: 'credentialing@test.serenitycare.com',
    password: 'Cred123456!',
    firstName: 'Test',
    lastName: 'CredentialingSpec',
    role: 'credentialing_specialist',
    phone: '+15135550053',
    department: 'HR'
  },

  // ============================================================================
  // COMPLIANCE & SECURITY
  // ============================================================================
  {
    email: 'compliance.officer@test.serenitycare.com',
    password: 'Comply123!',
    firstName: 'Test',
    lastName: 'ComplianceOfficer',
    role: 'compliance_officer',
    phone: '+15135550060',
    department: 'COMP'
  },
  {
    email: 'security.officer@test.serenitycare.com',
    password: 'Secure123!',
    firstName: 'Test',
    lastName: 'SecurityOfficer',
    role: 'security_officer',
    phone: '+15135550061',
    department: 'IT'
  },

  // ============================================================================
  // IT DEPARTMENT
  // ============================================================================
  {
    email: 'it.admin@test.serenitycare.com',
    password: 'ItAdmin123!',
    firstName: 'Test',
    lastName: 'ITAdmin',
    role: 'it_admin',
    phone: '+15135550070',
    department: 'IT'
  },
  {
    email: 'support.agent@test.serenitycare.com',
    password: 'Support123!',
    firstName: 'Test',
    lastName: 'SupportAgent',
    role: 'support_agent',
    phone: '+15135550071',
    department: 'IT'
  },

  // ============================================================================
  // EXTERNAL ACCESS
  // ============================================================================
  {
    email: 'client@test.serenitycare.com',
    password: 'Client1234!',
    firstName: 'Test',
    lastName: 'Client',
    role: 'client',
    phone: '+15135550080'
  },
  {
    email: 'family@test.serenitycare.com',
    password: 'Family1234!',
    firstName: 'Test',
    lastName: 'FamilyMember',
    role: 'family',
    phone: '+15135550081'
  },
  {
    email: 'payer.auditor@test.serenitycare.com',
    password: 'Auditor123!',
    firstName: 'Test',
    lastName: 'PayerAuditor',
    role: 'payer_auditor',
    phone: '+15135550082'
  }
];

async function seedTestRoles() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  console.log('🌱 Seeding test role credentials...\n');

  try {
    // Get organization ID
    const orgResult = await pool.query(
      "SELECT id FROM organizations WHERE slug = 'serenity-care-partners'"
    );

    if (orgResult.rows.length === 0) {
      console.error('❌ Organization not found. Run seed-initial-data.ts first.');
      process.exit(1);
    }

    const orgId = orgResult.rows[0].id;
    console.log('✅ Organization found:', orgId);

    // Get a pod for assignments
    const podResult = await pool.query("SELECT id FROM pods WHERE code = 'CIN-A' LIMIT 1");
    const podId = podResult.rows[0]?.id;

    let created = 0;
    let updated = 0;

    for (const user of testUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10);

      const result = await pool.query(`
        INSERT INTO users (
          id,
          organization_id,
          email,
          password_hash,
          first_name,
          last_name,
          phone,
          role,
          department,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
        ON CONFLICT (email) DO UPDATE SET
          password_hash = $4,
          role = $8,
          department = $9,
          status = 'active'
        RETURNING (xmax = 0) as inserted
      `, [
        uuidv4(),
        orgId,
        user.email,
        passwordHash,
        user.firstName,
        user.lastName,
        user.phone,
        user.role,
        user.department || null
      ]);

      if (result.rows[0].inserted) {
        created++;
      } else {
        updated++;
      }

      // Assign to pod if applicable
      if (podId && ['pod_lead', 'field_supervisor', 'caregiver', 'dsp_med', 'dsp_basic', 'hha', 'cna'].includes(user.role)) {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
        if (userResult.rows[0]) {
          await pool.query(`
            INSERT INTO user_pod_memberships (user_id, pod_id, role_in_pod, is_primary, status)
            VALUES ($1, $2, $3, true, 'active')
            ON CONFLICT (user_id, pod_id) DO UPDATE SET status = 'active'
          `, [userResult.rows[0].id, podId, user.role === 'pod_lead' ? 'team_lead' : 'caregiver']);
        }
      }
    }

    console.log(`\n✅ Created ${created} new users`);
    console.log(`✅ Updated ${updated} existing users`);

    // Print credentials table
    console.log('\n========================================');
    console.log('🔐 TEST CREDENTIALS BY ROLE');
    console.log('========================================\n');

    // Group by department
    const departments = new Map<string, TestUser[]>();
    testUsers.forEach(user => {
      const dept = user.department || 'EXTERNAL';
      if (!departments.has(dept)) {
        departments.set(dept, []);
      }
      departments.get(dept)!.push(user);
    });

    const deptNames: Record<string, string> = {
      'EXEC': 'EXECUTIVE LEADERSHIP',
      'FIN': 'FINANCE DEPARTMENT',
      'OPS': 'OPERATIONS DEPARTMENT',
      'CLIN': 'CLINICAL DEPARTMENT',
      'HR': 'HR DEPARTMENT',
      'COMP': 'COMPLIANCE',
      'IT': 'IT DEPARTMENT',
      'EXTERNAL': 'EXTERNAL ACCESS'
    };

    for (const [dept, users] of departments) {
      console.log(`\n--- ${deptNames[dept] || dept} ---`);
      for (const user of users) {
        console.log(`${user.role.padEnd(25)} | ${user.email.padEnd(45)} | ${user.password}`);
      }
    }

    console.log('\n========================================');
    console.log('📝 QUICK REFERENCE - ALL ROLES');
    console.log('========================================\n');

    console.log('Role                      | Email                                          | Password');
    console.log('-'.repeat(100));
    testUsers.forEach(user => {
      console.log(`${user.role.padEnd(25)} | ${user.email.padEnd(45)} | ${user.password}`);
    });

    console.log('\n========================================');
    console.log('🎉 Test role seeding complete!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error seeding test roles:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedTestRoles().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
