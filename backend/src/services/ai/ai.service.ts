
import OpenAI from 'openai';


import { createLogger } from '../../utils/logger';

const logger = createLogger('ai');
export class AIService {
    private openai: OpenAI | null = null;
    private readonly MODEL = 'gpt-3.5-turbo';
    private readonly MAX_TOKENS = 500;
    private readonly TEMPERATURE = 0.2;

    private getClient(): OpenAI {
        if (!this.openai) {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) {
                throw new Error('OPENAI_API_KEY not configured');
            }
            this.openai = new OpenAI({ apiKey });
        }
        return this.openai;
    }

    /**
     * Core Chat Function with Guardrails
     */
    async chat(messages: any[], userContext: { role: string; name: string; orgId: string }) {
        try {
            const client = this.getClient();

            // 1. Guardrail: System Prompt "Constitution"
            const systemPrompt = {
                role: 'system',
                content: `
You are Serenity AI, an operational assistant for Serenity Care Partners (Home Health Agency in Ohio).
YOUR MANDATE:
1. Compliance First: Adhere strictly to Ohio Medicaid EVV rules and HIPAA regulations.
2. No Medical Advice: Never provide diagnosis or treatment advice. Refer to clinical supervisors.
3. Scope Awareness: You are speaking to a ${userContext.role} named ${userContext.name}. ADJUST your answers to their permission level.
4. Accuracy Policy: If you are not 100% sure of a policy, do NOT hallucinate. State "I recommend checking with your supervisor regarding this specific policy."
5. Tone: Professional, concise, and supportive.

CONTEXT:
- EVV Rule: All visits must be verified electronically. Manual edits require a form.
- Overtime: Not authorized without prior written approval from the COO.
- HIPAA: Do not output full SSNs or patient financial details in this chat.
`
            };

            const response = await client.chat.completions.create({
                model: this.MODEL,
                messages: [systemPrompt, ...messages],
                temperature: this.TEMPERATURE,
                max_tokens: this.MAX_TOKENS,
            });

            const aiReply = response.choices[0]?.message?.content || "I apologize, I cannot answer that right now.";

            // 4. Guardrail: Output Filter (Basic Regex)
            if (this.detectUnsafeContent(aiReply)) {
                return "I generated a response, but it was flagged for potential policy violation. Please contact your administrator.";
            }

            return aiReply;

        } catch (error) {
            logger.error('[AIService] Error:', error);
            throw new Error('Failed to generate AI response');
        }
    }

    private detectUnsafeContent(content: string): boolean {
        const forbiddenTerms = [
            "ignore compliance", "skip evv", "fake visit",
            "medical diagnosis", "prescribe", "take this medication"
        ];
        const lower = content.toLowerCase();
        return forbiddenTerms.some(term => lower.includes(term));
    }
}

export const aiService = new AIService();
