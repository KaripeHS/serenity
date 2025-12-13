import { getDbClient } from '../database/client';

interface CreateEmployerData {
  clientId: string;
  fmsProviderId?: string;
  employerOfRecordName: string;
  employerOfRecordRelationship: string;
  taxId?: string;
  fmsAccountNumber?: string;
  effectiveDate: string;
  authorizedMonthlyBudget?: number;
  notes?: string;
}

interface UpdateEmployerData {
  fmsProviderId?: string;
  employerOfRecordName?: string;
  employerOfRecordRelationship?: string;
  taxId?: string;
  fmsAccountNumber?: string;
  authorizedMonthlyBudget?: number;
  status?: 'active' | 'inactive' | 'pending' | 'terminated';
  terminationDate?: string;
  notes?: string;
}

interface CreateWorkerData {
  employerId: string;
  caregiverId?: string;
  workerFirstName: string;
  workerLastName: string;
  workerSsn?: string;
  hourlyRate: number;
  maxHoursPerWeek?: number;
  effectiveDate: string;
  notes?: string;
}

interface UpdateWorkerData {
  hourlyRate?: number;
  maxHoursPerWeek?: number;
  status?: 'active' | 'inactive' | 'terminated';
  terminationDate?: string;
  notes?: string;
}

interface CreateTimesheetData {
  workerId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  entries: TimesheetEntry[];
}

interface TimesheetEntry {
  serviceDate: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  serviceCode?: string;
  notes?: string;
}

interface TimesheetFilters {
  employerId?: string;
  workerId?: string;
  status?: string;
  payPeriodStart?: string;
  payPeriodEnd?: string;
}

export class ConsumerDirectedService {
  // ==========================================
  // Consumer-Directed Employer Management
  // ==========================================

