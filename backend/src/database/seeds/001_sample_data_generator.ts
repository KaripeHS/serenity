/**
 * Comprehensive Sample Data Generator for Serenity ERP
 * Generates realistic data for 450 patients and 500 staff in Ohio
 */

import { DatabaseClient } from '../client';
import { faker } from '@faker-js/faker';
import { createLogger } from '../../utils/logger';

const apiLogger = createLogger('api');

// Ohio-specific data
const OHIO_CITIES = [
  'Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton',
  'Parma', 'Canton', 'Youngstown', 'Lorain', 'Hamilton', 'Springfield',
  'Kettering', 'Elyria', 'Lakewood', 'Cuyahoga Falls', 'Middletown',
  'Newark', 'Mansfield', 'Mentor', 'Beavercreek', 'Strongsville'
];

const OHIO_COUNTIES = [
  'Franklin', 'Cuyahoga', 'Hamilton', 'Lucas', 'Summit', 'Montgomery',
  'Butler', 'Stark', 'Mahoning', 'Lake', 'Warren', 'Trumbull',
  'Clermont', 'Lorain', 'Delaware', 'Medina', 'Fairfield', 'Licking'
];

const HOME_HEALTH_SERVICES = [
  'Personal Care', 'Skilled Nursing', 'Physical Therapy', 'Occupational Therapy',
  'Speech Therapy', 'Medical Social Services', 'Home Health Aide',
  'Companion Care', 'Respite Care', 'Medication Management'
];

const CAREGIVER_CERTIFICATIONS = [
  'CNA', 'HHA', 'RN', 'LPN', 'PTA', 'OTA', 'CMA', 'CPR', 'First Aid',
  'Alzheimer\'s Care', 'Diabetes Management', 'Wound Care'
];

export class SampleDataGenerator {
  constructor(private db: DatabaseClient) { }

  async generateAllSampleData(): Promise<void> {
    apiLogger.info('🚀 Starting comprehensive sample data generation...');

    // 1. Generate organization and users
    await this.generateOrganizationAndUsers();

    // 2. Generate 450 patients
    await this.generatePatients(450);

    // 3. Generate 500 employees
    await this.generateEmployees(500);

    // 4. Generate recruiting pipeline
    await this.generateRecruitingData();

    // 5. Generate scheduling and EVV data
    await this.generateSchedulingData();

    // 6. Generate tax compliance data
    await this.generateTaxData();

    // 7. Generate AI agent execution data
    await this.generateAIAgentData();

    // 8. Generate performance and retention data
    await this.generatePerformanceData();

    apiLogger.info('✅ Sample data generation complete!');
  }

  private async generateOrganizationAndUsers(): Promise<void> {
    apiLogger.info('📝 Generating organization and base users...');

    // Create organization
    const organization = {
      id: 'serenity-care-partners',
      name: 'Serenity Care Partners',
      address: '1234 Main Street, Columbus, OH 43215',
      phone: '(614) 555-0123',
      email: 'info@serenitycare.com',
      ein: '12-3456789',
      npi: '1234567890',
      ohio_provider_id: 'OH123456',
      created_at: new Date('2020-01-01')
    };

    await this.db.insert('organizations', organization);

    // Create founder/executive users
    const users = [
      {
        id: 'founder-001',
        organization_id: organization.id,
        email: 'founder@serenitycare.com',
        first_name: 'Sarah',
        last_name: 'Johnson',
        role: 'founder',
        phone: '(614) 555-0100',
        hire_date: new Date('2020-01-01'),
        status: 'active'
      },
      {
        id: 'coo-001',
        organization_id: organization.id,
        email: 'operations@serenitycare.com',
        first_name: 'Michael',
        last_name: 'Chen',
        role: 'operations_director',
        phone: '(614) 555-0101',
        hire_date: new Date('2020-03-15'),
        status: 'active'
      },
      {
        id: 'hr-director-001',
        organization_id: organization.id,
        email: 'hr@serenitycare.com',
        first_name: 'Jennifer',
        last_name: 'Williams',
        role: 'hr_manager',
        phone: '(614) 555-0102',
        hire_date: new Date('2020-06-01'),
        status: 'active'
      }
    ];

    for (const user of users) {
      await this.db.insert('users', user);
    }
  }

