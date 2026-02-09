import { geminiFlash, isAIAvailable } from '../gemini';
import { buildSystemPrompt, buildUserPrompt } from './prompts';
import type { TripContext, GeneratedItinerary, GeneratedDay } from './schemas';

export type { TripContext, GeneratedItinerary, GeneratedDay };

/**
 * Result of itinerary generation
 */
export interface GenerationResult {
    success: boolean;
    itinerary?: GeneratedItinerary;
    error?: string;
    fallback?: boolean; // true if we fell back to empty days
}

/**
 * Generate a complete trip itinerary using Gemini AI
 * 
 * @param context - Trip context with all preferences
 * @returns GenerationResult with itinerary or error
 */
export async function generateItinerary(context: TripContext): Promise<GenerationResult> {
    // Check if AI is available
    if (!isAIAvailable() || !geminiFlash) {
        console.warn('AI not available, returning empty itinerary');
        return {
            success: true,
            itinerary: createFallbackItinerary(context),
            fallback: true
        };
    }

    try {
        const systemPrompt = buildSystemPrompt();
        const userPrompt = buildUserPrompt(context);

        console.log('🤖 Generating itinerary with AI...');
        console.log('Context:', {
            destinations: context.destinations,
            days: context.durationDays,
            budget: context.budget,
            rhythm: context.rhythm
        });

        // Call Gemini API
        const result = await geminiFlash.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: systemPrompt },
                        { text: userPrompt }
                    ]
                }
            ]
        });

        const response = result.response;
        const text = response.text();

        // Parse JSON response
        let itinerary: GeneratedItinerary;
        try {
            itinerary = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse AI response:', text);
            throw new Error('Invalid JSON response from AI');
        }

        // Validate basic structure
        if (!itinerary.title || !itinerary.days || !Array.isArray(itinerary.days)) {
            throw new Error('Invalid itinerary structure');
        }

        // Ensure we have the right number of days
        if (itinerary.days.length !== context.durationDays) {
            console.warn(`AI generated ${itinerary.days.length} days, expected ${context.durationDays}. Adjusting...`);
            itinerary = adjustDaysCount(itinerary, context.durationDays);
        }

        console.log('✅ Itinerary generated successfully:', itinerary.title);

        return {
            success: true,
            itinerary
        };

    } catch (error: any) {
        console.error('❌ AI generation failed:', error);

        // Return fallback on error
        return {
            success: true,
            itinerary: createFallbackItinerary(context),
            fallback: true,
            error: error.message
        };
    }
}

/**
 * Create a fallback itinerary with empty days
 */
function createFallbackItinerary(context: TripContext): GeneratedItinerary {
    const days: GeneratedDay[] = [];

    for (let i = 1; i <= context.durationDays; i++) {
        days.push({
            dayIndex: i,
            title: `Jour ${i}`,
            location: context.destinations[0] || 'À définir',
            activities: []
        });
    }

    return {
        title: `Voyage à ${context.destinations.join(', ') || 'Nouvelle Destination'}`,
        days
    };
}

/**
 * Adjust days count if AI generated wrong number
 */
function adjustDaysCount(itinerary: GeneratedItinerary, targetDays: number): GeneratedItinerary {
    const currentDays = itinerary.days.length;

    if (currentDays < targetDays) {
        // Add missing empty days
        for (let i = currentDays + 1; i <= targetDays; i++) {
            itinerary.days.push({
                dayIndex: i,
                title: `Jour ${i}`,
                location: itinerary.days[currentDays - 1]?.location || 'À définir',
                activities: []
            });
        }
    } else if (currentDays > targetDays) {
        // Trim excess days
        itinerary.days = itinerary.days.slice(0, targetDays);
    }

    // Re-index days
    itinerary.days.forEach((day, index) => {
        day.dayIndex = index + 1;
    });

    return itinerary;
}