  async getEmployers(organizationId: string, status?: string): Promise<any[]> {
    const db = getDbClient();
    const params: any[] = [organizationId];
    let paramIndex = 2;

    let query = `
      SELECT
        e.id,
        e.client_id,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.medicaid_id as client_medicaid_id,
        e.fms_provider_id,
        e.employer_of_record_name,
        e.employer_of_record_relationship,
        e.fms_account_number,
        e.effective_date,
        e.termination_date,
        e.authorized_monthly_budget,
        e.status,
        e.notes,
        e.created_at,
        (
          SELECT COUNT(*)
          FROM consumer_directed_workers w
          WHERE w.employer_id = e.id AND w.status = 'active'
        ) as active_workers_count,
        (
          SELECT SUM(total_hours)
          FROM consumer_directed_timesheets t
          JOIN consumer_directed_workers w ON w.id = t.worker_id
          WHERE w.employer_id = e.id
            AND t.status = 'approved'
            AND t.pay_period_start >= DATE_TRUNC('month', CURRENT_DATE)
        ) as mtd_hours
      FROM consumer_directed_employers e
      JOIN clients c ON c.id = e.client_id
      WHERE c.organization_id = $1
    `;

    if (status) {
      query += ` AND e.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY e.created_at DESC`;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      clientId: row.client_id,
      clientName: `${row.client_first_name} ${row.client_last_name}`,
      clientMedicaidId: row.client_medicaid_id,
      fmsProviderId: row.fms_provider_id,
      employerOfRecordName: row.employer_of_record_name,
      employerOfRecordRelationship: row.employer_of_record_relationship,
      fmsAccountNumber: row.fms_account_number,
      effectiveDate: row.effective_date,
      terminationDate: row.termination_date,
      authorizedMonthlyBudget: row.authorized_monthly_budget ? parseFloat(row.authorized_monthly_budget) : null,
      status: row.status,
      notes: row.notes,
      activeWorkersCount: parseInt(row.active_workers_count),
      mtdHours: parseFloat(row.mtd_hours) || 0,
      createdAt: row.created_at
    }));
  }

  async getEmployerById(employerId: string, organizationId: string): Promise<any | null> {
    const db = getDbClient();

    const result = await db.query(`
      SELECT
        e.id,
        e.client_id,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.medicaid_id as client_medicaid_id,
        e.fms_provider_id,
        e.employer_of_record_name,
        e.employer_of_record_relationship,
        e.tax_id,
        e.fms_account_number,
        e.effective_date,
        e.termination_date,
        e.authorized_monthly_budget,
        e.status,
        e.notes,
        e.created_at,
        e.updated_at
      FROM consumer_directed_employers e
      JOIN clients c ON c.id = e.client_id
      WHERE e.id = $1 AND c.organization_id = $2
    `, [employerId, organizationId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    // Get workers
    const workersResult = await db.query(`
      SELECT
        id,
        caregiver_id,
        worker_first_name,
        worker_last_name,
        hourly_rate,
        max_hours_per_week,
        effective_date,
        termination_date,
        status
      FROM consumer_directed_workers
      WHERE employer_id = $1
      ORDER BY status, worker_last_name
    `, [employerId]);

    // Get recent timesheets
    const timesheetsResult = await db.query(`
      SELECT
        t.id,
        t.worker_id,
        w.worker_first_name,
        w.worker_last_name,
        t.pay_period_start,
        t.pay_period_end,
        t.total_hours,
        t.total_amount,
        t.status,
        t.submitted_at
      FROM consumer_directed_timesheets t
      JOIN consumer_directed_workers w ON w.id = t.worker_id
      WHERE w.employer_id = $1
      ORDER BY t.pay_period_start DESC
      LIMIT 10
    `, [employerId]);

    return {
      id: row.id,
      clientId: row.client_id,
      clientName: `${row.client_first_name} ${row.client_last_name}`,
      clientMedicaidId: row.client_medicaid_id,
      fmsProviderId: row.fms_provider_id,
      employerOfRecordName: row.employer_of_record_name,
      employerOfRecordRelationship: row.employer_of_record_relationship,
      taxId: row.tax_id ? '***-**-' + row.tax_id.slice(-4) : null, // Mask tax ID
      fmsAccountNumber: row.fms_account_number,
      effectiveDate: row.effective_date,
      terminationDate: row.termination_date,
      authorizedMonthlyBudget: row.authorized_monthly_budget ? parseFloat(row.authorized_monthly_budget) : null,
      status: row.status,
      notes: row.notes,
      workers: workersResult.rows.map(w => ({
        id: w.id,
        caregiverId: w.caregiver_id,
        name: `${w.worker_first_name} ${w.worker_last_name}`,
        hourlyRate: parseFloat(w.hourly_rate),
        maxHoursPerWeek: w.max_hours_per_week,
        effectiveDate: w.effective_date,
        terminationDate: w.termination_date,
        status: w.status
      })),
      recentTimesheets: timesheetsResult.rows.map(t => ({
        id: t.id,
        workerId: t.worker_id,
        workerName: `${t.worker_first_name} ${t.worker_last_name}`,
        payPeriodStart: t.pay_period_start,
        payPeriodEnd: t.pay_period_end,
        totalHours: parseFloat(t.total_hours),
        totalAmount: parseFloat(t.total_amount),
        status: t.status,
        submittedAt: t.submitted_at
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async createEmployer(organizationId: string, data: CreateEmployerData): Promise<any> {
    const db = getDbClient();

    // Verify client belongs to organization
    const clientCheck = await db.query(`
      SELECT id FROM clients WHERE id = $1 AND organization_id = $2
    `, [data.clientId, organizationId]);

    if (clientCheck.rows.length === 0) {
      throw new Error('Client not found in organization');
    }

    // Check if client already has an active employer record
    const existingCheck = await db.query(`
      SELECT id FROM consumer_directed_employers
      WHERE client_id = $1 AND status = 'active'
    `, [data.clientId]);

    if (existingCheck.rows.length > 0) {
      throw new Error('Client already has an active consumer-directed employer record');
    }

    const result = await db.query(`
      INSERT INTO consumer_directed_employers (
        client_id,
        fms_provider_id,
        employer_of_record_name,
        employer_of_record_relationship,
        tax_id,
        fms_account_number,
        effective_date,
        authorized_monthly_budget,
        notes,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
      RETURNING id, created_at
    `, [
      data.clientId,
      data.fmsProviderId || null,
      data.employerOfRecordName,
      data.employerOfRecordRelationship,
      data.taxId || null,
      data.fmsAccountNumber || null,
      data.effectiveDate,
      data.authorizedMonthlyBudget || null,
      data.notes || null
    ]);

    return {
      id: result.rows[0].id,
      ...data,
      status: 'active',
      createdAt: result.rows[0].created_at
    };
  }

  async updateEmployer(
    employerId: string,
    organizationId: string,
    data: UpdateEmployerData
  ): Promise<any | null> {
    const db = getDbClient();

    // Verify employer exists
    const existing = await db.query(`
      SELECT e.id
      FROM consumer_directed_employers e
      JOIN clients c ON c.id = e.client_id
      WHERE e.id = $1 AND c.organization_id = $2
    `, [employerId, organizationId]);

    if (existing.rows.length === 0) return null;

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fields: [keyof UpdateEmployerData, string][] = [
      ['fmsProviderId', 'fms_provider_id'],
      ['employerOfRecordName', 'employer_of_record_name'],
      ['employerOfRecordRelationship', 'employer_of_record_relationship'],
      ['taxId', 'tax_id'],
      ['fmsAccountNumber', 'fms_account_number'],
      ['authorizedMonthlyBudget', 'authorized_monthly_budget'],
      ['status', 'status'],
      ['terminationDate', 'termination_date'],
      ['notes', 'notes']
    ];

    for (const [key, column] of fields) {
      if (data[key] !== undefined) {
        updates.push(`${column} = $${paramIndex}`);
        params.push(data[key]);
        paramIndex++;
      }
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = NOW()`);
    params.push(employerId);

    await db.query(`
      UPDATE consumer_directed_employers
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, params);

    return this.getEmployerById(employerId, organizationId);
  }

  // ==========================================
  // Consumer-Directed Worker Management
  // ==========================================

  async getWorkers(employerId: string, organizationId: string, status?: string): Promise<any[]> {
    const db = getDbClient();

    // Verify employer belongs to organization
    const employerCheck = await db.query(`
      SELECT e.id
      FROM consumer_directed_employers e
      JOIN clients c ON c.id = e.client_id
      WHERE e.id = $1 AND c.organization_id = $2
    `, [employerId, organizationId]);

    if (employerCheck.rows.length === 0) {
      throw new Error('Employer not found');
    }

    const params: any[] = [employerId];
    let query = `
      SELECT
        w.id,
        w.caregiver_id,
        w.worker_first_name,
        w.worker_last_name,
        w.hourly_rate,
        w.max_hours_per_week,
        w.effective_date,
        w.termination_date,
        w.status,
        w.notes,
        w.created_at,
        (
          SELECT SUM(total_hours)
          FROM consumer_directed_timesheets t
          WHERE t.worker_id = w.id
            AND t.status = 'approved'
            AND t.pay_period_start >= DATE_TRUNC('month', CURRENT_DATE)
        ) as mtd_hours,
        (
          SELECT SUM(total_hours)
          FROM consumer_directed_timesheets t
          WHERE t.worker_id = w.id
            AND t.status = 'approved'
            AND t.pay_period_start >= DATE_TRUNC('year', CURRENT_DATE)
        ) as ytd_hours
      FROM consumer_directed_workers w
      WHERE w.employer_id = $1
    `;

    if (status) {
      query += ` AND w.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY w.worker_last_name, w.worker_first_name`;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      caregiverId: row.caregiver_id,
      name: `${row.worker_first_name} ${row.worker_last_name}`,
      firstName: row.worker_first_name,
      lastName: row.worker_last_name,
      hourlyRate: parseFloat(row.hourly_rate),
      maxHoursPerWeek: row.max_hours_per_week,
      effectiveDate: row.effective_date,
      terminationDate: row.termination_date,
      status: row.status,
      notes: row.notes,
      mtdHours: parseFloat(row.mtd_hours) || 0,
      ytdHours: parseFloat(row.ytd_hours) || 0,
      createdAt: row.created_at
    }));
  }

  async createWorker(organizationId: string, data: CreateWorkerData): Promise<any> {
    const db = getDbClient();

    // Verify employer belongs to organization
    const employerCheck = await db.query(`
      SELECT e.id, e.status
      FROM consumer_directed_employers e
      JOIN clients c ON c.id = e.client_id
      WHERE e.id = $1 AND c.organization_id = $2
    `, [data.employerId, organizationId]);

    if (employerCheck.rows.length === 0) {
      throw new Error('Employer not found');
    }

    if (employerCheck.rows[0].status !== 'active') {
      throw new Error('Employer is not active');
    }

    const result = await db.query(`
      INSERT INTO consumer_directed_workers (
        employer_id,
        caregiver_id,
        worker_first_name,
        worker_last_name,
        worker_ssn,
        hourly_rate,
        max_hours_per_week,
        effective_date,
        notes,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
      RETURNING id, created_at
    `, [
      data.employerId,
      data.caregiverId || null,
      data.workerFirstName,
      data.workerLastName,
      data.workerSsn || null,
      data.hourlyRate,
      data.maxHoursPerWeek || null,
      data.effectiveDate,
      data.notes || null
    ]);

    return {
      id: result.rows[0].id,
      employerId: data.employerId,
      name: `${data.workerFirstName} ${data.workerLastName}`,
      hourlyRate: data.hourlyRate,
      maxHoursPerWeek: data.maxHoursPerWeek,
      effectiveDate: data.effectiveDate,
      status: 'active',
      createdAt: result.rows[0].created_at
    };
  }

  async updateWorker(
    workerId: string,
    organizationId: string,
    data: UpdateWorkerData
  ): Promise<any | null> {
    const db = getDbClient();

    // Verify worker belongs to organization
    const existing = await db.query(`
      SELECT w.id, w.employer_id
      FROM consumer_directed_workers w
      JOIN consumer_directed_employers e ON e.id = w.employer_id
      JOIN clients c ON c.id = e.client_id
      WHERE w.id = $1 AND c.organization_id = $2
    `, [workerId, organizationId]);

    if (existing.rows.length === 0) return null;

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.hourlyRate !== undefined) {
      updates.push(`hourly_rate = $${paramIndex}`);
      params.push(data.hourlyRate);
      paramIndex++;
    }

    if (data.maxHoursPerWeek !== undefined) {
      updates.push(`max_hours_per_week = $${paramIndex}`);
      params.push(data.maxHoursPerWeek);
      paramIndex++;
    }

    if (data.status) {
      updates.push(`status = $${paramIndex}`);
      params.push(data.status);
      paramIndex++;
    }

    if (data.terminationDate) {
      updates.push(`termination_date = $${paramIndex}`);
      params.push(data.terminationDate);
      paramIndex++;
    }

    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      params.push(data.notes);
      paramIndex++;
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = NOW()`);
    params.push(workerId);

    await db.query(`
      UPDATE consumer_directed_workers
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, params);

    // Return updated worker
    const result = await db.query(`
      SELECT
        w.id,
        w.employer_id,
        w.caregiver_id,
        w.worker_first_name,
        w.worker_last_name,
        w.hourly_rate,
        w.max_hours_per_week,
        w.effective_date,
        w.termination_date,
        w.status,
        w.notes,
        w.updated_at
      FROM consumer_directed_workers w
      WHERE w.id = $1
    `, [workerId]);

    const row = result.rows[0];
    return {
      id: row.id,
      employerId: row.employer_id,
      caregiverId: row.caregiver_id,
      name: `${row.worker_first_name} ${row.worker_last_name}`,
      hourlyRate: parseFloat(row.hourly_rate),
      maxHoursPerWeek: row.max_hours_per_week,
      effectiveDate: row.effective_date,
      terminationDate: row.termination_date,
      status: row.status,
      notes: row.notes,
      updatedAt: row.updated_at
    };
  }

  // ==========================================
  // Timesheet Management
  // ==========================================

  async getTimesheets(organizationId: string, filters: TimesheetFilters = {}): Promise<any[]> {
    const db = getDbClient();
    const params: any[] = [organizationId];
    let paramIndex = 2;

    let query = `
      SELECT
        t.id,
        t.worker_id,
        w.worker_first_name,
        w.worker_last_name,
        w.hourly_rate,
        w.employer_id,
        e.employer_of_record_name,
        e.client_id,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        t.pay_period_start,
        t.pay_period_end,
        t.total_hours,
        t.total_amount,
        t.status,
        t.submitted_at,
        t.approved_at,
        t.approved_by,
        t.fms_submission_date,
        t.created_at
      FROM consumer_directed_timesheets t
      JOIN consumer_directed_workers w ON w.id = t.worker_id
      JOIN consumer_directed_employers e ON e.id = w.employer_id
      JOIN clients c ON c.id = e.client_id
      WHERE c.organization_id = $1
    `;

    if (filters.employerId) {
      query += ` AND e.id = $${paramIndex}`;
      params.push(filters.employerId);
      paramIndex++;
    }

    if (filters.workerId) {
      query += ` AND t.worker_id = $${paramIndex}`;
      params.push(filters.workerId);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.payPeriodStart) {
      query += ` AND t.pay_period_start >= $${paramIndex}`;
      params.push(filters.payPeriodStart);
      paramIndex++;
    }

    if (filters.payPeriodEnd) {
      query += ` AND t.pay_period_end <= $${paramIndex}`;
      params.push(filters.payPeriodEnd);
      paramIndex++;
    }

    query += ` ORDER BY t.pay_period_start DESC, t.created_at DESC`;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      workerId: row.worker_id,
      workerName: `${row.worker_first_name} ${row.worker_last_name}`,
      hourlyRate: parseFloat(row.hourly_rate),
      employerId: row.employer_id,
      employerName: row.employer_of_record_name,
      clientId: row.client_id,
      clientName: `${row.client_first_name} ${row.client_last_name}`,
      payPeriodStart: row.pay_period_start,
      payPeriodEnd: row.pay_period_end,
      totalHours: parseFloat(row.total_hours),
      totalAmount: parseFloat(row.total_amount),
      status: row.status,
      submittedAt: row.submitted_at,
      approvedAt: row.approved_at,
      approvedBy: row.approved_by,
      fmsSubmissionDate: row.fms_submission_date,
      createdAt: row.created_at
    }));
  }

  async getTimesheetById(timesheetId: string, organizationId: string): Promise<any | null> {
    const db = getDbClient();

    const result = await db.query(`
      SELECT
        t.id,
        t.worker_id,
        w.worker_first_name,
        w.worker_last_name,
        w.hourly_rate,
        w.employer_id,
        e.employer_of_record_name,
        e.client_id,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        t.pay_period_start,
        t.pay_period_end,
        t.total_hours,
        t.total_amount,
        t.status,
        t.submitted_at,
        t.approved_at,
        t.approved_by,
        t.fms_submission_date,
        t.fms_confirmation_number,
        t.notes,
        t.created_at,
        t.updated_at
      FROM consumer_directed_timesheets t
      JOIN consumer_directed_workers w ON w.id = t.worker_id
      JOIN consumer_directed_employers e ON e.id = w.employer_id
      JOIN clients c ON c.id = e.client_id
      WHERE t.id = $1 AND c.organization_id = $2
    `, [timesheetId, organizationId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    // Get line items
    const itemsResult = await db.query(`
      SELECT
        id,
        service_date,
        start_time,
        end_time,
        total_hours,
        service_code,
        notes,
        created_at
      FROM consumer_directed_timesheet_items
      WHERE timesheet_id = $1
      ORDER BY service_date, start_time
    `, [timesheetId]);

    return {
      id: row.id,
      workerId: row.worker_id,
      workerName: `${row.worker_first_name} ${row.worker_last_name}`,
      hourlyRate: parseFloat(row.hourly_rate),
      employerId: row.employer_id,
      employerName: row.employer_of_record_name,
      clientId: row.client_id,
      clientName: `${row.client_first_name} ${row.client_last_name}`,
      payPeriodStart: row.pay_period_start,
      payPeriodEnd: row.pay_period_end,
      totalHours: parseFloat(row.total_hours),
      totalAmount: parseFloat(row.total_amount),
      status: row.status,
      submittedAt: row.submitted_at,
      approvedAt: row.approved_at,
      approvedBy: row.approved_by,
      fmsSubmissionDate: row.fms_submission_date,
      fmsConfirmationNumber: row.fms_confirmation_number,
      notes: row.notes,
      entries: itemsResult.rows.map(item => ({
        id: item.id,
        serviceDate: item.service_date,
        startTime: item.start_time,
        endTime: item.end_time,
        totalHours: parseFloat(item.total_hours),
        serviceCode: item.service_code,
        notes: item.notes
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async createTimesheet(organizationId: string, data: CreateTimesheetData): Promise<any> {
    const db = getDbClient();

    // Verify worker belongs to organization
    const workerCheck = await db.query(`
      SELECT
        w.id,
        w.hourly_rate,
        w.max_hours_per_week,
        w.status,
        e.id as employer_id,
        e.status as employer_status
      FROM consumer_directed_workers w
      JOIN consumer_directed_employers e ON e.id = w.employer_id
      JOIN clients c ON c.id = e.client_id
      WHERE w.id = $1 AND c.organization_id = $2
    `, [data.workerId, organizationId]);

    if (workerCheck.rows.length === 0) {
      throw new Error('Worker not found');
    }

    const worker = workerCheck.rows[0];

    if (worker.status !== 'active') {
      throw new Error('Worker is not active');
    }

    if (worker.employer_status !== 'active') {
      throw new Error('Employer is not active');
    }

    // Check for duplicate timesheet
    const duplicateCheck = await db.query(`
      SELECT id FROM consumer_directed_timesheets
      WHERE worker_id = $1
        AND pay_period_start = $2
        AND pay_period_end = $3
    `, [data.workerId, data.payPeriodStart, data.payPeriodEnd]);

    if (duplicateCheck.rows.length > 0) {
      throw new Error('Timesheet already exists for this pay period');
    }

    // Calculate totals
    const totalHours = data.entries.reduce((sum, e) => sum + e.totalHours, 0);
    const hourlyRate = parseFloat(worker.hourly_rate);
    const totalAmount = totalHours * hourlyRate;

    // Create timesheet
    const timesheetResult = await db.query(`
      INSERT INTO consumer_directed_timesheets (
        worker_id,
        pay_period_start,
        pay_period_end,
        total_hours,
        total_amount,
        status
      ) VALUES ($1, $2, $3, $4, $5, 'draft')
      RETURNING id, created_at
    `, [data.workerId, data.payPeriodStart, data.payPeriodEnd, totalHours, totalAmount]);

    const timesheetId = timesheetResult.rows[0].id;

    // Create line items
    for (const entry of data.entries) {
      await db.query(`
        INSERT INTO consumer_directed_timesheet_items (
          timesheet_id,
          service_date,
          start_time,
          end_time,
          total_hours,
          service_code,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        timesheetId,
        entry.serviceDate,
        entry.startTime,
        entry.endTime,
        entry.totalHours,
        entry.serviceCode || null,
        entry.notes || null
      ]);
    }

    return {
      id: timesheetId,
      workerId: data.workerId,
      payPeriodStart: data.payPeriodStart,
      payPeriodEnd: data.payPeriodEnd,
      totalHours,
      totalAmount,
      status: 'draft',
      entriesCount: data.entries.length,
      createdAt: timesheetResult.rows[0].created_at
    };
  }

  async submitTimesheet(timesheetId: string, organizationId: string): Promise<any | null> {
    const db = getDbClient();

    // Get timesheet and verify
    const existing = await db.query(`
      SELECT t.id, t.status
      FROM consumer_directed_timesheets t
      JOIN consumer_directed_workers w ON w.id = t.worker_id
      JOIN consumer_directed_employers e ON e.id = w.employer_id
      JOIN clients c ON c.id = e.client_id
      WHERE t.id = $1 AND c.organization_id = $2
    `, [timesheetId, organizationId]);

    if (existing.rows.length === 0) return null;

    if (existing.rows[0].status !== 'draft') {
      throw new Error('Only draft timesheets can be submitted');
    }

    await db.query(`
      UPDATE consumer_directed_timesheets
      SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [timesheetId]);

    return this.getTimesheetById(timesheetId, organizationId);
  }

  async approveTimesheet(
    timesheetId: string,
    organizationId: string,
    approverId: string
  ): Promise<any | null> {
    const db = getDbClient();

    // Get timesheet and verify
    const existing = await db.query(`
      SELECT t.id, t.status
      FROM consumer_directed_timesheets t
      JOIN consumer_directed_workers w ON w.id = t.worker_id
      JOIN consumer_directed_employers e ON e.id = w.employer_id
      JOIN clients c ON c.id = e.client_id
      WHERE t.id = $1 AND c.organization_id = $2
    `, [timesheetId, organizationId]);

    if (existing.rows.length === 0) return null;

    if (existing.rows[0].status !== 'submitted') {
      throw new Error('Only submitted timesheets can be approved');
    }

    await db.query(`
      UPDATE consumer_directed_timesheets
      SET status = 'approved', approved_at = NOW(), approved_by = $2, updated_at = NOW()
      WHERE id = $1
    `, [timesheetId, approverId]);

    return this.getTimesheetById(timesheetId, organizationId);
  }

  async rejectTimesheet(
    timesheetId: string,
    organizationId: string,
    reason: string
  ): Promise<any | null> {
    const db = getDbClient();

    const existing = await db.query(`
      SELECT t.id, t.status
      FROM consumer_directed_timesheets t
      JOIN consumer_directed_workers w ON w.id = t.worker_id
      JOIN consumer_directed_employers e ON e.id = w.employer_id
      JOIN clients c ON c.id = e.client_id
      WHERE t.id = $1 AND c.organization_id = $2
    `, [timesheetId, organizationId]);

    if (existing.rows.length === 0) return null;

    if (existing.rows[0].status !== 'submitted') {
      throw new Error('Only submitted timesheets can be rejected');
    }

    await db.query(`
      UPDATE consumer_directed_timesheets
      SET status = 'rejected', notes = $2, updated_at = NOW()
      WHERE id = $1
    `, [timesheetId, reason]);

    return this.getTimesheetById(timesheetId, organizationId);
  }

  // ==========================================
  // Consumer-Directed Dashboard & Reports
  // ==========================================

  async getDashboard(organizationId: string): Promise<any> {
    const db = getDbClient();

    // Get summary stats
    const statsResult = await db.query(`
      SELECT
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active') as active_employers,
        COUNT(DISTINCT w.id) FILTER (WHERE w.status = 'active') as active_workers,
        COUNT(t.id) FILTER (WHERE t.status = 'submitted') as pending_timesheets,
        COALESCE(SUM(t.total_hours) FILTER (
          WHERE t.status = 'approved'
          AND t.pay_period_start >= DATE_TRUNC('month', CURRENT_DATE)
        ), 0) as mtd_approved_hours,
        COALESCE(SUM(t.total_amount) FILTER (
          WHERE t.status = 'approved'
          AND t.pay_period_start >= DATE_TRUNC('month', CURRENT_DATE)
        ), 0) as mtd_approved_amount
      FROM consumer_directed_employers e
      JOIN clients c ON c.id = e.client_id
      LEFT JOIN consumer_directed_workers w ON w.employer_id = e.id
      LEFT JOIN consumer_directed_timesheets t ON t.worker_id = w.id
      WHERE c.organization_id = $1
    `, [organizationId]);

    const stats = statsResult.rows[0];

    // Get recent activity
    const recentResult = await db.query(`
      SELECT
        t.id,
        w.worker_first_name,
        w.worker_last_name,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        t.pay_period_start,
        t.pay_period_end,
        t.total_hours,
        t.status,
        t.submitted_at
      FROM consumer_directed_timesheets t
      JOIN consumer_directed_workers w ON w.id = t.worker_id
      JOIN consumer_directed_employers e ON e.id = w.employer_id
      JOIN clients c ON c.id = e.client_id
      WHERE c.organization_id = $1
      ORDER BY t.updated_at DESC
      LIMIT 10
    `, [organizationId]);

    return {
      summary: {
        activeEmployers: parseInt(stats.active_employers),
        activeWorkers: parseInt(stats.active_workers),
        pendingTimesheets: parseInt(stats.pending_timesheets),
        mtdApprovedHours: parseFloat(stats.mtd_approved_hours),
        mtdApprovedAmount: parseFloat(stats.mtd_approved_amount)
      },
      recentActivity: recentResult.rows.map(row => ({
        timesheetId: row.id,
        workerName: `${row.worker_first_name} ${row.worker_last_name}`,
        clientName: `${row.client_first_name} ${row.client_last_name}`,
        payPeriod: `${row.pay_period_start} - ${row.pay_period_end}`,
        totalHours: parseFloat(row.total_hours),
        status: row.status,
        submittedAt: row.submitted_at
      }))
    };
  }

  async getBudgetUtilization(organizationId: string): Promise<any[]> {
    const db = getDbClient();

    const result = await db.query(`
      SELECT
        e.id as employer_id,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        e.employer_of_record_name,
        e.authorized_monthly_budget,
        COALESCE(SUM(t.total_amount) FILTER (
          WHERE t.status = 'approved'
          AND t.pay_period_start >= DATE_TRUNC('month', CURRENT_DATE)
        ), 0) as mtd_spent,
        COUNT(DISTINCT w.id) FILTER (WHERE w.status = 'active') as active_workers
      FROM consumer_directed_employers e
      JOIN clients c ON c.id = e.client_id
      LEFT JOIN consumer_directed_workers w ON w.employer_id = e.id
      LEFT JOIN consumer_directed_timesheets t ON t.worker_id = w.id
      WHERE c.organization_id = $1 AND e.status = 'active'
      GROUP BY e.id, c.first_name, c.last_name, e.employer_of_record_name, e.authorized_monthly_budget
      ORDER BY c.last_name, c.first_name
    `, [organizationId]);

    return result.rows.map(row => ({
      employerId: row.employer_id,
      clientName: `${row.client_first_name} ${row.client_last_name}`,
      employerName: row.employer_of_record_name,
      budget: row.authorized_monthly_budget ? parseFloat(row.authorized_monthly_budget) : null,
      mtdSpent: parseFloat(row.mtd_spent),
      remaining: row.authorized_monthly_budget ?
        parseFloat(row.authorized_monthly_budget) - parseFloat(row.mtd_spent) : null,
      utilizationPercent: row.authorized_monthly_budget && parseFloat(row.authorized_monthly_budget) > 0 ?
        Math.round((parseFloat(row.mtd_spent) / parseFloat(row.authorized_monthly_budget)) * 100) : null,
      activeWorkers: parseInt(row.active_workers)
    }));
  }
}

export const consumerDirectedService = new ConsumerDirectedService();
