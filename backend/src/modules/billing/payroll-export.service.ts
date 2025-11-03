/**
 * Payroll Export Service
 *
 * Exports caregiver hours for payroll processing (ADP/Gusto).
 * Includes regular hours, overtime hours, and Earned OT hours.
 *
 * Export Format: CSV compatible with ADP/Gusto
 *
 * Columns:
 * - Employee ID
 * - First Name
 * - Last Name
 * - Regular Hours
 * - Overtime Hours (>40hrs/week)
 * - Earned OT Hours (SPI >= 80)
 * - Total Hours
 * - Pay Period Start
 * - Pay Period End
 *
 * @module modules/billing/payroll-export
 */

interface EVVRecord {
  id: string;
  caregiverId: string;
  clockInTime: Date;
  clockOutTime: Date;
  serviceDate: Date;
  billableUnits: number;
}

interface CaregiverHours {
  caregiverId: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  regularHours: number;
  overtimeHours: number;
  earnedOTHours: number;
  totalHours: number;
  spiScore: number;
  weeklyBreakdown: Array<{
    week: string;
    hours: number;
  }>;
}

interface PayrollReport {
  payPeriodStart: string;
  payPeriodEnd: string;
  totalCaregivers: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalEarnedOTHours: number;
  totalHours: number;
  caregivers: CaregiverHours[];
}

/**
 * Payroll Export Service
 */
export class PayrollExportService {
  /**
   * Generate payroll report for date range
   */
  async generatePayrollReport(
    startDate: Date,
    endDate: Date,
    organizationId: string
  ): Promise<PayrollReport> {
    // TODO: Query EVV records from database
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     e.id,
    //     e.caregiver_id,
    //     e.clock_in_time,
    //     e.clock_out_time,
    //     e.service_date,
    //     e.billable_units,
    //     c.first_name,
    //     c.last_name,
    //     c.employee_id
    //   FROM evv_records e
    //   JOIN caregivers c ON c.id = e.caregiver_id
    //   WHERE e.service_date >= $1
    //     AND e.service_date <= $2
    //     AND e.clock_out_time IS NOT NULL
    //     AND e.organization_id = $3
    //   ORDER BY e.caregiver_id, e.service_date, e.clock_in_time
    // `, [startDate, endDate, organizationId]);

    // Mock EVV records for development
    const mockRecords: Array<EVVRecord & { caregiverName: string; employeeId: string }> = [
      {
        id: 'evv-001',
        caregiverId: 'cg-001',
        caregiverName: 'Mary Smith',
        employeeId: 'EMP001',
        clockInTime: new Date('2025-10-28T08:00:00'),
        clockOutTime: new Date('2025-10-28T16:00:00'),
        serviceDate: new Date('2025-10-28'),
        billableUnits: 32
      },
      {
        id: 'evv-002',
        caregiverId: 'cg-001',
        caregiverName: 'Mary Smith',
        employeeId: 'EMP001',
        clockInTime: new Date('2025-10-29T08:00:00'),
        clockOutTime: new Date('2025-10-29T16:00:00'),
        serviceDate: new Date('2025-10-29'),
        billableUnits: 32
      }
    ];

    // Group by caregiver
    const caregiverMap = new Map<string, CaregiverHours>();

    for (const record of mockRecords) {
      const hours = this.calculateHours(record.clockInTime, record.clockOutTime);

      if (!caregiverMap.has(record.caregiverId)) {
        // TODO: Get SPI score from database
        const spiScore = 85; // Mock

        caregiverMap.set(record.caregiverId, {
          caregiverId: record.caregiverId,
          firstName: record.caregiverName.split(' ')[0],
          lastName: record.caregiverName.split(' ')[1],
          employeeId: record.employeeId,
          regularHours: 0,
          overtimeHours: 0,
          earnedOTHours: 0,
          totalHours: 0,
          spiScore,
          weeklyBreakdown: []
        });
      }

      const caregiver = caregiverMap.get(record.caregiverId)!;
      caregiver.totalHours += hours;
    }

    // Calculate regular vs OT hours for each caregiver
    for (const caregiver of caregiverMap.values()) {
      const { regular, overtime, earnedOT } = this.classifyHours(
        caregiver.totalHours,
        caregiver.spiScore,
        startDate,
        endDate
      );

      caregiver.regularHours = regular;
      caregiver.overtimeHours = overtime;
      caregiver.earnedOTHours = earnedOT;
    }

    const caregivers = Array.from(caregiverMap.values());

    const report: PayrollReport = {
      payPeriodStart: startDate.toISOString().split('T')[0],
      payPeriodEnd: endDate.toISOString().split('T')[0],
      totalCaregivers: caregivers.length,
      totalRegularHours: caregivers.reduce((sum, c) => sum + c.regularHours, 0),
      totalOvertimeHours: caregivers.reduce((sum, c) => sum + c.overtimeHours, 0),
      totalEarnedOTHours: caregivers.reduce((sum, c) => sum + c.earnedOTHours, 0),
      totalHours: caregivers.reduce((sum, c) => sum + c.totalHours, 0),
      caregivers: caregivers.sort((a, b) => a.lastName.localeCompare(b.lastName))
    };

    return report;
  }

