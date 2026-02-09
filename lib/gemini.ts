import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('⚠️ VITE_GEMINI_API_KEY not configured - AI features will be disabled');
}

// Create Gemini client only if API key is valid
export const genAI = apiKey && apiKey !== 'your_gemini_api_key_here'
    ? new GoogleGenerativeAI(apiKey)
    : null;

// Primary model: Gemini 1.5 Pro - higher quality and rate limits
export const geminiPro = genAI?.getGenerativeModel({
    model: 'gemini-1.5-pro',
    generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 16000,
    },
});

// Fallback model: Gemini 2.0 Flash - faster but lower rate limits
export const geminiFlash = genAI?.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 16000,
    },
});

// Check if AI is available
export const isAIAvailable = (): boolean => {
    return genAI !== null && (geminiPro !== null || geminiFlash !== null);
};

// Helper: retry with exponential backoff
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Check if it's a rate limit error (429)
            const is429 = error?.message?.includes('429') || error?.status === 429;

            if (is429 && attempt < maxRetries - 1) {
                const delay = baseDelayMs * Math.pow(2, attempt);
                console.log(`⏳ Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }

    throw lastError;
}