  private async generatePatients(count: number): Promise<void> {
    apiLogger.info(`👥 Generating ${count} realistic Ohio patients...`);

    const patients = [];
    for (let i = 0; i < count; i++) {
      const city = faker.helpers.arrayElement(OHIO_CITIES);
      const county = faker.helpers.arrayElement(OHIO_COUNTIES);

      const patient = {
        id: faker.string.uuid(),
        organization_id: 'serenity-care-partners',
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        date_of_birth: faker.date.between({ from: '1930-01-01', to: '1980-12-31' }),
        ssn: this.generateSSN(),
        medicaid_number: `OH${faker.string.numeric(9)}`,
        address: `${faker.location.streetAddress()}, ${city}, OH ${faker.location.zipCode()}`,
        city: city,
        state: 'OH',
        zip_code: faker.location.zipCode(),
        county: county,
        phone: faker.phone.number('(###) ###-####'),
        emergency_contact_name: faker.person.fullName(),
        emergency_contact_phone: faker.phone.number('(###) ###-####'),
        primary_diagnosis: faker.helpers.arrayElement([
          'Diabetes mellitus', 'Hypertension', 'COPD', 'Heart failure',
          'Stroke', 'Alzheimer\'s disease', 'Parkinson\'s disease',
          'Arthritis', 'Depression', 'Chronic kidney disease'
        ]),
        secondary_diagnoses: faker.helpers.arrayElements([
          'Diabetes', 'Hypertension', 'Anxiety', 'Osteoporosis',
          'Anemia', 'Thyroid disorder', 'Sleep apnea'
        ], { min: 0, max: 3 }),
        physician_name: `Dr. ${faker.person.fullName()}`,
        physician_npi: faker.string.numeric(10),
        insurance_primary: faker.helpers.arrayElement([
          'Ohio Medicaid', 'Medicare', 'Buckeye Health Plan',
          'CareSource', 'Molina Healthcare', 'UnitedHealthcare'
        ]),
        services_authorized: faker.helpers.arrayElements(HOME_HEALTH_SERVICES, { min: 1, max: 4 }),
        service_frequency: faker.helpers.arrayElement([
          'Daily', '3x/week', '2x/week', 'Weekly', 'PRN'
        ]),
        care_plan_start_date: faker.date.between({ from: '2023-01-01', to: '2024-03-01' }),
        care_plan_end_date: faker.date.between({ from: '2024-04-01', to: '2024-12-31' }),
        status: faker.helpers.weightedArrayElement([
          { weight: 85, value: 'active' },
          { weight: 10, value: 'on_hold' },
          { weight: 5, value: 'discharged' }
        ]),
        risk_level: faker.helpers.weightedArrayElement([
          { weight: 60, value: 'low' },
          { weight: 30, value: 'medium' },
          { weight: 10, value: 'high' }
        ]),
        created_at: faker.date.between({ from: '2023-01-01', to: '2024-03-01' }),
        updated_at: new Date()
      };

      patients.push(patient);

      // Add care plan for each patient
      const carePlan = {
        id: faker.string.uuid(),
        patient_id: patient.id,
        services: patient.services_authorized.map(service => ({
          service_type: service,
          frequency: patient.service_frequency,
          duration_minutes: faker.number.int({ min: 30, max: 180 }),
          provider_qualifications: faker.helpers.arrayElements(CAREGIVER_CERTIFICATIONS, { min: 1, max: 2 })
        })),
        goals: [
          'Medication compliance and management',
          'Activities of daily living assistance',
          'Safety and fall prevention',
          'Chronic disease monitoring'
        ],
        special_instructions: faker.lorem.sentences(2),
        created_at: patient.created_at,
        updated_at: new Date()
      };

      await this.db.insert('care_plans', carePlan);
    }

    // Batch insert patients
    await this.batchInsert('patients', patients);
    apiLogger.info(`✅ Generated ${count} patients with care plans`);
  }

