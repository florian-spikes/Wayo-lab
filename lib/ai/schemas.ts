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
    type: 'activité' | 'repas' | 'transport' | 'visite' | 'logement' | 'nature' | 'autre';
    title: string;
    description: string;
    startTime?: string; // "09:00" format
    endTime?: string;   // "11:30" format
    locationText?: string;
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
    days: GeneratedDay[];
}

/**
 * JSON Schema for Gemini structured output validation
 */
export const ITINERARY_JSON_SCHEMA = {
    type: "object",
    properties: {
        title: { type: "string", description: "Titre attractif pour le voyage" },
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
                                    enum: ["activité", "repas", "transport", "visite", "logement", "nature", "autre"],
                                    description: "Type d'activité"
                                },
                                title: { type: "string", description: "Titre de l'activité" },
                                description: { type: "string", description: "Description détaillée (2-3 phrases max)" },
                                startTime: { type: "string", description: "Heure de début format HH:MM (ex: '09:00')" },
                                endTime: { type: "string", description: "Heure de fin format HH:MM (ex: '11:30')" },
                                locationText: { type: "string", description: "Lieu précis (adresse ou nom du lieu)" },
                                costEstimate: { type: "number", description: "Estimation du coût en euros" }
                            },
                            required: ["type", "title", "description"]
                        }
                    }
                },
                required: ["dayIndex", "title", "location", "activities"]
            }
        }
    },
    required: ["title", "days"]
};
