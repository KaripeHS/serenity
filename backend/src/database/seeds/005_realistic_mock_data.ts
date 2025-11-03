/**
 * Realistic Mock Data Seeder for Serenity ERP
 * Based on Manifesto v2.3 requirements
 *
 * Generates:
 * - 3 Pods (Dayton, Columbus, Cincinnati)
 * - 30 Caregivers (10 per pod) with realistic SPI scores
 * - 100 Patients (Medicaid/Medicare/Private mix)
 * - 2 weeks of EVV records (~2,000 visits)
 * - Mock Sandata transactions
 * - 20 Job requisitions
 * - 50 Applicants in various stages
 */

import { getDbClient } from '../client';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

// Ohio cities for realistic addresses
const OHIO_CITIES = [
  { name: 'Dayton', zip: '45402', county: 'Montgomery' },
  { name: 'Columbus', zip: '43215', county: 'Franklin' },
  { name: 'Cincinnati', zip: '45202', county: 'Hamilton' }
];

// Caregiver first names
const FIRST_NAMES = [
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica',
  'James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph',
  'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley',
  'Christopher', 'Matthew', 'Daniel', 'Anthony', 'Donald', 'Mark', 'Paul', 'Steven'
];

// Last names
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White'
];

// Generate realistic phone number
function generatePhone(): string {
  return `(614) 555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
}

// Generate realistic Medicaid ID
function generateMedicaidId(): string {
  return `OH${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
}

// Generate realistic address
function generateAddress(city: typeof OHIO_CITIES[0]): string {
  const street = `${Math.floor(Math.random() * 9999) + 1} ${['Main', 'Oak', 'Maple', 'Cedar', 'Pine'][Math.floor(Math.random() * 5)]} St`;
  return `${street}, ${city.name}, OH ${city.zip}`;
}

// Generate GPS coordinates near a city
function generateGPS(city: typeof OHIO_CITIES[0]): { latitude: number; longitude: number } {
  const bases = {
    'Dayton': { lat: 39.7589, lng: -84.1916 },
    'Columbus': { lat: 39.9612, lng: -82.9988 },
    'Cincinnati': { lat: 39.1031, lng: -84.5120 }
  };
  const base = bases[city.name as keyof typeof bases];
  return {
    latitude: base.lat + (Math.random() - 0.5) * 0.1, // ~5 mile radius
    longitude: base.lng + (Math.random() - 0.5) * 0.1
  };
}

export async function seedRealisticMockData() {
  const db = getDbClient();

  console.log('🌱 Serenity ERP - Realistic Mock Data Seeder');
  console.log('===========================================\n');

  try {
    // 1. Create 3 Pods
    console.log('📦 Creating 3 Pods...');
    const pods = [];
    for (let i = 0; i < 3; i++) {
      const city = OHIO_CITIES[i];
      if (!city) {
        throw new Error(`Missing city data at index ${i}`);
      }
      const podId = uuidv4();
      await db.insert('pods', {
        id: podId,
        organization_id: DEFAULT_ORG_ID,
        name: `Pod-${i + 1}`,
        code: `POD${i + 1}`,
        city: city.name,
        state: 'OH',
        zip_code: city.zip,
        capacity: 35,
        team_lead_id: null, // Will assign after creating caregivers
        status: 'active',
        created_at: new Date('2024-01-01'),
        updated_at: new Date()
      });
      pods.push({ id: podId, city, name: `Pod-${i + 1}` });
      console.log(`  ✓ Created ${city.name} Pod (${podId})`);
    }

    // 2. Create 30 Caregivers (10 per pod)
    console.log('\n👥 Creating 30 Caregivers...');
    const caregivers = [];
    let caregiverIndex = 0;

    for (const pod of pods) {
      for (let i = 0; i < 10; i++) {
        // Role distribution: 70% HHA, 20% LPN, 10% RN
        let role: string;
        if (i < 7) role = 'HHA';
        else if (i < 9) role = 'LPN';
        else role = 'RN';

        // SPI distribution: 3 perfect (95-100), 4 good (80-94), 2 struggling (60-79), 1 probation (<60)
        let spi: number;
        if (i < 3) spi = Math.floor(Math.random() * 6) + 95; // 95-100
        else if (i < 7) spi = Math.floor(Math.random() * 15) + 80; // 80-94
        else if (i < 9) spi = Math.floor(Math.random() * 20) + 60; // 60-79
        else spi = Math.floor(Math.random() * 20) + 40; // 40-59

        const caregiverId = uuidv4();
        const firstName = FIRST_NAMES[caregiverIndex % FIRST_NAMES.length] || 'John';
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)] || 'Doe';

        await db.insert('caregivers', {
          id: caregiverId,
          organization_id: DEFAULT_ORG_ID,
          pod_id: pod.id,
          first_name: firstName,
          last_name: lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@serenitycare.com`,
          phone: generatePhone(),
          address: generateAddress(pod.city),
          role: role,
          hire_date: new Date('2024-01-15'),
          status: 'active',
          spi_current: spi,
          spi_rolling_12mo: spi,
          earned_ot_eligible: spi >= 80,
          created_at: new Date('2024-01-15'),
          updated_at: new Date()
        });

        caregivers.push({
          id: caregiverId,
          podId: pod.id,
          name: `${firstName} ${lastName}`,
          role,
          spi
        });

        caregiverIndex++;
      }
      console.log(`  ✓ Created 10 caregivers for ${pod.name} (${pod.city?.name || 'Unknown'})`);
    }

    // Assign first caregiver of each pod as Pod Lead
    for (let i = 0; i < pods.length; i++) {
      const podLead = caregivers[i * 10];
      const podData = pods[i];
      if (podLead && podData) {
        await db.query(
          'UPDATE pods SET team_lead_id = $1 WHERE id = $2',
          [podLead.id, podData.id]
        );
        console.log(`  ✓ Assigned ${podLead.name} as ${podData.name} Lead`);
      }
    }

    // 3. Create 100 Patients (30-35 per pod)
    console.log('\n🏥 Creating 100 Patients...');
    const patients = [];
    let patientIndex = 0;

    for (const pod of pods) {
      const patientCount = 30 + Math.floor(Math.random() * 6); // 30-35 patients per pod

      for (let i = 0; i < patientCount; i++) {
        // Payer distribution: 80% Medicaid, 15% Medicare, 5% Private
        let payer: string;
        const rand = Math.random();
        if (rand < 0.80) payer = 'Medicaid';
        else if (rand < 0.95) payer = 'Medicare';
        else payer = 'Private';

        // Assign primary caregiver from same pod
        const caregiver = caregivers[Math.floor(patientIndex / 3.3) % 10 + (pods.indexOf(pod) * 10)];
        const primaryCaregiverId = caregiver ? caregiver.id : caregivers[0]?.id;

        const patientId = uuidv4();
        const firstName = FIRST_NAMES[patientIndex % FIRST_NAMES.length] || 'Jane';
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)] || 'Smith';

        await db.insert('clients', {
          id: patientId,
          organization_id: DEFAULT_ORG_ID,
          pod_id: pod.id,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: new Date(1940 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), 1),
          address: generateAddress(pod.city!),
          phone: generatePhone(),
          payer: payer,
          medicaid_id: payer === 'Medicaid' ? generateMedicaidId() : null,
          medicare_id: payer === 'Medicare' ? `MBI${String(Math.floor(Math.random() * 10000000000)).padStart(10, '0')}` : null,
          primary_caregiver_id: primaryCaregiverId,
          status: 'active',
          created_at: new Date('2024-01-01'),
          updated_at: new Date()
        });

        patients.push({
          id: patientId,
          podId: pod.id,
          name: `${firstName} ${lastName}`,
          caregiverId: primaryCaregiverId,
          address: generateAddress(pod.city!),
          gps: generateGPS(pod.city!)
        });

        patientIndex++;
      }
      console.log(`  ✓ Created ${patientCount} patients for ${pod.name}`);
    }

    console.log(`  Total: ${patients.length} patients created`);

    // 4. Create 2 weeks of EVV records (~2,000 visits)
    console.log('\n📅 Creating 2 weeks of EVV records...');
    const evvRecords = [];
    const sandataTransactions = [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14); // 2 weeks ago

    let totalVisits = 0;

    for (let day = 0; day < 14; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day);

      // Each patient gets 1-2 visits per day
      for (const patient of patients) {
        const visitsToday = Math.random() < 0.7 ? 1 : 2; // 70% one visit, 30% two visits

        for (let v = 0; v < visitsToday; v++) {
          const shiftId = uuidv4();
          const visitId = uuidv4();

          // Shift timing: morning (8-10am) or afternoon (2-4pm)
          const isMorning = v === 0;
          const startHour = isMorning ? 8 : 14;
          const scheduledStart = new Date(currentDate);
          scheduledStart.setHours(startHour, 0, 0, 0);
          const scheduledEnd = new Date(scheduledStart);
          scheduledEnd.setHours(scheduledStart.getHours() + 1.5); // 1.5 hour visits

          // Visit quality distribution: 85% perfect, 10% late, 3% missing clock-out, 2% GPS issue
          const qualityRand = Math.random();
          let clockInDelay = 0;
          let hasClockOut = true;
          let gpsAccurate = true;

          if (qualityRand < 0.85) {
            // Perfect visit
            clockInDelay = Math.floor(Math.random() * 5); // 0-5 min early/on-time
          } else if (qualityRand < 0.95) {
            // Late clock-in
            clockInDelay = Math.floor(Math.random() * 30) + 10; // 10-40 min late
          } else if (qualityRand < 0.98) {
            // Missing clock-out
            hasClockOut = false;
          } else {
            // GPS issue
            gpsAccurate = false;
          }

          const actualClockIn = new Date(scheduledStart);
          actualClockIn.setMinutes(actualClockIn.getMinutes() + clockInDelay);

          const actualClockOut = hasClockOut ? new Date(scheduledEnd) : null;
          if (actualClockOut) {
            actualClockOut.setMinutes(actualClockOut.getMinutes() + Math.floor(Math.random() * 10) - 5); // ±5 min variance
          }

          // GPS coordinates
          const gps = gpsAccurate ? patient.gps : {
            latitude: patient.gps.latitude + (Math.random() - 0.5) * 0.02, // Off by ~1 mile
            longitude: patient.gps.longitude + (Math.random() - 0.5) * 0.02
          };

          // Create shift
          await db.insert('shifts', {
            id: shiftId,
            organization_id: DEFAULT_ORG_ID,
            patient_id: patient.id,
            caregiver_id: patient.caregiverId,
            pod_id: patient.podId,
            scheduled_start: scheduledStart,
            scheduled_end: scheduledEnd,
            service_code: 'T1019', // Personal care services
            status: hasClockOut ? 'completed' : 'in_progress',
            created_at: scheduledStart,
            updated_at: new Date()
          });

          // EVV validation status
          const isValid = clockInDelay < 15 && hasClockOut && gpsAccurate;
          const validationErrors = [];
          if (clockInDelay >= 15) validationErrors.push('Late clock-in (>15 minutes)');
          if (!hasClockOut) validationErrors.push('Missing clock-out');
          if (!gpsAccurate) validationErrors.push('GPS outside geofence');

          // Create EVV record
          await db.insert('evv_records', {
            id: visitId,
            shift_id: shiftId,
            patient_id: patient.id,
            caregiver_id: patient.caregiverId,
            clock_in: actualClockIn,
            clock_out: actualClockOut,
            clock_in_latitude: gps.latitude,
            clock_in_longitude: gps.longitude,
            clock_out_latitude: actualClockOut ? gps.latitude + (Math.random() - 0.5) * 0.001 : null,
            clock_out_longitude: actualClockOut ? gps.longitude + (Math.random() - 0.5) * 0.001 : null,
            method: 'mobile_app',
            compliance_status: isValid ? 'compliant' : 'non_compliant',
            validation_errors: validationErrors.length > 0 ? JSON.stringify(validationErrors) : null,
            created_at: actualClockIn,
            updated_at: actualClockOut || actualClockIn
          });

          // Sandata transaction
          if (hasClockOut) {
            const transactionId = uuidv4();

            // Sandata acceptance distribution: 90% accepted, 5% pending, 5% rejected
            const sandataRand = Math.random();
            let status: string, responseCode: string | null;
            if (sandataRand < 0.90) {
              status = 'ack';
              responseCode = '000'; // Success
            } else if (sandataRand < 0.95) {
              status = 'pending';
              responseCode = null;
            } else {
              status = 'error';
              responseCode = isValid ? 'E105' : 'E201'; // E105: Duplicate, E201: Missing required field
            }

            // Only create Sandata transaction if we have a clock-out time
            if (actualClockOut) {
              await db.insert('sandata_transactions', {
                id: transactionId,
                organization_id: DEFAULT_ORG_ID,
                transaction_type: 'visit',
                entity_id: visitId,
                request_payload: JSON.stringify({ visitId, patientId: patient.id, caregiverId: patient.caregiverId }),
                request_timestamp: new Date(actualClockOut),
                response_status: status,
                response_code: responseCode,
                response_payload: status === 'ack' ? JSON.stringify({ status: 'accepted', transactionId }) : null,
                response_timestamp: status !== 'pending' ? new Date(actualClockOut.getTime() + 60000) : null, // 1 min later
                retry_count: 0,
                max_retries: 3,
                resolved: status === 'ack',
                created_at: new Date(actualClockOut),
                updated_at: new Date()
              });
              sandataTransactions.push({ id: transactionId, status });
            }
          }

          evvRecords.push({ id: visitId, isValid, hasClockOut });
          totalVisits++;
        }
      }
    }

    console.log(`  ✓ Created ${totalVisits} EVV records over 14 days`);
    const validCount = evvRecords.filter(e => e.isValid && e.hasClockOut).length;
    console.log(`  Valid EVV: ${validCount}/${totalVisits} (${Math.round((validCount / totalVisits) * 100)}%)`);
    const sandataAccepted = sandataTransactions.filter(t => t.status === 'ack').length;
    console.log(`  Sandata accepted: ${sandataAccepted}/${sandataTransactions.length} (${Math.round((sandataAccepted / sandataTransactions.length) * 100)}%)`);

    // 5. Create 20 Job Requisitions
    console.log('\n💼 Creating 20 Job Requisitions...');
    const jobRequisitions = [
      { title: 'Home Health Aide (HHA)', type: 'HHA', status: 'active', payRange: '$15-18/hour' },
      { title: 'Home Health Aide (HHA) - Weekend Shift', type: 'HHA', status: 'active', payRange: '$17-20/hour' },
      { title: 'Licensed Practical Nurse (LPN)', type: 'LPN', status: 'active', payRange: '$22-26/hour' },
      { title: 'Registered Nurse (RN)', type: 'RN', status: 'active', payRange: '$28-35/hour' },
      { title: 'Pod Lead (HHA/LPN)', type: 'Pod Lead', status: 'active', payRange: '$20-24/hour' },
      { title: 'Home Health Aide (HHA) - Dayton', type: 'HHA', status: 'filled', payRange: '$15-18/hour' },
      { title: 'Home Health Aide (HHA) - Columbus', type: 'HHA', status: 'filled', payRange: '$15-18/hour' },
      { title: 'Licensed Practical Nurse (LPN) - Cincinnati', type: 'LPN', status: 'filled', payRange: '$22-26/hour' },
      { title: 'Registered Nurse (RN) - Dayton', type: 'RN', status: 'filled', payRange: '$28-35/hour' },
      { title: 'Home Health Aide (HHA) - PRN', type: 'HHA', status: 'filled', payRange: '$16-19/hour' },
      { title: 'Licensed Practical Nurse (LPN) - PRN', type: 'LPN', status: 'filled', payRange: '$24-28/hour' },
      { title: 'Registered Nurse (RN) - Weekend', type: 'RN', status: 'filled', payRange: '$30-37/hour' },
      { title: 'Pod Lead (Experienced)', type: 'Pod Lead', status: 'filled', payRange: '$22-26/hour' },
      { title: 'Home Health Aide (HHA) - Full Time', type: 'HHA', status: 'filled', payRange: '$15-18/hour' },
      { title: 'Licensed Practical Nurse (LPN) - Full Time', type: 'LPN', status: 'filled', payRange: '$22-26/hour' },
      { title: 'Home Health Aide (HHA) - Part Time', type: 'HHA', status: 'draft', payRange: '$15-18/hour' },
      { title: 'Registered Nurse (RN) - Part Time', type: 'RN', status: 'draft', payRange: '$28-35/hour' },
      { title: 'Pod Lead (Columbus)', type: 'Pod Lead', status: 'draft', payRange: '$20-24/hour' },
      { title: 'Licensed Practical Nurse (LPN) - Night Shift', type: 'LPN', status: 'draft', payRange: '$24-28/hour' },
      { title: 'Home Health Aide (HHA) - Bilingual', type: 'HHA', status: 'draft', payRange: '$16-19/hour' }
    ];

    for (const job of jobRequisitions) {
      await db.insert('job_requisitions', {
        id: uuidv4(),
        organization_id: DEFAULT_ORG_ID,
        title: job.title,
        job_type: job.type,
        description: `Provide compassionate ${job.type} care to clients in their homes across Ohio.`,
        pay_range: job.payRange,
        requirements: JSON.stringify(['Active license/certification', 'Clean background check', 'Reliable transportation', 'Excellent communication skills']),
        status: job.status,
        posted_at: job.status === 'active' ? new Date('2024-10-01') : new Date('2024-11-01'),
        location: 'Ohio (multiple locations)',
        created_at: new Date('2024-09-15'),
        updated_at: new Date()
      });
    }
    console.log(`  ✓ Created 20 job requisitions (5 active, 10 filled, 5 draft)`);

    // 6. Create 50 Applicants
    console.log('\n📝 Creating 50 Applicants...');
    const stages = [
      { stage: 'application_received', status: 'new', count: 10 },
      { stage: 'screening', status: 'screening', count: 15 },
      { stage: 'interviewing', status: 'interviewing', count: 10 },
      { stage: 'hired', status: 'hired', count: 10 },
      { stage: 'rejected', status: 'rejected', count: 5 }
    ];

    let applicantIndex = 0;
    for (const stageGroup of stages) {
      for (let i = 0; i < stageGroup.count; i++) {
        const firstName = FIRST_NAMES[applicantIndex % FIRST_NAMES.length] || 'Alex';
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)] || 'Johnson';
        const randomCity = OHIO_CITIES[Math.floor(Math.random() * 3)];

        await db.insert('applicants', {
          id: uuidv4(),
          organization_id: DEFAULT_ORG_ID,
          first_name: firstName,
          last_name: lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${applicantIndex}@email.com`,
          phone: generatePhone(),
          address: randomCity ? generateAddress(randomCity) : '123 Main St, Columbus, OH 43215',
          position_applied_for: ['HHA', 'LPN', 'RN'][Math.floor(Math.random() * 3)],
          application_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
          source: ['website', 'referral', 'indeed', 'facebook'][Math.floor(Math.random() * 4)],
          availability: ['full-time', 'part-time', 'prn'][Math.floor(Math.random() * 3)],
          has_license: Math.random() < 0.8, // 80% have license
          status: stageGroup.status,
          current_stage: stageGroup.stage,
          ai_screening_score: Math.floor(Math.random() * 30) + 70, // 70-100
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          updated_at: new Date()
        });

        applicantIndex++;
      }
      console.log(`  ✓ Created ${stageGroup.count} applicants in stage: ${stageGroup.stage}`);
    }

    console.log('\n✅ Mock Data Seeding Complete!\n');
    console.log('📊 Summary:');
    console.log(`  • 3 Pods: ${pods.map(p => p.name).join(', ')}`);
    console.log(`  • 30 Caregivers (10 per pod)`);
    console.log(`  • ${patients.length} Patients`);
    console.log(`  • ${totalVisits} EVV Records (${validCount} valid)`);
    console.log(`  • ${sandataTransactions.length} Sandata Transactions (${sandataAccepted} accepted)`);
    console.log(`  • 20 Job Requisitions`);
    console.log(`  • 50 Applicants\n`);

    console.log('🚀 Next Steps:');
    console.log('  • Start backend: cd backend && npm run dev');
    console.log('  • View Morning Check-In: http://localhost:3001/operations/morning-check-in');
    console.log('  • View HR Applications: http://localhost:3001/hr/applications');
    console.log('  • View Careers Portal: http://localhost:3000/careers\n');

  } catch (error) {
    console.error('❌ Error seeding mock data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedRealisticMockData()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
