import { getDbClient } from '../../database/client';
import { createLogger } from '../../utils/logger';
import { FinancialSafeguardService } from '../finance/safeguard.service';
import { EmailService } from '../../services/notifications/email.service';

const logger = createLogger('spi-service');

export interface SPIWeights {
  attendance_weight: number;       // Default: 0.30
  quality_weight: number;          // Default: 0.25
  documentation_weight: number;    // Default: 0.25
  collaboration_weight: number;    // Default: 0.10
  learning_weight: number;         // Default: 0.10
}

export interface SPIComponents {
  attendance: number;      // 0-100
  quality: number;         // 0-100
  documentation: number;   // 0-100
  collaboration: number;   // 0-100
  learning: number;        // 0-100
}

export interface SPIResult {
  caregiverId: string;
  month: string;
  overallScore: number;
  components: SPIComponents;
  weights: SPIWeights;
  earnedOTEligible: boolean;
  tier: 'exceptional' | 'good' | 'needs_improvement' | 'probation';
  calculatedAt: Date;
}

export class SPIService {
  private defaultWeights: SPIWeights = {
    attendance_weight: 0.30,
    quality_weight: 0.25,
    documentation_weight: 0.25,
    collaboration_weight: 0.10,
    learning_weight: 0.10
  };

  /**
   * Calculate overall SPI for a caregiver for a given month
   */
  async calculateMonthlySPI(caregiverId: string, month: string): Promise<SPIResult> {
    // Get component scores
    const attendance = await this.calculateAttendance(caregiverId, month);
    const quality = await this.calculateQuality(caregiverId, month);
    const documentation = await this.calculateDocumentation(caregiverId, month);
    const collaboration = await this.calculateCollaboration(caregiverId, month);
    const learning = await this.calculateLearning(caregiverId, month);

    // Get weights (from config or use defaults)
    const weights = await this.getWeights();

    // Calculate weighted overall score
    const overallScore = Math.round(
      attendance * weights.attendance_weight +
      quality * weights.quality_weight +
      documentation * weights.documentation_weight +
      collaboration * weights.collaboration_weight +
      learning * weights.learning_weight
    );

    // Determine tier
    let tier: SPIResult['tier'];
    if (overallScore >= 95) tier = 'exceptional';
    else if (overallScore >= 80) tier = 'good';
    else if (overallScore >= 60) tier = 'needs_improvement';
    else tier = 'probation';

    return {
      caregiverId,
      month,
      overallScore,
      components: {
        attendance,
        quality,
        documentation,
        collaboration,
        learning
      },
      weights,
      earnedOTEligible: overallScore >= 80,
      tier,
      calculatedAt: new Date()
    };
  }

  /**
   * Calculate Attendance Score (30% weight)
   *
   * Factors:
   * - On-time clock-ins (within 5 minutes of scheduled start)
   * - No-shows (absent without notice)
   * - Call-outs (absent with notice)
   *
   * Formula:
   * - Base: (visits_on_time / total_scheduled_visits) * 100
   * - Penalty: -10 points per no-show
   * - Penalty: -3 points per call-out
   */
  private async calculateAttendance(caregiverId: string, month: string): Promise<number> {
    const db = getDbClient();

    // Query real attendance data from EVV records and shifts
    const result = await db.query(`
      SELECT
        COUNT(*) as total_visits,
        COUNT(CASE WHEN e.clock_in_time <= s.scheduled_start + INTERVAL '5 minutes' THEN 1 END) as on_time_visits,
        COUNT(CASE WHEN s.status = 'no_show' THEN 1 END) as no_shows,
        COUNT(CASE WHEN s.status = 'cancelled' AND s.notes ILIKE '%call out%' THEN 1 END) as call_outs
      FROM shifts s
      LEFT JOIN evv_records e ON s.id = e.visit_id
      WHERE s.caregiver_id = $1
        AND DATE_TRUNC('month', s.scheduled_start) = $2::date
        AND s.status IN ('completed', 'no_show', 'cancelled')
    `, [caregiverId, month]);

    const data = result.rows[0];
    const totalVisits = parseInt(data.total_visits || '0');
    const onTimeVisits = parseInt(data.on_time_visits || '0');
    const noShows = parseInt(data.no_shows || '0');
    const callOuts = parseInt(data.call_outs || '0');

    if (totalVisits === 0) return 0;

    const onTimeRate = (onTimeVisits / totalVisits) * 100;
    const noShowPenalty = noShows * 10;
    const callOutPenalty = callOuts * 3;

    const score = Math.max(0, Math.min(100, onTimeRate - noShowPenalty - callOutPenalty));
    return Math.round(score);
  }

