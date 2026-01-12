/**
 * Executive Dashboard Routes
 * Comprehensive CEO/Executive metrics with real data queries
 *
 * @module api/routes/console/executive
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { pool } from '../../../config/database';

const router = Router();

/**
 * GET /api/console/executive/overview
 * Main executive overview with KPIs across all domains
 */
router.get('/overview', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    // Financial metrics
    const financialResult = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status IN ('paid', 'submitted', 'accepted') AND created_at >= date_trunc('month', CURRENT_DATE) THEN billed_amount ELSE 0 END), 0) as monthly_revenue,
        COALESCE(SUM(CASE WHEN status IN ('paid', 'submitted', 'accepted') AND created_at >= date_trunc('month', CURRENT_DATE - interval '1 month') AND created_at < date_trunc('month', CURRENT_DATE) THEN billed_amount ELSE 0 END), 0) as prev_month_revenue,
        COALESCE(SUM(CASE WHEN status IN ('paid', 'submitted', 'accepted') AND created_at >= date_trunc('year', CURRENT_DATE) THEN billed_amount ELSE 0 END), 0) as ytd_revenue,
        COALESCE(SUM(CASE WHEN status NOT IN ('paid', 'denied', 'adjusted') THEN billed_amount ELSE 0 END), 0) as ar_balance,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN paid_amount ELSE 0 END), 0) as total_collected,
        COALESCE(SUM(billed_amount), 0) as total_billed
      FROM claims
      WHERE organization_id = $1
    `, [organizationId]).catch(() => ({ rows: [{ monthly_revenue: 0, prev_month_revenue: 0, ytd_revenue: 0, ar_balance: 0, total_collected: 0, total_billed: 0 }] }));

    const financial = financialResult.rows[0];
    const monthlyRevenue = parseFloat(financial.monthly_revenue) || 0;
    const prevMonthRevenue = parseFloat(financial.prev_month_revenue) || 0;
    const revenueChange = prevMonthRevenue > 0 ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;
    const collectionRate = parseFloat(financial.total_billed) > 0 ? (parseFloat(financial.total_collected) / parseFloat(financial.total_billed)) * 100 : 0;

    // Operations metrics
    const patientsResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_patients,
        COUNT(*) FILTER (WHERE admission_date >= CURRENT_DATE - interval '30 days') as new_admissions,
        COUNT(*) FILTER (WHERE discharge_date >= CURRENT_DATE - interval '30 days') as recent_discharges
      FROM clients
      WHERE organization_id = $1
    `, [organizationId]).catch(() => ({ rows: [{ active_patients: 0, new_admissions: 0, recent_discharges: 0 }] }));

    const patients = patientsResult.rows[0];

    // Today's visits
    const visitsResult = await pool.query(`
      SELECT
        COUNT(*) as total_visits,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        ROUND(COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 1) as completion_rate
      FROM shifts
      WHERE organization_id = $1 AND DATE(scheduled_start) = CURRENT_DATE
    `, [organizationId]).catch(() => ({ rows: [{ total_visits: 0, completed: 0, completion_rate: 0 }] }));

    const visits = visitsResult.rows[0];

    // EVV Compliance (current month)
    const evvResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE sandata_status = 'accepted') as compliant,
        ROUND(COUNT(*) FILTER (WHERE sandata_status = 'accepted')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 1) as compliance_rate
      FROM evv_records
      WHERE organization_id = $1 AND service_date >= date_trunc('month', CURRENT_DATE)
    `, [organizationId]).catch(() => ({ rows: [{ total: 0, compliant: 0, compliance_rate: 0 }] }));

    const evv = evvResult.rows[0];

    // Workforce metrics
    const staffResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_staff,
        COUNT(*) FILTER (WHERE hire_date >= CURRENT_DATE - interval '30 days' AND status = 'active') as new_hires,
        COUNT(*) FILTER (WHERE termination_date >= CURRENT_DATE - interval '90 days') as recent_terminations
      FROM users
      WHERE organization_id = $1
        AND role IN ('caregiver', 'dsp_basic', 'dsp_med', 'hha', 'cna', 'rn_case_manager', 'lpn_lvn', 'therapist', 'qidp')
    `, [organizationId]).catch(() => ({ rows: [{ active_staff: 0, new_hires: 0, recent_terminations: 0 }] }));

    const staff = staffResult.rows[0];
    const activeStaff = parseInt(staff.active_staff) || 0;
    const recentTerminations = parseInt(staff.recent_terminations) || 0;
    const turnoverRate = activeStaff > 0 ? (recentTerminations / activeStaff) * 100 * 4 : 0; // Annualized from 90 days

    // Recruiting pipeline
    const recruitingResult = await pool.query(`
      SELECT COUNT(*) as pipeline_count
      FROM applicants
      WHERE organization_id = $1 AND status NOT IN ('hired', 'rejected', 'withdrawn')
    `, [organizationId]).catch(() => ({ rows: [{ pipeline_count: 0 }] }));

    // Open positions
    const positionsResult = await pool.query(`
      SELECT COUNT(*) as open_positions
      FROM job_requisitions
      WHERE organization_id = $1 AND status = 'open'
    `, [organizationId]).catch(() => ({ rows: [{ open_positions: 0 }] }));

    // Compliance metrics
    const credentialsResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE expires_at <= CURRENT_DATE + interval '30 days' AND expires_at > CURRENT_DATE) as expiring_30,
        COUNT(*) FILTER (WHERE expires_at <= CURRENT_DATE) as expired
      FROM training_assignments
      WHERE organization_id = $1 AND status = 'completed'
    `, [organizationId]).catch(() => ({ rows: [{ expiring_30: 0, expired: 0 }] }));

    const credentials = credentialsResult.rows[0];

    // Training compliance
    const trainingResult = await pool.query(`
      SELECT COUNT(*) as overdue
      FROM training_assignments
      WHERE organization_id = $1 AND status NOT IN ('completed', 'waived') AND due_date < CURRENT_DATE
    `, [organizationId]).catch(() => ({ rows: [{ overdue: 0 }] }));

    // Calculate overall compliance score (weighted average)
    const evvScore = parseFloat(evv.compliance_rate) || 0;
    const credentialScore = 100 - (parseInt(credentials.expired) || 0) * 5; // -5 points per expired
    const trainingScore = 100 - (parseInt(trainingResult.rows[0].overdue) || 0) * 2; // -2 points per overdue
    const overallCompliance = Math.max(0, Math.min(100, (evvScore * 0.4 + credentialScore * 0.3 + trainingScore * 0.3)));

    res.json({
      financial: {
        monthlyRevenue,
        monthlyRevenueChange: Math.round(revenueChange * 10) / 10,
        ytdRevenue: parseFloat(financial.ytd_revenue) || 0,
        arBalance: parseFloat(financial.ar_balance) || 0,
        collectionRate: Math.round(collectionRate * 10) / 10
      },
      operations: {
        activePatients: parseInt(patients.active_patients) || 0,
        newAdmissions: parseInt(patients.new_admissions) || 0,
        recentDischarges: parseInt(patients.recent_discharges) || 0,
        visitsToday: parseInt(visits.total_visits) || 0,
        visitCompletionRate: parseFloat(visits.completion_rate) || 0,
        evvComplianceRate: parseFloat(evv.compliance_rate) || 0
      },
      workforce: {
        activeStaff,
        newHires: parseInt(staff.new_hires) || 0,
        turnoverRate: Math.round(turnoverRate * 10) / 10,
        openPositions: parseInt(positionsResult.rows[0].open_positions) || 0,
        pipelineCount: parseInt(recruitingResult.rows[0].pipeline_count) || 0
      },
      compliance: {
        overallScore: Math.round(overallCompliance),
        expiringCredentials: parseInt(credentials.expiring_30) || 0,
        expiredCredentials: parseInt(credentials.expired) || 0,
        overdueTraining: parseInt(trainingResult.rows[0].overdue) || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/executive/financial
 * Detailed financial metrics
 */
router.get('/financial', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    // Revenue by month (last 12 months)
    const revenueByMonthResult = await pool.query(`
      SELECT
        to_char(date_trunc('month', created_at), 'Mon YYYY') as month,
        date_trunc('month', created_at) as month_date,
        COALESCE(SUM(CASE WHEN status IN ('paid', 'submitted', 'accepted') THEN billed_amount ELSE 0 END), 0) as revenue,
        COUNT(*) as claims_count
      FROM claims
      WHERE organization_id = $1 AND created_at >= CURRENT_DATE - interval '12 months'
      GROUP BY date_trunc('month', created_at)
      ORDER BY month_date
    `, [organizationId]).catch(() => ({ rows: [] }));

    // AR Aging buckets
    const arAgingResult = await pool.query(`
      SELECT
        CASE
          WHEN CURRENT_DATE - created_at::date <= 30 THEN '0-30 Days'
          WHEN CURRENT_DATE - created_at::date <= 60 THEN '31-60 Days'
          WHEN CURRENT_DATE - created_at::date <= 90 THEN '61-90 Days'
          ELSE '90+ Days'
        END as bucket,
        COUNT(*) as count,
        COALESCE(SUM(billed_amount - COALESCE(paid_amount, 0)), 0) as amount
      FROM claims
      WHERE organization_id = $1 AND status NOT IN ('paid', 'denied', 'adjusted')
      GROUP BY bucket
      ORDER BY
        CASE bucket
          WHEN '0-30 Days' THEN 1
          WHEN '31-60 Days' THEN 2
          WHEN '61-90 Days' THEN 3
          ELSE 4
        END
    `, [organizationId]).catch(() => ({ rows: [] }));

    // Revenue by payer type
    const payerMixResult = await pool.query(`
      SELECT
        COALESCE(payer_type, 'Other') as payer,
        COALESCE(SUM(CASE WHEN status IN ('paid', 'submitted', 'accepted') THEN billed_amount ELSE 0 END), 0) as revenue,
        COUNT(*) as claims_count
      FROM claims
      WHERE organization_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE)
      GROUP BY payer_type
      ORDER BY revenue DESC
    `, [organizationId]).catch(() => ({ rows: [] }));

    // Summary metrics
    const summaryResult = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) AND status IN ('paid', 'submitted', 'accepted') THEN billed_amount ELSE 0 END), 0) as current_month,
        COALESCE(SUM(CASE WHEN created_at >= date_trunc('year', CURRENT_DATE) AND status IN ('paid', 'submitted', 'accepted') THEN billed_amount ELSE 0 END), 0) as ytd,
        COALESCE(SUM(CASE WHEN status NOT IN ('paid', 'denied', 'adjusted') THEN billed_amount - COALESCE(paid_amount, 0) ELSE 0 END), 0) as total_ar,
        COALESCE(SUM(CASE WHEN status NOT IN ('paid', 'denied', 'adjusted') AND CURRENT_DATE - created_at::date > 90 THEN billed_amount - COALESCE(paid_amount, 0) ELSE 0 END), 0) as ar_90_plus,
        COALESCE(AVG(CASE WHEN status = 'paid' AND paid_date IS NOT NULL THEN paid_date - created_at::date END), 0) as avg_days_to_pay
      FROM claims
      WHERE organization_id = $1
    `, [organizationId]).catch(() => ({ rows: [{}] }));

    const summary = summaryResult.rows[0];

    res.json({
      summary: {
        currentMonthRevenue: parseFloat(summary.current_month) || 0,
        ytdRevenue: parseFloat(summary.ytd) || 0,
        totalAR: parseFloat(summary.total_ar) || 0,
        ar90Plus: parseFloat(summary.ar_90_plus) || 0,
        avgDaysToPay: Math.round(parseFloat(summary.avg_days_to_pay) || 0)
      },
      revenueByMonth: revenueByMonthResult.rows.map(r => ({
        month: r.month,
        revenue: parseFloat(r.revenue) || 0,
        claimsCount: parseInt(r.claims_count) || 0
      })),
      arAging: arAgingResult.rows.map(r => ({
        bucket: r.bucket,
        count: parseInt(r.count) || 0,
        amount: parseFloat(r.amount) || 0
      })),
      payerMix: payerMixResult.rows.map(r => ({
        payer: r.payer,
        revenue: parseFloat(r.revenue) || 0,
        claimsCount: parseInt(r.claims_count) || 0
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/executive/operations
 * Detailed operations metrics
 */
router.get('/operations', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    // Patient census
    const censusResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE admission_date >= CURRENT_DATE - interval '30 days') as new_admissions,
        COUNT(*) FILTER (WHERE discharge_date >= CURRENT_DATE - interval '30 days') as discharges,
        COUNT(*) as total
      FROM clients
      WHERE organization_id = $1
    `, [organizationId]).catch(() => ({ rows: [{ active: 0, new_admissions: 0, discharges: 0, total: 0 }] }));

    // Visit metrics (today and this week)
    const visitsResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE DATE(scheduled_start) = CURRENT_DATE) as today_total,
        COUNT(*) FILTER (WHERE DATE(scheduled_start) = CURRENT_DATE AND status = 'completed') as today_completed,
        COUNT(*) FILTER (WHERE DATE(scheduled_start) = CURRENT_DATE AND status = 'cancelled') as today_cancelled,
        COUNT(*) FILTER (WHERE DATE(scheduled_start) = CURRENT_DATE AND status = 'no_show') as today_no_show,
        COUNT(*) FILTER (WHERE scheduled_start >= date_trunc('week', CURRENT_DATE)) as week_total,
        COUNT(*) FILTER (WHERE scheduled_start >= date_trunc('week', CURRENT_DATE) AND status = 'completed') as week_completed
      FROM shifts
      WHERE organization_id = $1
    `, [organizationId]).catch(() => ({ rows: [{ today_total: 0, today_completed: 0, today_cancelled: 0, today_no_show: 0, week_total: 0, week_completed: 0 }] }));

    const visits = visitsResult.rows[0];
    const todayTotal = parseInt(visits.today_total) || 0;
    const todayCompleted = parseInt(visits.today_completed) || 0;
    const todayCompletionRate = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;

    // EVV Compliance
    const evvResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE sandata_status = 'accepted') as accepted,
        COUNT(*) FILTER (WHERE sandata_status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE sandata_status = 'pending') as pending,
        COUNT(*) FILTER (WHERE sandata_status = 'error') as errors
      FROM evv_records
      WHERE organization_id = $1 AND service_date >= date_trunc('month', CURRENT_DATE)
    `, [organizationId]).catch(() => ({ rows: [{ total: 0, accepted: 0, rejected: 0, pending: 0, errors: 0 }] }));

    const evv = evvResult.rows[0];
    const evvTotal = parseInt(evv.total) || 0;
    const evvCompliance = evvTotal > 0 ? (parseInt(evv.accepted) / evvTotal) * 100 : 0;

    // Pod performance (if pods table exists)
    const podPerformanceResult = await pool.query(`
      SELECT
        p.name as pod_name,
        p.id as pod_id,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as active_clients,
        COUNT(DISTINCT u.id) FILTER (WHERE u.status = 'active') as active_caregivers,
        COUNT(s.id) FILTER (WHERE DATE(s.scheduled_start) = CURRENT_DATE) as visits_today,
        COUNT(s.id) FILTER (WHERE DATE(s.scheduled_start) = CURRENT_DATE AND s.status = 'completed') as completed_today
      FROM pods p
      LEFT JOIN clients c ON c.pod_id = p.id
      LEFT JOIN user_pod_memberships upm ON upm.pod_id = p.id
      LEFT JOIN users u ON u.id = upm.user_id
      LEFT JOIN shifts s ON s.pod_id = p.id
      WHERE p.organization_id = $1
      GROUP BY p.id, p.name
      ORDER BY p.name
      LIMIT 10
    `, [organizationId]).catch(() => ({ rows: [] }));

    res.json({
      census: {
        active: parseInt(censusResult.rows[0].active) || 0,
        newAdmissions: parseInt(censusResult.rows[0].new_admissions) || 0,
        discharges: parseInt(censusResult.rows[0].discharges) || 0,
        total: parseInt(censusResult.rows[0].total) || 0
      },
      visits: {
        todayTotal,
        todayCompleted,
        todayCancelled: parseInt(visits.today_cancelled) || 0,
        todayNoShow: parseInt(visits.today_no_show) || 0,
        todayCompletionRate: Math.round(todayCompletionRate * 10) / 10,
        weekTotal: parseInt(visits.week_total) || 0,
        weekCompleted: parseInt(visits.week_completed) || 0
      },
      evv: {
        total: evvTotal,
        accepted: parseInt(evv.accepted) || 0,
        rejected: parseInt(evv.rejected) || 0,
        pending: parseInt(evv.pending) || 0,
        errors: parseInt(evv.errors) || 0,
        complianceRate: Math.round(evvCompliance * 10) / 10
      },
      podPerformance: podPerformanceResult.rows.map(p => ({
        name: p.pod_name,
        id: p.pod_id,
        activeClients: parseInt(p.active_clients) || 0,
        activeCaregivers: parseInt(p.active_caregivers) || 0,
        visitsToday: parseInt(p.visits_today) || 0,
        completedToday: parseInt(p.completed_today) || 0,
        completionRate: parseInt(p.visits_today) > 0 ? Math.round((parseInt(p.completed_today) / parseInt(p.visits_today)) * 100) : 0
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/executive/workforce
 * Detailed workforce metrics
 */
router.get('/workforce', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    // Staff by role
    const staffByRoleResult = await pool.query(`
      SELECT
        role,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE hire_date >= CURRENT_DATE - interval '30 days') as new_hires
      FROM users
      WHERE organization_id = $1 AND status = 'active'
        AND role IN ('caregiver', 'dsp_basic', 'dsp_med', 'hha', 'cna', 'rn_case_manager', 'lpn_lvn', 'therapist', 'qidp', 'scheduler', 'office_admin')
      GROUP BY role
      ORDER BY count DESC
    `, [organizationId]).catch(() => ({ rows: [] }));

    // Turnover by month (last 12 months)
    const turnoverResult = await pool.query(`
      SELECT
        to_char(date_trunc('month', termination_date), 'Mon YYYY') as month,
        date_trunc('month', termination_date) as month_date,
        COUNT(*) as terminations
      FROM users
      WHERE organization_id = $1
        AND termination_date >= CURRENT_DATE - interval '12 months'
        AND role IN ('caregiver', 'dsp_basic', 'dsp_med', 'hha', 'cna', 'rn_case_manager', 'lpn_lvn', 'therapist', 'qidp')
      GROUP BY date_trunc('month', termination_date)
      ORDER BY month_date
    `, [organizationId]).catch(() => ({ rows: [] }));

    // Recruiting pipeline
    const pipelineResult = await pool.query(`
      SELECT
        current_stage,
        COUNT(*) as count
      FROM applicants
      WHERE organization_id = $1 AND status NOT IN ('hired', 'rejected', 'withdrawn')
      GROUP BY current_stage
      ORDER BY
        CASE current_stage
          WHEN 'applied' THEN 1
          WHEN 'screening' THEN 2
          WHEN 'interviewing' THEN 3
          WHEN 'offer_pending' THEN 4
          WHEN 'offer_accepted' THEN 5
          ELSE 6
        END
    `, [organizationId]).catch(() => ({ rows: [] }));

    // Open positions
    const positionsResult = await pool.query(`
      SELECT
        title,
        department,
        created_at,
        CURRENT_DATE - created_at::date as days_open
      FROM job_requisitions
      WHERE organization_id = $1 AND status = 'open'
      ORDER BY created_at
      LIMIT 10
    `, [organizationId]).catch(() => ({ rows: [] }));

    // Recent hires
    const recentHiresResult = await pool.query(`
      SELECT
        first_name,
        last_name,
        role,
        hire_date
      FROM users
      WHERE organization_id = $1
        AND hire_date >= CURRENT_DATE - interval '30 days'
        AND status = 'active'
      ORDER BY hire_date DESC
      LIMIT 10
    `, [organizationId]).catch(() => ({ rows: [] }));

    // Summary stats
    const summaryResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as total_active,
        COUNT(*) FILTER (WHERE hire_date >= CURRENT_DATE - interval '30 days' AND status = 'active') as new_hires_30d,
        COUNT(*) FILTER (WHERE termination_date >= CURRENT_DATE - interval '90 days') as terminations_90d
      FROM users
      WHERE organization_id = $1
        AND role IN ('caregiver', 'dsp_basic', 'dsp_med', 'hha', 'cna', 'rn_case_manager', 'lpn_lvn', 'therapist', 'qidp')
    `, [organizationId]).catch(() => ({ rows: [{ total_active: 0, new_hires_30d: 0, terminations_90d: 0 }] }));

    const summary = summaryResult.rows[0];
    const totalActive = parseInt(summary.total_active) || 0;
    const terminations90d = parseInt(summary.terminations_90d) || 0;
    const turnoverRate = totalActive > 0 ? (terminations90d / totalActive) * 100 * 4 : 0; // Annualized

    res.json({
      summary: {
        totalActive,
        newHires30d: parseInt(summary.new_hires_30d) || 0,
        terminations90d,
        annualTurnoverRate: Math.round(turnoverRate * 10) / 10
      },
      staffByRole: staffByRoleResult.rows.map(r => ({
        role: r.role,
        count: parseInt(r.count) || 0,
        newHires: parseInt(r.new_hires) || 0
      })),
      turnoverByMonth: turnoverResult.rows.map(r => ({
        month: r.month,
        terminations: parseInt(r.terminations) || 0
      })),
      recruitingPipeline: pipelineResult.rows.map(r => ({
        stage: r.current_stage,
        count: parseInt(r.count) || 0
      })),
      openPositions: positionsResult.rows.map(r => ({
        title: r.title,
        department: r.department,
        daysOpen: parseInt(r.days_open) || 0
      })),
      recentHires: recentHiresResult.rows.map(r => ({
        name: `${r.first_name} ${r.last_name}`,
        role: r.role,
        hireDate: r.hire_date
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/executive/compliance
 * Detailed compliance metrics
 */
router.get('/compliance', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    // Credential status
    const credentialsResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE expires_at > CURRENT_DATE + interval '30 days') as current,
        COUNT(*) FILTER (WHERE expires_at <= CURRENT_DATE + interval '7 days' AND expires_at > CURRENT_DATE) as expiring_7d,
        COUNT(*) FILTER (WHERE expires_at <= CURRENT_DATE + interval '14 days' AND expires_at > CURRENT_DATE + interval '7 days') as expiring_14d,
        COUNT(*) FILTER (WHERE expires_at <= CURRENT_DATE + interval '30 days' AND expires_at > CURRENT_DATE + interval '14 days') as expiring_30d,
        COUNT(*) FILTER (WHERE expires_at <= CURRENT_DATE) as expired
      FROM training_assignments
      WHERE organization_id = $1 AND status = 'completed'
    `, [organizationId]).catch(() => ({ rows: [{ current: 0, expiring_7d: 0, expiring_14d: 0, expiring_30d: 0, expired: 0 }] }));

    const credentials = credentialsResult.rows[0];

    // Training status
    const trainingResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status IN ('in_progress', 'assigned') AND due_date >= CURRENT_DATE) as in_progress,
        COUNT(*) FILTER (WHERE status NOT IN ('completed', 'waived') AND due_date < CURRENT_DATE) as overdue,
        COUNT(*) as total
      FROM training_assignments
      WHERE organization_id = $1
    `, [organizationId]).catch(() => ({ rows: [{ completed: 0, in_progress: 0, overdue: 0, total: 0 }] }));

    const training = trainingResult.rows[0];
    const trainingTotal = parseInt(training.total) || 0;
    const trainingCompleted = parseInt(training.completed) || 0;
    const trainingCompletionRate = trainingTotal > 0 ? (trainingCompleted / trainingTotal) * 100 : 0;

    // EVV Compliance
    const evvResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE sandata_status = 'accepted') as compliant
      FROM evv_records
      WHERE organization_id = $1 AND service_date >= date_trunc('month', CURRENT_DATE)
    `, [organizationId]).catch(() => ({ rows: [{ total: 0, compliant: 0 }] }));

    const evv = evvResult.rows[0];
    const evvTotal = parseInt(evv.total) || 0;
    const evvCompliant = parseInt(evv.compliant) || 0;
    const evvComplianceRate = evvTotal > 0 ? (evvCompliant / evvTotal) * 100 : 0;

    // Onboarding progress
    const onboardingResult = await pool.query(`
      SELECT
        COUNT(*) as active_count,
        AVG(completion_percentage) as avg_completion,
        COUNT(*) FILTER (WHERE health_status = 'overdue') as overdue_count
      FROM onboarding_instances
      WHERE organization_id = $1 AND status NOT IN ('completed', 'cancelled')
    `, [organizationId]).catch(() => ({ rows: [{ active_count: 0, avg_completion: 0, overdue_count: 0 }] }));

    const onboarding = onboardingResult.rows[0];

    // Expiring credentials list (detailed)
    const expiringListResult = await pool.query(`
      SELECT
        ta.id,
        u.first_name,
        u.last_name,
        ta.training_type,
        ta.expires_at,
        CASE
          WHEN ta.expires_at <= CURRENT_DATE THEN 'expired'
          WHEN ta.expires_at <= CURRENT_DATE + interval '7 days' THEN 'critical'
          WHEN ta.expires_at <= CURRENT_DATE + interval '14 days' THEN 'warning'
          ELSE 'upcoming'
        END as urgency
      FROM training_assignments ta
      JOIN users u ON u.id = ta.user_id
      WHERE ta.organization_id = $1
        AND ta.status = 'completed'
        AND ta.expires_at <= CURRENT_DATE + interval '30 days'
      ORDER BY ta.expires_at
      LIMIT 20
    `, [organizationId]).catch(() => ({ rows: [] }));

    // Calculate overall compliance score
    const credentialScore = 100 - (parseInt(credentials.expired) * 5) - (parseInt(credentials.expiring_7d) * 2);
    const overallScore = Math.max(0, Math.min(100, (evvComplianceRate * 0.4 + trainingCompletionRate * 0.3 + credentialScore * 0.3)));

    res.json({
      overallScore: Math.round(overallScore),
      credentials: {
        current: parseInt(credentials.current) || 0,
        expiring7d: parseInt(credentials.expiring_7d) || 0,
        expiring14d: parseInt(credentials.expiring_14d) || 0,
        expiring30d: parseInt(credentials.expiring_30d) || 0,
        expired: parseInt(credentials.expired) || 0
      },
      training: {
        completed: trainingCompleted,
        inProgress: parseInt(training.in_progress) || 0,
        overdue: parseInt(training.overdue) || 0,
        completionRate: Math.round(trainingCompletionRate * 10) / 10
      },
      evv: {
        complianceRate: Math.round(evvComplianceRate * 10) / 10,
        total: evvTotal,
        compliant: evvCompliant
      },
      onboarding: {
        activeCount: parseInt(onboarding.active_count) || 0,
        avgCompletion: Math.round(parseFloat(onboarding.avg_completion) || 0),
        overdueCount: parseInt(onboarding.overdue_count) || 0
      },
      expiringCredentials: expiringListResult.rows.map(r => ({
        id: r.id,
        staffName: `${r.first_name} ${r.last_name}`,
        type: r.training_type,
        expiresAt: r.expires_at,
        urgency: r.urgency
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/executive/alerts
 * Executive alerts requiring attention
 */
router.get('/alerts', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    const alerts: Array<{
      id: string;
      severity: 'critical' | 'warning' | 'info';
      title: string;
      description: string;
      value: number;
      action: string;
    }> = [];

    // AR over 90 days
    const ar90Result = await pool.query(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(billed_amount - COALESCE(paid_amount, 0)), 0) as amount
      FROM claims
      WHERE organization_id = $1
        AND status NOT IN ('paid', 'denied', 'adjusted')
        AND CURRENT_DATE - created_at::date > 90
    `, [organizationId]).catch(() => ({ rows: [{ count: 0, amount: 0 }] }));

    if (parseFloat(ar90Result.rows[0].amount) > 0) {
      alerts.push({
        id: 'ar-90-plus',
        severity: 'critical',
        title: 'AR Over 90 Days',
        description: `$${Math.round(parseFloat(ar90Result.rows[0].amount)).toLocaleString()} in claims outstanding over 90 days`,
        value: parseFloat(ar90Result.rows[0].amount),
        action: '/dashboard/billing'
      });
    }

    // Expired credentials
    const expiredCredsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM training_assignments
      WHERE organization_id = $1 AND status = 'completed' AND expires_at <= CURRENT_DATE
    `, [organizationId]).catch(() => ({ rows: [{ count: 0 }] }));

    if (parseInt(expiredCredsResult.rows[0].count) > 0) {
      alerts.push({
        id: 'expired-credentials',
        severity: 'critical',
        title: 'Expired Credentials',
        description: `${expiredCredsResult.rows[0].count} staff member(s) have expired credentials`,
        value: parseInt(expiredCredsResult.rows[0].count),
        action: '/dashboard/hr/credentials'
      });
    }

    // Credentials expiring in 7 days
    const expiringCredsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM training_assignments
      WHERE organization_id = $1
        AND status = 'completed'
        AND expires_at > CURRENT_DATE
        AND expires_at <= CURRENT_DATE + interval '7 days'
    `, [organizationId]).catch(() => ({ rows: [{ count: 0 }] }));

    if (parseInt(expiringCredsResult.rows[0].count) > 0) {
      alerts.push({
        id: 'expiring-credentials',
        severity: 'warning',
        title: 'Credentials Expiring This Week',
        description: `${expiringCredsResult.rows[0].count} credential(s) expiring in the next 7 days`,
        value: parseInt(expiringCredsResult.rows[0].count),
        action: '/dashboard/hr/credentials'
      });
    }

    // EVV rejections
    const evvRejectionsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM evv_records
      WHERE organization_id = $1 AND sandata_status IN ('rejected', 'error')
    `, [organizationId]).catch(() => ({ rows: [{ count: 0 }] }));

    if (parseInt(evvRejectionsResult.rows[0].count) > 0) {
      alerts.push({
        id: 'evv-rejections',
        severity: 'warning',
        title: 'EVV Records Requiring Attention',
        description: `${evvRejectionsResult.rows[0].count} EVV record(s) rejected or have errors`,
        value: parseInt(evvRejectionsResult.rows[0].count),
        action: '/dashboard/operations/evv'
      });
    }

    // Overdue training
    const overdueTrainingResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM training_assignments
      WHERE organization_id = $1 AND status NOT IN ('completed', 'waived') AND due_date < CURRENT_DATE
    `, [organizationId]).catch(() => ({ rows: [{ count: 0 }] }));

    if (parseInt(overdueTrainingResult.rows[0].count) > 0) {
      alerts.push({
        id: 'overdue-training',
        severity: 'warning',
        title: 'Overdue Training',
        description: `${overdueTrainingResult.rows[0].count} training assignment(s) are overdue`,
        value: parseInt(overdueTrainingResult.rows[0].count),
        action: '/dashboard/hr/training'
      });
    }

    // Open positions > 30 days
    const openPositionsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM job_requisitions
      WHERE organization_id = $1 AND status = 'open' AND created_at < CURRENT_DATE - interval '30 days'
    `, [organizationId]).catch(() => ({ rows: [{ count: 0 }] }));

    if (parseInt(openPositionsResult.rows[0].count) > 0) {
      alerts.push({
        id: 'open-positions',
        severity: 'info',
        title: 'Open Positions (30+ Days)',
        description: `${openPositionsResult.rows[0].count} position(s) have been open for over 30 days`,
        value: parseInt(openPositionsResult.rows[0].count),
        action: '/dashboard/hr/recruiting'
      });
    }

    // Sort by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    res.json({ alerts });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/executive/trends/:type
 * 12-month trend data for charts
 */
router.get('/trends/:type', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { type } = req.params;

    let data: Array<{ month: string; value: number; label?: string }> = [];

    if (type === 'revenue') {
      const result = await pool.query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE - interval '11 months'),
            date_trunc('month', CURRENT_DATE),
            '1 month'::interval
          ) as month
        )
        SELECT
          to_char(m.month, 'Mon') as month_label,
          m.month as month_date,
          COALESCE(SUM(CASE WHEN c.status IN ('paid', 'submitted', 'accepted') THEN c.billed_amount ELSE 0 END), 0) as value
        FROM months m
        LEFT JOIN claims c ON date_trunc('month', c.created_at) = m.month AND c.organization_id = $1
        GROUP BY m.month
        ORDER BY m.month
      `, [organizationId]).catch(() => ({ rows: [] }));

      data = result.rows.map(r => ({
        month: r.month_label,
        value: parseFloat(r.value) || 0
      }));
    } else if (type === 'visits') {
      const result = await pool.query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE - interval '11 months'),
            date_trunc('month', CURRENT_DATE),
            '1 month'::interval
          ) as month
        )
        SELECT
          to_char(m.month, 'Mon') as month_label,
          m.month as month_date,
          COUNT(s.id) as total,
          COUNT(s.id) FILTER (WHERE s.status = 'completed') as completed
        FROM months m
        LEFT JOIN shifts s ON date_trunc('month', s.scheduled_start) = m.month AND s.organization_id = $1
        GROUP BY m.month
        ORDER BY m.month
      `, [organizationId]).catch(() => ({ rows: [] }));

      data = result.rows.map(r => ({
        month: r.month_label,
        value: parseInt(r.completed) || 0,
        label: `${r.completed}/${r.total}`
      }));
    } else if (type === 'evv') {
      const result = await pool.query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE - interval '11 months'),
            date_trunc('month', CURRENT_DATE),
            '1 month'::interval
          ) as month
        )
        SELECT
          to_char(m.month, 'Mon') as month_label,
          m.month as month_date,
          COUNT(e.id) as total,
          COUNT(e.id) FILTER (WHERE e.sandata_status = 'accepted') as compliant
        FROM months m
        LEFT JOIN evv_records e ON date_trunc('month', e.service_date) = m.month AND e.organization_id = $1
        GROUP BY m.month
        ORDER BY m.month
      `, [organizationId]).catch(() => ({ rows: [] }));

      data = result.rows.map(r => {
        const total = parseInt(r.total) || 0;
        const compliant = parseInt(r.compliant) || 0;
        const rate = total > 0 ? (compliant / total) * 100 : 0;
        return {
          month: r.month_label,
          value: Math.round(rate * 10) / 10
        };
      });
    } else if (type === 'census') {
      // Patient census trend - count active patients at end of each month
      const result = await pool.query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE - interval '11 months'),
            date_trunc('month', CURRENT_DATE),
            '1 month'::interval
          ) as month
        )
        SELECT
          to_char(m.month, 'Mon') as month_label,
          m.month as month_date,
          COUNT(c.id) FILTER (WHERE c.admission_date <= m.month + interval '1 month' - interval '1 day'
            AND (c.discharge_date IS NULL OR c.discharge_date >= m.month)) as active_count
        FROM months m
        LEFT JOIN clients c ON c.organization_id = $1
        GROUP BY m.month
        ORDER BY m.month
      `, [organizationId]).catch(() => ({ rows: [] }));

      data = result.rows.map(r => ({
        month: r.month_label,
        value: parseInt(r.active_count) || 0
      }));
    } else if (type === 'turnover') {
      const result = await pool.query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE - interval '11 months'),
            date_trunc('month', CURRENT_DATE),
            '1 month'::interval
          ) as month
        )
        SELECT
          to_char(m.month, 'Mon') as month_label,
          m.month as month_date,
          COUNT(u.id) as terminations
        FROM months m
        LEFT JOIN users u ON date_trunc('month', u.termination_date) = m.month
          AND u.organization_id = $1
          AND u.role IN ('caregiver', 'dsp_basic', 'dsp_med', 'hha', 'cna', 'rn_case_manager', 'lpn_lvn', 'therapist', 'qidp')
        GROUP BY m.month
        ORDER BY m.month
      `, [organizationId]).catch(() => ({ rows: [] }));

      data = result.rows.map(r => ({
        month: r.month_label,
        value: parseInt(r.terminations) || 0
      }));
    }

    res.json({ type, data });
  } catch (error) {
    next(error);
  }
});

export default router;
