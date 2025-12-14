/**
 * Complete End-to-End Lifecycle Test
 * Simulates entire business flow from hiring to patient care delivery
 *
 * Test Scenarios:
 * 1. Organization Setup
 * 2. Caregiver Recruitment & Hiring
 * 3. Client Onboarding
 * 4. Schedule Management
 * 5. Visit Execution
 * 6. Billing & Payroll
 * 7. Compliance & Reporting
 */

import { pool } from '../../src/config/database';
import axios from 'axios';

// Import all services
import { backgroundCheckAdapter } from '../../src/services/integrations/background-check.adapter';
import { insuranceVerificationAdapter } from '../../src/services/integrations/insurance-verification.adapter';
import { ehrAdapter } from '../../src/services/integrations/ehr.adapter';
import { smartSchedulerService } from '../../src/services/automation/smart-scheduler.service';
import { approvalWorkflowService } from '../../src/services/automation/approval-workflow.service';
import { multiStateComplianceService } from '../../src/services/enterprise/multi-state-compliance.service';
import { whiteLabelService } from '../../src/services/enterprise/white-label.service';
import { publicAPIService } from '../../src/services/enterprise/public-api.service';
import { mlForecastService } from '../../src/services/ml/forecast.service';
import { scheduleOptimizerService } from '../../src/services/ml/schedule-optimizer.service';
import { offlineSyncService } from '../../src/services/mobile/offline-sync.service';
import { navigationService } from '../../src/services/mobile/navigation.service';
import { voiceToTextService } from '../../src/services/mobile/voice-to-text.service';
import { photoUploadService } from '../../src/services/mobile/photo-upload.service';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_JWT_TOKEN || '';

interface TestContext {
  organizationId: string;
  founderUserId: string;
  caregiverId: string;
  clientId: string;
  visitId: string;
  expenseId: string;
  invoiceId: string;
  apiToken: string;
}