  /**
   * Calculate Quality Score (25% weight)
   *
   * Factors:
   * - Family survey ratings (0-5 stars)
   * - Supervisor observations
   * - Client complaints
   * - Positive feedback
   *
   * Formula:
   * - Base: (average_family_rating / 5) * 100
   * - Bonus: +5 points per positive feedback
   * - Penalty: -15 points per complaint
   */
  private async calculateQuality(caregiverId: string, month: string): Promise<number> {
    const db = getDbClient();
    const result = await db.query(`
      SELECT
        AVG(rating) as avg_rating,
        COUNT(CASE WHEN feedback_type = 'positive' THEN 1 END) as positive_count,
        COUNT(CASE WHEN feedback_type = 'complaint' THEN 1 END) as complaint_count
      FROM family_feedback
      WHERE caregiver_id = $1
        AND DATE_TRUNC('month', created_at) = $2::date
    `, [caregiverId, month]);

    const data = result.rows[0];
    const avgRating = parseFloat(data.avg_rating || '0');
    const positiveCount = parseInt(data.positive_count || '0');
    const complaintCount = parseInt(data.complaint_count || '0');

    if (avgRating === 0 && positiveCount === 0 && complaintCount === 0) return 100; // Default to 100 if no feedback? Or 0? Assuming neutral start.

    const baseScore = avgRating > 0 ? (avgRating / 5) * 100 : 100; // Default to 100 if no ratings yet
    const positiveBonus = Math.min(15, positiveCount * 5); // Cap at +15
    const complaintPenalty = complaintCount * 15;

    const score = Math.max(0, Math.min(100, baseScore + positiveBonus - complaintPenalty));
    return Math.round(score);
  }

  /**
   * Calculate Documentation Score (25% weight)
   *
   * Factors:
   * - Visit note completeness (all required fields filled)
   * - Sandata acceptance rate (visits accepted on first submission)
   * - Timeliness of documentation (within 24 hours)
   *
   * Formula:
   * - Note completeness (40%): (complete_notes / total_visits) * 40
   * - Sandata acceptance (40%): (accepted_visits / submitted_visits) * 40
   * - Timeliness (20%): (on_time_docs / total_visits) * 20
   */
  private async calculateDocumentation(caregiverId: string, month: string): Promise<number> {
    const db = getDbClient();
    const result = await db.query(`
      SELECT
        COUNT(*) as total_visits,
        COUNT(CASE WHEN note_complete = true THEN 1 END) as complete_notes,
        COUNT(CASE WHEN sandata_status = 'accepted' THEN 1 END) as accepted_visits,
        COUNT(CASE WHEN sandata_status IS NOT NULL THEN 1 END) as submitted_visits,
        COUNT(CASE WHEN clock_out_time - clock_in_time <= INTERVAL '24 hours' THEN 1 END) as on_time_docs
      FROM evv_records e
      JOIN shifts s ON s.id = e.visit_id -- Changed shift_id to visit_id based on previous file view
      WHERE e.caregiver_id = $1
        AND DATE_TRUNC('month', s.scheduled_start) = $2::date
    `, [caregiverId, month]);

    const data = result.rows[0];
    const totalVisits = parseInt(data.total_visits || '0');
    const completeNotes = parseInt(data.complete_notes || '0');
    const acceptedVisits = parseInt(data.accepted_visits || '0');
    const submittedVisits = parseInt(data.submitted_visits || '0');
    const onTimeDocs = parseInt(data.on_time_docs || '0');

    if (totalVisits === 0) return 0;

    const completenessScore = (completeNotes / totalVisits) * 40;
    const acceptanceScore = submittedVisits > 0
      ? (acceptedVisits / submittedVisits) * 40
      : 0;
    const timelinessScore = (onTimeDocs / totalVisits) * 20;

    const score = completenessScore + acceptanceScore + timelinessScore;
    return Math.round(score);
  }

