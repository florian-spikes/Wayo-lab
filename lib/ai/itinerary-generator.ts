import { geminiPro, geminiFlash, isAIAvailable, withRetry } from '../gemini';
import { buildSystemPrompt, buildUserPrompt } from './prompts';
import type { TripContext, GeneratedItinerary, GeneratedDay } from './schemas';

export type { TripContext, GeneratedItinerary, GeneratedDay };

/**
 * Result of itinerary generation
 */
/**
 * Result of itinerary generation
 */
export interface GenerationResult {
    success: boolean;
    itinerary?: GeneratedItinerary;
    error?: string;
    fallback?: boolean;
    partial?: boolean;
}

/**
 * Generate a complete trip itinerary using Gemini AI (Streaming)
 */
export async function* generateItineraryStream(context: TripContext): AsyncGenerator<GenerationResult> {
    // Check if AI is available
    const model = geminiPro || geminiFlash;
    if (!isAIAvailable() || !model) {
        console.warn('AI not available, returning empty itinerary');
        return yield {
            success: true,
            itinerary: createFallbackItinerary(context),
            fallback: true,
            partial: false
        };
    }

    try {
        const systemPrompt = buildSystemPrompt();
        const userPrompt = buildUserPrompt(context);

        console.log('🤖 Generating itinerary stream with AI...');

        const result = await model.generateContentStream({
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

        const parser = new DailyParser(context);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();

            const updates = parser.parseChunk(chunkText);

            if (updates.length > 0) {
                for (const update of updates) {
                    yield update;
                }
            }
        }

    } catch (error: any) {
        console.error('❌ AI stream failed:', error);
        yield {
            success: false,
            error: error.message
        };
    }
}

/**
* Helper class to parse streaming JSON and extract days
*/
class DailyParser {
    private buffer = '';
    private context: TripContext;
    private processedDays = new Set<number>();
    private titleFound = false;
    private title = '';
    private emoji = '';

    constructor(context: TripContext) {
        this.context = context;
    }

    parseChunk(chunk: string): GenerationResult[] {
        this.buffer += chunk;
        const results: GenerationResult[] = [];

        // 1. Try to extract title/emoji if not found yet
        if (!this.titleFound) {
            const titleMatch = this.buffer.match(/"title"\s*:\s*"([^"]+)"/);
            if (titleMatch) {
                this.title = titleMatch[1];
                this.titleFound = true;
                results.push({
                    success: true,
                    itinerary: {
                        title: this.title,
                        emoji: this.emoji || selectDefaultEmoji(this.context.destinations),
                        days: []
                    },
                    partial: true
                });
            }

            const emojiMatch = this.buffer.match(/"emoji"\s*:\s*"([^"]+)"/);
            if (emojiMatch) {
                this.emoji = emojiMatch[1];
            }
        }

        // 2. Extract complete day objects
        // Look for {"dayIndex": X, ...} blocks that are closed.
        // We use a regex that matches from { "dayIndex" ... up to the closing brace of the day object
        // The closing literal is hard to determine via regex alone because of nested braces.
        // However, since we know the structure, we can assume days end with "}," or "]"

        // Regex explanation:
        // {\s*"dayIndex"  -> start of day
        // [^}]+           -> content (this is weak if nested objects exist)
        // activities      -> ensure it has activities
        // .*?             -> lazy match until end
        // }\s*(,|])       -> end of object

        // A more robust way without full parser: 
        // Split buffer by "dayIndex". For each segment, try to parse it as a JSON object (or wrapped in brackets).

        // Let's rely on a simpler regex that works for typical Gemini output:
        // It usually outputs strictly formatted JSON.
        // We look for patterns: { "dayIndex": 1, ... }

        const dayMetrics = this.buffer.matchAll(/{\s*"dayIndex"\s*:\s*(\d+)/g);
        for (const match of dayMetrics) {
            const dayIdx = parseInt(match[1]);
            if (this.processedDays.has(dayIdx)) continue;

            // We found a start of a new day. Let's see if we can find its end.
            // The start index in buffer is match.index
            const startIndex = match.index!;

            // We need to find the matching closing brace.
            const endIndex = this.findMatchingBrace(this.buffer, startIndex);

            if (endIndex !== -1) {
                const dayJsonStr = this.buffer.substring(startIndex, endIndex + 1);
                try {
                    const dayObj = JSON.parse(dayJsonStr);
                    if (dayObj.dayIndex) { // Verify it parsed correctly
                        const normalizedDay = normalizeDaysArray([dayObj], this.context)[0];
                        this.processedDays.add(dayObj.dayIndex);

                        results.push({
                            success: true,
                            itinerary: {
                                title: this.title || `Voyage à ${this.context.destinations.join(', ')}`,
                                emoji: this.emoji || selectDefaultEmoji(this.context.destinations),
                                days: [normalizedDay]
                            },
                            partial: true
                        });
                    }
                } catch (e) {
                    // Not complete yet
                }
            }
        }

        return results;
    }

    private findMatchingBrace(str: string, start: number): number {
        let depth = 0;
        let inString = false;
        let escape = false;

        for (let i = start; i < str.length; i++) {
            const char = str[i];

            if (escape) {
                escape = false;
                continue;
            }

            if (char === '\\') {
                escape = true;
                continue;
            }

            if (char === '"') {
                inString = !inString;
                continue;
            }

            if (inString) continue;

            if (char === '{') {
                depth++;
            } else if (char === '}') {
                depth--;
                if (depth === 0) return i;
            }
        }

        return -1;
    }
}

