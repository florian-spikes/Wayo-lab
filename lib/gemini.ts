import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('⚠️ VITE_GEMINI_API_KEY not configured - AI features will be disabled');
}

// Create Gemini client only if API key is valid
export const genAI = apiKey && apiKey !== 'your_gemini_api_key_here'
    ? new GoogleGenerativeAI(apiKey)
    : null;

// Gemini 2.0 Flash model - fast and cost-effective for structured generation
export const geminiFlash = genAI?.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7, // Balanced creativity
    },
});

// Check if AI is available
export const isAIAvailable = (): boolean => {
    return genAI !== null && geminiFlash !== null;
};