  /**
   * Calculate Collaboration Score (10% weight)
   *
   * Factors:
   * - Peer feedback (from other caregivers)
   * - Team participation (meetings, huddles)
   * - Knowledge sharing (helping new caregivers)
   *
   * Formula:
   * - Base: 50 points (neutral)
   * - Peer feedback: +/-10 per positive/negative feedback
   * - Meeting attendance: +5 per meeting attended
   */
  private async calculateCollaboration(caregiverId: string, month: string): Promise<number> {
    const db = getDbClient();
    const result = await db.query(`
      SELECT
        COUNT(CASE WHEN feedback_type = 'positive' THEN 1 END) as positive_peer_feedback,
        COUNT(CASE WHEN feedback_type = 'negative' THEN 1 END) as negative_peer_feedback,
        COUNT(CASE WHEN attended = true THEN 1 END) as meetings_attended
      FROM (
        SELECT feedback_type, NULL as attended FROM peer_feedback WHERE caregiver_id = $1 AND DATE_TRUNC('month', created_at) = $2::date
        UNION ALL
        SELECT 'meeting' as feedback_type, attended FROM meeting_attendance WHERE caregiver_id = $1 AND DATE_TRUNC('month', meeting_date) = $2::date
      ) combined
    `, [caregiverId, month]);

    const data = result.rows[0];
    const positivePeerFeedback = parseInt(data.positive_peer_feedback || '0');
    const negativePeerFeedback = parseInt(data.negative_peer_feedback || '0');
    const meetingsAttended = parseInt(data.meetings_attended || '0');

    let score = 50; // Base neutral score
    score += positivePeerFeedback * 10;
    score -= negativePeerFeedback * 10;
    score += meetingsAttended * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate Learning Score (10% weight)
   *
   * Factors:
   * - Training completion rate (required trainings this month)
   * - Credential freshness (certifications not expired, not expiring soon)
   * - Optional training (extra courses taken)
   *
   * Formula:
   * - Required training (60%): (completed / required) * 60
   * - Credential status (30%): 30 if all current, -10 per expired/expiring
   * - Optional training (10%): +10 per optional course (max 10 points)
   */
  private async calculateLearning(caregiverId: string, month: string): Promise<number> {
    const db = getDbClient();
    const result = await db.query(`
      SELECT
        COUNT(CASE WHEN completed = true THEN 1 END) as completed_trainings,
        COUNT(*) as required_trainings,
        COUNT(CASE WHEN type = 'optional' AND completed = true THEN 1 END) as optional_trainings,
        COUNT(CASE WHEN expiration_date < NOW() OR expiration_date <= NOW() + INTERVAL '30 days' THEN 1 END) as credentials_issue
      FROM (
        SELECT completed, 'required' as type, NULL as expiration_date FROM training_assignments WHERE caregiver_id = $1 AND due_date <= $2::date + INTERVAL '1 month'
        UNION ALL
        SELECT completed, 'optional' as type, NULL as expiration_date FROM training_assignments WHERE caregiver_id = $1 AND type = 'optional' AND DATE_TRUNC('month', completed_at) = $2::date
        UNION ALL
        SELECT NULL as completed, 'credential' as type, expiration_date FROM credentials WHERE caregiver_id = $1
      ) combined
    `, [caregiverId, month]);

    const data = result.rows[0];
    const completedTrainings = parseInt(data.completed_trainings || '0');
    const requiredTrainings = parseInt(data.required_trainings || '0');
    const optionalTrainings = parseInt(data.optional_trainings || '0');
    const credentialsIssue = parseInt(data.credentials_issue || '0');

    let score = 0;

    // Required training score
    if (requiredTrainings > 0) {
      score += (completedTrainings / requiredTrainings) * 60;
    } else {
      score += 60; // No required trainings this month = full credit
    }

    // Credential status score
    if (credentialsIssue === 0) {
      score += 30; // All credentials current
    } else {
      score += Math.max(0, 30 - (credentialsIssue * 10));
    }

    // Optional training bonus
    score += Math.min(10, optionalTrainings * 10);

    return Math.round(Math.min(100, score));
  }

  /**
   * Get SPI weights from configuration
   * Falls back to default weights if not configured
   */
  private async getWeights(): Promise<SPIWeights> {
    const db = getDbClient();
    const result = await db.query<{
      attendance_weight: string;
      quality_weight: string;
      documentation_weight: string;
      collaboration_weight: string;
      learning_weight: string;
    }>(`
      SELECT
        attendance_weight,
        quality_weight,
        documentation_weight,
        collaboration_weight,
        learning_weight
      FROM configuration
      WHERE key = 'spi_weights'
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        attendance_weight: parseFloat(row.attendance_weight),
        quality_weight: parseFloat(row.quality_weight),
        documentation_weight: parseFloat(row.documentation_weight),
        collaboration_weight: parseFloat(row.collaboration_weight),
        learning_weight: parseFloat(row.learning_weight)
      };
    }

    return this.defaultWeights;
  }

  /**
   * Calculate 12-month rolling average SPI
   */
  async calculateRollingAverage(caregiverId: string): Promise<number> {
    const db = getDbClient();
    const result = await db.query<{ rolling_avg: string }>(`
      SELECT AVG(overall_score) as rolling_avg
      FROM spi_snapshots
      WHERE caregiver_id = $1
        AND month >= NOW() - INTERVAL '12 months'
    `, [caregiverId]);

    return parseFloat(result.rows[0]?.rolling_avg || '0');
  }

  /**
   * Get SPI history for a caregiver
   */
  async getSPIHistory(caregiverId: string, months: number = 12): Promise<SPIResult[]> {
    const db = getDbClient();
    const result = await db.query<any>(`
      SELECT
        caregiver_id,
        month,
        overall_score,
        attendance_score,
        quality_score,
        documentation_score,
        collaboration_score,
        learning_score,
        earned_ot_eligible,
        tier,
        calculated_at
      FROM spi_snapshots
      WHERE caregiver_id = $1
      ORDER BY month DESC
      LIMIT $2
    `, [caregiverId, months]);

    const weights = await this.getWeights();

    return result.rows.map(row => ({
      caregiverId: row.caregiver_id,
      month: row.month,
      overallScore: row.overall_score,
      components: {
        attendance: row.attendance_score,
        quality: row.quality_score,
        documentation: row.documentation_score,
        collaboration: row.collaboration_score,
        learning: row.learning_score
      },
      weights,
      earnedOTEligible: row.earned_ot_eligible,
      tier: row.tier,
      calculatedAt: row.calculated_at
    }));
  }

  /**
   * Save SPI calculation result to database
   */
  async saveSPISnapshot(result: SPIResult): Promise<void> {
    const db = getDbClient();
    await db.query(`
      INSERT INTO spi_snapshots (
        caregiver_id, month, overall_score,
        attendance_score, quality_score, documentation_score,
        collaboration_score, learning_score,
        earned_ot_eligible, tier, calculated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (caregiver_id, month)
      DO UPDATE SET
        overall_score = $3,
        attendance_score = $4,
        quality_score = $5,
        documentation_score = $6,
        collaboration_score = $7,
        learning_score = $8,
        earned_ot_eligible = $9,
        tier = $10,
        calculated_at = NOW()
    `, [
      result.caregiverId,
      result.month,
      result.overallScore,
      result.components.attendance,
      result.components.quality,
      result.components.documentation,
      result.components.collaboration,
      result.components.learning,
      result.earnedOTEligible,
      result.tier
    ]);

    console.log(`[SPI] Saved snapshot for caregiver ${result.caregiverId}, month ${result.month}: ${result.overallScore}`);
  }
  /**
   * Process monthly bonus based on SPI score
   * Includes Financial Safeguard checks (Budget Cap & Circuit Breaker)
   */
  async processMonthlyBonus(caregiverId: string, month: string, organizationId: string): Promise<{ success: boolean; message: string; amount?: number }> {
    const spiResult = await this.calculateMonthlySPI(caregiverId, month);

    // Determine bonus amount based on tier
    let bonusAmount = 0;
    if (spiResult.tier === 'exceptional') {
      bonusAmount = 100; // $100 bonus for exceptional performance
    } else if (spiResult.tier === 'good') {
      bonusAmount = 50;  // $50 bonus for good performance
    }

    if (bonusAmount === 0) {
      return { success: true, message: 'No bonus earned this month' };
    }

    // Initialize Safeguard Service (In a real app, inject this)
    const db = getDbClient();

    // Quick fix for dependency injection in this context
    const emailService = new EmailService();
    const safeguardService = new FinancialSafeguardService(db, emailService);

    // Validate Payout
    const safetyCheck = await safeguardService.validateBonusPayout(bonusAmount, caregiverId, organizationId);

    if (!safetyCheck.approved) {
      console.warn(`[SPI] Bonus blocked by safeguard: ${safetyCheck.reason}`);
      return {
        success: false,
        message: `Bonus blocked: ${safetyCheck.reason}`,
        amount: bonusAmount
      };
    }

    // Record Payout
    await safeguardService.recordPayout(bonusAmount, caregiverId, 'bonus', organizationId);
    console.log(`[SPI] Bonus of $${bonusAmount} processed for caregiver ${caregiverId}`);

    return {
      success: true,
      message: 'Bonus processed successfully',
      amount: bonusAmount
    };
  }
}

export const spiService = new SPIService();
