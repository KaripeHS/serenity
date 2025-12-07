import { createLogger } from '../../utils/logger';

const logger = createLogger('clinical-nlp-service');

export interface AnalysisResult {
    sentiment: 'positive' | 'neutral' | 'negative';
    riskScore: number; // 0-100
    flags: string[];
    keywords: string[];
}

export class ClinicalNLPService {

    /**
     * Analyze a care note for clinical risks using keyword matching (MVP)
     * In production, this would call OpenAI/Google Cloud NLP
     */
    async analyzeNote(text: string): Promise<AnalysisResult> {
        const lowerText = text.toLowerCase();
        const flags: string[] = [];
        const keywords: string[] = [];
        let riskScore = 0;

        // 1. Decline Indicators (High Risk)
        const declineKeywords = ['fall', 'fell', 'wobbly', 'unsteady', 'confused', 'agitated', 'refused meds', 'refused food', 'pain', 'bruise'];

        declineKeywords.forEach(word => {
            if (lowerText.includes(word)) {
                flags.push(`Risk Indicator: "${word}"`);
                keywords.push(word);
                riskScore += 20;
            }
        });

        // 2. Positive Indicators (Mitigation)
        const positiveKeywords = ['happy', 'ate well', 'slept well', 'good mood', 'stable', 'walked'];
        positiveKeywords.forEach(word => {
            if (lowerText.includes(word)) {
                riskScore -= 5;
            }
        });

        // Clamp score
        riskScore = Math.max(0, Math.min(100, riskScore));

        // Determine sentiment
        let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
        if (riskScore > 30) sentiment = 'negative';
        if (riskScore < 10 && keywords.length === 0) sentiment = 'positive';

        logger.info(`Analyzed note. Score: ${riskScore}, Flags: ${flags.length}`);

        return {
            sentiment,
            riskScore,
            flags,
            keywords
        };
    }

    /**
     * Calculate aggregate risk score for a patient based on recent history
     */
    async calculatePatientRiskScore(patientId: string): Promise<{ score: number; trend: 'improving' | 'stable' | 'declining' }> {
        // Mock implementation - would normally query DB for last 7 days of notes
        logger.info(`Calculating aggregate risk for patient ${patientId}`);

        return {
            score: 15, // Low risk
            trend: 'stable'
        };
    }
}
