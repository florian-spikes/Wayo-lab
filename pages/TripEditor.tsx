import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ToriLogo from '../components/ToriLogo';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
    ChevronLeft,
    Plus,
    Lock,
    Unlock,
    MoreVertical,
    MapPin,
    Clock,
    Utensils,
    Car,
    Activity as ActivityIcon,
    Hotel,
    FileText,
    Mail,
    Link as LinkIcon,
    ChevronRight,
    BrainCircuit,
    GripVertical,
    Save,
    Trash2,
    X,
    ClipboardList,
    BookOpen,
    ShieldCheck,
    Stethoscope,
    Wallet,
    Wifi,
    Truck,
    CloudRain,
    Sparkles,
    CheckCircle2,
    ImageIcon,
    Share2,
    ExternalLink,
    MapIcon,
    History,
    Navigation,
    Heart,
    Check,
    Compass,
    Users,
    TrendingUp,
    Zap,
    Map,
    Smile,
    Calendar,
    ShoppingBag,
    TreePine,
    CheckSquare,
    AlertTriangle,
    Send,
    Pencil
} from 'lucide-react';
import Navbar from '../components/Navbar';
import TripNotFound from '../components/TripNotFound';

// DnD Kit imports
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    TouchSensor
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface Trip {
    id: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    duration_days: number;
    destination_country: string;
    preferences: {
        budget?: string;
        rhythm?: string;
        participants?: number;
        experiences?: string[];
        notes?: string;
        emoji?: string;
    };
}

interface TripDay {
    id: string;
    day_index: number;
    date: string | null;
    title: string | null;
    status: 'draft' | 'locked';
    edited_by?: string | null; // [NEW] UUID of the user currently editing
    edited_at?: string | null; // [NEW] Timestamp of the lock
}

interface Card {
    id: string;
    trip_id: string;
    day_id: string;
    type: string;
    title: string;
    description: string;
    order_index: number;
    start_time: string | null;
    end_time: string | null;
    location_text: string | null;
    end_location_text?: string | null; // [NEW] For Transport arrival
    website_url?: string | null;
}

// Catégories d'emojis pour le voyage
const tripEmojiCategories = [
    { name: 'Voyage', emojis: ['✈️', '🌍', '🏝️', '🏔️', '🏕️', '🏙️', '🎒', '📸', '⛵', '🗺️', '🚅', '🏨', '🎟️', '🚲', '🌋', '⛺'] },
    { name: 'Activités', emojis: ['🏃', '🧗', '🏄', '🎿', '🚲', '🎨', '🎭', '🎧', '🔭', '⛳', '🎰', '🧘'] },
    { name: 'Nature', emojis: ['🌲', '🌵', '🌻', '🍃', '🌊', '❄️', '🔥', '⭐', '🌙', '☀️', '🌈', '🌩️'] }
];

// --- Constants ---
const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGFhcnJwIiwiYSI6ImNtbGFwN3A3dzBjaTQzZHNnaWgxcXIxbG8ifQ.B_Mc8QMKmVLpprv6pRJqIQ';

// --- Liste des types d'évènements avec leurs icônes ---
const EVENT_TYPES = [
    { id: 'activité', icon: <ActivityIcon size={24} />, label: 'Activité', color: 'text-brand-500' },
    { id: 'repas', icon: <Utensils size={24} />, label: 'Repas', color: 'text-orange-500' },
    { id: 'transport', icon: <Car size={24} />, label: 'Transport', color: 'text-blue-500' },
    { id: 'hébergement', icon: <Hotel size={24} />, label: 'Hébergement', color: 'text-indigo-500' },
    { id: 'shopping', icon: <ShoppingBag size={24} />, label: 'Shopping', color: 'text-pink-500' },
    { id: 'culture', icon: <BookOpen size={24} />, label: 'Culture', color: 'text-emerald-500' },
    { id: 'nature', icon: <TreePine size={24} />, label: 'Nature', color: 'text-green-500' },
    { id: 'autre', icon: <FileText size={24} />, label: 'Autre', color: 'text-gray-500' },
];

interface SortableCardProps {
    card: Card;
    display_order: number;
    checklist_count?: number; // Count of checklist items
    isEditing?: boolean; // [NEW] State for inline editing
    children?: React.ReactNode; // [NEW] Form content
    onDelete?: (card: Card) => void;
}

interface ChecklistItem {
    id: string;
    card_id: string;
    is_completed: boolean;
    created_at: string;
    trip_id?: string; // [FIX] Added for realtime client-side filtering
    checklist_data?: {
        label: string;
    };
}

interface TripMember {
    id: string;
    trip_id: string;
    user_id: string;
    role: 'owner' | 'editor' | 'viewer';
    user?: {
        email: string;
        user_metadata?: {
            full_name?: string;
            avatar_url?: string;
        };
        username?: string; // [NEW] Added for display
        emoji?: string;    // [NEW] Added for display
    };
}

interface TripInvitation {
    id: string;
    email: string;
    role: 'editor' | 'viewer';
    status: 'pending' | 'accepted' | 'expired';
    token: string;
}

