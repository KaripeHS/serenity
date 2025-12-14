/**
 * Voice-to-Text Service
 * Integrates with Google Cloud Speech-to-Text API
 *
 * Features:
 * - Real-time speech recognition
 * - Audio file transcription
 * - Multiple language support
 * - Medical terminology optimization
 * - Automatic punctuation
 */

import axios from 'axios';
import { pool } from '../../config/database';


import { createLogger } from '../../utils/logger';

const logger = createLogger('voice-to-text');
interface TranscriptionResult {
  transcript: string;
  confidence: number;
  languageCode: string;
  words?: Array<{
    word: string;
    startTime: number; // seconds
    endTime: number; // seconds
    confidence: number;
  }>;
}

interface TranscriptionRequest {
  audio: {
    content?: string; // Base64 encoded audio
    uri?: string; // Cloud Storage URI
  };
  config: {
    encoding: 'LINEAR16' | 'FLAC' | 'MULAW' | 'AMR' | 'AMR_WB' | 'OGG_OPUS' | 'WEBM_OPUS';
    sampleRateHertz: number;
    languageCode: string;
    enableAutomaticPunctuation?: boolean;
    enableWordTimeOffsets?: boolean;
    model?: 'default' | 'medical_conversation' | 'command_and_search';
    useEnhanced?: boolean;
  };
}