// Kept for backward compatibility but unused in new flow
export async function generateItinerary(context: TripContext): Promise<GenerationResult> {
    // Legacy implementation - just reusing the stream to gather all data
    const generator = generateItineraryStream(context);
    let finalResult: GenerationResult = { success: false, error: 'Unknown' };
    const allDays: GeneratedDay[] = [];

    for await (const result of generator) {
        finalResult = result;
        if (result.itinerary?.days) {
            allDays.push(...result.itinerary.days);
        }
    }

    // Sort days
    allDays.sort((a, b) => a.dayIndex - b.dayIndex);

    if (finalResult.itinerary) {
        finalResult.itinerary.days = allDays;
    }

    return finalResult;
}

/**
 * Select an appropriate default emoji based on destinations
 */
function selectDefaultEmoji(destinations: string[]): string {
    const destStr = destinations.join(' ').toLowerCase();

    // Destination-based emoji mapping
    const emojiMap: [RegExp, string][] = [
        // Countries/Regions
        [/canada|qu[eé]bec|montr[eé]al|toronto|vancouver/i, '🍁'],
        [/usa|[eé]tats.?unis|new.?york|california|los.?angeles|miami|vegas/i, '🗽'],
        [/japon|japan|tokyo|kyoto|osaka/i, '🏯'],
        [/france|paris|lyon|marseille|nice/i, '🗼'],
        [/australie|australia|sydney|melbourne/i, '🦘'],
        [/afrique|africa|kenya|tanzanie|safari|marrakech/i, '🐘'],
        [/inde|india|delhi|mumbai|rajasthan/i, '🛕'],
        [/thaïlande|thailand|bangkok|phuket|bali|indonésie|vietnam/i, '🌴'],
        [/caraïbes|caribbean|cuba|jamaïque|bahamas|antilles/i, '🌴'],
        [/maldives|seychelles|maurice|réunion/i, '🏝️'],
        [/islande|iceland|norvège|norway|scandinavie|laponie/i, '❄️'],
        [/espagne|spain|barcelone|madrid|portugal|lisbonne/i, '☀️'],
        [/italie|italy|rome|venise|florence|milan/i, '🏰'],
        [/grèce|greece|athènes|santorini|croatie|croatia/i, '☀️'],
        [/maroc|morocco|désert|desert|sahara/i, '🌵'],
        [/suisse|switzerland|alpes|alps|montagne|mountain|ski/i, '🏔️'],
        [/hawaii|hawaï|volcans?|islande/i, '🌋'],
        [/égypte|egypt|pyramides?/i, '🏛️'],
        [/chine|china|pékin|beijing|shanghai/i, '🐉'],
        [/dubaï|dubai|émirats|abu.?dhabi|qatar/i, '🕌'],
        [/mexique|mexico|cancun/i, '🌮'],
        [/brésil|brazil|rio/i, '🎭'],
        [/argentine|argentina|buenos.?aires|patagonie/i, '🗻'],
        // Activity-based
        [/road.?trip|roadtrip/i, '🚐'],
        [/croisière|cruise|bateau/i, '⛵'],
        [/surf|plage|beach/i, '🏄'],
        [/ski|neige|snow/i, '🎿'],
        [/randonnée|trek|hiking/i, '🥾'],
        [/vin|wine|vignoble|vineyard/i, '🍷'],
        [/gastronomie|food|culinaire/i, '🍜'],
    ];

    for (const [pattern, emoji] of emojiMap) {
        if (pattern.test(destStr)) {
            return emoji;
        }
    }

    // Default: globe for multi-destination, airplane otherwise
    return destinations.length > 1 ? '🌍' : '✈️';
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

        // Extract emoji from response or use default based on destination
        const emoji = data.emoji || data.icone || selectDefaultEmoji(context.destinations);
        console.log('🎨 Selected emoji:', emoji);

        return {
            title,
            emoji,
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
    const emoji = selectDefaultEmoji(context.destinations);

    return {
        title: `Voyage à ${context.destinations.join(', ')}`,
        emoji,
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
        emoji: selectDefaultEmoji(context.destinations),
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

/**
 * Attempt to repair truncated JSON by closing open brackets/braces
 * This is a best-effort recovery for when AI response is cut off
 */
function repairTruncatedJSON(jsonText: string): string | null {
    try {
        // Track open brackets and braces
        const stack: string[] = [];
        let inString = false;
        let escape = false;

        for (let i = 0; i < jsonText.length; i++) {
            const char = jsonText[i];

            if (escape) {
                escape = false;
                continue;
            }

            if (char === '\\') {
                escape = true;
                continue;
            }

            if (char === '"' && !escape) {
                inString = !inString;
                continue;
            }

            if (inString) continue;

            if (char === '{' || char === '[') {
                stack.push(char);
            } else if (char === '}') {
                if (stack.length > 0 && stack[stack.length - 1] === '{') {
                    stack.pop();
                }
            } else if (char === ']') {
                if (stack.length > 0 && stack[stack.length - 1] === '[') {
                    stack.pop();
                }
            }
        }

        if (stack.length === 0) {
            // JSON is complete, no repair needed
            return null;
        }

        // Find the last complete structure (end at last complete object/array)
        let repairedJson = jsonText;

        // If we're in the middle of a string, close it
        if (inString) {
            // Find a reasonable cutoff point
            const lastQuote = repairedJson.lastIndexOf('"');
            if (lastQuote > 0) {
                // Truncate before incomplete string and close
                const lastGoodPoint = repairedJson.lastIndexOf(',', lastQuote);
                if (lastGoodPoint > 0) {
                    repairedJson = repairedJson.substring(0, lastGoodPoint);
                }
            }
        }

        // Remove any trailing incomplete property/value
        repairedJson = repairedJson.replace(/,\s*"[^"]*"?\s*:?\s*("?[^"]*)?$/, '');
        repairedJson = repairedJson.replace(/,\s*$/, '');
        repairedJson = repairedJson.replace(/,\s*{\s*$/, '');
        repairedJson = repairedJson.replace(/,\s*\[\s*$/, '');

        // Re-count what we need to close
        stack.length = 0;
        inString = false;
        escape = false;

        for (let i = 0; i < repairedJson.length; i++) {
            const char = repairedJson[i];
            if (escape) { escape = false; continue; }
            if (char === '\\') { escape = true; continue; }
            if (char === '"' && !escape) { inString = !inString; continue; }
            if (inString) continue;
            if (char === '{' || char === '[') stack.push(char);
            else if (char === '}' && stack.length > 0 && stack[stack.length - 1] === '{') stack.pop();
            else if (char === ']' && stack.length > 0 && stack[stack.length - 1] === '[') stack.pop();
        }

        // Close remaining open brackets/braces in reverse order
        while (stack.length > 0) {
            const open = stack.pop();
            if (open === '{') repairedJson += '}';
            else if (open === '[') repairedJson += ']';
        }

        console.log('🔧 Repaired JSON (partial response recovered)');
        return repairedJson;
    } catch {
        console.error('❌ JSON repair failed');
        return null;
    }
}