const SortableCard: React.FC<SortableCardProps & { onEdit: (card: Card) => void }> = ({ card, isLocked, onEdit, checklistCount = 0, isEditing, children, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: card.id,
        disabled: isLocked
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1
    };

    const getTypeIcon = (type: string, size = 18) => {
        const typeData = EVENT_TYPES.find(t => t.id === type.toLowerCase()) || EVENT_TYPES[EVENT_TYPES.length - 1];
        return React.cloneElement(typeData.icon as React.ReactElement, { size });
    };

    return (
        <div ref={setNodeRef} style={style} className="relative pl-10 group">
            {/* Timeline Dot - plus gros et mieux visible */}
            <div className={`absolute left-[9px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 z-10 transition-all ${isLocked
                ? 'bg-dark-800 border-gray-600'
                : 'bg-brand-500 border-brand-400 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                }`}></div>

            <div
                onClick={() => !isDragging && onEdit(card)}
                className={`bg-dark-800/80 backdrop-blur-sm border rounded-2xl p-4 transition-all flex gap-3 relative z-20 ${isLocked
                    ? 'border-white/5 cursor-default'
                    : isEditing
                        ? 'border-brand-500/50 bg-dark-800 shadow-xl shadow-brand-900/10'
                        : 'border-white/10 cursor-pointer hover:border-brand-500/30 hover:bg-dark-800 hover:shadow-lg hover:shadow-brand-500/5'
                    }`}
            >
                {/* Drag Handle */}
                {!isLocked && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-1.5 -ml-1 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0 self-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical size={16} />
                    </button>
                )}

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isLocked
                    ? 'bg-dark-700 text-gray-500'
                    : isEditing
                        ? 'bg-brand-500 text-white'
                        : 'bg-brand-500/10 text-brand-500'
                    }`}>
                    {getTypeIcon(card.type, 18)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm truncate transition-colors ${isLocked ? 'text-gray-400' : 'text-white group-hover:text-brand-400'
                        }`}>{card.title}</h3>

                    <div className="flex flex-wrap gap-2 mt-1.5">
                        {(card.start_time || card.end_time) && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
                                <Clock size={10} className="text-brand-500/70" />
                                {card.start_time?.slice(0, 5) || '??'}–{card.end_time?.slice(0, 5) || '??'}
                            </span>
                        )}
                        {card.type === 'Transport' && card.end_location_text ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 truncate max-w-[200px]">
                                <MapPin size={10} className="text-brand-500/70 shrink-0" />
                                {card.location_text}
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                {card.end_location_text}
                            </span>
                        ) : (
                            card.location_text && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 truncate max-w-[120px]">
                                    <MapPin size={10} className="text-brand-500/70 shrink-0" />
                                    {card.location_text}
                                </span>
                            )
                        )}
                        {checklistCount > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-400">
                                <CheckSquare size={10} />
                                {checklistCount}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions: Delete & Expand */}
                {!isLocked && (
                    <div className="flex items-center gap-2 self-center ml-2">
                        {/* Delete Button (visible on hover or when editing) */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete?.(card);
                            }}
                            className={`p-1.5 rounded-lg text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-all ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            title="Supprimer l'étape"
                        >
                            <Trash2 size={16} />
                        </button>

                        {/* Chevron */}
                        <div className={`text-gray-600 transition-all duration-300 ${isEditing ? 'text-brand-500 rotate-90' : 'group-hover:text-brand-500'}`}>
                            <ChevronRight size={16} />
                        </div>
                    </div>
                )}
            </div>

            {/* Inline Form Content (Accordion Body) */}
            {isEditing && (
                <div className="mt-[-12px] pt-6 pb-4 px-4 bg-dark-900/50 border-x border-b border-white/5 rounded-b-2xl animate-in slide-in-from-top-4 duration-300 origin-top">
                    {children}
                </div>
            )}
        </div>
    );
};

// --- Composant Confirmation Stylisé ---
const GenericConfirmationModal: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning';
}> = ({ isOpen, title, message, onConfirm, onCancel, variant = 'danger' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onCancel}></div>
            <div className="relative bg-dark-800 border border-white/10 rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-200 text-center">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    <AlertTriangle size={40} />
                </div>
                <h3 className="text-2xl font-black italic mb-3">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">{message}</p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg ${variant === 'danger' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'}`}
                    >
                        Confirmer
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Squelette de chargement des cartes ---
const CardSkeleton: React.FC = () => {
    return (
        <div className="relative pl-12 mb-6">
            {/* Timeline Dot Skeleton */}
            <div className="absolute left-[22px] top-6 w-1.5 h-1.5 rounded-full bg-dark-700 ring-4 ring-dark-900 z-10 animate-pulse"></div>

            <div className="w-full bg-dark-800/50 border border-white/5 rounded-[32px] p-6 animate-pulse">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-dark-700 rounded-2xl shrink-0"></div>
                    <div className="flex-1 space-y-3">
                        <div className="h-4 bg-dark-700 rounded-full w-1/3"></div>
                        <div className="h-3 bg-dark-700 rounded-full w-1/4"></div>
                    </div>
                    <div className="w-8 h-8 bg-dark-700 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

// --- Page Éditeur ---
const TripEditor: React.FC = () => {
    const { tripId, dayIndex } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [trip, setTrip] = useState<Trip | null>(null);
    const [days, setDays] = useState<TripDay[]>([]);
    const [currentDay, setCurrentDay] = useState<TripDay | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isDayLoading, setIsDayLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [activeTab, setActiveTab] = useState<'itineraire' | 'preparation' | 'carnet'>('itineraire');

    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [showIconSelect, setShowIconSelect] = useState(false);
    const [editData, setEditData] = useState<{
        title: string;
        description: string;
        location_text: string;
        end_location_text: string;
        website_url: string;
        start_time: string;
        end_time: string;
        duration: number | 'custom';
        type: string;
    }>({
        title: '',
        description: '',
        location_text: '',
        end_location_text: '',
        website_url: '',
        start_time: '',
        end_time: '',
        duration: 60,
        type: 'Activité'
    });

    // Mapbox Autocomplete State
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
    const [activeAddressField, setActiveAddressField] = useState<'start' | 'end' | null>(null);

    const handleAddressSearch = async (query: string, field: 'start' | 'end') => {
        setEditData(prev => ({
            ...prev,
            [field === 'start' ? 'location_text' : 'end_location_text']: query
        }));
        setActiveAddressField(field);

        if (query.length > 2) {
            try {
                // Improved Search: French language, limit 10, more types (poi, locality, place, etc.)
                const response = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&language=fr&limit=10&types=poi,address,place,locality,district,neighborhood`
                );
                const data = await response.json();
                if (data.features) {
                    setAddressSuggestions(data.features);
                    setShowAddressSuggestions(true);
                }
            } catch (error) {
                console.error("Mapbox error:", error);
            }
        } else {
            setAddressSuggestions([]);
            setShowAddressSuggestions(false);
        }
    };

    const selectAddress = (feature: any) => {
        if (!activeAddressField) return;

        setEditData(prev => {
            const newState = {
                ...prev,
                [activeAddressField === 'start' ? 'location_text' : 'end_location_text']: feature.place_name
            };

            // AUTO-TITLE LOGIC for Transport Events
            if (prev.type && prev.type.toLowerCase() === 'transport') {
                const shortName = feature.text || feature.place_name.split(',')[0];

                // Get the OTHER location's short name (heuristic: first part of comma-separated string)
                let startShort = activeAddressField === 'start'
                    ? shortName
                    : (newState.location_text ? newState.location_text.split(',')[0] : '...');

                let endShort = activeAddressField === 'end'
                    ? shortName
                    : (newState.end_location_text ? newState.end_location_text.split(',')[0] : '...');

                // Clean up "..." if fields are empty
                if (startShort === '...') startShort = '?';
                if (endShort === '...') endShort = '?';

                newState.title = `${startShort} ➔ ${endShort}`;
            }

            return newState;
        });

        setShowAddressSuggestions(false);
    };

    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [allTripCards, setAllTripCards] = useState<Record<string, string>>({});
    const [members, setMembers] = useState<TripMember[]>([]);
    const [invitations, setInvitations] = useState<TripInvitation[]>([]);
    const [showTravelersSheet, setShowTravelersSheet] = useState(false);
    // Email invitations removed - link sharing only
    const [inviteStatus, setInviteStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [inviteStatusMessage, setInviteStatusMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [deletingTrip, setDeletingTrip] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: 'danger' | 'warning';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        variant: 'danger'
    });
    const [tripEmoji, setTripEmoji] = useState('🚩');
    const [newChecklistItem, setNewChecklistItem] = useState('');


    const activeDayIndex = parseInt(dayIndex || '1');

    const currentUserMember = members.find(m => m.user_id === user?.id);
    const currentUserRole = currentUserMember?.role || 'viewer';
    const isOwner = currentUserRole === 'owner';
    const canEditGlobal = currentUserRole === 'owner' || currentUserRole === 'editor';

    // Locking Logic
    const isLockedBySomeoneElse = currentDay?.edited_by && currentDay.edited_by !== user?.id;
    const isLockedByMe = currentDay?.edited_by === user?.id;
    const editingUser = currentDay?.edited_by ? members.find(m => m.user_id === currentDay.edited_by)?.user : null;

    // Realtime Subscription
    useEffect(() => {
        if (!tripId) return;

        const daysChannel = supabase
            .channel('trip_days_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'trip_days',
                    filter: `trip_id=eq.${tripId}`
                },
                (payload) => {
                    const eventType = payload.eventType;
                    const newRecord = payload.new as TripDay;
                    const oldRecord = payload.old as { id: string };

                    if (eventType === 'INSERT') {
                        setDays(prev => {
                            if (prev.find(d => d.id === newRecord.id)) return prev;
                            return [...prev, newRecord].sort((a, b) => a.day_index - b.day_index);
                        });
                    } else if (eventType === 'UPDATE') {
                        setDays(prev => prev.map(d => d.id === newRecord.id ? { ...d, ...newRecord } : d).sort((a, b) => a.day_index - b.day_index));
                        setCurrentDay(prev => (prev && prev.id === newRecord.id) ? { ...prev, ...newRecord } : prev);
                    } else if (eventType === 'DELETE') {
                        setDays(prev => prev.filter(d => d.id !== oldRecord.id));
                        setCurrentDay(prev => (prev && prev.id === oldRecord.id) ? null : prev);
                    }
                }
            )
            .subscribe();

        // Subscribe to Trip Details (Duration, End Date)
        const tripChannel = supabase
            .channel('trip_details_realtime')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'trips',
                    filter: `id=eq.${tripId}`
                },
                (payload) => {
                    const newTrip = payload.new as any;
                    setTrip(prev => prev ? { ...prev, ...newTrip } : null);
                }
            )
            .subscribe();

        // Subscribe to Changes on Cards
        const cardChannel = supabase
            .channel('trip_cards_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events: INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'cards',
                    filter: `trip_id=eq.${tripId}`
                },
                (payload) => {
                    const eventType = payload.eventType;
                    const newRecord = payload.new as Card;
                    const oldRecord = payload.old as { id: string };

                    // Only update if it pertains to the current day
                    // We need to check day_id. For DELETE, we might not have the new record's day_id, 
                    // but we can filter by ID existence in our current list.

                    setCurrentDay(currentDay => {
                        if (!currentDay) return null;

                        // If the change is for another day, we might just ignore it for the Cards view,
                        // BUT `trip_id` filter already catches all global changes.
                        // Optimization: Check if card belongs to current day.

                        setCards(prevCards => {
                            // INSERT
                            if (eventType === 'INSERT' && newRecord.day_id === currentDay.id) {
                                // Check if already exists to prevent duplication
                                if (prevCards.find(c => c.id === newRecord.id)) return prevCards;
                                return [...prevCards, newRecord].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
                            }

                            // UPDATE
                            if (eventType === 'UPDATE') {
                                // If card moved to another day (day_id changed) and was in our list -> Remove it
                                if (newRecord.day_id !== currentDay.id && prevCards.find(c => c.id === newRecord.id)) {
                                    return prevCards.filter(c => c.id !== newRecord.id);
                                }
                                // If card moved TO this day
                                if (newRecord.day_id === currentDay.id) {
                                    const exists = prevCards.find(c => c.id === newRecord.id);
                                    if (exists) {
                                        return prevCards.map(c => c.id === newRecord.id ? newRecord : c).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
                                    } else {
                                        return [...prevCards, newRecord].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
                                    }
                                }
                            }

                            // DELETE
                            if (eventType === 'DELETE') {
                                return prevCards.filter(c => c.id !== oldRecord.id);
                            }

                            return prevCards;
                        });

                        return currentDay; // Return same state to avoiding re-render of this hook (hacky but valid for access)
                    });
                }
            )
            .subscribe();



        // Subscribe to Members (Roles, Add/Remove)
        const membersChannel = supabase
            .channel('trip_members_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'trip_members',
                    filter: `trip_id=eq.${tripId}`
                },
                (payload) => {
                    const eventType = payload.eventType;
                    const newRecord = payload.new as TripMember;
                    const oldRecord = payload.old as { id: string };

                    setMembers(prevMembers => {
                        // UPDATE: Role change
                        if (eventType === 'UPDATE') {
                            return prevMembers.map(m => m.id === newRecord.id ? { ...m, ...newRecord } : m);
                        }

                        // INSERT: New member
                        if (eventType === 'INSERT') {
                            // We might miss profile data here (username, emoji) until a refresh or separate fetch,
                            // but for permissions, the record is enough.
                            if (prevMembers.find(m => m.id === newRecord.id)) return prevMembers;
                            // Optimistically add without profile (will likely need a fetch to be perfect UI, but core logic works)
                            return [...prevMembers, newRecord];
                        }

                        // DELETE: Member removed
                        if (eventType === 'DELETE') {
                            return prevMembers.filter(m => m.id !== oldRecord.id);
                        }
                        return prevMembers;
                    });

                    // If *MY* role changed, the UI will auto-update because currentUserRole is derived from members state.
                }
            )
            .subscribe();


        // Subscribe to Checklists (Counter updates)
        const checklistsChannel = supabase
            .channel('trip_checklists_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'checklists'
                    // Remove filter here because DELETE events don't have trip_id (only PK)
                    // unless REPLICA IDENTITY is FULL. So we filter client-side.
                },
                (payload) => {
                    const eventType = payload.eventType;
                    const newRecord = payload.new as ChecklistItem;
                    const oldRecord = payload.old as { id: string };

                    setChecklistItems(prev => {
                        if (eventType === 'INSERT') {
                            if (newRecord.trip_id !== tripId) return prev; // Client-side filter
                            if (prev.find(i => i.id === newRecord.id)) return prev;
                            return [...prev, newRecord];
                        }
                        if (eventType === 'UPDATE') {
                            if (newRecord.trip_id !== tripId) return prev; // Client-side filter
                            return prev.map(i => i.id === newRecord.id ? { ...i, ...newRecord } : i);
                        }
                        if (eventType === 'DELETE') {
                            // No trip_id check possible on oldRecord usually, but if it exists in 'prev', 
                            // it belongs to this trip.
                            return prev.filter(i => i.id !== oldRecord.id);
                        }
                        return prev;
                    });
                }
            )
            .subscribe();


        return () => {
            supabase.removeChannel(daysChannel);
            supabase.removeChannel(tripChannel);
            supabase.removeChannel(cardChannel);
            supabase.removeChannel(membersChannel);
            supabase.removeChannel(checklistsChannel);
        };
    }, [tripId]);

    const handleRequestLock = async () => {
        if (!currentDay || !user || !canEditGlobal) return;

        try {
            const { data: success, error } = await supabase.rpc('request_day_lock', { p_day_id: currentDay.id });

            if (error) throw error;

            if (success) {
                // Optimistic update
                const now = new Date().toISOString();
                // Auto-uncheck si la journée était validée
                const updated = { ...currentDay, edited_by: user.id, edited_at: now, status: 'draft' as const };
                setCurrentDay(updated);
                setDays(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));

                // Persister le changement de status si était locké
                if (currentDay.status === 'locked') {
                    await supabase.from('trip_days').update({ status: 'draft' }).eq('id', currentDay.id);
                }
            } else {
                alert("Cette journée est déjà en cours de modification par quelqu'un d'autre.");
            }
        } catch (err) {
            console.error("Error requesting lock:", err);
            alert("Impossible de passer en mode édition.");
        }
    };

    const handleReleaseLock = async () => {
        if (!currentDay || !user || !isLockedByMe) return;

        try {
            const { error } = await supabase.rpc('release_day_lock', { p_day_id: currentDay.id });

            if (error) throw error;

            // Optimistic update
            const updated = { ...currentDay, edited_by: null, edited_at: null };
            setCurrentDay(updated);
            setDays(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
            setEditingCard(null); // Close sidebar if open
        } catch (err) {
            console.error("Error releasing lock:", err);
        }
    };

    const handleForceUnlock = async () => {
        if (!currentDay || !isOwner) return;
        if (!confirm("Voulez-vous forcer le déverrouillage ? Cela peut écraser le travail en cours de l'autre utilisateur.")) return;

        try {
            const { error } = await supabase.rpc('force_unlock_day_owner', { p_day_id: currentDay.id });
            if (error) throw error;
        } catch (err) {
            console.error("Error forcing unlock:", err);
        }
    };


    // [NEW] Local state for smooth typing
    const [localDayTitle, setLocalDayTitle] = useState<string | null>(null);

    // Sync local state when currentDay changes (and not editing)
    useEffect(() => {
        if (currentDay) {
            setLocalDayTitle(currentDay.title);
        }
    }, [currentDay?.id, currentDay?.title]);

    const debouncedSaveTitle = useCallback(
        (dayId: string, newTitle: string) => {
            const timer = setTimeout(async () => {
                const { error } = await supabase
                    .from('trip_days')
                    .update({ title: newTitle })
                    .eq('id', dayId);
                if (error) console.error("Error saving title:", error);
            }, 1000);
            return () => clearTimeout(timer);
        },
        []
    );

    // [NEW] Ref for cleanup
    const saveTitleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleUpdateDayTitle = (newTitle: string) => {
        if (!currentDay || !isLockedByMe) return;

        // 1. Update Local UI immediately
        setLocalDayTitle(newTitle);
        // Optimistic update for other components
        setDays(prev => prev.map(d => d.id === currentDay.id ? { ...d, title: newTitle } : d));
        setCurrentDay(prev => prev ? { ...prev, title: newTitle } : null);

        // 2. Debounced Save
        if (saveTitleTimeoutRef.current) clearTimeout(saveTitleTimeoutRef.current);

        saveTitleTimeoutRef.current = setTimeout(async () => {
            const { error } = await supabase
                .from('trip_days')
                .update({ title: newTitle })
                .eq('id', currentDay.id);
            if (error) console.error("Error updating day title:", error);
        }, 1000);
    };

    const handleDeleteDay = async () => {
        // Must be owner or editor AND hold the lock (or day must be unlocked? logical ambiguity)
        // Generally deleting a day is a big action. Let's restrict to global editors.
        if (!canEditGlobal) return;

        // ... rest of logic
        if (days.length <= 1) {
            setConfirmConfig({
                isOpen: true,
                title: "Action impossible",
                message: "Vous ne pouvez pas supprimer la dernière journée d'un voyage.",
                onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false })),
                variant: 'warning'
            });
            return;
        }

        setConfirmConfig({
            isOpen: true,
            title: "Supprimer la journée ?",
            message: `Êtes-vous sûr de vouloir supprimer la journée J${currentDay?.day_index} et toutes ses activités ? Cette action est irréversible.`,
            variant: 'danger',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                // 1. Supprimer les cartes associées
                if (!currentDay) return;
                await supabase.from('cards').delete().eq('day_id', currentDay.id);

                // 2. Supprimer la journée
                const { error } = await supabase.from('trip_days').delete().eq('id', currentDay.id);

                if (!error) {
                    // 3. Réorganiser les index des jours restants
                    const remainingDays = days.filter(d => d.id !== currentDay.id)
                        .sort((a, b) => a.day_index - b.day_index);

                    const updatedDays = await Promise.all(remainingDays.map(async (day, index) => {
                        const newIndex = index + 1;
                        let newDate = null;
                        if (trip?.start_date) {
                            const d = new Date(trip.start_date);
                            d.setDate(d.getDate() + index);
                            newDate = d.toISOString().split('T')[0];
                        }

                        if (day.day_index !== newIndex || day.date !== newDate) {
                            await supabase.from('trip_days')
                                .update({ day_index: newIndex, date: newDate })
                                .eq('id', day.id);
                            return { ...day, day_index: newIndex, date: newDate };
                        }
                        return day;
                    }));

                    // 4. Mettre à jour le voyage (durée et date de fin)
                    const newDuration = updatedDays.length;
                    const newEndDate = updatedDays[updatedDays.length - 1]?.date || trip?.start_date;

                    await supabase.from('trips')
                        .update({ duration_days: newDuration, end_date: newEndDate })
                        .eq('id', tripId);

                    setTrip(prev => prev ? { ...prev, duration_days: newDuration, end_date: newEndDate } : null);
                    setDays(updatedDays);

                    // 5. Rediriger vers le premier jour
                    navigate(`/trips/${tripId}/day/1`);
                }
            }
        });
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 4,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 5,
            },
        })
    );

    const updateTripEmoji = async (newEmoji: string) => {
        if (!trip) return;

        const updatedPreferences = {
            ...trip.preferences,
            emoji: newEmoji
        };

        const { error } = await supabase
            .from('trips')
            .update({ preferences: updatedPreferences })
            .eq('id', trip.id);

        if (!error) {
            setTrip(prev => prev ? { ...prev, preferences: updatedPreferences } : null);
            setTripEmoji(newEmoji);
        }
    };

    // Delete trip and all related data
    const handleDeleteTrip = async () => {
        if (!trip || !tripId || !isOwner) return;

        setDeletingTrip(true);
        setShowOptionsMenu(false);

        try {
            // Get all day IDs for this trip
            const dayIds = days.map(d => d.id);

            // Get all card IDs for these days
            const { data: cardsData } = await supabase
                .from('cards')
                .select('id')
                .in('day_id', dayIds);

            const cardIds = cardsData?.map(c => c.id) || [];

            // 1. Delete checklists (linked to cards)
            if (cardIds.length > 0) {
                await supabase
                    .from('checklists')
                    .delete()
                    .in('card_id', cardIds);
            }

            // 2. Delete cards (linked to days)
            if (dayIds.length > 0) {
                await supabase
                    .from('cards')
                    .delete()
                    .in('day_id', dayIds);
            }

            // 3. Delete days
            await supabase
                .from('trip_days')
                .delete()
                .eq('trip_id', tripId);

            // 4. Delete invitations
            await supabase
                .from('trip_invitations')
                .delete()
                .eq('trip_id', tripId);

            // 5. Delete members
            await supabase
                .from('trip_members')
                .delete()
                .eq('trip_id', tripId);

            // 6. Finally delete the trip itself
            const { error } = await supabase
                .from('trips')
                .delete()
                .eq('id', tripId);

            if (error) throw error;

            // Navigate back to dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error('Error deleting trip:', error);
            setConfirmConfig({
                isOpen: true,
                title: 'Erreur',
                message: 'Impossible de supprimer le voyage. Veuillez réessayer.',
                onConfirm: () => { },
                variant: 'danger'
            });
        } finally {
            setDeletingTrip(false);
        }
    };

    const confirmDeleteTrip = () => {
        setConfirmConfig({
            isOpen: true,
            title: 'Supprimer ce voyage ?',
            message: 'Cette action est irréversible. Toutes les données du voyage (jours, activités, participants) seront définitivement supprimées.',
            onConfirm: handleDeleteTrip,
            variant: 'danger'
        });
        setShowOptionsMenu(false);
    };

    const handleAddDay = async () => {
        if (!trip || !tripId || !user) return;

        const newDayIndex = days.length + 1;
        let newDate = null;

        if (trip.start_date) {
            const startDate = new Date(trip.start_date);
            startDate.setDate(startDate.getDate() + (newDayIndex - 1));
            newDate = startDate.toISOString().split('T')[0];
        }

        const newDay = {
            trip_id: tripId,
            day_index: newDayIndex,
            date: newDate,
            status: 'draft'
        };

        const { data, error } = await supabase.from('trip_days').insert(newDay).select().single();

        if (!error && data) {
            setDays([...days, data]);

            // Mettre à jour la durée totale du voyage et la date de fin dans Supabase
            const updatePayload: any = { duration_days: newDayIndex };
            if (newDate) {
                updatePayload.end_date = newDate;
            }

            await supabase
                .from('trips')
                .update(updatePayload)
                .eq('id', tripId);

            setTrip(prev => prev ? { ...prev, ...updatePayload } : null);

            // Naviguer vers le nouveau jour
            navigate(`/trips/${tripId}/day/${newDayIndex}`);
        } else if (error) {
            console.error("Error adding new day:", error);
            alert("Erreur lors de l'ajout du jour");
        }
    };



    // [REFACTORED] Updated to support Auto-Save and stay in edit mode
    // [MOVED] hasChanges must be defined before use in useEffect/callbacks to avoid ReferenceError
    const hasChanges = editingCard && (
        editData.title !== editingCard.title ||
        editData.description !== editingCard.description ||
        editData.location_text !== (editingCard.location_text || '') ||
        editData.end_location_text !== (editingCard.end_location_text || '') ||
        editData.website_url !== (editingCard.website_url || '') ||
        editData.start_time !== (editingCard.start_time?.slice(0, 5) || '') ||
        editData.end_time !== (editingCard.end_time?.slice(0, 5) || '') ||
        editData.type !== editingCard.type
    );

    const saveCard = useCallback(async (shouldClose: boolean = false) => {
        if (!editingCard || !tripId || !currentDay || !user) return;

        const cardData = {
            title: editData.title,
            description: editData.description,
            location_text: editData.location_text,
            end_location_text: editData.type.toLowerCase() === 'transport' ? editData.end_location_text : null,
            website_url: editData.website_url || null,
            start_time: editData.start_time || null,
            end_time: editData.end_time || null,
            type: editData.type,
            updated_at: new Date().toISOString()
        };

        let savedCard: Card;

        if (isCreating) {
            // INSERT NEW (DRAFT) -> BECOMES VALID
            const newCard = {
                ...cardData,
                trip_id: tripId,
                day_id: currentDay.id,
                created_by: user.id,
                order_index: cards.length,
                source: 'manual'
            };

            const { data, error } = await supabase.from('cards').insert(newCard).select().single();

            if (!error && data) {
                savedCard = data;
                setCards(prev => [...prev, data]);
                setIsCreating(false); // No longer in creation mode
            } else {
                console.error("Error creating card:", error);
                return;
            }
        } else {
            // UPDATE EXISTING
            const { data, error } = await supabase
                .from('cards')
                .update(cardData)
                .eq('id', editingCard.id)
                .select()
                .single();

            if (!error && data) {
                savedCard = data;
                setCards(prev => prev.map(c => c.id === data.id ? data : c));
            } else {
                console.error("Error updating card:", error);
                return;
            }
        }

        // Update editing state
        if (shouldClose) {
            setEditingCard(null);
        } else if (savedCard) {
            // Important for next Auto-Save: Update reference to prevent infinite loop or wrong diff
            setEditingCard(savedCard);
        }
    }, [editingCard, tripId, currentDay, user, editData, isCreating, cards.length]);

    // [NEW] Auto-Save Effect
    useEffect(() => {
        if (!editingCard || !hasChanges) return;

        const timer = setTimeout(() => {
            saveCard(false); // Auto-save without closing
        }, 1000); // 1s debounce

        return () => clearTimeout(timer);
    }, [editData, hasChanges, saveCard]);

    const handleDeleteCard = async (id: string) => {
        setConfirmConfig({
            isOpen: true,
            title: "Supprimer l'évènement ?",
            message: "Êtes-vous sûr de vouloir supprimer cette étape ? Les notes et horaires associés seront perdus.",
            variant: 'danger',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                const { error } = await supabase.from('cards').delete().eq('id', id);
                if (!error) {
                    setCards(prev => prev.filter(c => c.id !== id));
                    setEditingCard(null);
                }
            }
        });
    };

    const handleSafeNavigation = (action: () => void) => {
        if (!isLockedByMe) {
            action();
            return;
        }

        setConfirmConfig({
            isOpen: true,
            title: "Quitter le mode modification ?",
            message: "Vous êtes en train de modifier cette journée. Voulez-vous enregistrer et quitter ?",
            variant: 'info',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                await handleReleaseLock();
                action();
            }
        });
    };

    // [MODIFIED] Helper to close edit sheet/form
    const handleCloseEdit = () => {
        // [NEW] Logic: Explicitly save (or just close since auto-save handles it)
        // If we want to be safe, we can call saveCard(true);
        // But since auto-save is debounced, there might be a pending change.
        // Calling saveCard(true) handles it immediately.
        if (hasChanges) {
            saveCard(true);
        } else {
            setEditingCard(null);
            if (isCreating) {
                // If we were creating but didn't save? Actually, card is already inserted as Draft.
                // We should probably keep it or delete it if it's empty?
                // For now, simpler to just close.
                setIsCreating(false);
            }
        }
    };

    const openEdit = (card: Card, isNew: boolean = false) => {
        // Toggle Logic: If clicking the same card, close it
        if (editingCard?.id === card.id) {
            handleCloseEdit();
            return;
        }

        if (editingCard && hasChanges) {
            // If switching from another card, save the previous one first
            saveCard(true);
        }

        setIsCreating(isNew);
        // ... rest of logic


        // Calculer la durée initiale en minutes si les deux heures existent
        let initialDuration: number | 'custom' = 60; // Default to 60 minutes
        if (card.start_time && card.end_time) {
            const startStr = card.start_time.slice(0, 5);
            const endStr = card.end_time.slice(0, 5);
            const [sh, sm] = startStr.split(':').map(Number);
            const [eh, em] = endStr.split(':').map(Number);
            let duration = (eh * 60 + em) - (sh * 60 + sm);
            if (duration < 0) duration += 1440; // Case crossing midnight
            initialDuration = duration;
        }

        setEditingCard(card);
        setEditData({
            title: card.title,
            description: card.description || '',
            location_text: card.location_text || '',
            end_location_text: card.end_location_text || '',
            website_url: card.website_url || '',
            start_time: card.start_time?.slice(0, 5) || '',
            end_time: card.end_time?.slice(0, 5) || '',
            duration: initialDuration,
            type: card.type
        });

        setShowIconSelect(false);
    };

    const handleDirectAddCard = () => {
        if (!tripId || !currentDay) return;

        // Create a local DRAFT card (not in DB, not in cards array)
        const draftCard = {
            id: 'draft-' + Date.now(), // Temp ID
            trip_id: tripId,
            day_id: currentDay.id,
            type: 'Activité',
            title: '',
            description: '',
            order_index: cards.length,
            start_time: null,
            end_time: null,
            location_text: '',
            end_location_text: null,
            website_url: null,
            created_by: user?.id || ''
        } as Card;

        // Open Edit Mode Immediately with DRAFT
        openEdit(draftCard, true);
    };

    const handleCancelEdit = () => {
        if (hasChanges) {
            saveCard(true);
        } else {
            setEditingCard(null);
            if (isCreating) setIsCreating(false);
        }
    };

    useEffect(() => {
        if (!tripId || !user) return;

        const fetchData = async () => {
            // Si on n'a pas encore le voyage, c'est le chargement initial
            const isInitial = !trip;
            if (isInitial) setIsInitialLoading(true);
            else setIsDayLoading(true);

            try {
                // Ne charger les infos de base que si elles sont absentes ou si c'est l'init
                if (isInitial) {
                    // Try RPC first (bypasses RLS), fallback to direct query if RPC doesn't exist yet
                    let tripData = null;
                    const { data: rpcData, error: rpcError } = await supabase
                        .rpc('get_trip_for_member', { p_trip_id: tripId });

                    if (rpcError) {
                        console.warn('RPC get_trip_for_member not available, using direct query:', rpcError);
                        // Fallback to direct query (may fail if RLS blocks)
                        const { data: directData, error: directError } = await supabase
                            .from('trips')
                            .select('*')
                            .eq('id', tripId)
                            .single();

                        if (directError) {
                            console.error('Error fetching trip:', directError);
                            setTrip(null);
                        } else {
                            setTrip(directData);
                        }
                    } else if (rpcData && rpcData.length > 0) {
                        setTrip(rpcData[0]);
                    } else {
                        setTrip(null);
                    }


                    const { data: daysData } = await supabase.from('trip_days').select('*').eq('trip_id', tripId).order('day_index', { ascending: true });
                    setDays(daysData || []);

                    const day = (daysData || []).find(d => d.day_index === activeDayIndex);
                    setCurrentDay(day || null);

                    if (day) {
                        const { data: cardsData } = await supabase
                            .from('cards')
                            .select('*')
                            .eq('day_id', day.id)
                            .order('order_index', { ascending: true });
                        setCards((cardsData as Card[]) || []);
                    }
                } else {
                    // Chargement spécifique au jour (navigation rapide)
                    const day = days.find(d => d.day_index === activeDayIndex);
                    setCurrentDay(day || null);

                    if (day) {
                        const { data: cardsData } = await supabase
                            .from('cards')
                            .select('*')
                            .eq('day_id', day.id)
                            .order('order_index', { ascending: true });
                        setCards((cardsData as Card[]) || []);
                    }
                }
            } catch (error) {
                console.error("Error loading trip data:", error);
            } finally {
                setIsInitialLoading(false);
                setIsDayLoading(false);
            }
        };

        fetchData();
    }, [tripId, activeDayIndex, user, trip === null]);

    // Update local emoji state when trip loads
    useEffect(() => {
        if (trip?.preferences?.emoji) {
            setTripEmoji(trip.preferences.emoji);
        }
    }, [trip]);

    const getTypeIcon = (type: string, size = 18) => {
        const typeData = EVENT_TYPES.find(t => t.id === type.toLowerCase()) || EVENT_TYPES[EVENT_TYPES.length - 1];
        return React.cloneElement(typeData.icon as React.ReactElement, { size });
    };

    const fetchMembers = useCallback(async () => {
        if (!tripId) return;

        // Step 1: Fetch members (creator is now guaranteed to be in this list)
        const { data: membersData, error: membersError } = await supabase
            .from('trip_members')
            .select('*')
            .eq('trip_id', tripId);

        if (!membersError && membersData) {
            // Step 2: Fetch profiles for all members
            const userIds = membersData.map(m => m.user_id);
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, username, emoji, location')
                .in('id', userIds);

            // Step 3: Merge the data
            const membersWithProfiles = membersData.map(member => ({
                ...member,
                user: profilesData?.find(p => p.id === member.user_id) || null
            }));

            // Sort so owner is always first
            membersWithProfiles.sort((a, b) => {
                if (a.role === 'owner') return -1;
                if (b.role === 'owner') return 1;
                return 0;
            });

            // @ts-ignore - Supabase types mapping for joined tables can be tricky
            setMembers(membersWithProfiles);
        }

        // Fetch pending invitations (only non-expired ones)
        const { data: invitesData, error: invitesError } = await supabase
            .from('trip_invitations')
            .select('*')
            .eq('trip_id', tripId)
            .eq('status', 'pending')
            .gte('expires_at', new Date().toISOString()); // Only valid invitations

        if (!invitesError && invitesData) {
            setInvitations(invitesData as TripInvitation[]);
        }
    }, [tripId]);

    const fetchChecklist = useCallback(async () => {
        if (!tripId) return;

        // Fetch checklist items
        const { data: checklistData } = await supabase
            .from('checklists')
            .select('*')
            .eq('trip_id', tripId)
            .order('created_at', { ascending: true });

        if (checklistData) setChecklistItems(checklistData);

        // Fetch all card titles for this trip to resolve names in checklist
        const { data: cardsData } = await supabase
            .from('cards')
            .select('id, title')
            .eq('trip_id', tripId);

        if (cardsData) {
            const cardMap: Record<string, string> = {};
            cardsData.forEach(c => cardMap[c.id] = c.title);
            setAllTripCards(cardMap);
        }
    }, [tripId]);

    const handleAddChecklistItem = async () => {
        if (!newChecklistItem.trim() || !user || !tripId) return;

        const { error } = await supabase.from('checklists').insert({
            user_id: user.id,
            trip_id: tripId,
            card_id: editingCard?.id || null,
            checklist_data: { label: newChecklistItem, category: 'À faire', done: false }
        });

        if (!error) {
            setNewChecklistItem('');
            fetchChecklist();
        }
    };

    const handleToggleChecklist = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('checklists')
            .update({ is_completed: !currentStatus })
            .eq('id', id);

        if (!error) {
            setChecklistItems(prev => prev.map(item =>
                item.id === id ? { ...item, is_completed: !currentStatus } : item
            ));
        }
    };

    useEffect(() => {
        if (tripId) {
            fetchChecklist();
            fetchMembers();
        }
    }, [tripId, fetchChecklist, fetchMembers]);

    const persistOrder = async (newCards: Card[]) => {
        const updates = newCards.map((card, index) => ({
            ...card,
            order_index: index,
            updated_at: new Date().toISOString()
        }));

        // Upsert est safe ici car on fournit les IDs
        const { error } = await supabase
            .from('cards')
            .upsert(updates, { onConflict: 'id' });

        if (error) {
            console.error("Error persisting order:", error);
            // Revert optimistic update if needed (ideal world)
            console.error("Failed to save order");
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = cards.findIndex(c => c.id === active.id);
            const newIndex = cards.findIndex(c => c.id === over.id);

            const reorderedCards = arrayMove(cards, oldIndex, newIndex) as Card[];

            // [FIX] Update local indices immediately to prevent jitter with realtime updates
            const reorderedWithIndices = reorderedCards.map((c, i) => ({ ...c, order_index: i }));

            // Optimistic UI
            setCards(reorderedWithIndices);

            // Real persistence
            persistOrder(reorderedWithIndices);
        }
    };

    const handleToggleLock = async () => {
        if (!currentDay) return;

        const newStatus = currentDay.status === 'locked' ? 'draft' : 'locked';
        const { error } = await supabase
            .from('trip_days')
            .update({
                status: newStatus,
                locked_at: newStatus === 'locked' ? new Date().toISOString() : null
            })
            .eq('id', currentDay.id);

        if (!error) {
            setCurrentDay({ ...currentDay, status: newStatus });
            setDays(prev => prev.map(d => d.id === currentDay.id ? { ...d, status: newStatus } : d));
        }
    };


    const handleGenerateLink = async () => {
        if (!tripId || !user) return;
        setInviteStatus('idle');

        // 1. Check if a valid generic link already exists
        // Fetch all pending invitations and filter client-side to avoid .is() syntax issues
        const { data: pendingInvites } = await supabase
            .from('trip_invitations')
            .select('id, token, email, expires_at')
            .eq('trip_id', tripId)
            .eq('status', 'pending');

        // Find a valid generic link (one without an email and not expired)
        const now = new Date();
        const existingLink = pendingInvites?.find(inv => {
            if (inv.email !== null) return false; // Must be generic
            const expiresAt = new Date(inv.expires_at);
            return expiresAt > now; // Must not be expired
        });
        let token = existingLink?.token;
        let expiresAt: Date;

        // 2. If not, create one with 24h expiration
        if (!token) {
            token = crypto.randomUUID();
            expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24h from now

            const { error } = await supabase.from('trip_invitations').insert({
                trip_id: tripId,
                token,
                role: 'viewer',
                created_by: user.id,
                status: 'pending',
                email: null, // Explicitly null for generic
                expires_at: expiresAt.toISOString()
            });

            if (error) {
                setInviteStatus('error');
                setInviteStatusMessage('Erreur lors de la génération.');
                return;
            }
        } else {
            // Use existing link's expiration
            expiresAt = new Date(existingLink.expires_at);
        }

        // 3. Copy to clipboard
        const link = `${window.location.origin}/join/${token}`;
        navigator.clipboard.writeText(link);

        // 4. Show success message with expiration warning
        const expiryTime = expiresAt.toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        setInviteStatus('success');
        setInviteStatusMessage(`Lien copié ! Expire le ${expiryTime}`);
        setTimeout(() => setInviteStatus('idle'), 5000); // Show for 5 seconds

        // Refresh to show the link in the list (if we want to show it)
        fetchMembers();
    };

    if (isInitialLoading) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!trip) return <TripNotFound />;

    const formattedDate = currentDay?.date
        ? new Date(currentDay.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
        : `Jour ${activeDayIndex}`;

    const allDaysLocked = days.length > 0 && days.every(d => d.status === 'locked');
    const isPreparationValidated = checklistItems.length > 0 && checklistItems.every(i => i.is_completed);

    // [MOVED] hasChanges calculation moved to top to fix ReferenceError
    // const hasChanges = !!editingCard && (
    //     editData.title !== editingCard.title ||
    //     editData.description !== (editingCard.description || '') ||
    //     editData.location_text !== (editingCard.location_text || '') ||
    //     editData.end_location_text !== (editingCard.end_location_text || '') ||
    //     editData.website_url !== (editingCard.website_url || '') ||
    //     editData.start_time !== (editingCard.start_time?.slice(0, 5) || '') ||
    //     editData.end_time !== (editingCard.end_time?.slice(0, 5) || '') ||
    //     editData.type !== editingCard.type
    // );

    return (
        <div className="min-h-screen bg-dark-900 text-white pb-40 overflow-x-hidden">
            <Navbar />

            {/* HERO CARD - Container Principal Mobile-First */}
            <header className="pt-6 pb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-4">
                    {/* Bouton Retour */}
                    <button
                        onClick={() => handleSafeNavigation(() => navigate('/dashboard'))}
                        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors group"
                    >
                        <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all">
                            <ChevronLeft size={14} />
                        </div>
                        <span className="group-hover:translate-x-0.5 transition-transform">Retour</span>
                    </button>

                    {/* Bouton Options (only for owner) */}
                    {isOwner && (
                        <div className="relative">
                            <button
                                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                                className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors group"
                            >
                                <span className="group-hover:-translate-x-0.5 transition-transform">Options</span>
                                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all">
                                    <MoreVertical size={14} />
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {showOptionsMenu && (
                                <>
                                    {/* Overlay to close */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowOptionsMenu(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button
                                            onClick={confirmDeleteTrip}
                                            disabled={deletingTrip}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                            {deletingTrip ? 'Suppression...' : 'Supprimer le voyage'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Hero Card */}
                <div className="bg-gradient-to-br from-dark-800 via-dark-800 to-dark-900 rounded-[28px] border border-white/5 overflow-hidden shadow-2xl shadow-black/40">

                    {/* Main Info Section */}
                    <div className="p-5 md:p-6">
                        <div className="flex items-start gap-4">
                            {/* Emoji Voyage - Cliquable pour changer */}
                            <button
                                onClick={() => isOwner && setShowEmojiPicker(true)}
                                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-dark-900/80 border border-white/5 flex items-center justify-center text-3xl md:text-4xl shrink-0 shadow-inner transition-all ${isOwner ? 'hover:scale-105 hover:border-brand-500/30 cursor-pointer' : 'cursor-default'}`}
                                title={isOwner ? "Changer l'emoji" : undefined}
                            >
                                {tripEmoji}
                            </button>

                            {/* Titre + Status + Meta */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-xl md:text-2xl font-black tracking-tight truncate">{trip.title}</h1>
                                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${allDaysLocked ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                        {allDaysLocked ? 'Prêt' : 'En cours'}
                                    </span>
                                </div>

                                {/* Meta Grid - Responsive */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-bold text-gray-400">
                                    <span className="flex items-center gap-1.5">
                                        <MapPin size={11} className="text-brand-500/70" />
                                        <span className="truncate">{trip.destination_country}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={11} className="text-brand-500/70" />
                                        {trip.start_date ? new Date(trip.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''} • {trip.duration_days}j
                                    </span>
                                    {trip.preferences?.budget && (
                                        <span className="flex items-center gap-1.5">
                                            <Wallet size={11} className="text-brand-500/70" />
                                            <span className="capitalize">{trip.preferences.budget}</span>
                                        </span>
                                    )}
                                    {trip.preferences?.rhythm && (
                                        <span className="flex items-center gap-1.5">
                                            <Zap size={11} className="text-brand-500/70" />
                                            <span className="capitalize">{trip.preferences.rhythm}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Voyageurs Section */}
                    <div className="px-5 md:px-6 py-4 border-t border-white/5 bg-white/[0.015]">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 flex items-center gap-2">
                                <Users size={12} className="text-gray-600" />
                                Voyageurs ({members.length})
                            </span>
                            <div className="flex items-center">
                                {members.slice(0, 5).map((member, idx) => (
                                    <div
                                        key={member.id}
                                        className="w-9 h-9 rounded-full bg-dark-700 border-2 border-dark-800 flex items-center justify-center text-lg shadow-sm hover:scale-110 hover:z-10 transition-transform cursor-default"
                                        style={{ marginLeft: idx === 0 ? 0 : -8 }}
                                        title={member.user?.username || 'Voyageur'}
                                    >
                                        {member.user?.emoji || '👤'}
                                    </div>
                                ))}
                                {members.length > 5 && (
                                    <div
                                        className="w-9 h-9 rounded-full bg-dark-600 border-2 border-dark-800 flex items-center justify-center text-[10px] font-black text-gray-400"
                                        style={{ marginLeft: -8 }}
                                    >
                                        +{members.length - 5}
                                    </div>
                                )}
                                {(isOwner || canEditGlobal) && (
                                    <button
                                        onClick={() => setShowTravelersSheet(true)}
                                        className="w-9 h-9 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-gray-500 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-500/5 transition-all ml-2"
                                        title="Inviter des voyageurs"
                                    >
                                        <Plus size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Switch Container - Séparé */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex justify-center">
                    <div className="bg-gradient-to-br from-dark-800 via-dark-800 to-dark-900 rounded-full border border-white/5 p-1.5 shadow-xl shadow-black/30">
                        {[
                            { id: 'itineraire', label: 'Itinéraire', icon: <MapIcon size={14} />, validated: allDaysLocked },
                            { id: 'preparation', label: 'Préparation', icon: <ClipboardList size={14} />, validated: isPreparationValidated },
                            { id: 'carnet', label: 'Carnet', icon: <Compass size={14} />, validated: false }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleSafeNavigation(() => setActiveTab(tab.id as any))}
                                className={`relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
                                {tab.validated && (
                                    <div className="absolute -top-1 -right-1 bg-green-500 text-white w-4 h-4 rounded-full flex items-center justify-center border-2 border-dark-800">
                                        <Check size={8} strokeWidth={4} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Day Selector (Itinerary Only) */}
            {activeTab === 'itineraire' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-2">
                        {days.map((day) => {
                            const isBeingEdited = !!day.edited_by;
                            const isValidated = day.status === 'locked';
                            const isActive = day.day_index === activeDayIndex;

                            return (
                                <button
                                    key={day.id}
                                    onClick={() => handleSafeNavigation(() => navigate(`/trips/${tripId}/day/${day.day_index}`))}
                                    className={`shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-xl transition-all relative ${isActive && isBeingEdited
                                        ? 'bg-white text-dark-900 border border-dashed border-brand-500 shadow-lg'
                                        : isActive
                                            ? 'bg-white text-dark-900 border border-white shadow-lg'
                                            : isBeingEdited
                                                ? 'bg-dark-800/50 border border-dashed border-brand-500/60 text-brand-400'
                                                : 'bg-dark-800/50 border border-white/5 text-gray-500 hover:bg-dark-800 hover:text-gray-300'
                                        }`}
                                >
                                    <span className="text-[9px] font-black uppercase opacity-60">J{day.day_index}</span>
                                    <span className="text-base font-black">{day.date ? new Date(day.date).getDate() : '-'}</span>
                                    {isValidated && !isBeingEdited && (
                                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center border-2 border-dark-900 ${isActive ? 'bg-dark-900 text-white' : 'bg-green-500 text-white'}`}>
                                            <Check size={6} strokeWidth={4} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                        {canEditGlobal && (
                            <button
                                onClick={handleAddDay}
                                className="shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-xl border-2 border-dashed border-white/10 text-gray-600 hover:border-brand-500/50 hover:text-brand-500 transition-all hover:bg-brand-500/5"
                            >
                                <Plus size={16} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Timeline Main - Itinerary Tab */}
            {activeTab === 'itineraire' && (
                <>
                    {/* Container Principal Itinéraire - Design cohérent avec Hero Card */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                        <div className={`bg-gradient-to-br from-dark-800 via-dark-800 to-dark-900 rounded-[28px] overflow-hidden shadow-2xl shadow-black/40 transition-all ${isLockedByMe
                            ? 'border border-dashed border-brand-500/60'
                            : isLockedBySomeoneElse
                                ? 'border border-dashed border-orange-500/40'
                                : 'border border-white/5'
                            }`}>

                            {/* Header Journée */}
                            <div className="p-5 md:p-6 border-b border-white/5">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="text"
                                                value={localDayTitle ?? currentDay?.title ?? ''}
                                                placeholder={`Journée ${activeDayIndex}`}
                                                onChange={(e) => handleUpdateDayTitle(e.target.value)}
                                                disabled={!isLockedByMe}
                                                className={`text-xl md:text-2xl font-black focus:ring-0 w-full transition-all rounded-lg px-3 py-2 ${isLockedByMe
                                                    ? 'bg-dark-800 border border-brand-500/30 text-white placeholder:text-white/30 focus:border-brand-500 shadow-inner'
                                                    : 'bg-transparent border-transparent text-white cursor-default px-0'
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar size={11} className="text-brand-500/70" />
                                                {formattedDate}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                            {isLockedBySomeoneElse ? (
                                                <span className="flex items-center gap-1.5 text-orange-400 animate-pulse">
                                                    <Lock size={11} />
                                                    En cours de modification par {editingUser?.username || 'un utilisateur'}
                                                    {isOwner && (
                                                        <button onClick={handleForceUnlock} className="ml-1 underline text-[9px] text-red-400 hover:text-red-300">Récupérer les droits</button>
                                                    )}
                                                </span>
                                            ) : isLockedByMe ? (
                                                <span className="flex items-center gap-1.5 text-green-400">
                                                    <CheckCircle2 size={11} />
                                                    Mode Édition
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5">
                                                    <Zap size={11} className="text-brand-500/70" />
                                                    {isDayLoading ? 'Chargement...' : `${cards.length} évènement${cards.length > 1 ? 's' : ''}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Organize Button */}
                                        {canEditGlobal && (
                                            isLockedByMe ? (
                                                <button
                                                    onClick={handleReleaseLock}
                                                    className="h-9 px-4 rounded-xl flex items-center gap-2 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest bg-brand-500 text-white hover:bg-brand-600"
                                                >
                                                    <Check size={14} />
                                                    <span className="hidden sm:inline">Terminer</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleRequestLock}
                                                    disabled={isLockedBySomeoneElse}
                                                    className={`h-9 px-4 rounded-xl flex items-center gap-2 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest ${isLockedBySomeoneElse ? 'bg-dark-700 text-gray-600 cursor-not-allowed opacity-50' : 'bg-brand-500 text-white hover:bg-brand-600'}`}
                                                >
                                                    {isLockedBySomeoneElse ? <Lock size={14} /> : <Pencil size={14} />}
                                                    <span className="hidden sm:inline">{isLockedBySomeoneElse ? 'En cours de modification...' : 'Organiser'}</span>
                                                </button>
                                            )
                                        )}

                                        {/* Validate Day Switch - replace button */}
                                        {canEditGlobal && !isLockedByMe && !isLockedBySomeoneElse && (
                                            <div className="flex items-center gap-3 bg-dark-900/40 rounded-full px-3 py-1.5 border border-white/5">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${currentDay?.status === 'locked' ? 'text-green-400' : 'text-gray-500'}`}>
                                                    {currentDay?.status === 'locked' ? 'Validé' : 'En préparation'}
                                                </span>
                                                <button
                                                    onClick={async () => {
                                                        if (!currentDay) return;
                                                        const newStatus = currentDay.status === 'locked' ? 'draft' : 'locked';
                                                        const { error } = await supabase
                                                            .from('trip_days')
                                                            .update({ status: newStatus })
                                                            .eq('id', currentDay.id);
                                                        if (!error) {
                                                            setCurrentDay(prev => prev ? { ...prev, status: newStatus } : null);
                                                            setDays(prev => prev.map(d => d.id === currentDay.id ? { ...d, status: newStatus } : d));
                                                        }
                                                    }}
                                                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 focus:ring-brand-500 ${currentDay?.status === 'locked' ? 'bg-green-500' : 'bg-dark-700 border border-white/10'
                                                        }`}
                                                    title={currentDay?.status === 'locked' ? 'Déverrouiller la journée' : 'Valider la journée'}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out ${currentDay?.status === 'locked' ? 'translate-x-5' : 'translate-x-0'
                                                        }`} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Delete Day Button - visible seulement en modification */}
                                        {canEditGlobal && isLockedByMe && (
                                            <button
                                                onClick={handleDeleteDay}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all group bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500"
                                                title="Supprimer cette journée"
                                            >
                                                <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Timeline Content */}
                            <div className="p-5 md:p-6">
                                <div className="relative before:absolute before:left-[15px] before:top-0 before:bottom-0 before:w-0.5 before:bg-gradient-to-b before:from-brand-500/30 before:via-brand-500/20 before:to-transparent before:rounded-full">
                                    {isDayLoading ? (
                                        <div className="space-y-3">
                                            <CardSkeleton />
                                            <CardSkeleton />
                                            <CardSkeleton />
                                        </div>
                                    ) : cards.length === 0 ? (
                                        <div className="relative pl-10 w-full">
                                            <button
                                                onClick={handleDirectAddCard}
                                                disabled={!isLockedByMe}
                                                className={`w-full bg-dark-900/40 border-2 border-dashed border-white/10 rounded-2xl py-12 flex flex-col items-center justify-center gap-3 transition-all group ${isLockedByMe ? 'hover:border-brand-500/30 hover:bg-brand-500/5 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-dark-800 border border-white/10 flex items-center justify-center text-gray-500 group-hover:scale-110 group-hover:border-brand-500/30 group-hover:text-brand-500 transition-all">
                                                    <Plus size={24} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-gray-400 font-bold text-sm mb-1">Rien de prévu</p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-500/50 group-hover:text-brand-500 transition-colors">
                                                        {isLockedByMe ? 'Ajouter votre première étape' : 'Cliquez sur "Organiser"'}
                                                    </p>
                                                </div>
                                            </button>
                                        </div>
                                    ) : (
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleDragEnd}
                                            modifiers={[restrictToVerticalAxis]}
                                        >
                                            <div className="space-y-3">
                                                <SortableContext
                                                    items={cards.map(c => c.id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {cards.map((card) => {
                                                        // [NEW] Live Preview: Merge real data with edit data if editing this card
                                                        const isEditing = editingCard?.id === card.id;
                                                        const displayCard = isEditing ? { ...card, ...editData, type: editData.type } : card;

                                                        return (
                                                            <SortableCard
                                                                key={card.id}
                                                                card={displayCard}
                                                                isLocked={!isLockedByMe}
                                                                onEdit={() => isLockedByMe && openEdit(card)}
                                                                onDelete={() => handleDeleteCard(card.id)}
                                                                checklistCount={checklistItems.filter(i => i.card_id === card.id).length}
                                                                isEditing={isEditing}
                                                            >
                                                                {/* INLINE EDIT FORM */}
                                                                {isEditing && (
                                                                    <div className="space-y-6 animate-in fade-in duration-300">

                                                                        {/* Header Actions (Delete/Close) */}
                                                                        {/* <div className="flex justify-end gap-2 mb-4"> ... REMOVED ... </div> */}

                                                                        {/* Type Selection */}
                                                                        <div className="space-y-3">
                                                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Type</label>
                                                                            <div className="grid grid-cols-4 gap-2">
                                                                                {EVENT_TYPES.map(t => (
                                                                                    <button
                                                                                        key={t.id}
                                                                                        onClick={() => setEditData({ ...editData, type: t.id })}
                                                                                        className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all duration-200 ${editData.type === t.id
                                                                                            ? 'bg-brand-500 border-brand-400 text-white ring-2 ring-brand-500/20'
                                                                                            : 'bg-dark-800 border-white/5 text-gray-500 hover:bg-dark-700 hover:text-gray-300'
                                                                                            }`}
                                                                                    >
                                                                                        {React.cloneElement(t.icon as React.ReactElement, { size: 18 })}
                                                                                        <span className="text-[9px] font-black uppercase tracking-wide truncate w-full text-center">{t.label}</span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>

                                                                        {/* Title */}
                                                                        <div className="space-y-2">
                                                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Titre</label>
                                                                            <input
                                                                                type="text"
                                                                                value={editData.title}
                                                                                onChange={e => setEditData({ ...editData, title: e.target.value })}
                                                                                className="w-full bg-dark-800 border border-white/5 rounded-xl h-[42px] px-4 text-sm font-bold text-white focus:outline-none focus:border-brand-500 transition-all placeholder:text-white/10"
                                                                                placeholder="Nommez votre moment..."
                                                                            />
                                                                        </div>

                                                                        {/* Time & Duration */}
                                                                        <div className="bg-dark-800/30 p-4 rounded-2xl border border-white/5 space-y-4">
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div className="space-y-2">
                                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Début</label>
                                                                                    <div className="relative">
                                                                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={14} />
                                                                                        <input
                                                                                            type="time"
                                                                                            value={editData.start_time}
                                                                                            onChange={e => {
                                                                                                const start = e.target.value;
                                                                                                let end = editData.end_time;
                                                                                                if (editData.duration !== 'custom') {
                                                                                                    const [h, m] = start.split(':').map(Number);
                                                                                                    const totalMinutes = h * 60 + m + (editData.duration as number);
                                                                                                    const eh = Math.floor(totalMinutes / 60) % 24;
                                                                                                    const em = totalMinutes % 60;
                                                                                                    end = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
                                                                                                }
                                                                                                setEditData({ ...editData, start_time: start, end_time: end });
                                                                                            }}
                                                                                            className="w-full bg-dark-800 border border-white/5 rounded-xl h-[42px] pl-10 pr-3 text-white text-sm focus:outline-none focus:border-brand-500 transition-all font-bold"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Fin</label>
                                                                                    <div className="relative">
                                                                                        {editData.duration === 'custom' ? (
                                                                                            <input
                                                                                                type="time"
                                                                                                value={editData.end_time}
                                                                                                onChange={e => setEditData({ ...editData, end_time: e.target.value })}
                                                                                                className="w-full bg-dark-800 border border-brand-500/50 rounded-xl h-[42px] px-3 text-white text-sm focus:outline-none focus:border-brand-500 transition-all font-bold"
                                                                                            />
                                                                                        ) : (
                                                                                            <div className="h-[42px] flex items-center px-4 bg-dark-950/30 rounded-xl border border-white/5 text-gray-500 font-bold text-sm">
                                                                                                {editData.end_time || '--:--'}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Duration Presets */}
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {[
                                                                                    { label: '30m', val: 30 },
                                                                                    { label: '1h', val: 60 },
                                                                                    { label: '1h30', val: 90 },
                                                                                    { label: '2h', val: 120 },
                                                                                    { label: 'Autre', val: 'custom' },
                                                                                ].map(d => (
                                                                                    <button
                                                                                        key={d.label}
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            if (d.val === 'custom') {
                                                                                                setEditData({ ...editData, duration: 'custom' });
                                                                                                return;
                                                                                            }
                                                                                            if (!editData.start_time) return;
                                                                                            const [h, m] = editData.start_time.split(':').map(Number);
                                                                                            const totalMinutes = h * 60 + m + (d.val as number);
                                                                                            const eh = Math.floor(totalMinutes / 60) % 24;
                                                                                            const em = totalMinutes % 60;
                                                                                            const end = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
                                                                                            setEditData({ ...editData, duration: d.val, end_time: end });
                                                                                        }}
                                                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${editData.duration === d.val ? 'bg-brand-500 text-white' : 'bg-dark-900 text-gray-500 hover:text-gray-300 border border-white/5'}`}
                                                                                    >
                                                                                        {d.label}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>

                                                                        {/* Location */}
                                                                        <div className="space-y-4">
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                <div className="relative">
                                                                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder={editData.type === 'transport' ? "Départ..." : "Lieu..."}
                                                                                        value={editData.location_text}
                                                                                        onChange={e => handleAddressSearch(e.target.value, 'start')}
                                                                                        onFocus={() => {
                                                                                            setActiveAddressField('start');
                                                                                            if (editData.location_text.length > 2) setShowAddressSuggestions(true);
                                                                                        }}
                                                                                        className="w-full bg-dark-800 border border-white/5 rounded-xl h-[42px] pl-10 pr-4 text-white text-sm focus:outline-none focus:border-brand-500 transition-all font-bold"
                                                                                    />
                                                                                    {/* Suggestions (Simplified for inline) */}
                                                                                    {showAddressSuggestions && activeAddressField === 'start' && addressSuggestions.length > 0 && (
                                                                                        <div className="absolute top-full left-0 right-0 mt-2 bg-dark-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden max-h-40 overflow-y-auto z-10">
                                                                                            {addressSuggestions.map((feature: any) => (
                                                                                                <button
                                                                                                    key={feature.id}
                                                                                                    onClick={() => selectAddress(feature)}
                                                                                                    className="w-full text-left px-4 py-2 hover:bg-white/5 text-xs font-medium border-b border-white/5 last:border-0 flex items-center gap-2"
                                                                                                >
                                                                                                    <span className="truncate">{feature.place_name}</span>
                                                                                                </button>
                                                                                            ))}
                                                                                            <div className="fixed inset-0 z-[-1]" onClick={() => setShowAddressSuggestions(false)}></div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                {editData.type === 'transport' && (
                                                                                    <div className="relative">
                                                                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={14} />
                                                                                        <input
                                                                                            type="text"
                                                                                            placeholder="Arrivée..."
                                                                                            value={editData.end_location_text}
                                                                                            onChange={e => handleAddressSearch(e.target.value, 'end')}
                                                                                            onFocus={() => {
                                                                                                setActiveAddressField('end');
                                                                                                if (editData.end_location_text.length > 2) setShowAddressSuggestions(true);
                                                                                            }}
                                                                                            className="w-full bg-dark-800 border border-white/5 rounded-xl h-[42px] pl-10 pr-4 text-white text-sm focus:outline-none focus:border-brand-500 transition-all font-bold"
                                                                                        />
                                                                                        {showAddressSuggestions && activeAddressField === 'end' && addressSuggestions.length > 0 && (
                                                                                            <div className="absolute top-full left-0 right-0 mt-2 bg-dark-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden max-h-40 overflow-y-auto z-10">
                                                                                                {addressSuggestions.map((feature: any) => (
                                                                                                    <button
                                                                                                        key={feature.id}
                                                                                                        onClick={() => selectAddress(feature)}
                                                                                                        className="w-full text-left px-4 py-2 hover:bg-white/5 text-xs font-medium border-b border-white/5 last:border-0 flex items-center gap-2"
                                                                                                    >
                                                                                                        <span className="truncate">{feature.place_name}</span>
                                                                                                    </button>
                                                                                                ))}
                                                                                                <div className="fixed inset-0 z-[-1]" onClick={() => setShowAddressSuggestions(false)}></div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Checklist (Restored) */}
                                                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                                                            <div className="flex items-center gap-2">
                                                                                <CheckSquare size={16} className="text-brand-500" />
                                                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Checklist</h4>
                                                                            </div>

                                                                            {/* Liste des tâches */}
                                                                            <div className="space-y-2 mb-4">
                                                                                {checklistItems.filter(item => item.card_id === card.id).map((item) => (
                                                                                    <div key={item.id} className="bg-dark-900 border border-white/5 rounded-xl p-3 flex items-center justify-between group animate-in slide-in-from-left-2 duration-300">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <button
                                                                                                onClick={() => handleToggleChecklist(item.id, item.is_completed)}
                                                                                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${item.is_completed ? 'bg-green-500 border-green-500 text-white' : 'border-white/10 hover:border-brand-500/50'}`}
                                                                                            >
                                                                                                {item.is_completed && <Check size={12} />}
                                                                                            </button>
                                                                                            <span className={`text-xs font-bold ${item.is_completed ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                                                                                                {item.checklist_data?.label}
                                                                                            </span>
                                                                                        </div>
                                                                                        <button
                                                                                            onClick={async () => {
                                                                                                const { error } = await supabase.from('checklists').delete().eq('id', item.id);
                                                                                                if (!error) setChecklistItems(prev => prev.filter(i => i.id !== item.id));
                                                                                            }}
                                                                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-500 transition-all"
                                                                                        >
                                                                                            <X size={14} />
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>

                                                                            <div className="flex gap-2">
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Ajouter une tâche..."
                                                                                    value={newChecklistItem}
                                                                                    onChange={e => setNewChecklistItem(e.target.value)}
                                                                                    className="flex-1 bg-dark-800 border border-white/5 rounded-xl h-[42px] px-4 text-sm text-white focus:outline-none focus:border-brand-500 transition-all font-bold"
                                                                                    onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem()}
                                                                                />
                                                                                <button
                                                                                    onClick={handleAddChecklistItem}
                                                                                    className="w-[42px] h-[42px] flex items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-lg active:scale-95"
                                                                                >
                                                                                    <Plus size={18} />
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Description */}
                                                                        <div>
                                                                            <textarea
                                                                                rows={3}
                                                                                value={editData.description}
                                                                                onChange={e => setEditData({ ...editData, description: e.target.value })}
                                                                                className="w-full bg-dark-800 border border-white/5 rounded-xl p-4 text-white focus:outline-none focus:border-brand-500 transition-all text-sm no-scrollbar resize-none placeholder:text-gray-600"
                                                                                placeholder="Notes..."
                                                                            />
                                                                        </div>

                                                                        {/* Actions Footer REMOVED (Auto-save) */}
                                                                    </div>
                                                                )}
                                                            </SortableCard>
                                                        );
                                                    })}
                                                </SortableContext>

                                                {/* Add Activity Card */}
                                                {isLockedByMe && (
                                                    <div className="relative pl-10">
                                                        <button
                                                            onClick={handleDirectAddCard}
                                                            className="w-full bg-dark-900/40 border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-brand-500/30 hover:bg-brand-500/5 transition-all group"
                                                        >
                                                            <div className="w-10 h-10 rounded-xl bg-dark-800 border border-white/10 flex items-center justify-center text-gray-500 group-hover:scale-110 group-hover:border-brand-500/30 group-hover:text-brand-500 transition-all">
                                                                <Plus size={20} />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-brand-500 transition-colors">Ajouter une étape</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </DndContext>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Preparation Tab */}
            {activeTab === 'preparation' && (
                <main className="max-w-7xl mx-auto px-4 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-black italic mb-2">Préparation</h2>
                        <p className="text-gray-500 font-medium">Tout ce dont vous avez besoin avant le départ</p>

                        <div className="mt-8 bg-dark-800/50 border border-white/5 rounded-3xl p-6">
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Progression</span>
                                <span className="text-2xl font-black text-brand-500">
                                    {checklistItems.length > 0 ? Math.round((checklistItems.filter(i => i.is_completed).length / checklistItems.length) * 100) : 0}% prêt
                                </span>
                            </div>
                            <div className="h-3 bg-dark-900 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-brand-500 shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all duration-1000"
                                    style={{ width: `${checklistItems.length > 0 ? (checklistItems.filter(i => i.is_completed).length / checklistItems.length) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-sm text-gray-400 font-bold">
                                <Sparkles size={16} className="text-brand-500" />
                                {checklistItems.filter(i => !i.is_completed).length} actions en attente
                            </div>
                        </div>
                    </div>

                    {/* Hub Section */}
                    <div className="space-y-4 mb-12">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-600 ml-2">Hub Pratique & Sécurité</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'docs', label: 'Documents', icon: <BookOpen />, sub: 'Passeport, Visa...' },
                                { id: 'sante', label: 'Santé', icon: <Stethoscope />, sub: 'Vaccins, Pharma' },
                                { id: 'safety', label: 'Sécurité', icon: <ShieldCheck />, sub: 'Zones, Scams' },
                                { id: 'money', label: 'Argent', icon: <Wallet />, sub: 'Cartes, Budget' },
                                { id: 'tel', label: 'Connectivité', icon: <Wifi />, sub: 'SIM, eSIM' },
                                { id: 'transp', label: 'Transports', icon: <Truck />, sub: 'Location, Péages' },
                                { id: 'meteo', label: 'Météo', icon: <CloudRain />, sub: 'Équipement' },
                                { id: 'guides', label: 'Guides', icon: <ImageIcon />, sub: 'Inspiration' },
                            ].map(item => (
                                <button key={item.id} className="p-4 bg-dark-800/30 border border-white/5 rounded-2xl hover:border-brand-500/20 transition-all flex items-start gap-4 text-left group">
                                    <div className="w-10 h-10 bg-dark-900 rounded-xl flex items-center justify-center text-brand-500 shrink-0 group-hover:scale-110 transition-transform">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm">{item.label}</div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-0.5">{item.sub}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AI Section */}
                    <div className="bg-brand-500/10 border border-brand-500/20 rounded-[32px] p-8 mb-12 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/5 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <ToriLogo size={32} color="#f97316" className="drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                                <span className="font-black italic uppercase tracking-widest text-sm">Utiliser Tori IA</span>
                            </div>
                            <h4 className="text-xl font-black mb-3">Conseil personnalisé pour Tokyo</h4>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                "N'oubliez pas d'acheter une carte Pasmo ou Suica dès votre arrivée. Les retraits sont plus faciles dans les 7-Eleven."
                            </p>
                            <button className="flex items-center gap-2 text-brand-500 font-black text-sm hover:gap-3 transition-all">
                                <Plus size={16} /> Ajouter à ma checklist
                            </button>
                        </div>
                    </div>

                    {/* Checklist Section */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-600 ml-2">Checklist Structurée</h3>
                        </div>

                        <div className="space-y-3">
                            {checklistItems.length === 0 ? (
                                <div className="p-12 text-center border border-dashed border-white/5 rounded-[32px] text-gray-500 font-bold">
                                    Aucune tâche ajoutée pour le moment.
                                </div>
                            ) : (
                                checklistItems.map((item) => (
                                    <div key={item.id} className="bg-dark-800/50 p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleToggleChecklist(item.id, item.is_completed)}
                                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.is_completed ? 'bg-green-500 border-green-500 text-white' : 'border-white/10 hover:border-brand-500/50'}`}
                                            >
                                                {item.is_completed && <Check size={14} />}
                                            </button>
                                            <div>
                                                <div className={`text-sm font-bold ${item.is_completed ? 'line-through text-gray-600' : 'text-white'}`}>
                                                    {item.checklist_data?.label || 'Tâche sans nom'}
                                                </div>
                                                <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mt-0.5 flex items-center gap-2">
                                                    {item.checklist_data?.category || 'Général'}
                                                    {item.card_id && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                                            <span className="text-brand-500/50 flex items-center gap-1">
                                                                <Zap size={8} /> {allTripCards[item.card_id] || 'Évènement lié'}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                const { error } = await supabase.from('checklists').delete().eq('id', item.id);
                                                if (!error) setChecklistItems(prev => prev.filter(i => i.id !== item.id));
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            )
            }

            {/* Carnet Tab */}
            {
                activeTab === 'carnet' && (
                    <main className="max-w-7xl mx-auto px-4 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                        <div className="mb-10 text-center">
                            <h2 className="text-3xl font-black italic mb-2">Mon Carnet</h2>
                            <p className="text-gray-500 font-medium">Capturez et vivez votre voyage en temps réel</p>
                        </div>

                        {/* Today Control Center */}
                        <div className="mb-12">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-600 ml-2 mb-4">Mode Voyage : Mercredi 11 Février</h3>
                            <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-white/5 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/5 rounded-full blur-3xl"></div>

                                <div className="flex items-start justify-between mb-8">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-brand-500 mb-1">
                                            <Navigation size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">En cours</span>
                                        </div>
                                        <h4 className="text-2xl font-black">Visite du Palais Impérial</h4>
                                        <p className="text-gray-400 font-bold flex items-center gap-2">
                                            <Clock size={16} className="text-gray-600" /> 10:00 - 12:30
                                        </p>
                                    </div>
                                    <button className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20 active:scale-90 transition-all">
                                        <Navigation size={24} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button className="py-4 bg-dark-700/50 hover:bg-green-500/10 hover:border-green-500/30 border border-white/5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                        <CheckCircle2 size={16} className="text-green-500" /> Fait
                                    </button>
                                    <button className="py-4 bg-dark-700/50 hover:bg-orange-500/10 hover:border-orange-500/30 border border-white/5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                        <History size={16} className="text-orange-500" /> Déplacer
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Journal Section */}
                        <div className="space-y-6 mb-12">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-600 ml-2">Journal de Bord</h3>
                                <button className="p-3 bg-brand-500/10 rounded-2xl text-brand-500 hover:bg-brand-500/20 transition-all">
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-dark-800/30 border border-white/5 rounded-3xl p-6 relative group overflow-hidden">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">🍵</span>
                                            <span className="font-bold">Moment "Calme" à Yanaka</span>
                                        </div>
                                        <span className="text-[10px] font-black text-gray-600 uppercase">14:20</span>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed italic mb-4">
                                        "Probablement le meilleur matcha que j'ai bu. Les rues sont calmes, on se sent loin de Shinjuku..."
                                    </p>
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1 bg-dark-900 rounded-full text-[9px] font-black uppercase text-gray-500 border border-white/5 flex items-center gap-1.5">
                                            <Heart size={10} className="text-red-500" /> Mood: Zen
                                        </div>
                                        <div className="px-3 py-1 bg-dark-900 rounded-full text-[9px] font-black uppercase text-gray-500 border border-white/5">
                                            Gourmet
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="aspect-square bg-dark-800 rounded-3xl border border-white/10 flex items-center justify-center text-gray-700 flex-col gap-2 cursor-pointer hover:border-brand-500/30 transition-all">
                                        <ImageIcon size={32} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Ajouter Photos</span>
                                    </div>
                                    <div className="aspect-square bg-dark-800 rounded-3xl border border-white/10 flex items-center justify-center text-gray-700 flex-col gap-2 cursor-pointer hover:border-brand-500/30 transition-all">
                                        <Plus size={32} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Nouvelle Note</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Carnet */}
                        <div className="bg-dark-800/50 border border-brand-500/20 rounded-[32px] p-8 mb-12 relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles className="text-brand-500 shadow-glow-sm" size={24} />
                                <h4 className="text-xl font-black italic">IA Carnet</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-dark-900/50 p-4 rounded-2xl border border-white/5">
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        "Votre journée a été marquée par la gastronomie. Voulez-vous que je génère un résumé 'Foodie' pour vos réseaux ?"
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button className="flex-1 py-3 bg-brand-500/10 text-brand-500 border border-brand-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-500/20 transition-all flex items-center justify-center gap-2">
                                        <Share2 size={14} /> Préparer le post
                                    </button>
                                    <button className="flex-1 py-3 bg-dark-800 border border-white/5 text-gray-400 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                        Ignorer
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* End of Trip Export */}
                        <div className="text-center py-10 border-t border-white/5">
                            <button className="inline-flex items-center gap-3 text-gray-500 hover:text-white transition-all group">
                                <ExternalLink size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                <span className="font-black italic uppercase tracking-widest">Exporter mon voyage</span>
                            </button>
                        </div>
                    </main>
                )
            }

            {/* Add Moment Sheet Logic Removed - Direct Create Implemented */}

            {/* Emoji Picker Modal */}
            {
                showEmojiPicker && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowEmojiPicker(false)}></div>
                        <div className="relative bg-dark-800 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">L'esprit de ce voyage...</h3>
                                <button onClick={() => setShowEmojiPicker(false)} className="text-gray-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="flex flex-col gap-6 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                                {tripEmojiCategories.map(category => (
                                    <div key={category.name} className="px-1">
                                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-3 tracking-widest">{category.name}</p>
                                        <div className="grid grid-cols-5 gap-3">
                                            {category.emojis.map(e => (
                                                <button
                                                    key={e}
                                                    type="button"
                                                    onClick={() => {
                                                        updateTripEmoji(e);
                                                        setShowEmojiPicker(false);
                                                    }}
                                                    className={`w-14 h-14 flex items-center justify-center rounded-xl text-3xl hover:bg-white/10 transition-all ${tripEmoji === e ? 'bg-brand-500/20 ring-2 ring-brand-500/50 scale-105' : 'bg-dark-900 border border-white/5'}`}
                                                >
                                                    {e}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }



            {/* Travelers Management Off-Canvas */}
            {
                showTravelersSheet && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowTravelersSheet(false)}></div>
                        <div className="relative w-full max-w-md bg-dark-900 border-l border-white/10 h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">

                            {/* Header */}
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-dark-900/95 backdrop-blur-md z-10">
                                <h2 className="text-2xl font-black italic">Gérer les voyageurs</h2>
                                <button
                                    onClick={() => setShowTravelersSheet(false)}
                                    className="w-10 h-10 rounded-full bg-dark-800 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-700 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-8">

                                {/* Status Feedback */}
                                {inviteStatus !== 'idle' && (
                                    <div className="px-8 animate-in slide-in-from-top duration-300">
                                        <div className={`p-4 rounded-2xl flex items-center gap-3 border ${inviteStatus === 'success'
                                            ? 'bg-green-500/10 border-green-500/20 text-green-200'
                                            : 'bg-red-500/10 border-red-500/20 text-red-200'
                                            }`}>
                                            {inviteStatus === 'success' ? <CheckCircle2 size={18} className="text-green-500" /> : <AlertTriangle size={18} className="text-red-500" />}
                                            <span className="text-sm font-bold">{inviteStatusMessage}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Current Members */}
                                <section className="space-y-4 px-8">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                        <Users size={12} />
                                        Membres du voyage
                                    </h3>
                                    <div className="space-y-3">
                                        {members.map(member => (
                                            <div key={member.id} className="flex items-center gap-4 bg-dark-800/50 p-3 rounded-2xl border border-white/5 group relative overflow-visible z-10 hover:z-20">
                                                <div className="w-10 h-10 rounded-full bg-dark-700 overflow-hidden flex items-center justify-center shrink-0 border border-white/10 text-xl">
                                                    {member.user?.emoji || '👤'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold truncate">{member.user?.username || 'Utilisateur'}</div>
                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-2">
                                                        {/* Role Selector */}
                                                        {members.find(m => m.user_id === user?.id)?.role === 'owner' && member.role !== 'owner' ? (
                                                            <select
                                                                value={member.role}
                                                                onChange={async (e) => {
                                                                    const newRole = e.target.value as 'editor' | 'viewer';
                                                                    // Optimistic Update
                                                                    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m));

                                                                    const { error } = await supabase
                                                                        .from('trip_members')
                                                                        .update({ role: newRole })
                                                                        .eq('id', member.id);

                                                                    if (error) {
                                                                        console.error('Error updating role:', error);
                                                                        // Revert if error (optional, could just refetch)
                                                                        fetchMembers();
                                                                    }
                                                                }}
                                                                className="bg-transparent border-none p-0 text-[10px] uppercase font-bold text-brand-500 focus:ring-0 cursor-pointer hover:underline"
                                                            >
                                                                <option value="editor">Éditeur (Modifie)</option>
                                                                <option value="viewer">Observateur (Voir)</option>
                                                            </select>
                                                        ) : (
                                                            <span>{member.role === 'owner' ? 'Leader' : (member.role === 'editor' ? 'Éditeur' : 'Observateur')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {member.role !== 'owner' && members.find(m => m.user_id === user?.id)?.role === 'owner' && (
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Retirer ce membre ?')) return;
                                                            const { error } = await supabase.from('trip_members').delete().eq('id', member.id);
                                                            if (!error) setMembers(prev => prev.filter(m => m.id !== member.id));
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Pending Invitations */}
                                {invitations.length > 0 && (
                                    <section className="space-y-4 px-8">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                            <Clock size={12} />
                                            Invitations en attente
                                        </h3>
                                        <div className="space-y-2">
                                            {invitations.map(invite => (
                                                <div key={invite.id} className="flex items-center gap-4 p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                                        {invite.email ? <Mail size={16} className="text-gray-400" /> : <LinkIcon size={16} className="text-brand-500" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold truncate text-gray-300">
                                                            {invite.email || 'Lien Public Actif'}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                            En attente • Observateur
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            const { error } = await supabase.from('trip_invitations').delete().eq('id', invite.id);
                                                            if (!error) {
                                                                setInvitations(prev => prev.filter(i => i.id !== invite.id));
                                                                setInviteStatus('success');
                                                                setInviteStatusMessage('Invitation révoquée');
                                                                setTimeout(() => setInviteStatus('idle'), 3000);
                                                            }
                                                        }}
                                                        className="p-2 text-gray-600 hover:text-red-500 transition-all opacity-50 hover:opacity-100"
                                                        title="Révoquer l'invitation"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Invite Actions */}
                                <section className="space-y-6 pt-6 border-t border-white/5 px-8">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-500">Inviter des voyageurs</h3>

                                    <div className="space-y-3">
                                        <button
                                            onClick={handleGenerateLink}
                                            className="w-full h-[50px] rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group"
                                        >
                                            <LinkIcon size={16} /> Copier le lien d'invitation
                                        </button>
                                        <p className="text-[10px] text-gray-500 text-center">
                                            ⚠️ Le lien expire 24h après sa création
                                        </p>
                                    </div>
                                </section>

                            </div>
                        </div>
                    </div>
                )
            }

            {/* Confirmation Modal */}
            <GenericConfirmationModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                variant={confirmConfig.variant}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div >
    );
};

export default TripEditor;