export class VoiceToTextService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://speech.googleapis.com/v1';

  constructor() {
    this.apiKey = process.env.GOOGLE_CLOUD_SPEECH_API_KEY || '';

    if (!this.apiKey) {
      logger.warn('[VoiceToText] Google Cloud Speech API key not configured. Voice features will be disabled.');
    }
  }

  /**
   * Transcribe audio content
   */
  async transcribe(
    audioContent: string, // Base64 encoded
    encoding: TranscriptionRequest['config']['encoding'] = 'WEBM_OPUS',
    sampleRate: number = 48000,
    languageCode: string = 'en-US'
  ): Promise<TranscriptionResult | null> {
    if (!this.apiKey) {
      logger.error('[VoiceToText] API key not configured');
      return null;
    }

    try {
      const request: TranscriptionRequest = {
        audio: {
          content: audioContent
        },
        config: {
          encoding,
          sampleRateHertz: sampleRate,
          languageCode,
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
          model: 'medical_conversation', // Optimized for healthcare
          useEnhanced: true
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/speech:recognize?key=${this.apiKey}`,
        request,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.results || response.data.results.length === 0) {
        logger.error('[VoiceToText] No transcription results');
        return null;
      }

      // Get the best alternative (highest confidence)
      const result = response.data.results[0];
      const alternative = result.alternatives[0];

      // Extract word timings
      const words = alternative.words?.map((w: any) => ({
        word: w.word,
        startTime: parseFloat(w.startTime?.replace('s', '') || '0'),
        endTime: parseFloat(w.endTime?.replace('s', '') || '0'),
        confidence: w.confidence || 0
      }));

      return {
        transcript: alternative.transcript,
        confidence: alternative.confidence || 0,
        languageCode,
        words
      };
    } catch (error) {
      logger.error('[VoiceToText] Transcription error:', error);
      return null;
    }
  }

  /**
   * Transcribe care note from audio
   */
  async transcribeCareNote(
    caregiverId: string,
    visitId: string,
    audioContent: string,
    encoding: TranscriptionRequest['config']['encoding'] = 'WEBM_OPUS',
    sampleRate: number = 48000
  ): Promise<{
    noteId: string;
    transcript: string;
    confidence: number;
  } | null> {
    try {
      // Transcribe audio
      const result = await this.transcribe(audioContent, encoding, sampleRate);

      if (!result) {
        throw new Error('Transcription failed');
      }

      // Save to care_notes table
      const noteResult = await pool.query(
        `
        INSERT INTO care_notes (
          visit_id,
          caregiver_id,
          note_type,
          content,
          transcription_confidence,
          created_at
        ) VALUES ($1, $2, 'voice_note', $3, $4, NOW())
        RETURNING id
        `,
        [visitId, caregiverId, result.transcript, result.confidence]
      );

      return {
        noteId: noteResult.rows[0].id,
        transcript: result.transcript,
        confidence: result.confidence
      };
    } catch (error) {
      logger.error('[VoiceToText] Error transcribing care note:', error);
      return null;
    }
  }

  /**
   * Transcribe incident report from audio
   */
  async transcribeIncidentReport(
    caregiverId: string,
    organizationId: string,
    audioContent: string,
    encoding: TranscriptionRequest['config']['encoding'] = 'WEBM_OPUS',
    sampleRate: number = 48000
  ): Promise<{
    transcript: string;
    confidence: number;
    extractedData: {
      incidentType?: string;
      severity?: string;
      clientName?: string;
      location?: string;
    };
  } | null> {
    try {
      // Transcribe audio
      const result = await this.transcribe(audioContent, encoding, sampleRate);

      if (!result) {
        throw new Error('Transcription failed');
      }

      // Extract structured data from transcript using keyword matching
      const extractedData = this.extractIncidentData(result.transcript);

      return {
        transcript: result.transcript,
        confidence: result.confidence,
        extractedData
      };
    } catch (error) {
      logger.error('[VoiceToText] Error transcribing incident report:', error);
      return null;
    }
  }

  /**
   * Extract incident data from transcript using keyword matching
   */
  private extractIncidentData(transcript: string): {
    incidentType?: string;
    severity?: string;
    clientName?: string;
    location?: string;
  } {
    const lower = transcript.toLowerCase();
    const data: any = {};

    // Detect incident type
    if (lower.includes('fall') || lower.includes('fell')) {
      data.incidentType = 'fall';
    } else if (lower.includes('injury') || lower.includes('injured')) {
      data.incidentType = 'injury';
    } else if (lower.includes('medication error') || lower.includes('wrong medication')) {
      data.incidentType = 'medication_error';
    } else if (lower.includes('abuse') || lower.includes('mistreatment')) {
      data.incidentType = 'abuse_suspicion';
    } else if (lower.includes('death') || lower.includes('passed away')) {
      data.incidentType = 'death';
    }

    // Detect severity
    if (lower.includes('critical') || lower.includes('severe') || lower.includes('emergency')) {
      data.severity = 'critical';
    } else if (lower.includes('serious') || lower.includes('reportable')) {
      data.severity = 'reportable';
    } else {
      data.severity = 'unusual_occurrence';
    }

    // Try to extract location
    const locationPatterns = [
      /at (?:the )?([a-z\s]+(?:room|bathroom|kitchen|bedroom|living room|hallway))/i,
      /in (?:the )?([a-z\s]+(?:room|bathroom|kitchen|bedroom|living room|hallway))/i,
      /location:?\s*([a-z\s]+)/i
    ];

    for (const pattern of locationPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        data.location = match[1].trim();
        break;
      }
    }

    return data;
  }

  /**
   * Voice command recognition for navigation
   */
  async recognizeCommand(
    audioContent: string,
    encoding: TranscriptionRequest['config']['encoding'] = 'WEBM_OPUS',
    sampleRate: number = 48000
  ): Promise<{
    command: string;
    action: 'navigate' | 'check_in' | 'check_out' | 'call_client' | 'call_office' | 'unknown';
    parameters?: any;
  } | null> {
    try {
      const result = await this.transcribe(audioContent, encoding, sampleRate, 'en-US');

      if (!result) {
        return null;
      }

      const command = result.transcript.toLowerCase();

      // Parse command
      let action: 'navigate' | 'check_in' | 'check_out' | 'call_client' | 'call_office' | 'unknown' = 'unknown';
      let parameters: any = {};

      if (command.includes('navigate') || command.includes('directions') || command.includes('route')) {
        action = 'navigate';
      } else if (command.includes('check in') || command.includes('check-in') || command.includes('checkin')) {
        action = 'check_in';
      } else if (command.includes('check out') || command.includes('check-out') || command.includes('checkout')) {
        action = 'check_out';
      } else if (command.includes('call client') || command.includes('phone client')) {
        action = 'call_client';
      } else if (command.includes('call office') || command.includes('phone office')) {
        action = 'call_office';
      }

      return {
        command: result.transcript,
        action,
        parameters
      };
    } catch (error) {
      logger.error('[VoiceToText] Error recognizing command:', error);
      return null;
    }
  }

  /**
   * Save transcription history
   */
  async saveTranscriptionHistory(
    userId: string,
    organizationId: string,
    audioType: 'care_note' | 'incident_report' | 'command' | 'general',
    transcript: string,
    confidence: number,
    duration?: number
  ): Promise<string> {
    const result = await pool.query(
      `
      INSERT INTO voice_transcription_history (
        user_id,
        organization_id,
        audio_type,
        transcript,
        confidence,
        duration_seconds,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id
      `,
      [userId, organizationId, audioType, transcript, confidence, duration]
    );

    return result.rows[0].id;
  }

  /**
   * Get transcription history for user
   */
  async getTranscriptionHistory(
    userId: string,
    limit: number = 50
  ): Promise<Array<{
    id: string;
    audioType: string;
    transcript: string;
    confidence: number;
    duration?: number;
    createdAt: Date;
  }>> {
    const result = await pool.query(
      `
      SELECT
        id,
        audio_type,
        transcript,
        confidence,
        duration_seconds,
        created_at
      FROM voice_transcription_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [userId, limit]
    );

    return result.rows.map(row => ({
      id: row.id,
      audioType: row.audio_type,
      transcript: row.transcript,
      confidence: row.confidence,
      duration: row.duration_seconds,
      createdAt: row.created_at
    }));
  }

  /**
   * Validate audio encoding and sample rate
   */
  validateAudioConfig(
    encoding: string,
    sampleRate: number
  ): {
    valid: boolean;
    error?: string;
  } {
    const supportedEncodings = [
      'LINEAR16',
      'FLAC',
      'MULAW',
      'AMR',
      'AMR_WB',
      'OGG_OPUS',
      'WEBM_OPUS'
    ];

    if (!supportedEncodings.includes(encoding)) {
      return {
        valid: false,
        error: `Unsupported encoding: ${encoding}. Supported: ${supportedEncodings.join(', ')}`
      };
    }

    if (sampleRate < 8000 || sampleRate > 48000) {
      return {
        valid: false,
        error: 'Sample rate must be between 8000 and 48000 Hz'
      };
    }

    return { valid: true };
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en-US', name: 'English (United States)' },
      { code: 'en-GB', name: 'English (United Kingdom)' },
      { code: 'es-ES', name: 'Spanish (Spain)' },
      { code: 'es-US', name: 'Spanish (United States)' },
      { code: 'fr-FR', name: 'French (France)' },
      { code: 'de-DE', name: 'German (Germany)' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'ja-JP', name: 'Japanese (Japan)' },
      { code: 'ko-KR', name: 'Korean (South Korea)' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)' },
      { code: 'ru-RU', name: 'Russian (Russia)' },
      { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' }
    ];
  }
}

export const voiceToTextService = new VoiceToTextService();