  private async generateEmployees(count: number): Promise<void> {
    apiLogger.info(`👷 Generating ${count} employees with realistic Ohio distribution...`);

    // Role distribution for home health agency
    const roleDistribution = [
      { role: 'caregiver', count: 380, hourly_rate: [15, 22] },
      { role: 'nurse_rn', count: 45, hourly_rate: [28, 38] },
      { role: 'nurse_lpn', count: 40, hourly_rate: [22, 28] },
      { role: 'therapist_pt', count: 15, hourly_rate: [35, 45] },
      { role: 'therapist_ot', count: 10, hourly_rate: [33, 43] },
      { role: 'social_worker', count: 5, hourly_rate: [25, 32] },
      { role: 'scheduler', count: 8, salary: [40000, 55000] },
      { role: 'billing_specialist', count: 6, salary: [38000, 52000] },
      { role: 'compliance_officer', count: 3, salary: [60000, 80000] },
      { role: 'hr_specialist', count: 4, salary: [45000, 62000] },
      { role: 'field_supervisor', count: 12, salary: [50000, 68000] },
      { role: 'manager', count: 8, salary: [65000, 85000] },
      { role: 'director', count: 4, salary: [85000, 120000] }
    ];

    const employees = [];
    let employeeCount = 0;

    for (const roleGroup of roleDistribution) {
      for (let i = 0; i < roleGroup.count; i++) {
        employeeCount++;
        const city = faker.helpers.arrayElement(OHIO_CITIES);
        const hireDate = faker.date.between({ from: '2020-01-01', to: '2024-02-01' });

        // Determine compensation
        let currentSalary, hourlyRate;
        if (roleGroup.hourly_rate) {
          hourlyRate = faker.number.float({
            min: roleGroup.hourly_rate[0],
            max: roleGroup.hourly_rate[1],
            fractionDigits: 2
          });
          currentSalary = hourlyRate * 2080; // Full-time equivalent
        } else {
          currentSalary = faker.number.int({
            min: roleGroup.salary[0],
            max: roleGroup.salary[1]
          });
          hourlyRate = currentSalary / 2080;
        }

        const employee = {
          id: faker.string.uuid(),
          organization_id: 'serenity-care-partners',
          employee_number: `SC${employeeCount.toString().padStart(4, '0')}`,
          first_name: faker.person.firstName(),
          last_name: faker.person.lastName(),
          email: faker.internet.email(),
          phone: faker.phone.number('(###) ###-####'),
          address: `${faker.location.streetAddress()}, ${city}, OH ${faker.location.zipCode()}`,
          city: city,
          state: 'OH',
          zip_code: faker.location.zipCode(),
          ssn: this.generateSSN(),
          date_of_birth: faker.date.between({ from: '1960-01-01', to: '2000-12-31' }),
          position: roleGroup.role,
          department: this.getDepartment(roleGroup.role),
          hire_date: hireDate,
          current_salary: currentSalary,
          hourly_rate: hourlyRate,
          pay_frequency: roleGroup.hourly_rate ? 'biweekly' : 'monthly',
          employment_type: faker.helpers.weightedArrayElement([
            { weight: 85, value: 'full_time' },
            { weight: 15, value: 'part_time' }
          ]),
          status: faker.helpers.weightedArrayElement([
            { weight: 92, value: 'active' },
            { weight: 5, value: 'on_leave' },
            { weight: 3, value: 'terminated' }
          ]),
          manager_id: this.getManagerId(roleGroup.role),
          certifications: this.getCertifications(roleGroup.role),
          license_numbers: this.getLicenseNumbers(roleGroup.role),
          background_check_date: faker.date.between({ from: hireDate, to: new Date() }),
          background_check_status: faker.helpers.weightedArrayElement([
            { weight: 95, value: 'clear' },
            { weight: 5, value: 'pending' }
          ]),
          drug_test_date: faker.date.between({ from: hireDate, to: new Date() }),
          drug_test_status: 'passed',
          performance_rating: faker.number.float({ min: 2.5, max: 5.0, fractionDigits: 1 }),
          created_at: hireDate,
          updated_at: new Date()
        };

        employees.push(employee);

        // Generate employee tax setup
        const taxSetup = {
          id: faker.string.uuid(),
          employee_id: employee.id,
          federal_filing_status: faker.helpers.arrayElement(['single', 'married_joint', 'head_of_household']),
          federal_allowances: faker.number.int({ min: 0, max: 4 }),
          additional_federal_withholding: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
          state_filing_status: faker.helpers.arrayElement(['single', 'married_joint']),
          state_allowances: faker.number.int({ min: 0, max: 3 }),
          municipality_code: this.getMunicipalityCode(city),
          sui_rate: 0.004,
          effective_date: hireDate,
          created_by: 'hr-director-001'
        };

        await this.db.insert('employee_tax_setup', taxSetup);
      }
    }

    await this.batchInsert('employees', employees);
    apiLogger.info(`✅ Generated ${count} employees with tax setups`);
  }

