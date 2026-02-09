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

        console.log('📥 Raw AI response (first 500 chars):', text.substring(0, 500));

        // Parse JSON response
        let rawData: any;
        try {
            // Try to extract JSON from the response (handle potential markdown code blocks)
            let jsonText = text.trim();

            // Remove markdown code block if present
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.slice(7);
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.slice(3);
            }
            if (jsonText.endsWith('```')) {
                jsonText = jsonText.slice(0, -3);
            }
            jsonText = jsonText.trim();

            rawData = JSON.parse(jsonText);
            console.log('✅ JSON parsed successfully');
        } catch (parseError) {
            console.error('❌ Failed to parse AI response as JSON:', text);
            throw new Error('Invalid JSON response from AI');
        }

        // Normalize the response structure (handle different key names)
        const itinerary = normalizeItinerary(rawData, context);

        if (!itinerary) {
            console.error('❌ Could not normalize itinerary from:', rawData);
            throw new Error('Invalid itinerary structure');
        }

        // Ensure we have the right number of days
        if (itinerary.days.length !== context.durationDays) {
            console.warn(`AI generated ${itinerary.days.length} days, expected ${context.durationDays}. Adjusting...`);
            adjustDaysCount(itinerary, context.durationDays);
        }

        console.log('✅ Itinerary generated successfully:', itinerary.title);
        console.log('📊 Days:', itinerary.days.length, 'Activities:', itinerary.days.reduce((sum, d) => sum + d.activities.length, 0));

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
 * Normalize different possible response formats into our expected structure
 */
function normalizeItinerary(data: any, context: TripContext): GeneratedItinerary | null {
    console.log('🔄 Normalizing itinerary structure...');
    console.log('📋 Top-level keys:', Object.keys(data));
    console.log('📋 Is array:', Array.isArray(data));

    // CASE 1: AI returned an array directly (the days array)
    if (Array.isArray(data)) {
        console.log('📋 Response is a direct array of days');
        return normalizeFromDaysArray(data, context);
    }

    // CASE 2: Standard object with title and days
    // Try to extract title
    const title = data.title || data.titre || data.tripTitle || data.trip_title ||
        `Voyage à ${context.destinations.join(', ')}`;

    // Try to extract days array (handle various key names)
    let daysArray = data.days || data.jours || data.itinerary || data.itineraire ||
        data.schedule || data.planning;

    if (Array.isArray(daysArray)) {
        console.log('📅 Found days array with', daysArray.length, 'entries');
        const normalizedDays = normalizeDaysArray(daysArray, context);
        return {
            title,
            days: normalizedDays
        };
    }

    // CASE 3: Maybe the object itself is iterable (numbered keys like '0', '1', '2')
    const numericKeys = Object.keys(data).filter(k => /^\d+$/.test(k));
    if (numericKeys.length > 0) {
        console.log('📋 Found numeric keys, treating as array');
        const arrayFromObject = numericKeys
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(k => data[k]);
        return normalizeFromDaysArray(arrayFromObject, context);
    }

    console.error('❌ Could not find days array in response');
    return null;
}

/**
 * Normalize when we have a direct array of days
 */
function normalizeFromDaysArray(daysArray: any[], context: TripContext): GeneratedItinerary | null {
    if (daysArray.length === 0) {
        console.warn('⚠️ Days array is empty');
        return null;
    }

    console.log('📅 Processing', daysArray.length, 'days from array');

    const normalizedDays = normalizeDaysArray(daysArray, context);

    return {
        title: `Voyage à ${context.destinations.join(', ')}`,
        days: normalizedDays
    };
}

/**
 * Normalize an array of day objects
 */
function normalizeDaysArray(daysArray: any[], context: TripContext): GeneratedDay[] {
    return daysArray.map((day: any, index: number) => {
        // Extract day fields with fallbacks
        const dayIndex = day.dayIndex || day.day_index || day.jour || day.day || day.number || (index + 1);
        const dayTitle = day.title || day.titre || day.name || day.nom || `Jour ${dayIndex}`;
        const location = day.location || day.lieu || day.ville || day.city || day.zone || context.destinations[0] || '';

        // Extract activities with fallbacks
        let activities = day.activities || day.activités || day.activites || day.events || day.evenements || [];

        if (!Array.isArray(activities)) {
            activities = [];
        }

        // Normalize each activity
        const normalizedActivities = activities.map((act: any, actIndex: number) => ({
            type: normalizeActivityType(act.type || act.category || act.categorie || 'autre'),
            title: act.title || act.titre || act.name || act.nom || act.description?.substring(0, 50) || `Activité ${actIndex + 1}`,
            description: act.description || act.desc || act.details || '',
            startTime: normalizeTime(act.startTime || act.start_time || act.heure_debut || act.heureDebut || act.heure || act.start),
            duration: normalizeDuration(act.duration || act.duree || act.durée),
            locationText: act.locationText || act.location_text || act.location || act.lieu || act.adresse || act.address,
            checklist: normalizeChecklist(act.checklist || act.checkList || act.items || act.todo),
            costEstimate: typeof act.costEstimate === 'number' ? act.costEstimate :
                typeof act.cost_estimate === 'number' ? act.cost_estimate :
                    typeof act.cost === 'number' ? act.cost :
                        typeof act.cout === 'number' ? act.cout : undefined
        }));

        return {
            dayIndex: typeof dayIndex === 'number' ? dayIndex : index + 1,
            title: dayTitle,
            location,
            activities: normalizedActivities
        };
    });
}