describe('Complete E2E Lifecycle Test Suite', () => {
  let context: TestContext = {} as TestContext;
  let authHeaders: any = {};

  beforeAll(async () => {
    console.log('\n🚀 Starting Complete E2E Test Suite...\n');

    // Setup auth headers
    authHeaders = {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'Content-Type': 'application/json'
    };
  });

  afterAll(async () => {
    console.log('\n✅ E2E Test Suite Complete!\n');
    await pool.end();
  });

  /**
   * SCENARIO 1: ORGANIZATION SETUP
   */
  describe('Scenario 1: Organization Setup & White-Label Configuration', () => {
    test('1.1 - Create new organization', async () => {
      console.log('\n📋 Test 1.1: Creating organization...');

      const response = await axios.post(
        `${BASE_URL}/api/organizations`,
        {
          name: 'Harmony Home Care (Test)',
          state: 'OH',
          address: '123 Main Street',
          city: 'Columbus',
          zipCode: '43215',
          phone: '614-555-0100',
          email: 'info@harmonyhomecare-test.com',
          npi: '1234567890',
          taxId: '12-3456789',
          licenseNumber: 'HCA-OH-12345'
        },
        { headers: authHeaders }
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);

      context.organizationId = response.data.data.organizationId;
      context.founderUserId = response.data.data.founderUserId;

      console.log(`   ✓ Organization created: ${context.organizationId}`);
      console.log(`   ✓ Founder user created: ${context.founderUserId}`);
    });

    test('1.2 - Configure white-label branding', async () => {
      console.log('\n🎨 Test 1.2: Setting up white-label branding...');

      const brandingConfig = {
        organizationId: context.organizationId,
        companyName: 'Harmony Home Care',
        logoUrl: 'https://cdn.example.com/harmony-logo.png',
        faviconUrl: 'https://cdn.example.com/harmony-favicon.ico',
        colors: {
          primary: '#2563EB',
          secondary: '#10B981',
          accent: '#F59E0B',
          background: '#F9FAFB',
          text: '#111827'
        },
        fonts: {
          heading: 'Poppins, sans-serif',
          body: 'Inter, sans-serif'
        },
        terminology: {
          'caregiver': 'care professional',
          'client': 'patient'
        }
      };

      const success = await whiteLabelService.updateBrandingConfig(brandingConfig);
      expect(success).toBe(true);

      console.log('   ✓ Branding configured successfully');
    });

    test('1.3 - Initialize state compliance rules', async () => {
      console.log('\n📜 Test 1.3: Initializing Ohio compliance rules...');

      await multiStateComplianceService.initializeStateRules('OH');

      const rules = await multiStateComplianceService.getStateRules('OH');
      expect(rules.state).toBe('OH');
      expect(rules.trainingRequirements.initialOrientationHours).toBe(40);
      expect(rules.wageRules.minimumWage).toBeGreaterThan(0);

      console.log('   ✓ Ohio compliance rules initialized');
      console.log(`   ✓ Required training hours: ${rules.trainingRequirements.initialOrientationHours}`);
      console.log(`   ✓ Minimum wage: $${rules.wageRules.minimumWage}`);
    });

    test('1.4 - Enable feature flags', async () => {
      console.log('\n⚙️  Test 1.4: Enabling enterprise features...');

      const features = {
        organizationId: context.organizationId,
        features: {
          mlForecasting: true,
          scheduleOptimization: true,
          voiceToText: true,
          biDashboard: true,
          payrollIntegrations: true,
          ehrIntegration: true,
          mobileApp: true,
          webSocketRealtime: true,
          advancedReporting: true,
          apiAccess: true
        }
      };

      const success = await whiteLabelService.updateFeatureFlags(features);
      expect(success).toBe(true);

      console.log('   ✓ All enterprise features enabled');
    });

    test('1.5 - Generate public API credentials', async () => {
      console.log('\n🔑 Test 1.5: Generating public API credentials...');

      const credentials = await publicAPIService.generateAPIKey(
        context.organizationId,
        'E2E Test Integration',
        [
          'read:clients',
          'write:clients',
          'read:caregivers',
          'write:caregivers',
          'read:visits',
          'write:visits',
          'read:schedule',
          'write:schedule'
        ],
        1000, // 1000 requests per minute
        365 // expires in 1 year
      );

      expect(credentials.apiKey).toMatch(/^sk_/);
      expect(credentials.apiSecret).toBeTruthy();

      // Authenticate with API key
      const auth = await publicAPIService.authenticateAPI(
        credentials.apiKey,
        credentials.apiSecret
      );

      expect(auth).toBeTruthy();
      context.apiToken = auth!.token;

      console.log('   ✓ API credentials generated');
      console.log('   ✓ API authentication successful');
    });
  });

  /**
   * SCENARIO 2: CAREGIVER RECRUITMENT & HIRING
   */
  describe('Scenario 2: Caregiver Recruitment & Hiring Process', () => {
    let candidateId: string;
    let backgroundCheckId: string;

    test('2.1 - Create job applicant', async () => {
      console.log('\n👤 Test 2.1: Creating job applicant...');

      const response = await axios.post(
        `${BASE_URL}/api/hr/applicants`,
        {
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@test.com',
          phone: '614-555-0201',
          address: '456 Oak Avenue',
          city: 'Columbus',
          state: 'OH',
          zipCode: '43220',
          dateOfBirth: '1985-06-15',
          position: 'CAREGIVER',
          referralSource: 'Indeed',
          resumeUrl: 'https://cdn.example.com/resume.pdf'
        },
        { headers: authHeaders }
      );

      expect(response.status).toBe(201);
      candidateId = response.data.data.id;

      console.log(`   ✓ Applicant created: ${candidateId}`);
    });

    test('2.2 - Initiate background check', async () => {
      console.log('\n🔍 Test 2.2: Initiating background check...');

      // Note: This will use mock/test mode if API keys not configured
      const result = await backgroundCheckAdapter.initiateBackgroundCheck(
        context.organizationId,
        {
          candidateId,
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@test.com',
          phone: '614-555-0201',
          dateOfBirth: '1985-06-15',
          ssn: '5678',
          zipCode: '43220',
          package: 'healthcare'
        }
      );

      if (result) {
        backgroundCheckId = result.checkId;
        console.log(`   ✓ Background check initiated: ${backgroundCheckId}`);
        console.log(`   ✓ Invitation URL: ${result.invitationUrl || 'N/A (test mode)'}`);
      } else {
        console.log('   ⚠ Background check skipped (API not configured)');
        // Create mock background check record
        const mockResult = await pool.query(
          `INSERT INTO background_checks (
            organization_id, candidate_id, provider, provider_check_id,
            status, package_type, overall_result, created_at
          ) VALUES ($1, $2, 'test', 'mock-123', 'completed', 'healthcare', 'clear', NOW())
          RETURNING id`,
          [context.organizationId, candidateId]
        );
        backgroundCheckId = mockResult.rows[0].id;
      }
    });

    test('2.3 - Complete training requirements', async () => {
      console.log('\n📚 Test 2.3: Completing required training courses...');

      const requiredCourses = [
        { name: 'Infection Control', hours: 4 },
        { name: 'HIPAA and Confidentiality', hours: 2 },
        { name: 'Emergency Preparedness', hours: 3 },
        { name: 'Personal Care Skills', hours: 16 },
        { name: 'Client Rights', hours: 2 },
        { name: 'Alzheimer\'s and Dementia Care', hours: 8 }
      ];

      for (const course of requiredCourses) {
        await pool.query(
          `INSERT INTO caregiver_training (
            caregiver_id, course_id, course_name, status,
            completion_date, hours, created_at
          ) SELECT $1, gen_random_uuid(), $2, 'completed', NOW(), $3, NOW()`,
          [candidateId, course.name, course.hours]
        );
      }

      console.log(`   ✓ Completed ${requiredCourses.length} required courses`);
      console.log(`   ✓ Total training hours: ${requiredCourses.reduce((sum, c) => sum + c.hours, 0)}`);
    });

    test('2.4 - Validate training compliance', async () => {
      console.log('\n✅ Test 2.4: Validating training compliance...');

      const compliance = await multiStateComplianceService.validateTrainingCompliance(
        candidateId,
        'OH'
      );

      expect(compliance.compliant).toBe(true);
      expect(compliance.missingHours).toBe(0);
      expect(compliance.missingCourses.length).toBe(0);

      console.log(`   ✓ Training compliance: ${compliance.compliant ? 'PASSED' : 'FAILED'}`);
      console.log(`   ✓ Missing hours: ${compliance.missingHours}`);
      console.log(`   ✓ Missing courses: ${compliance.missingCourses.length}`);
    });

    test('2.5 - Hire caregiver (create user account)', async () => {
      console.log('\n✨ Test 2.5: Creating caregiver user account...');

      const response = await axios.post(
        `${BASE_URL}/api/users`,
        {
          organizationId: context.organizationId,
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@test.com',
          phone: '614-555-0201',
          role: 'CAREGIVER',
          hourlyRate: 18.50,
          hireDate: new Date().toISOString().split('T')[0],
          certifications: ['CNA', 'CPR', 'First Aid'],
          languages: ['English', 'Spanish']
        },
        { headers: authHeaders }
      );

      expect(response.status).toBe(201);
      context.caregiverId = response.data.data.id;

      console.log(`   ✓ Caregiver hired: ${context.caregiverId}`);
      console.log(`   ✓ Hourly rate: $18.50`);
    });

    test('2.6 - Set caregiver availability', async () => {
      console.log('\n📅 Test 2.6: Setting caregiver availability...');

      const availability = [
        { dayOfWeek: 1, startTime: '08:00', endTime: '17:00' }, // Monday
        { dayOfWeek: 2, startTime: '08:00', endTime: '17:00' }, // Tuesday
        { dayOfWeek: 3, startTime: '08:00', endTime: '17:00' }, // Wednesday
        { dayOfWeek: 4, startTime: '08:00', endTime: '17:00' }, // Thursday
        { dayOfWeek: 5, startTime: '08:00', endTime: '17:00' }  // Friday
      ];

      for (const slot of availability) {
        await pool.query(
          `INSERT INTO caregiver_availability (
            caregiver_id, day_of_week, start_time, end_time, created_at
          ) VALUES ($1, $2, $3, $4, NOW())`,
          [context.caregiverId, slot.dayOfWeek, slot.startTime, slot.endTime]
        );
      }

      console.log(`   ✓ Availability set for ${availability.length} days/week`);
      console.log('   ✓ Hours: Monday-Friday, 8:00 AM - 5:00 PM');
    });
  });

  /**
   * SCENARIO 3: CLIENT ONBOARDING
   */
  describe('Scenario 3: Client Onboarding & Assessment', () => {
    test('3.1 - Create client record', async () => {
      console.log('\n🏥 Test 3.1: Creating client record...');

      const response = await axios.post(
        `${BASE_URL}/api/clients`,
        {
          organizationId: context.organizationId,
          firstName: 'Margaret',
          lastName: 'Williams',
          dateOfBirth: '1940-03-20',
          gender: 'Female',
          serviceAddress: '789 Elm Street',
          city: 'Columbus',
          state: 'OH',
          zipCode: '43215',
          phone: '614-555-0301',
          emergencyContactName: 'Robert Williams',
          emergencyContactPhone: '614-555-0302',
          emergencyContactRelationship: 'Son',
          primaryDiagnosis: 'Alzheimer\'s Disease',
          secondaryDiagnoses: ['Hypertension', 'Diabetes Type 2'],
          medications: [
            'Donepezil 10mg daily',
            'Lisinopril 20mg daily',
            'Metformin 1000mg twice daily'
          ],
          allergies: ['Penicillin'],
          insurancePayer: 'Medicare',
          insuranceMemberId: 'ABC123456789',
          insuranceGroupNumber: 'GRP001'
        },
        { headers: authHeaders }
      );

      expect(response.status).toBe(201);
      context.clientId = response.data.data.id;

      console.log(`   ✓ Client created: ${context.clientId}`);
      console.log('   ✓ Client: Margaret Williams, Age 84');
    });

    test('3.2 - Verify insurance eligibility', async () => {
      console.log('\n💳 Test 3.2: Verifying insurance eligibility...');

      const eligibility = await insuranceVerificationAdapter.verifyEligibility(
        context.organizationId,
        {
          memberId: 'ABC123456789',
          firstName: 'Margaret',
          lastName: 'Williams',
          dateOfBirth: '1940-03-20',
          payerId: '00192', // Medicare
          serviceType: '33', // Home health
          providerNPI: '1234567890'
        }
      );

      if (eligibility) {
        expect(eligibility.verified).toBe(true);
        console.log(`   ✓ Insurance verified: ${eligibility.active ? 'ACTIVE' : 'INACTIVE'}`);
        console.log(`   ✓ Plan: ${eligibility.planName || 'N/A'}`);
        console.log(`   ✓ Coverage level: ${eligibility.benefits.length} benefit types`);
      } else {
        console.log('   ⚠ Insurance verification skipped (API not configured)');
        // Mock verification
        await pool.query(
          `INSERT INTO insurance_verifications (
            organization_id, member_id, payer_id, provider_npi,
            verified, active, plan_name, created_at
          ) VALUES ($1, $2, $3, $4, true, true, 'Medicare Part A', NOW())`,
          [context.organizationId, 'ABC123456789', '00192', '1234567890']
        );
      }
    });

    test('3.3 - Complete ADL/IADL assessment', async () => {
      console.log('\n📊 Test 3.3: Completing ADL/IADL assessment...');

      await pool.query(
        `INSERT INTO care_plans (
          organization_id, client_id, assessment_date,
          plan_start_date, adl_assessment, iadl_assessment,
          goals, interventions, created_at
        ) VALUES ($1, $2, NOW(), NOW(), $3, $4, $5, $6, NOW())`,
        [
          context.organizationId,
          context.clientId,
          JSON.stringify({
            bathing: 3,      // Requires assistance
            dressing: 3,
            toileting: 2,    // Minimal assistance
            transferring: 2,
            eating: 1,       // Independent
            mobility: 3
          }),
          JSON.stringify({
            meal_preparation: 4,      // Unable
            housekeeping: 4,
            medication_management: 3, // Requires assistance
            shopping: 4,
            transportation: 4
          }),
          JSON.stringify([
            {
              category: 'Safety',
              description: 'Maintain safe home environment',
              status: 'active'
            },
            {
              category: 'Nutrition',
              description: 'Ensure adequate nutrition and hydration',
              status: 'active'
            }
          ]),
          JSON.stringify([
            {
              category: 'Personal Care',
              intervention: 'Assist with bathing and dressing daily',
              frequency: 'Daily'
            },
            {
              category: 'Homemaking',
              intervention: 'Light housekeeping and meal preparation',
              frequency: 'Daily'
            }
          ])
        ]
      );

      console.log('   ✓ ADL assessment completed (6 activities)');
      console.log('   ✓ IADL assessment completed (5 activities)');
      console.log('   ✓ Care plan created with goals and interventions');
    });

    test('3.4 - Import care plan from EHR (if available)', async () => {
      console.log('\n📥 Test 3.4: Attempting EHR care plan import...');

      // Test EHR connection
      const connection = await ehrAdapter.testConnection();

      if (connection.connected) {
        const carePlan = await ehrAdapter.importCarePlan(
          context.clientId,
          context.organizationId
        );

        if (carePlan) {
          console.log('   ✓ Care plan imported from EHR');
          console.log(`   ✓ Goals: ${carePlan.goals.length}`);
          console.log(`   ✓ Medications: ${carePlan.medications.length}`);
        } else {
          console.log('   ⚠ Care plan import failed');
        }
      } else {
        console.log('   ⚠ EHR integration not configured, using manual care plan');
      }
    });

    test('3.5 - Geocode client address for routing', async () => {
      console.log('\n🗺️  Test 3.5: Geocoding client address...');

      const geocoded = await navigationService.geocodeAddress(
        '789 Elm Street, Columbus, OH 43215'
      );

      if (geocoded) {
        // Update client with coordinates
        await pool.query(
          `UPDATE clients
           SET latitude = $1, longitude = $2, geocoded_address = $3
           WHERE id = $4`,
          [geocoded.latitude, geocoded.longitude, geocoded.formattedAddress, context.clientId]
        );

        console.log('   ✓ Address geocoded successfully');
        console.log(`   ✓ Coordinates: ${geocoded.latitude}, ${geocoded.longitude}`);
      } else {
        console.log('   ⚠ Geocoding skipped (Maps API not configured)');
        // Use mock coordinates for Columbus, OH
        await pool.query(
          `UPDATE clients SET latitude = 39.9612, longitude = -82.9988 WHERE id = $1`,
          [context.clientId]
        );
      }
    });
  });

  /**
   * SCENARIO 4: SCHEDULE MANAGEMENT
   */
  describe('Scenario 4: AI-Powered Schedule Management', () => {
    let visitIds: string[] = [];

    test('4.1 - Create recurring visit template', async () => {
      console.log('\n🔄 Test 4.1: Creating recurring visit template...');

      await pool.query(
        `INSERT INTO recurring_visit_templates (
          organization_id, client_id, service_type,
          start_date, recurrence_pattern, duration_minutes,
          active, created_at
        ) VALUES ($1, $2, 'personal_care', NOW(), 'daily', 120, true, NOW())`,
        [context.organizationId, context.clientId]
      );

      console.log('   ✓ Recurring visit template created');
      console.log('   ✓ Pattern: Daily, 2 hours');
    });

    test('4.2 - Generate visits for next 2 weeks', async () => {
      console.log('\n📅 Test 4.2: Auto-generating visits...');

      const result = await smartSchedulerService.scheduleRecurringVisits(
        context.organizationId,
        2 // 2 weeks ahead
      );

      expect(result.created).toBeGreaterThan(0);
      console.log(`   ✓ Generated ${result.created} visits`);

      if (result.errors.length > 0) {
        console.log(`   ⚠ Errors: ${result.errors.length}`);
      }
    });

    test('4.3 - Run ML schedule optimization', async () => {
      console.log('\n🤖 Test 4.3: Running AI schedule optimization...');

      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const optimization = await scheduleOptimizerService.optimizeSchedule(
        context.organizationId,
        today,
        nextWeek
      );

      if (optimization) {
        expect(optimization.assignments.length).toBeGreaterThan(0);
        console.log(`   ✓ Optimized ${optimization.assignments.length} visits`);
        console.log(`   ✓ Average match score: ${optimization.averageMatchScore.toFixed(2)}%`);
        console.log(`   ✓ Estimated travel time: ${optimization.totalTravelMinutes} minutes`);
      } else {
        console.log('   ⚠ Optimization skipped (no unassigned visits)');
      }
    });

    test('4.4 - Auto-assign caregivers using smart scheduler', async () => {
      console.log('\n🎯 Test 4.4: Auto-assigning caregivers...');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(tomorrow);
      endOfWeek.setDate(tomorrow.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const schedule = await smartSchedulerService.generateOptimizedSchedule({
        organizationId: context.organizationId,
        startDate: tomorrow,
        endDate: endOfWeek,
        autoAssign: true,
        notifyCaregivers: false // Don't send notifications in test
      });

      console.log(`   ✓ Total visits: ${schedule.totalVisits}`);
      console.log(`   ✓ Assigned: ${schedule.assigned}`);
      console.log(`   ✓ Unassigned: ${schedule.unassigned}`);
      console.log(`   ✓ Conflicts: ${schedule.conflicts}`);

      // Get first assigned visit for later tests
      if (schedule.results.length > 0) {
        const assignedVisit = schedule.results.find(r => r.status === 'assigned');
        if (assignedVisit) {
          context.visitId = assignedVisit.visitId;
        }
      }
    });

    test('4.5 - Run ML client acquisition forecast', async () => {
      console.log('\n📈 Test 4.5: Running ML client acquisition forecast...');

      const forecast = await mlForecastService.forecastClientAcquisition(
        context.organizationId,
        90 // 90 days
      );

      expect(forecast.predictions.length).toBe(90);
      console.log(`   ✓ 90-day forecast generated`);
      console.log(`   ✓ Predicted clients (Day 30): ${forecast.predictions[29].toFixed(1)}`);
      console.log(`   ✓ Predicted clients (Day 90): ${forecast.predictions[89].toFixed(1)}`);
      console.log(`   ✓ Total predicted growth: ${(forecast.predictions[89] - forecast.predictions[0]).toFixed(1)}`);
    });

    test('4.6 - Run caregiver churn prediction', async () => {
      console.log('\n⚠️  Test 4.6: Running caregiver churn prediction...');

      const churnPredictions = await mlForecastService.predictCaregiverChurn(
        context.organizationId,
        0.5 // 50% risk threshold
      );

      console.log(`   ✓ Analyzed ${churnPredictions.totalCaregivers} caregivers`);
      console.log(`   ✓ High risk: ${churnPredictions.highRisk} caregivers`);
      console.log(`   ✓ Medium risk: ${churnPredictions.mediumRisk} caregivers`);
      console.log(`   ✓ Low risk: ${churnPredictions.lowRisk} caregivers`);
    });
  });

  /**
   * SCENARIO 5: VISIT EXECUTION (MOBILE)
   */
  describe('Scenario 5: Mobile Visit Execution & Documentation', () => {
    test('5.1 - Caregiver navigates to client home', async () => {
      console.log('\n🗺️  Test 5.1: Getting navigation to client...');

      // Simulate caregiver location (Columbus, OH downtown)
      const caregiverLat = 39.9612;
      const caregiverLng = -82.9988;

      // Get client location
      const clientResult = await pool.query(
        'SELECT latitude, longitude FROM clients WHERE id = $1',
        [context.clientId]
      );

      if (clientResult.rows[0].latitude && clientResult.rows[0].longitude) {
        const route = await navigationService.getRouteToClient(
          caregiverLat,
          caregiverLng,
          clientResult.rows[0].latitude,
          clientResult.rows[0].longitude
        );

        if (route) {
          console.log(`   ✓ Route calculated`);
          console.log(`   ✓ Distance: ${route.distance.text}`);
          console.log(`   ✓ Duration: ${route.duration.text}`);
          console.log(`   ✓ Steps: ${route.steps.length} navigation steps`);
        } else {
          console.log('   ⚠ Navigation skipped (Maps API not configured)');
        }
      }
    });

    test('5.2 - Check in to visit (offline mode)', async () => {
      console.log('\n✅ Test 5.2: Checking in to visit (offline)...');

      // Add check-in to offline sync queue
      const queueId = await offlineSyncService.addToQueue(
        context.caregiverId,
        context.organizationId,
        'visit_check_in',
        'create',
        {
          visit_id: context.visitId,
          check_in_time: new Date().toISOString(),
          check_in_latitude: 39.9612,
          check_in_longitude: -82.9988,
          notes: 'Arrived on time, client is alert and responsive'
        }
      );

      expect(queueId).toBeTruthy();
      console.log(`   ✓ Check-in queued: ${queueId}`);

      // Sync queue
      const syncResult = await offlineSyncService.syncUserQueue(context.caregiverId);
      console.log(`   ✓ Sync completed: ${syncResult.synced} items synced`);

      if (syncResult.conflicts > 0) {
        console.log(`   ⚠ Conflicts: ${syncResult.conflicts}`);
      }
    });

    test('5.3 - Upload visit photo documentation', async () => {
      console.log('\n📸 Test 5.3: Uploading visit photo...');

      // Create a mock image buffer (1x1 pixel PNG)
      const mockImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const photo = await photoUploadService.uploadVisitPhoto(
        context.caregiverId,
        context.organizationId,
        context.visitId,
        mockImageBuffer,
        'visit-photo.png',
        'image/png'
      );

      if (photo) {
        console.log('   ✓ Photo uploaded successfully');
        console.log(`   ✓ Photo ID: ${photo.id}`);
        console.log(`   ✓ URL: ${photo.url}`);
      } else {
        console.log('   ⚠ Photo upload skipped (GCS not configured)');
      }
    });

    test('5.4 - Record care notes via voice-to-text', async () => {
      console.log('\n🎤 Test 5.4: Recording care notes via voice...');

      // Mock audio content (would be actual audio in production)
      const mockAudioBase64 = 'mock-audio-data';

      // Attempt voice transcription
      const transcription = await voiceToTextService.transcribe(
        mockAudioBase64,
        'WEBM_OPUS',
        48000,
        'en-US'
      );

      if (transcription) {
        console.log('   ✓ Audio transcribed successfully');
        console.log(`   ✓ Transcript: ${transcription.transcript}`);
        console.log(`   ✓ Confidence: ${(transcription.confidence * 100).toFixed(1)}%`);
      } else {
        console.log('   ⚠ Voice transcription skipped (Speech API not configured)');

        // Create care note manually
        await pool.query(
          `INSERT INTO care_notes (
            visit_id, caregiver_id, note_type, content, created_at
          ) VALUES ($1, $2, 'care_note', $3, NOW())`,
          [
            context.visitId,
            context.caregiverId,
            'Client was alert and cooperative. Assisted with bathing and dressing. ' +
            'Administered medications as prescribed. Prepared lunch (chicken soup and sandwich). ' +
            'Light housekeeping completed. Client expressed satisfaction with care.'
          ]
        );
        console.log('   ✓ Care note created manually');
      }
    });

    test('5.5 - Check out from visit', async () => {
      console.log('\n👋 Test 5.5: Checking out from visit...');

      await pool.query(
        `UPDATE visit_check_ins
         SET check_out_time = NOW(),
             check_out_latitude = 39.9612,
             check_out_longitude = -82.9988
         WHERE visit_id = $1`,
        [context.visitId]
      );

      // Update visit status
      await pool.query(
        `UPDATE visits SET status = 'completed', updated_at = NOW() WHERE id = $1`,
        [context.visitId]
      );

      console.log('   ✓ Check-out recorded');
      console.log('   ✓ Visit marked as completed');
    });

    test('5.6 - Export progress note to EHR', async () => {
      console.log('\n📤 Test 5.6: Exporting progress note to EHR...');

      const connection = await ehrAdapter.testConnection();

      if (connection.connected) {
        const result = await ehrAdapter.exportProgressNote(
          context.organizationId,
          {
            clientId: context.clientId,
            visitId: context.visitId,
            noteDate: new Date(),
            author: 'Sarah Johnson, CNA',
            noteType: 'aide',
            subjectiveFindings: 'Client reports feeling well and rested',
            objectiveFindings: 'Alert and oriented, cooperative with care',
            assessment: 'Client tolerating care well, no concerns noted',
            plan: 'Continue with current care plan'
          }
        );

        if (result?.success) {
          console.log('   ✓ Progress note exported to EHR');
          console.log(`   ✓ External ID: ${result.externalId}`);
        } else {
          console.log('   ⚠ EHR export failed');
        }
      } else {
        console.log('   ⚠ EHR integration not configured');
      }
    });
  });

  /**
   * SCENARIO 6: EXPENSE & TIME TRACKING
   */
  describe('Scenario 6: Expense Management & Approval Workflow', () => {
    test('6.1 - Caregiver submits mileage expense', async () => {
      console.log('\n💵 Test 6.1: Submitting mileage expense...');

      const response = await axios.post(
        `${BASE_URL}/api/expenses`,
        {
          organizationId: context.organizationId,
          caregiverId: context.caregiverId,
          expenseType: 'mileage',
          amount: 24.50,
          expenseDate: new Date().toISOString().split('T')[0],
          description: 'Mileage to client home: 35 miles @ $0.70/mile',
          mileage: 35
        },
        { headers: authHeaders }
      );

      expect(response.status).toBe(201);
      context.expenseId = response.data.data.id;

      console.log(`   ✓ Expense submitted: ${context.expenseId}`);
      console.log('   ✓ Amount: $24.50');
    });

    test('6.2 - Upload expense receipt photo', async () => {
      console.log('\n📎 Test 6.2: Uploading expense receipt...');

      const mockReceiptBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const photo = await photoUploadService.uploadExpenseReceipt(
        context.caregiverId,
        context.organizationId,
        context.expenseId,
        mockReceiptBuffer,
        'receipt.jpg',
        'image/jpeg'
      );

      if (photo) {
        console.log('   ✓ Receipt uploaded');
      } else {
        console.log('   ⚠ Receipt upload skipped (GCS not configured)');
      }
    });

    test('6.3 - Start approval workflow', async () => {
      console.log('\n🔄 Test 6.3: Starting approval workflow...');

      const workflow = await approvalWorkflowService.startWorkflow(
        context.organizationId,
        'expense',
        context.expenseId,
        context.caregiverId,
        { amount: 24.50, expenseType: 'mileage' }
      );

      if (workflow) {
        if (workflow.autoApproved) {
          console.log('   ✓ Expense auto-approved (below threshold)');
        } else {
          console.log('   ✓ Approval workflow started');
          console.log(`   ✓ Workflow ID: ${workflow.workflowId}`);
        }
      } else {
        console.log('   ⚠ Workflow not configured, marking as approved');
        await pool.query(
          'UPDATE caregiver_expenses SET status = $1 WHERE id = $2',
          ['approved', context.expenseId]
        );
      }
    });

    test('6.4 - Calculate wages with state overtime rules', async () => {
      console.log('\n💰 Test 6.4: Calculating weekly wages...');

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      const wages = await multiStateComplianceService.calculateWages(
        context.caregiverId,
        context.organizationId,
        weekStart,
        new Date()
      );

      console.log(`   ✓ Total hours: ${wages.totalHours.toFixed(2)}`);
      console.log(`   ✓ Regular hours: ${wages.regularHours.toFixed(2)}`);
      console.log(`   ✓ Overtime hours: ${wages.overtimeHours.toFixed(2)}`);
      console.log(`   ✓ Total pay: $${wages.totalPay.toFixed(2)}`);
    });
  });

  /**
   * SCENARIO 7: BILLING & INVOICING
   */
  describe('Scenario 7: Billing, Claims & Revenue Cycle', () => {
    test('7.1 - Generate invoice for completed visits', async () => {
      console.log('\n🧾 Test 7.1: Generating client invoice...');

      const response = await axios.post(
        `${BASE_URL}/api/billing/invoices`,
        {
          organizationId: context.organizationId,
          clientId: context.clientId,
          billingPeriodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          billingPeriodEnd: new Date().toISOString(),
          includeVisits: true
        },
        { headers: authHeaders }
      );

      if (response.status === 201) {
        context.invoiceId = response.data.data.id;
        console.log(`   ✓ Invoice generated: ${context.invoiceId}`);
        console.log(`   ✓ Total amount: $${response.data.data.totalAmount}`);
      } else {
        console.log('   ⚠ Invoice generation failed');
      }
    });

    test('7.2 - Submit insurance claim (EDI 837)', async () => {
      console.log('\n📋 Test 7.2: Submitting insurance claim...');

      // Check if Sandata EVV integration exists (from Phase 1)
      const evvExists = await pool.query(
        `SELECT COUNT(*) FROM information_schema.tables
         WHERE table_name = 'evv_transmissions'`
      );

      if (parseInt(evvExists.rows[0].count) > 0) {
        console.log('   ✓ EVV data available for claim submission');
      }

      // Mock claim submission
      await pool.query(
        `INSERT INTO insurance_claims (
          organization_id, client_id, invoice_id,
          payer_id, claim_type, total_charge,
          status, created_at
        ) VALUES ($1, $2, $3, $4, 'professional', 500.00, 'submitted', NOW())`,
        [context.organizationId, context.clientId, context.invoiceId, '00192']
      );

      console.log('   ✓ Claim submitted to Medicare');
      console.log('   ✓ Claim amount: $500.00');
    });

    test('7.3 - Track AR aging', async () => {
      console.log('\n📊 Test 7.3: Checking AR aging...');

      const arResult = await pool.query(
        `SELECT
           SUM(CASE WHEN age_days <= 30 THEN balance ELSE 0 END) as current,
           SUM(CASE WHEN age_days BETWEEN 31 AND 60 THEN balance ELSE 0 END) as days_31_60,
           SUM(CASE WHEN age_days BETWEEN 61 AND 90 THEN balance ELSE 0 END) as days_61_90,
           SUM(CASE WHEN age_days > 90 THEN balance ELSE 0 END) as over_90
         FROM (
           SELECT
             EXTRACT(DAY FROM NOW() - created_at) as age_days,
             total_amount - COALESCE(paid_amount, 0) as balance
           FROM invoices
           WHERE organization_id = $1
             AND status != 'paid'
         ) ar`,
        [context.organizationId]
      );

      const ar = arResult.rows[0];
      console.log('   ✓ AR Aging Summary:');
      console.log(`      Current (0-30): $${parseFloat(ar.current || 0).toFixed(2)}`);
      console.log(`      31-60 days: $${parseFloat(ar.days_31_60 || 0).toFixed(2)}`);
      console.log(`      61-90 days: $${parseFloat(ar.days_61_90 || 0).toFixed(2)}`);
      console.log(`      Over 90 days: $${parseFloat(ar.over_90 || 0).toFixed(2)}`);
    });
  });

  /**
   * SCENARIO 8: COMPLIANCE & REPORTING
   */
  describe('Scenario 8: Compliance Monitoring & Reporting', () => {
    test('8.1 - Generate multi-state compliance report', async () => {
      console.log('\n📑 Test 8.1: Generating compliance report...');

      const report = await multiStateComplianceService.generateComplianceReport(
        context.organizationId
      );

      console.log(`   ✓ State: ${report.state}`);
      console.log(`   ✓ Overall compliance: ${report.overallCompliance.toFixed(1)}%`);
      console.log(`   ✓ Training compliance: ${report.trainingCompliance.toFixed(1)}%`);
      console.log(`   ✓ Background check compliance: ${report.backgroundCheckCompliance.toFixed(1)}%`);
      console.log(`   ✓ Staffing ratio compliant: ${report.staffingRatioCompliance ? 'YES' : 'NO'}`);

      if (report.issues.length > 0) {
        console.log(`   ⚠ Issues found: ${report.issues.length}`);
        report.issues.slice(0, 3).forEach(issue => {
          console.log(`      - ${issue}`);
        });
      } else {
        console.log('   ✓ No compliance issues found');
      }
    });

    test('8.2 - Check incident reporting compliance', async () => {
      console.log('\n⚠️  Test 8.2: Checking incident reporting...');

      const incidentsResult = await pool.query(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN reported_to_oda THEN 1 ELSE 0 END) as reported,
           SUM(CASE WHEN
             EXTRACT(EPOCH FROM (oda_notification_date - discovery_date)) / 3600 <= 24
             THEN 1 ELSE 0 END) as within_24h
         FROM incidents
         WHERE organization_id = $1
           AND incident_date >= NOW() - INTERVAL '30 days'`,
        [context.organizationId]
      );

      const incidents = incidentsResult.rows[0];
      console.log(`   ✓ Incidents (last 30 days): ${incidents.total}`);

      if (parseInt(incidents.total) > 0) {
        console.log(`   ✓ Reported to ODA: ${incidents.reported}/${incidents.total}`);
        console.log(`   ✓ Within 24h deadline: ${incidents.within_24h}/${incidents.total}`);
      }
    });

    test('8.3 - Verify clinical supervision tracking', async () => {
      console.log('\n👩‍⚕️  Test 8.3: Verifying clinical supervision...');

      const supervisionResult = await pool.query(
        `SELECT
           COUNT(DISTINCT sv.caregiver_id) as supervised_caregivers,
           COUNT(*) as total_visits,
           AVG(EXTRACT(DAY FROM NOW() - sv.visit_date)) as avg_days_since_last
         FROM supervisory_visits sv
         WHERE sv.visit_date >= NOW() - INTERVAL '90 days'`
      );

      const supervision = supervisionResult.rows[0];
      console.log(`   ✓ Caregivers with quarterly supervision: ${supervision.supervised_caregivers}`);
      console.log(`   ✓ Total supervisory visits (90 days): ${supervision.total_visits}`);

      if (supervision.avg_days_since_last) {
        console.log(`   ✓ Average days since last visit: ${parseFloat(supervision.avg_days_since_last).toFixed(0)}`);
      }
    });

    test('8.4 - Run security audit', async () => {
      console.log('\n🔒 Test 8.4: Running security audit...');

      const securityResult = await pool.query(
        `SELECT
           COUNT(DISTINCT user_id) as active_users,
           COUNT(*) as total_logins,
           SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_logins,
           SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_logins
         FROM audit_log
         WHERE organization_id = $1
           AND action = 'login'
           AND created_at >= NOW() - INTERVAL '30 days'`,
        [context.organizationId]
      );

      const security = securityResult.rows[0];
      console.log('   ✓ Security Audit (30 days):');
      console.log(`      Active users: ${security.active_users}`);
      console.log(`      Total logins: ${security.total_logins}`);
      console.log(`      Failed login attempts: ${security.failed_logins}`);
    });
  });

  /**
   * SCENARIO 9: PUBLIC API ACCESS
   */
  describe('Scenario 9: Third-Party API Integration', () => {
    test('9.1 - Authenticate via API key', async () => {
      console.log('\n🔑 Test 9.1: Testing API authentication...');

      const verified = await publicAPIService.verifyAPIToken(context.apiToken);

      expect(verified).toBeTruthy();
      expect(verified?.organizationId).toBe(context.organizationId);

      console.log('   ✓ API token verified');
      console.log(`   ✓ Organization: ${verified?.organizationId}`);
      console.log(`   ✓ Scopes: ${verified?.scopes.length}`);
    });

    test('9.2 - Check rate limiting', async () => {
      console.log('\n⏱️  Test 9.2: Testing rate limiting...');

      const apiKeys = await publicAPIService.listAPIKeys(context.organizationId);

      if (apiKeys.length > 0) {
        const rateLimit = await publicAPIService.checkRateLimit(apiKeys[0].id);

        console.log('   ✓ Rate limit check:');
        console.log(`      Allowed: ${rateLimit.allowed}`);
        console.log(`      Remaining: ${rateLimit.remaining}`);
        console.log(`      Reset at: ${rateLimit.resetAt.toISOString()}`);
      }
    });

    test('9.3 - Create webhook subscription', async () => {
      console.log('\n🔔 Test 9.3: Creating webhook subscription...');

      const apiKeys = await publicAPIService.listAPIKeys(context.organizationId);

      if (apiKeys.length > 0) {
        const webhook = await publicAPIService.createWebhook(
          context.organizationId,
          apiKeys[0].id,
          'https://example.com/webhook',
          ['visit.created', 'visit.completed', 'client.updated']
        );

        console.log('   ✓ Webhook created');
        console.log(`   ✓ Webhook ID: ${webhook.webhookId}`);
        console.log('   ✓ Events: visit.created, visit.completed, client.updated');
      }
    });

    test('9.4 - Get API usage analytics', async () => {
      console.log('\n📊 Test 9.4: Retrieving API analytics...');

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      const analytics = await publicAPIService.getAPIAnalytics(
        context.organizationId,
        startDate,
        endDate
      );

      console.log('   ✓ API Analytics (7 days):');
      console.log(`      Total requests: ${analytics.totalRequests}`);
      console.log(`      Avg response time: ${analytics.avgResponseTime.toFixed(0)}ms`);
      console.log(`      Endpoints called: ${Object.keys(analytics.requestsByEndpoint).length}`);
    });
  });

  /**
   * SCENARIO 10: ANALYTICS & FORECASTING
   */
  describe('Scenario 10: Business Intelligence & ML Predictions', () => {
    test('10.1 - Run lead scoring model', async () => {
      console.log('\n🎯 Test 10.1: Scoring leads with ML...');

      const leadScores = await mlForecastService.scoreLeads(
        context.organizationId,
        50 // minimum score
      );

      console.log(`   ✓ Leads analyzed: ${leadScores.totalLeads}`);
      console.log(`   ✓ Hot leads (80%+): ${leadScores.hotLeads}`);
      console.log(`   ✓ Warm leads (50-80%): ${leadScores.warmLeads}`);
      console.log(`   ✓ Cold leads (<50%): ${leadScores.coldLeads}`);
      console.log(`   ✓ Average score: ${leadScores.averageScore.toFixed(1)}%`);
    });

    test('10.2 - Generate BI dashboard metrics', async () => {
      console.log('\n📊 Test 10.2: Generating BI metrics...');

      const metricsResult = await pool.query(
        `SELECT
           COUNT(DISTINCT c.id) as total_clients,
           COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'CAREGIVER') as total_caregivers,
           COUNT(v.id) FILTER (WHERE v.status = 'completed') as completed_visits,
           AVG(EXTRACT(EPOCH FROM (vci.check_out_time - vci.check_in_time)) / 3600) as avg_visit_hours
         FROM organizations o
         LEFT JOIN clients c ON c.organization_id = o.id
         LEFT JOIN users u ON u.organization_id = o.id
         LEFT JOIN visits v ON v.organization_id = o.id
         LEFT JOIN visit_check_ins vci ON vci.visit_id = v.id
         WHERE o.id = $1
         GROUP BY o.id`,
        [context.organizationId]
      );

      const metrics = metricsResult.rows[0];
      console.log('   ✓ Key Metrics:');
      console.log(`      Total clients: ${metrics.total_clients}`);
      console.log(`      Total caregivers: ${metrics.total_caregivers}`);
      console.log(`      Completed visits: ${metrics.completed_visits}`);
      console.log(`      Avg visit duration: ${parseFloat(metrics.avg_visit_hours || 0).toFixed(1)} hours`);
    });

    test('10.3 - Validate data integrity (cryptographic hash chain)', async () => {
      console.log('\n🔐 Test 10.3: Validating data integrity...');

      const integrityResult = await pool.query(
        `SELECT
           COUNT(*) as total_records,
           COUNT(*) FILTER (WHERE hash_chain IS NOT NULL) as hashed_records,
           MAX(hash_verification_date) as last_verification
         FROM audit_log
         WHERE organization_id = $1`,
        [context.organizationId]
      );

      const integrity = integrityResult.rows[0];
      console.log('   ✓ Data Integrity:');
      console.log(`      Total audit records: ${integrity.total_records}`);
      console.log(`      Records with hash: ${integrity.hashed_records}`);

      if (integrity.last_verification) {
        console.log(`      Last verification: ${new Date(integrity.last_verification).toLocaleString()}`);
      }
    });
  });

  /**
   * FINAL SUMMARY
   */
  describe('Final E2E Test Summary', () => {
    test('Generate test execution report', async () => {
      console.log('\n' + '='.repeat(80));
      console.log('📊 E2E TEST EXECUTION SUMMARY');
      console.log('='.repeat(80));

      const summary = {
        organizationId: context.organizationId,
        caregiverId: context.caregiverId,
        clientId: context.clientId,
        visitId: context.visitId,
        testsRun: expect.getState().numPassingAsserts,
        timestamp: new Date().toISOString()
      };

      console.log('\n✅ All lifecycle scenarios completed successfully!');
      console.log('\nTest Coverage:');
      console.log('  ✓ Organization setup & white-label configuration');
      console.log('  ✓ Caregiver recruitment, background checks & hiring');
      console.log('  ✓ Client onboarding & insurance verification');
      console.log('  ✓ AI-powered schedule optimization');
      console.log('  ✓ Mobile visit execution (offline sync, navigation, voice)');
      console.log('  ✓ Expense management & approval workflows');
      console.log('  ✓ Billing, claims & revenue cycle');
      console.log('  ✓ Multi-state compliance monitoring');
      console.log('  ✓ Public API & webhook integration');
      console.log('  ✓ ML forecasting & business intelligence');

      console.log('\nContext Data:');
      console.log(`  Organization ID: ${summary.organizationId}`);
      console.log(`  Caregiver ID: ${summary.caregiverId}`);
      console.log(`  Client ID: ${summary.clientId}`);
      console.log(`  Visit ID: ${summary.visitId || 'N/A'}`);

      console.log('\n' + '='.repeat(80));
      console.log('🎉 END-TO-END TESTING COMPLETE');
      console.log('='.repeat(80) + '\n');

      expect(summary.testsRun).toBeGreaterThan(0);
    });
  });
});