  private async generateRecruitingData(): Promise<void> {
    apiLogger.info('📋 Generating recruiting pipeline data...');

    // Generate 150 applicants in various stages
    const applicants = [];
    const stages = [
      { stage: 'application', count: 45 },
      { stage: 'ai_screening', count: 30 },
      { stage: 'phone_screen', count: 25 },
      { stage: 'interviews', count: 20 },
      { stage: 'final_review', count: 15 },
      { stage: 'offer', count: 10 },
      { stage: 'hired', count: 5 }
    ];

    const sources = ['website', 'indeed', 'ziprecruiter', 'referral', 'facebook', 'linkedin'];
    const positions = ['caregiver', 'nurse_rn', 'nurse_lpn', 'therapist_pt', 'scheduler'];

    for (const stageGroup of stages) {
      for (let i = 0; i < stageGroup.count; i++) {
        const applicationDate = faker.date.between({ from: '2024-01-01', to: '2024-03-15' });

        const applicant = {
          id: faker.string.uuid(),
          organization_id: 'serenity-care-partners',
          first_name: faker.person.firstName(),
          last_name: faker.person.lastName(),
          email: faker.internet.email(),
          phone: faker.phone.number('(###) ###-####'),
          address: `${faker.location.streetAddress()}, ${faker.helpers.arrayElement(OHIO_CITIES)}, OH ${faker.location.zipCode()}`,
          position_applied_for: faker.helpers.arrayElement(positions),
          application_date: applicationDate,
          source: faker.helpers.arrayElement(sources),
          experience_level: faker.helpers.arrayElement(['entry', 'junior', 'mid', 'senior']),
          certifications: faker.helpers.arrayElements(CAREGIVER_CERTIFICATIONS, { min: 1, max: 3 }),
          skills: faker.helpers.arrayElements([
            'Patient Care', 'Medication Administration', 'Vital Signs', 'Documentation',
            'Communication', 'Time Management', 'Empathy', 'Reliability'
          ], { min: 3, max: 6 }),
          availability: {
            fullTime: faker.datatype.boolean(),
            partTime: faker.datatype.boolean(),
            weekends: faker.datatype.boolean(),
            nights: faker.datatype.boolean(),
            holidays: faker.datatype.boolean()
          },
          ai_screening_score: faker.number.int({ min: 65, max: 95 }),
          ai_screening_notes: faker.lorem.sentences(3),
          status: this.getApplicantStatus(stageGroup.stage),
          current_stage: stageGroup.stage,
          created_at: applicationDate,
          updated_at: faker.date.between({ from: applicationDate, to: new Date() }),
          created_by: 'hr-director-001'
        };

        applicants.push(applicant);

        // Generate interview data for applicable stages
        if (['interviews', 'final_review', 'offer', 'hired'].includes(stageGroup.stage)) {
          const interview = {
            id: faker.string.uuid(),
            applicant_id: applicant.id,
            interview_type: faker.helpers.arrayElement(['phone', 'video', 'in_person']),
            scheduled_date: faker.date.between({ from: applicationDate, to: new Date() }),
            interviewer_id: 'hr-director-001',
            questions: this.generateInterviewQuestions(applicant.position_applied_for),
            responses: this.generateInterviewResponses(),
            overall_rating: faker.number.int({ min: 6, max: 10 }),
            notes: faker.lorem.paragraph(),
            recommendation: faker.helpers.weightedArrayElement([
              { weight: 70, value: 'yes' },
              { weight: 20, value: 'maybe' },
              { weight: 10, value: 'no' }
            ]),
            status: 'completed',
            completed_at: faker.date.between({ from: applicationDate, to: new Date() }),
            created_at: applicationDate,
            created_by: 'hr-director-001'
          };

          await this.db.insert('interviews', interview);
        }
      }
    }

    await this.batchInsert('applicants', applicants);
    apiLogger.info('✅ Generated recruiting pipeline with 150 applicants');
  }

  private async generateSchedulingData(): Promise<void> {
    apiLogger.info('📅 Generating scheduling and EVV data...');

    // Get active patients and caregivers
    const patientsResult = await this.db.query('SELECT id FROM patients WHERE status = $1 LIMIT 100', ['active']);
    const caregiversResult = await this.db.query('SELECT id FROM employees WHERE position IN ($1, $2, $3) AND status = $4',
      ['caregiver', 'nurse_rn', 'nurse_lpn', 'active']);

    const patients = patientsResult.rows as { id: string }[];
    const caregivers = caregiversResult.rows as { id: string }[];

    const shifts = [];
    const evvRecords = [];

    // Generate 30 days of scheduling data
    for (let day = 0; day < 30; day++) {
      const shiftDate = new Date();
      shiftDate.setDate(shiftDate.getDate() - day);

      // Generate 8-15 shifts per day
      const shiftsPerDay = faker.number.int({ min: 8, max: 15 });

      for (let i = 0; i < shiftsPerDay; i++) {
        const patient = faker.helpers.arrayElement(patients);
        const caregiver = faker.helpers.arrayElement(caregivers);
        const startTime = faker.date.between({
          from: new Date(shiftDate.toDateString() + ' 06:00:00'),
          to: new Date(shiftDate.toDateString() + ' 18:00:00')
        });
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + faker.number.int({ min: 2, max: 8 }));

        const shift = {
          id: faker.string.uuid(),
          organization_id: 'serenity-care-partners',
          pod_id: 'pod-001',
          patient_id: patient.id,
          caregiver_id: caregiver.id,
          service_id: faker.string.uuid(),
          scheduled_start: startTime,
          scheduled_end: endTime,
          status: faker.helpers.weightedArrayElement([
            { weight: 85, value: 'completed' },
            { weight: 10, value: 'in_progress' },
            { weight: 5, value: 'no_show' }
          ]),
          tasks: [
            { id: faker.string.uuid(), name: 'Medication assistance', completed: true },
            { id: faker.string.uuid(), name: 'Vital signs check', completed: true },
            { id: faker.string.uuid(), name: 'Personal care', completed: true }
          ],
          created_at: faker.date.between({ from: startTime, to: new Date() }),
          updated_at: new Date(),
          created_by: 'scheduler-001'
        };

        shifts.push(shift);

        // Generate EVV record for completed shifts
        if (shift.status === 'completed') {
          const actualStart = new Date(startTime);
          actualStart.setMinutes(actualStart.getMinutes() + faker.number.int({ min: -10, max: 15 }));

          const actualEnd = new Date(endTime);
          actualEnd.setMinutes(actualEnd.getMinutes() + faker.number.int({ min: -15, max: 10 }));

          const evvRecord = {
            id: faker.string.uuid(),
            shift_id: shift.id,
            patient_id: patient.id,
            caregiver_id: caregiver.id,
            service_type: 'Personal Care',
            service_date: shiftDate,
            scheduled_start: startTime,
            scheduled_end: endTime,
            actual_start: actualStart,
            actual_end: actualEnd,
            location_verified: true,
            gps_coordinates: {
              latitude: faker.location.latitude({ min: 39.9, max: 41.7 }), // Ohio bounds
              longitude: faker.location.longitude({ min: -84.8, max: -80.5 })
            },
            compliance_status: faker.helpers.weightedArrayElement([
              { weight: 95, value: 'compliant' },
              { weight: 5, value: 'needs_review' }
            ]),
            submission_status: 'submitted',
            submitted_to_sandata: faker.date.between({ from: actualEnd, to: new Date() }),
            created_at: actualEnd,
            updated_at: new Date()
          };

          evvRecords.push(evvRecord);
        }
      }
    }