/**
 * Normalize activity type to match expected values
 */
function normalizeActivityType(type: string): string {
    const typeMap: Record<string, string> = {
        // English mappings
        'activity': 'activité',
        'meal': 'repas',
        'food': 'repas',
        'restaurant': 'repas',
        'dining': 'repas',
        'breakfast': 'repas',
        'lunch': 'repas',
        'dinner': 'repas',
        'travel': 'transport',
        'transportation': 'transport',
        'transit': 'transport',
        'flight': 'transport',
        'train': 'transport',
        'visit': 'culture',
        'sightseeing': 'culture',
        'museum': 'culture',
        'monument': 'culture',
        'temple': 'culture',
        'church': 'culture',
        'accommodation': 'hébergement',
        'hotel': 'hébergement',
        'lodging': 'hébergement',
        'logement': 'hébergement',
        'visite': 'culture',
        'nature': 'nature',
        'outdoor': 'nature',
        'hiking': 'nature',
        'beach': 'nature',
        'park': 'nature',
        'garden': 'nature',
        'shopping': 'shopping',
        'market': 'shopping',
        'store': 'shopping',
        'culture': 'culture',
        'show': 'culture',
        'spectacle': 'culture',
        'concert': 'culture',
        'other': 'autre',
        'misc': 'autre'
    };

    const normalized = type.toLowerCase().trim();
    return typeMap[normalized] || normalized || 'autre';
}

/**
 * Normalize duration to standard format
 */
function normalizeDuration(duration: any): string | undefined {
    if (!duration) return undefined;

    const str = String(duration).toLowerCase().trim();

    // Already in correct format
    if (/^\d+h(\d+)?$/.test(str) || /^\d+m$/.test(str)) {
        return str;
    }

    // Handle "1 hour", "2 hours" format
    const hourMatch = str.match(/(\d+)\s*hour/i);
    if (hourMatch) {
        return `${hourMatch[1]}h`;
    }

    // Handle "30 min", "90 minutes" format
    const minMatch = str.match(/(\d+)\s*min/i);
    if (minMatch) {
        const mins = parseInt(minMatch[1]);
        if (mins >= 60) {
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            return m > 0 ? `${h}h${m}` : `${h}h`;
        }
        return `${mins}m`;
    }

    // Handle "1:30" format
    const timeMatch = str.match(/(\d+):(\d+)/);
    if (timeMatch) {
        const h = parseInt(timeMatch[1]);
        const m = parseInt(timeMatch[2]);
        return m > 0 ? `${h}h${m}` : `${h}h`;
    }

    return str;
}

/**
 * Normalize checklist to array of strings
 */
function normalizeChecklist(checklist: any): string[] | undefined {
    if (!checklist) return undefined;

    if (Array.isArray(checklist)) {
        return checklist
            .map(item => typeof item === 'string' ? item : item?.text || item?.label || String(item))
            .filter(item => item && item.length > 0);
    }

    if (typeof checklist === 'string') {
        return checklist.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 0);
    }

    return undefined;
}

/**
 * Normalize time format to HH:MM
 */
function normalizeTime(time: any): string | undefined {
    if (!time) return undefined;

    const str = String(time).trim();

    // Already in HH:MM format
    if (/^\d{1,2}:\d{2}$/.test(str)) {
        const [h, m] = str.split(':');
        return `${h.padStart(2, '0')}:${m}`;
    }

    // Handle "9h30" format
    const frMatch = str.match(/^(\d{1,2})h(\d{2})?$/i);
    if (frMatch) {
        return `${frMatch[1].padStart(2, '0')}:${frMatch[2] || '00'}`;
    }

    return str;
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