  /**
   * Calculate hours between clock in and clock out
   */
  private calculateHours(clockIn: Date, clockOut: Date): number {
    const milliseconds = clockOut.getTime() - clockIn.getTime();
    return milliseconds / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Classify hours into regular, overtime, and earned OT
   */
  private classifyHours(
    totalHours: number,
    spiScore: number,
    startDate: Date,
    endDate: Date
  ): { regular: number; overtime: number; earnedOT: number } {
    const payPeriodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksInPeriod = Math.ceil(payPeriodDays / 7);

    // Standard OT: Hours over 40/week
    const regularWeeklyHours = 40;
    const maxRegularHours = regularWeeklyHours * weeksInPeriod;

    let regular = Math.min(totalHours, maxRegularHours);
    let overtime = Math.max(0, totalHours - maxRegularHours);
    let earnedOT = 0;

    // Earned OT: Eligible if SPI >= 80
    if (spiScore >= 80) {
      // Award up to 10% of regular hours as Earned OT
      const maxEarnedOT = regular * 0.10;
      earnedOT = Math.min(overtime, maxEarnedOT);
      overtime = Math.max(0, overtime - earnedOT);
    }

    return {
      regular: Math.round(regular * 100) / 100,
      overtime: Math.round(overtime * 100) / 100,
      earnedOT: Math.round(earnedOT * 100) / 100
    };
  }

  /**
   * Export payroll report as CSV
   */
  async exportAsCSV(report: PayrollReport): Promise<string> {
    const header = [
      'Employee ID',
      'First Name',
      'Last Name',
      'Regular Hours',
      'Overtime Hours',
      'Earned OT Hours',
      'Total Hours',
      'Pay Period Start',
      'Pay Period End',
      'SPI Score'
    ];

    const rows = report.caregivers.map(caregiver => [
      caregiver.employeeId,
      caregiver.firstName,
      caregiver.lastName,
      caregiver.regularHours.toFixed(2),
      caregiver.overtimeHours.toFixed(2),
      caregiver.earnedOTHours.toFixed(2),
      caregiver.totalHours.toFixed(2),
      report.payPeriodStart,
      report.payPeriodEnd,
      caregiver.spiScore.toString()
    ]);

    const csvLines = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ];

    return csvLines.join('\n');
  }

  /**
   * Export payroll report as ADP format
   */
  async exportAsADP(report: PayrollReport): Promise<string> {
    // ADP-specific format
    const header = [
      'Co Code',
      'Batch ID',
      'File #',
      'Reg Hours',
      'O/T Hours',
      'Earnings 3 Hours', // Earned OT
      'Earnings 3 Code'   // Custom code for Earned OT
    ];

    const rows = report.caregivers.map(caregiver => [
      '001',                                    // Company Code
      report.payPeriodEnd.replace(/-/g, ''),    // Batch ID (date)
      caregiver.employeeId,                     // File # (Employee ID)
      caregiver.regularHours.toFixed(2),        // Regular Hours
      caregiver.overtimeHours.toFixed(2),       // Overtime Hours
      caregiver.earnedOTHours.toFixed(2),       // Earned OT Hours
      'EOT'                                     // Earned OT Code
    ]);

    const csvLines = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ];

    return csvLines.join('\n');
  }

  /**
   * Export payroll report as Gusto format
   */
  async exportAsGusto(report: PayrollReport): Promise<string> {
    // Gusto-specific format
    const header = [
      'Employee ID',
      'First Name',
      'Last Name',
      'Regular Hours',
      'Overtime Hours',
      'Bonus Hours', // Earned OT as bonus
      'Pay Period Start Date',
      'Pay Period End Date'
    ];

    const rows = report.caregivers.map(caregiver => [
      caregiver.employeeId,
      caregiver.firstName,
      caregiver.lastName,
      caregiver.regularHours.toFixed(2),
      caregiver.overtimeHours.toFixed(2),
      caregiver.earnedOTHours.toFixed(2),
      report.payPeriodStart,
      report.payPeriodEnd
    ]);

    const csvLines = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ];

    return csvLines.join('\n');
  }
}

// Singleton instance
let instance: PayrollExportService | null = null;

export function getPayrollExportService(): PayrollExportService {
  if (!instance) {
    instance = new PayrollExportService();
  }
  return instance;
}