    await this.batchInsert('shifts', shifts);
    await this.batchInsert('evv_records', evvRecords);
    apiLogger.info(`✅ Generated ${shifts.length} shifts and ${evvRecords.length} EVV records`);
  }

  private async generateTaxData(): Promise<void> {
    apiLogger.info('💰 Generating tax compliance data...');

    // Generate quarterly tax calculations for all employees
    const employees = await this.db.query('SELECT id, current_salary, hourly_rate, hire_date FROM employees WHERE status = $1', ['active']);

    const taxCalculations = [];
    const currentYear = new Date().getFullYear();

    // Generate 3 quarters of data
    for (let quarter = 1; quarter <= 3; quarter++) {
      for (const employee of employees.rows) {
        // Calculate quarterly gross pay
        const quarterlyHours = 520; // 40 hours/week * 13 weeks
        const grossPay = employee.hourly_rate ?
          employee.hourly_rate * quarterlyHours :
          employee.current_salary / 4;

        const taxCalc = {
          id: faker.string.uuid(),
          organization_id: 'serenity-care-partners',
          employee_id: employee.id,
          pay_period_id: `Q${quarter}-${currentYear}`,
          gross_pay: grossPay,
          federal_withholding: grossPay * 0.12, // Approximate 12% federal withholding
          ohio_state_withholding: grossPay * 0.028, // Ohio state rate
          local_withholding: grossPay * 0.02, // Municipal tax
          social_security_tax: Math.min(grossPay * 0.062, 160200 * 0.062), // SS wage base
          medicare_tax: grossPay * 0.0145,
          additional_medicare_tax: grossPay > 200000 ? (grossPay - 200000) * 0.009 : 0,
          ohio_sui: Math.min(grossPay * 0.004, 9000 * 0.004), // Ohio SUI
          federal_unemployment: Math.min(grossPay * 0.006, 7000 * 0.006), // FUTA
          net_pay: grossPay * 0.78, // Approximate net after taxes
          tax_year: currentYear,
          municipality_code: 'COLUMBUS',
          calculated_at: new Date(`${currentYear}-${quarter * 3}-15`),
          created_by: 'payroll-system'
        };

        taxCalculations.push(taxCalc);
      }
    }

    await this.batchInsert('tax_calculations', taxCalculations);

    // Generate tax forms
    const taxForms = [
      {
        id: faker.string.uuid(),
        organization_id: 'serenity-care-partners',
        form_type: '941',
        tax_year: currentYear,
        quarter: 1,
        form_data: {
          ein: '12-3456789',
          quarter: 1,
          taxYear: currentYear,
          employeeCount: employees.rows.length,
          totalWages: 2500000,
          federalWithheld: 300000,
          totalTaxLiability: 500000
        },
        generated_at: new Date(`${currentYear}-04-01`),
        status: 'submitted',
        submitted_at: new Date(`${currentYear}-04-28`),
        created_by: 'tax-system'
      },
      {
        id: faker.string.uuid(),
        organization_id: 'serenity-care-partners',
        form_type: 'OH_IT501',
        tax_year: currentYear,
        quarter: 1,
        form_data: {
          ohioAccountNumber: 'OH123456',
          quarter: 1,
          taxYear: currentYear,
          totalWages: 2500000,
          ohioWithheld: 70000
        },
        generated_at: new Date(`${currentYear}-04-01`),
        status: 'submitted',
        submitted_at: new Date(`${currentYear}-04-29`),
        created_by: 'tax-system'
      }
    ];

    await this.batchInsert('tax_forms', taxForms);

    // Generate tax deadlines
    const taxDeadlines = [
      {
        id: faker.string.uuid(),
        organization_id: 'serenity-care-partners',
        deadline_date: new Date(`${currentYear}-04-30`),
        description: 'Q1 Form 941 Federal Tax Return',
        form_type: '941',
        jurisdiction: 'federal',
        tax_year: currentYear,
        quarter: 1,
        status: 'completed',
        completed_at: new Date(`${currentYear}-04-28`),
        completed_by: 'tax-system'
      },
      {
        id: faker.string.uuid(),
        organization_id: 'serenity-care-partners',
        deadline_date: new Date(`${currentYear}-07-31`),
        description: 'Q2 Form 941 Federal Tax Return',
        form_type: '941',
        jurisdiction: 'federal',
        tax_year: currentYear,
        quarter: 2,
        status: 'upcoming',
        remind_days_before: 30
      }
    ];

    await this.batchInsert('tax_deadlines', taxDeadlines);
    apiLogger.info('✅ Generated tax compliance data');
  }

  private async generateAIAgentData(): Promise<void> {
    apiLogger.info('🤖 Generating AI agent execution data...');

    const agentTypes = [
      'scheduler_agent', 'evv_watchdog_agent', 'no_show_predictor_agent',
      'recruiting_screener_agent', 'billing_compliance_agent', 'denial_resolution_agent',
      'fpa_copilot_agent', 'hipaa_guardian_agent', 'executive_copilot_agent',
      'ai_companion', 'family_concierge_agent', 'training_policy_agent',
      'notification_agent', 'survey_feedback_agent', 'credentialing_agent',
      'audit_prep_agent', 'policy_brain_agent'
    ];

    const agentExecutions = [];

    // Generate 30 days of agent executions
    for (let day = 0; day < 30; day++) {
      const executionDate = new Date();
      executionDate.setDate(executionDate.getDate() - day);

      // Each agent executes multiple times per day
      for (const agentType of agentTypes) {
        const executionsPerDay = this.getExecutionsPerDay(agentType);

        for (let i = 0; i < executionsPerDay; i++) {
          const execution = {
            id: faker.string.uuid(),
            organization_id: 'serenity-care-partners',
            agent_type: agentType,
            prompt_hash: faker.string.alphanumeric(32),
            context_data: this.generateAgentContext(agentType),
            result: this.generateAgentResult(agentType),
            confidence: faker.number.float({ min: 0.7, max: 0.98, fractionDigits: 3 }),
            processing_time: faker.number.int({ min: 200, max: 3000 }), // milliseconds
            cost: this.calculateAgentCost(agentType),
            model_used: this.getModelForAgent(agentType),
            executed_at: faker.date.between({
              from: new Date(executionDate.toDateString() + ' 00:00:00'),
              to: new Date(executionDate.toDateString() + ' 23:59:59')
            }),
            user_id: faker.helpers.arrayElement(['founder-001', 'coo-001', 'hr-director-001', null]),
            cache_hit: faker.datatype.boolean({ probability: 0.15 }),
            error_occurred: faker.datatype.boolean({ probability: 0.02 })
          };

          agentExecutions.push(execution);
        }
      }
    }

    await this.batchInsert('agent_executions', agentExecutions);
    apiLogger.info(`✅ Generated ${agentExecutions.length} AI agent executions`);
  }

  private async generatePerformanceData(): Promise<void> {
    apiLogger.info('📊 Generating performance and retention data...');

    const employees = await this.db.query('SELECT id, position, hire_date FROM employees WHERE status = $1', ['active']);

    const performanceReviews = [];
    const retentionRisks = [];

    for (const employee of employees.rows.slice(0, 200)) { // Generate for 200 employees
      // Performance review
      const review = {
        id: faker.string.uuid(),
        employee_id: employee.id,
        review_period: '2024-Q1',
        review_type: 'quarterly',
        metrics: [
          {
            category: 'Quality of Care',
            description: 'Patient satisfaction and care quality',
            rating: faker.number.int({ min: 3, max: 5 }),
            weight: 30,
            comments: faker.lorem.sentence()
          },
          {
            category: 'Reliability',
            description: 'Punctuality and attendance',
            rating: faker.number.int({ min: 3, max: 5 }),
            weight: 25,
            comments: faker.lorem.sentence()
          },
          {
            category: 'Communication',
            description: 'Documentation and team communication',
            rating: faker.number.int({ min: 3, max: 5 }),
            weight: 20,
            comments: faker.lorem.sentence()
          }
        ],
        overall_rating: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }),
        goals_achieved: [
          {
            id: faker.string.uuid(),
            description: 'Complete HIPAA training',
            status: 'completed',
            progress: 100
          }
        ],
        new_goals: [
          {
            id: faker.string.uuid(),
            description: 'Improve medication management skills',
            target_date: '2024-06-30',
            progress: 0
          }
        ],
        current_salary: faker.number.int({ min: 35000, max: 75000 }),
        promotion_recommended: faker.datatype.boolean({ probability: 0.1 }),
        reviewed_by: 'hr-director-001',
        reviewed_at: faker.date.recent({ days: 30 }),
        status: 'completed'
      };

      performanceReviews.push(review);

      // Retention risk analysis
      const riskLevel = faker.helpers.weightedArrayElement([
        { weight: 70, value: 'low' },
        { weight: 20, value: 'medium' },
        { weight: 8, value: 'high' },
        { weight: 2, value: 'critical' }
      ]);

      const retentionRisk = {
        id: faker.string.uuid(),
        employee_id: employee.id,
        risk_level: riskLevel,
        risk_score: this.getRiskScore(riskLevel),
        risk_factors: this.getRiskFactors(riskLevel),
        calculated_at: faker.date.recent({ days: 7 }),
        recommended_actions: this.getRetentionActions(riskLevel),
        next_assessment_date: faker.date.soon({ days: 30 }),
        assigned_to: 'hr-director-001'
      };

      retentionRisks.push(retentionRisk);
    }

    await this.batchInsert('performance_reviews', performanceReviews);
    await this.batchInsert('retention_risks', retentionRisks);
    apiLogger.info('✅ Generated performance reviews and retention analysis');
  }

  // Helper methods
  private generateSSN(): string {
    return `${faker.string.numeric(3)}-${faker.string.numeric(2)}-${faker.string.numeric(4)}`;
  }

  private getDepartment(role: string): string {
    const departmentMap = {
      'caregiver': 'Field Operations',
      'nurse_rn': 'Clinical Services',
      'nurse_lpn': 'Clinical Services',
      'therapist_pt': 'Therapy Services',
      'therapist_ot': 'Therapy Services',
      'social_worker': 'Clinical Services',
      'scheduler': 'Operations',
      'billing_specialist': 'Revenue Cycle',
      'compliance_officer': 'Compliance',
      'hr_specialist': 'Human Resources',
      'field_supervisor': 'Field Operations',
      'manager': 'Management',
      'director': 'Executive'
    };
    return departmentMap[role] || 'General';
  }

  private getManagerId(role: string): string | null {
    // Simplified manager assignment
    if (['director', 'founder'].includes(role)) return null;
    if (['manager'].includes(role)) return 'coo-001';
    return 'manager-001'; // Would be dynamically assigned
  }

  private getCertifications(role: string): string[] {
    const certMap = {
      'caregiver': ['CNA', 'CPR', 'First Aid'],
      'nurse_rn': ['RN License', 'CPR', 'ACLS'],
      'nurse_lpn': ['LPN License', 'CPR'],
      'therapist_pt': ['PT License', 'CPR'],
      'therapist_ot': ['OT License', 'CPR'],
      'social_worker': ['LSW', 'CPR']
    };
    return certMap[role] || ['CPR'];
  }

  private getLicenseNumbers(role: string): Record<string, string> {
    const licenses = {};
    if (role.includes('nurse') || role.includes('therapist') || role === 'social_worker') {
      licenses['primary'] = `OH${faker.string.numeric(6)}`;
    }
    return licenses;
  }

  private getMunicipalityCode(city: string): string {
    const municipalityMap = {
      'Columbus': 'COLUMBUS',
      'Cleveland': 'CLEVELAND',
      'Cincinnati': 'CINCINNATI',
      'Toledo': 'TOLEDO',
      'Akron': 'AKRON',
      'Dayton': 'DAYTON'
    };
    return municipalityMap[city] || 'COLUMBUS';
  }

  private getApplicantStatus(stage: string): string {
    const statusMap = {
      'application': 'new',
      'ai_screening': 'screening',
      'phone_screen': 'interviewing',
      'interviews': 'interviewing',
      'final_review': 'reference_check',
      'offer': 'offer_pending',
      'hired': 'hired'
    };
    return statusMap[stage] || 'new';
  }

  private generateInterviewQuestions(position: string): any[] {
    return [
      {
        id: faker.string.uuid(),
        question: `Tell me about your experience in ${position} roles.`,
        category: 'experience',
        aiGenerated: true
      },
      {
        id: faker.string.uuid(),
        question: 'How do you handle challenging patient situations?',
        category: 'behavioral',
        aiGenerated: true
      }
    ];
  }

  private generateInterviewResponses(): any[] {
    return [
      {
        questionId: faker.string.uuid(),
        response: faker.lorem.paragraph(),
        rating: faker.number.int({ min: 3, max: 5 }),
        notes: faker.lorem.sentence()
      }
    ];
  }

  private getExecutionsPerDay(agentType: string): number {
    const executionMap = {
      'scheduler_agent': faker.number.int({ min: 50, max: 100 }),
      'evv_watchdog_agent': faker.number.int({ min: 200, max: 300 }),
      'ai_companion': faker.number.int({ min: 100, max: 200 }),
      'notification_agent': faker.number.int({ min: 150, max: 250 }),
      'hipaa_guardian_agent': faker.number.int({ min: 300, max: 500 }),
      'executive_copilot_agent': faker.number.int({ min: 5, max: 15 }),
      'policy_brain_agent': faker.number.int({ min: 20, max: 40 })
    };
    return executionMap[agentType] || faker.number.int({ min: 10, max: 50 });
  }

  private generateAgentContext(agentType: string): any {
    return {
      timestamp: new Date().toISOString(),
      requestId: faker.string.uuid(),
      agentType: agentType
    };
  }

  private generateAgentResult(agentType: string): any {
    return {
      success: true,
      recommendations: faker.lorem.sentences(2),
      confidence: faker.number.float({ min: 0.8, max: 0.99, fractionDigits: 2 })
    };
  }

  private calculateAgentCost(agentType: string): number {
    const costMap = {
      'ai_companion': faker.number.float({ min: 0.01, max: 0.03, fractionDigits: 4 }),
      'notification_agent': faker.number.float({ min: 0.005, max: 0.015, fractionDigits: 4 }),
      'executive_copilot_agent': faker.number.float({ min: 0.05, max: 0.15, fractionDigits: 4 }),
      'policy_brain_agent': faker.number.float({ min: 0.03, max: 0.08, fractionDigits: 4 })
    };
    return costMap[agentType] || faker.number.float({ min: 0.01, max: 0.05, fractionDigits: 4 });
  }

  private getModelForAgent(agentType: string): string {
    const modelMap = {
      'ai_companion': faker.helpers.arrayElement(['gpt-5-main', 'gpt-5-main-mini']),
      'notification_agent': 'gpt-5-main-mini',
      'executive_copilot_agent': 'gpt-5-thinking',
      'hipaa_guardian_agent': 'azure-gpt-5-main',
      'policy_brain_agent': 'claude-sonnet'
    };
    return modelMap[agentType] || 'gpt-5-main';
  }

  private getRiskScore(riskLevel: string): number {
    const scoreMap = {
      'low': faker.number.int({ min: 10, max: 30 }),
      'medium': faker.number.int({ min: 31, max: 60 }),
      'high': faker.number.int({ min: 61, max: 80 }),
      'critical': faker.number.int({ min: 81, max: 95 })
    };
    return scoreMap[riskLevel] || 25;
  }

  private getRiskFactors(riskLevel: string): any[] {
    const factors = [
      { factor: 'Below market compensation', impact: 7, description: 'Salary 15% below market rate' },
      { factor: 'Limited career advancement', impact: 6, description: 'No promotion in 2+ years' },
      { factor: 'High workload', impact: 8, description: 'Consistently working overtime' },
      { factor: 'Manager relationship', impact: 5, description: 'Tensions with direct supervisor' }
    ];

    const count = riskLevel === 'critical' ? 4 : riskLevel === 'high' ? 3 : riskLevel === 'medium' ? 2 : 1;
    return faker.helpers.arrayElements(factors, count);
  }

  private getRetentionActions(riskLevel: string): any[] {
    const actions = [
      { action: 'Salary review and adjustment', category: 'compensation', priority: 'high' },
      { action: 'Career implementation planning', category: 'implementation', priority: 'medium' },
      { action: 'Flexible scheduling options', category: 'workload', priority: 'medium' },
      { action: 'Recognition program enrollment', category: 'recognition', priority: 'low' }
    ];

    const count = riskLevel === 'critical' ? 4 : riskLevel === 'high' ? 3 : 2;
    return faker.helpers.arrayElements(actions, count);
  }

  private async batchInsert(table: string, records: any[], batchSize = 100): Promise<void> {
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      for (const record of batch) {
        await this.db.insert(table, record);
      }
      apiLogger.info(`  Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)} for ${table}`);
    }
  }
}

// Export the generator class
export default SampleDataGenerator;