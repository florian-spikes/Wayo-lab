import type { TripContext } from './schemas';

/**
 * Build the system prompt for itinerary generation
 */
export function buildSystemPrompt(): string {
    return `Tu es Tori, un expert en planification de voyages avec plus de 20 ans d'expérience.

OBJECTIF:
Générer un itinéraire de voyage détaillé, réaliste et personnalisé basé sur les préférences de l'utilisateur.

RÈGLES STRICTES:
1. FAISABILITÉ: Chaque journée doit être réalisable. Pas de trajets impossibles ou d'activités incompatibles.
2. RYTHME: Respecte strictement le rythme demandé:
   - "relaxed": 2-3 activités max par jour, beaucoup de temps libre
   - "balanced": 3-4 activités par jour, bon équilibre
   - "intense": 5-6 activités par jour, emploi du temps chargé
3. BUDGET: Adapte les suggestions au budget:
   - "low": Activités gratuites ou peu chères, street food, transports en commun
   - "medium": Mix d'activités payantes et gratuites, restaurants corrects
   - "high": Expériences premium, bons restaurants, taxis/Uber
   - "luxury": Meilleures expériences, restaurants gastronomiques, chauffeur privé
4. LOGIQUE GÉOGRAPHIQUE: Organise les activités par zone pour minimiser les déplacements inutiles.
5. HORAIRES RÉALISTES: Les horaires doivent tenir compte des temps de trajet et des heures d'ouverture.
6. EXPÉRIENCES: Intègre les types d'expériences demandés (culture, gastronomie, nature, etc.).

FORMAT DES HORAIRES:
- Utilise le format "HH:MM" (ex: "09:00", "14:30")
- Prévois des pauses entre les activités

TYPES D'ACTIVITÉS DISPONIBLES:
- "activité": Activité générale, loisir
- "repas": Restaurant, café, dégustation
- "transport": Déplacement (train, avion, ferry, etc.)
- "visite": Musée, monument, site touristique
- "logement": Check-in/check-out hôtel
- "nature": Randonnée, plage, parc
- "autre": Autre type d'activité

RÉPONSE:
Réponds UNIQUEMENT avec un JSON valide suivant le schéma demandé. Pas de texte avant ou après.`;
}

/**
 * Build the user prompt with trip context
 */
export function buildUserPrompt(context: TripContext): string {
    const budgetLabels = {
        low: 'Économique (petit budget)',
        medium: 'Moyen (confort standard)',
        high: 'Élevé (expériences premium)',
        luxury: 'Luxe (sans limite)'
    };

    const rhythmLabels = {
        relaxed: 'Détendu (peu d\'activités, beaucoup de temps libre)',
        balanced: 'Équilibré (bon mix activités/repos)',
        intense: 'Intense (programme chargé, voir un maximum)'
    };

    let prompt = `Génère un itinéraire de voyage avec les paramètres suivants:

📍 DESTINATION(S): ${context.destinations.join(', ')}
🏠 ORIGINE: ${context.origin}
📅 DURÉE: ${context.durationDays} jours`;

    if (context.startDate) {
        prompt += `\n🗓️ DATE DE DÉBUT: ${context.startDate}`;
    } else if (context.season) {
        prompt += `\n🌤️ SAISON: ${context.season}`;
    }

    prompt += `
👥 NOMBRE DE VOYAGEURS: ${context.participants}
💰 BUDGET: ${budgetLabels[context.budget]}
🎯 RYTHME: ${rhythmLabels[context.rhythm]}`;

    if (context.experiences.length > 0) {
        prompt += `\n✨ EXPÉRIENCES SOUHAITÉES: ${context.experiences.join(', ')}`;
    }

    if (context.notes) {
        prompt += `\n📝 NOTES ADDITIONNELLES: ${context.notes}`;
    }

    // Context for travel logic
    if (context.userCountry) {
        prompt += `\n\n⚠️ CONTEXTE UTILISATEUR:`;
        prompt += `\n- Pays de résidence: ${context.userCountry}`;
        if (context.userCity) {
            prompt += ` (${context.userCity})`;
        }

        // Add specific instructions based on context
        const destinations = context.destinations.join(', ').toLowerCase();
        const origin = context.origin.toLowerCase();

        if (context.userCountry.toLowerCase().includes('france') &&
            (destinations.includes('france') || origin.includes('france'))) {
            prompt += `\n- Voyage domestique: privilégie le train/voiture plutôt que l'avion pour les courtes distances`;
        }
    }

    prompt += `\n\nGénère maintenant un itinéraire complet de ${context.durationDays} jours avec des activités détaillées pour chaque jour.`;

    return prompt;
}
