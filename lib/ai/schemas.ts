// Type definitions for AI-generated itinerary content

/**
 * Context sent to AI for itinerary generation
 */
export interface TripContext {
    // Trip details
    destinations: string[];
    origin: string;
    durationDays: number;
    startDate?: string;
    season?: string;

    // Preferences
    budget: 'low' | 'medium' | 'high' | 'luxury';
    rhythm: 'relaxed' | 'balanced' | 'intense';
    experiences: string[];
    participants: number;
    notes?: string;

    // User context (for travel logic)
    userCountry?: string;
    userCity?: string;
}

/**
 * Generated activity structure (maps to cards table)
 */
export interface GeneratedActivity {
    type: 'activité' | 'repas' | 'transport' | 'hébergement' | 'shopping' | 'culture' | 'nature' | 'autre';
    title: string;
    description: string;
    startTime?: string; // "09:00" format
    duration?: string;  // "30m", "1h", "1h30", "2h", etc.
    locationText?: string;
    checklist?: string[]; // Items to prepare or remember
    costEstimate?: number;
}

/**
 * Generated day structure (maps to trip_days table)
 */
export interface GeneratedDay {
    dayIndex: number;
    title: string;
    location: string;
    activities: GeneratedActivity[];
}

/**
 * Complete generated itinerary
 */
export interface GeneratedItinerary {
    title: string;
    emoji: string; // Trip icon emoji selected by AI
    days: GeneratedDay[];
}

/**
 * JSON Schema for Gemini structured output validation
 */
export const ITINERARY_JSON_SCHEMA = {
    type: "object",
    properties: {
        title: { type: "string", description: "Titre attractif pour le voyage (5-6 mots max)" },
        emoji: { type: "string", description: "Un seul emoji représentant le voyage" },
        days: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    dayIndex: { type: "integer", description: "Numéro du jour (1, 2, 3...)" },
                    title: { type: "string", description: "Titre court pour la journée (ex: 'Découverte de Tokyo')" },
                    location: { type: "string", description: "Ville ou zone principale du jour" },
                    activities: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                type: {
                                    type: "string",
                                    enum: ["activité", "repas", "transport", "hébergement", "shopping", "culture", "nature", "autre"],
                                    description: "Catégorie de l'activité"
                                },
                                title: { type: "string", description: "Titre concis de l'activité" },
                                description: { type: "string", description: "Description détaillée (2-3 phrases)" },
                                startTime: { type: "string", description: "Heure de début format HH:MM (ex: '09:00')" },
                                duration: { type: "string", description: "Durée (ex: '30m', '1h', '1h30', '2h', '3h')" },
                                locationText: { type: "string", description: "Lieu précis (nom + adresse si possible)" },
                                checklist: {
                                    type: "array",
                                    items: { type: "string" },
                                    description: "Liste de choses à préparer ou retenir (2-4 items max)"
                                },
                                costEstimate: { type: "number", description: "Coût estimé par personne en euros" }
                            },
                            required: ["type", "title", "description", "startTime", "duration"]
                        }
                    }
                },
                required: ["dayIndex", "title", "location", "activities"]
            }
        }
    },
    required: ["title", "emoji", "days"]
};
