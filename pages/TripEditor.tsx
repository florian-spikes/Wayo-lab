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
    Send
} from 'lucide-react';
import Navbar from '../components/Navbar';

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
}

// Catégories d'emojis pour le voyage
const tripEmojiCategories = [
    { name: 'Voyage', emojis: ['✈️', '🌍', '🏝️', '🏔️', '🏕️', '🏙️', '🎒', '📸', '⛵', '🗺️', '🚅', '🏨', '🎟️', '🚲', '🌋', '⛺'] },
    { name: 'Activités', emojis: ['🏃', '🧗', '🏄', '🎿', '🚲', '🎨', '🎭', '🎧', '🔭', '⛳', '🎰', '🧘'] },
    { name: 'Nature', emojis: ['🌲', '🌵', '🌻', '🍃', '🌊', '❄️', '🔥', '⭐', '🌙', '☀️', '🌈', '🌩️'] }
];

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
}

interface ChecklistItem {
    id: string;
    card_id: string;
    is_completed: boolean;
    created_at: string;
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
    };
}

interface TripInvitation {
    id: string;
    email: string;
    role: 'editor' | 'viewer';
    status: 'pending' | 'accepted' | 'expired';
    token: string;
}

const SortableCard: React.FC<SortableCardProps & { onEdit: (card: Card) => void }> = ({ card, isLocked, onEdit, checklistCount = 0 }) => {
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
        opacity: isDragging ? 0.5 : (isLocked ? 0.8 : 1)
    };

    const getTypeIcon = (type: string, size = 18) => {
        const typeData = EVENT_TYPES.find(t => t.id === type.toLowerCase()) || EVENT_TYPES[EVENT_TYPES.length - 1];
        return React.cloneElement(typeData.icon as React.ReactElement, { size });
    };

    return (
        <div ref={setNodeRef} style={style} className="relative pl-12 group mb-6">
            {/* Timeline Dot */}
            <div className={`absolute left-[22px] top-6 w-1.5 h-1.5 rounded-full ring-4 ring-dark-900 z-10 ${isLocked ? 'bg-gray-600' : 'bg-brand-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'}`}></div>

            <div
                onClick={() => !isDragging && onEdit(card)}
                className={`bg-dark-800/50 border border-white/5 rounded-3xl p-5 hover:border-brand-500/20 transition-all flex gap-4 cursor-pointer ${isLocked ? '' : 'hover:shadow-lg hover:shadow-brand-500/5'}`}
            >
                {!isLocked && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-2 -ml-2 text-gray-700 hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical size={20} />
                    </button>
                )}

                <div className="w-12 h-12 bg-dark-900 rounded-2xl flex items-center justify-center shrink-0 text-brand-500 shadow-inner">
                    {getTypeIcon(card.type)}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold truncate text-lg group-hover:text-white transition-colors">{card.title}</h3>
                        <button className="text-gray-600 hover:text-white transition-colors">
                            <MoreVertical size={18} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest">
                        {(card.start_time || card.end_time) && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-dark-900 rounded-lg text-gray-400 border border-white/5 capitalize">
                                <Clock size={12} className="text-brand-500" />
                                {card.start_time?.slice(0, 5) || '??'} - {card.end_time?.slice(0, 5) || '??'}
                                {(() => {
                                    if (card.start_time && card.end_time) {
                                        const [sh, sm] = card.start_time.split(':').map(Number);
                                        const [eh, em] = card.end_time.split(':').map(Number);
                                        let duration = (eh * 60 + em) - (sh * 60 + sm);
                                        if (duration < 0) duration += 1440;
                                        const h = Math.floor(duration / 60);
                                        const m = duration % 60;
                                        return (
                                            <span className="text-brand-500/60 ml-1">
                                                ({h > 0 ? `${h}h` : ''}{m > 0 ? `${m}m` : ''})
                                            </span>
                                        );
                                    }
                                    return null;
                                })()}
                            </span>
                        )}
                        {card.location_text && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-dark-900 rounded-lg text-gray-400 border border-white/5 capitalize text-[9px]">
                                <MapPin size={10} className="text-brand-500" />
                                {card.location_text}
                            </span>
                        )}
                        {checklistCount > 0 && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-500/5 rounded-lg text-brand-500 border border-brand-500/10">
                                <CheckSquare size={10} />
                                {checklistCount} {checklistCount > 1 ? 'tâches' : 'tâche'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
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
    const [showAddSheet, setShowAddSheet] = useState(false);
    const [activeTab, setActiveTab] = useState<'itineraire' | 'preparation' | 'carnet'>('itineraire');

    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [showIconSelect, setShowIconSelect] = useState(false);
    const [editData, setEditData] = useState<{
        title: string;
        description: string;
        location_text: string;
        start_time: string;
        end_time: string;
        duration: number | 'custom';
        type: string;
    }>({
        title: '',
        description: '',
        location_text: '',
        start_time: '',
        end_time: '',
        duration: 60,
        type: 'activité'
    });

    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [allTripCards, setAllTripCards] = useState<Record<string, string>>({});
    const [members, setMembers] = useState<TripMember[]>([]);
    const [invitations, setInvitations] = useState<TripInvitation[]>([]);
    const [showTravelersSheet, setShowTravelersSheet] = useState(false);
    // Email invitations removed - link sharing only
    const [inviteStatus, setInviteStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [inviteStatusMessage, setInviteStatusMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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

    const handleUpdateDayTitle = async (newTitle: string) => {
        if (!currentDay) return;

        // Mise à jour optimiste de l'UI
        setCurrentDay({ ...currentDay, title: newTitle });
        setDays(prev => prev.map(d => d.id === currentDay.id ? { ...d, title: newTitle } : d));

        const { error } = await supabase
            .from('trip_days')
            .update({ title: newTitle })
            .eq('id', currentDay.id);

        if (error) {
            console.error("Error updating day title:", error);
            // Optionnel : rollback en cas d'erreur
        }
    };

    const handleDeleteDay = async () => {
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
            message: `Êtes-vous sûr de vouloir supprimer la journée J${currentDay.day_index} et toutes ses activités ? Cette action est irréversible.`,
            variant: 'danger',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                // 1. Supprimer les cartes associées
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

    const handleUpdateCard = async () => {
        if (!editingCard) return;

        const { data, error } = await supabase
            .from('cards')
            .update({
                title: editData.title,
                description: editData.description,
                location_text: editData.location_text,
                start_time: editData.start_time || null,
                end_time: editData.end_time || null,
                type: editData.type,
                updated_at: new Date().toISOString()
            })
            .eq('id', editingCard.id)
            .select()
            .single();

        if (!error && data) {
            setCards(prev => prev.map(c => c.id === data.id ? data : c));
            setEditingCard(null);
        }
    };

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

    const openEdit = (card: Card) => {
        if (currentDay?.status === 'locked') return;
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
            start_time: card.start_time?.slice(0, 5) || '',
            end_time: card.end_time?.slice(0, 5) || '',
            duration: initialDuration,
            type: card.type
        });
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

        // Step 1: Fetch members without trying to join profiles
        const { data: membersData, error: membersError } = await supabase
            .from('trip_members')
            .select('*')
            .eq('trip_id', tripId);

        if (!membersError && membersData) {
            // Step 2: Fetch profiles separately
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
        }
    }, [tripId, fetchChecklist]);

    const persistOrder = async (newCards: Card[]) => {
        const updates = newCards.map((card, index) => ({
            id: card.id,
            order_index: index
        }));

        // Upsert order_index changes in batch
        const { error } = await supabase
            .from('cards')
            .upsert(updates, { onConflict: 'id' });

        if (error) {
            console.error("Error persisting order:", error);
            // Optional: fallback to previous state if error
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = cards.findIndex(c => c.id === active.id);
            const newIndex = cards.findIndex(c => c.id === over.id);

            const reorderedCards = arrayMove(cards, oldIndex, newIndex) as Card[];

            // Optimistic UI
            setCards(reorderedCards);

            // Real persistence
            persistOrder(reorderedCards);
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

    const handleAddCard = async (type: string) => {
        if (!currentDay || !tripId || !user) return;

        const newCard = {
            trip_id: tripId,
            day_id: currentDay.id,
            type,
            title: `Nouveau ${type}`,
            description: '',
            order_index: cards.length,
            start_time: '10:00:00',
            end_time: '11:00:00',
            created_by: user.id,
            source: 'manual'
        };

        const { data, error } = await supabase.from('cards').insert(newCard).select().single();
        if (!error && data) {
            setCards([...cards, data]);
            setShowAddSheet(false);
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

    if (!trip) return <div>Trip not found</div>;

    const formattedDate = currentDay?.date
        ? new Date(currentDay.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
        : `Jour ${activeDayIndex}`;

    const allDaysLocked = days.length > 0 && days.every(d => d.status === 'locked');

    const hasChanges = !!editingCard && (
        editData.title !== editingCard.title ||
        editData.description !== (editingCard.description || '') ||
        editData.location_text !== (editingCard.location_text || '') ||
        editData.start_time !== (editingCard.start_time?.slice(0, 5) || '') ||
        editData.end_time !== (editingCard.end_time?.slice(0, 5) || '') ||
        editData.type !== editingCard.type
    );

    return (
        <div className="min-h-screen bg-dark-900 text-white pb-40 overflow-x-hidden">
            <Navbar />

            {/* Premium Immersive Header */}
            <header className="pt-24 pb-8 px-4 relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
                <div className="absolute top-20 right-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px] -z-10"></div>

                <div className="max-w-7xl mx-auto">
                    {/* Back to Voyages Link */}
                    <div className="mb-8 flex justify-center md:justify-start">
                        <Link
                            to="/dashboard"
                            className="group/back flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-brand-500 transition-all"
                        >
                            <div className="w-8 h-8 rounded-full bg-dark-800 border border-white/5 flex items-center justify-center group-hover/back:border-brand-500/30 group-hover/back:bg-brand-500/5 transition-all">
                                <ChevronLeft size={16} />
                            </div>
                            <span>Retour à mes voyages</span>
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8 text-center md:text-left">
                        {/* Trip Icon / Emoji - Clickable */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-brand-500/20 rounded-[40px] blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                            <button
                                onClick={() => setShowEmojiPicker(true)}
                                className="relative w-32 h-32 md:w-40 md:h-40 bg-dark-800 border border-white/10 rounded-[40px] flex items-center justify-center text-7xl md:text-8xl shadow-2xl transition-all hover:scale-105 hover:border-brand-500/50 duration-500 cursor-pointer active:scale-95 group"
                            >
                                {tripEmoji}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[40px]">
                                    <Smile size={32} className="text-white" />
                                </div>
                            </button>
                        </div>

                        {/* Trip Info */}
                        <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${allDaysLocked ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}>
                                    {allDaysLocked ? <ShieldCheck size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>}
                                    {allDaysLocked ? 'Prévu' : 'En préparation'}
                                </span>
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    {trip.duration_days} Jours
                                </span>
                            </div>

                            <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter">
                                {trip.title}
                            </h1>

                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-y-3 gap-x-6 text-sm font-bold text-gray-400">
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-brand-500" />
                                    <span>{trip.destination_country}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-brand-500" />
                                    <span>
                                        {trip.start_date ? new Date(trip.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Flexible'}
                                        {trip.end_date ? ` - ${new Date(trip.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={16} className="text-brand-500" />
                                    <span>{trip.preferences?.rhythm || 'Standard'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Wallet size={16} className="text-brand-500" />
                                    <span>{trip.preferences?.budget || '€€'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Participants / Invited */}
                        <div className="flex flex-col items-center md:items-end gap-3 mt-4 md:mt-0">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Explorateurs</span>
                            <div className="flex -space-x-3">
                                {members.slice(0, 3).map((member, i) => (
                                    <div
                                        key={member.id}
                                        onClick={() => setShowTravelersSheet(true)}
                                        className="w-12 h-12 rounded-full bg-dark-800 border-2 border-dark-900 flex items-center justify-center text-sm font-bold text-gray-300 shadow-lg hover:-translate-y-1 transition-transform cursor-pointer group relative overflow-hidden"
                                    >
                                        {member.user?.user_metadata?.avatar_url ? (
                                            <img src={member.user.user_metadata.avatar_url} alt={member.user.email} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="bg-brand-500/10 w-full h-full flex items-center justify-center text-brand-500">
                                                {member.user?.email?.[0].toUpperCase() || '?'}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white text-dark-900 text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                            {member.user?.user_metadata?.full_name || member.user?.email?.split('@')[0] || 'Inconnu'}
                                        </div>
                                    </div>
                                ))}
                                {members.length > 3 && (
                                    <div
                                        onClick={() => setShowTravelersSheet(true)}
                                        className="w-12 h-12 rounded-full bg-dark-800 border-2 border-dark-900 flex items-center justify-center text-xs font-bold text-gray-400 cursor-pointer hover:text-white"
                                    >
                                        +{members.length - 3}
                                    </div>
                                )}
                                <button
                                    onClick={() => setShowTravelersSheet(true)}
                                    className="w-12 h-12 rounded-full bg-brand-500/10 border-2 border-dashed border-brand-500/30 flex items-center justify-center text-brand-500 hover:bg-brand-500 hover:text-white transition-all z-10"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs - Modern & Floating */}
            <div className="sticky top-16 z-50 bg-dark-900/80 backdrop-blur-xl border-y border-white/5">
                <div className="max-w-7xl mx-auto flex px-2 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'itineraire', label: 'Itinéraire', icon: <MapIcon size={18} /> },
                        { id: 'preparation', label: 'Préparation', icon: <ClipboardList size={18} /> },
                        { id: 'carnet', label: 'Carnet', icon: <Compass size={18} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 px-8 py-5 transition-all relative group shrink-0 ${activeTab === tab.id ? 'text-brand-500' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {tab.icon}
                            <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-brand-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Day Selector - Only for Itinerary - Floating style */}
            {activeTab === 'itineraire' && (
                <div className="bg-dark-900/40 border-b border-white/5 py-4">
                    <div className="max-w-7xl mx-auto px-4 flex gap-3 overflow-x-auto no-scrollbar py-1">
                        {days.map((day) => (
                            <button
                                key={day.id}
                                onClick={() => navigate(`/trips/${tripId}/day/${day.day_index}`)}
                                className={`shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-2xl border transition-all relative ${day.day_index === activeDayIndex ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20 scale-105' : 'bg-dark-800/50 border-white/5 text-gray-400 hover:border-white/10'}`}
                            >
                                <span className="text-[10px] font-bold uppercase opacity-60">J{day.day_index}</span>
                                <span className="text-lg font-black">{day.date ? new Date(day.date).getDate() : '-'}</span>
                                {day.status === 'locked' && (
                                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 shadow-lg border-2 border-dark-900">
                                        <Check size={8} strokeWidth={4} />
                                    </div>
                                )}
                            </button>
                        ))}

                        {/* Add Day Button */}
                        <button
                            onClick={handleAddDay}
                            className="shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-2xl border-2 border-dashed border-white/10 text-gray-500 hover:border-brand-500/50 hover:text-brand-500 transition-all hover:bg-brand-500/5 group"
                            title="Ajouter une journée"
                        >
                            <Plus size={20} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[8px] font-black uppercase mt-1">Nouveau</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Timeline Main - Itinerary Tab */}
            {activeTab === 'itineraire' && (
                <>
                    <main className="max-w-7xl mx-auto px-4 pt-12 pb-20">
                        <div className="mb-12 pl-12 py-2 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3 group/title">
                                    <input
                                        type="text"
                                        value={currentDay?.title || ''}
                                        placeholder={`Journée ${activeDayIndex}`}
                                        onChange={(e) => handleUpdateDayTitle(e.target.value)}
                                        className="bg-transparent border-none text-2xl md:text-3xl font-black text-white/90 focus:ring-0 p-0 w-full placeholder:text-white/10 hover:text-white transition-colors cursor-text"
                                    />
                                </div>
                                <div className="flex items-center gap-4 text-gray-500 font-bold tracking-tight text-sm">
                                    <div className="flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
                                        <Calendar size={12} className="text-brand-500/50" />
                                        {formattedDate}
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-white/10"></div>
                                    <div className="flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
                                        <Zap size={12} className="text-brand-500/50" />
                                        {isDayLoading ? 'Chargement...' : `${cards.length} évènement${cards.length > 1 ? 's' : ''}`}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Tori IA Button in Header */}
                                <button className="h-10 px-4 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center gap-2 hover:bg-brand-500/20 transition-all shadow-lg group/ia" title="Utiliser Tori IA">
                                    <ToriLogo size={20} color="#f97316" className="group-hover/ia:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-500">Utiliser Tori IA</span>
                                </button>

                                {/* Lock Button in Header */}
                                <button
                                    onClick={handleToggleLock}
                                    className={`h-10 px-4 rounded-xl border flex items-center gap-2 transition-all active:scale-95 shadow-lg text-[10px] font-black uppercase tracking-widest ${currentDay?.status === 'locked' ? 'bg-orange-500 border-orange-600 text-white' : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'}`}
                                >
                                    {currentDay?.status === 'locked' ? <Lock size={14} /> : <Unlock size={14} />}
                                    <span>{currentDay?.status === 'locked' ? 'Déverrouiller' : 'Valider'}</span>
                                </button>

                                <button
                                    onClick={handleDeleteDay}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-600 transition-all group scale-105"
                                    title="Supprimer cette journée"
                                >
                                    <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>

                        <div className="relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-brand-500/20">
                            {isDayLoading ? (
                                <div className="space-y-6">
                                    <CardSkeleton />
                                    <CardSkeleton />
                                    <CardSkeleton />
                                </div>
                            ) : cards.length === 0 ? (
                                <button
                                    onClick={() => setShowAddSheet(true)}
                                    className="ml-12 w-[calc(100%-3rem)] bg-dark-800/20 border-2 border-dashed border-white/5 rounded-[32px] py-16 flex flex-col items-center justify-center gap-4 hover:border-brand-500/30 hover:bg-brand-500/5 transition-all group"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-white/10 flex items-center justify-center text-gray-500 group-hover:scale-110 group-hover:border-brand-500/30 group-hover:text-brand-500 transition-all">
                                        <Plus size={32} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-500 font-bold mb-1">Rien de prévu pour ce jour.</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-500/50 group-hover:text-brand-500 transition-colors">Ajouter votre première étape</p>
                                    </div>
                                </button>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                    modifiers={[restrictToVerticalAxis]}
                                >
                                    <div className="space-y-6">
                                        <SortableContext
                                            items={cards.map(c => c.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {cards.map((card) => (
                                                <SortableCard
                                                    key={card.id}
                                                    card={card}
                                                    isLocked={currentDay?.status === 'locked'}
                                                    onEdit={() => openEdit(card)}
                                                    checklistCount={checklistItems.filter(i => i.card_id === card.id).length}
                                                />
                                            ))}
                                        </SortableContext>

                                        {/* Add Activity Card at the End of Timeline */}
                                        {currentDay?.status !== 'locked' && (
                                            <button
                                                onClick={() => setShowAddSheet(true)}
                                                className="w-full ml-12 bg-dark-800/20 border-2 border-dashed border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 hover:border-brand-500/30 hover:bg-brand-500/5 transition-all group"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-dark-800 border border-white/10 flex items-center justify-center text-gray-500 group-hover:scale-110 group-hover:border-brand-500/30 group-hover:text-brand-500 transition-all">
                                                    <Plus size={24} />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-gray-600 group-hover:text-brand-500 transition-colors">Ajouter une étape à la journée</span>
                                            </button>
                                        )}
                                    </div>
                                </DndContext>
                            )}
                        </div>
                    </main>

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

            {/* Add Moment Sheet */}
            {
                showAddSheet && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowAddSheet(false)}></div>
                        <div className="relative bg-dark-800 border border-white/10 rounded-t-[40px] p-8 pb-12 w-full max-w-xl shadow-2xl animate-in slide-in-from-bottom duration-300">
                            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-8"></div>
                            <h3 className="text-2xl font-black italic mb-8 flex items-center gap-3">
                                <Plus className="text-brand-500" /> Quel type de moment ?
                            </h3>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {[
                                    { id: 'Activité', icon: <ActivityIcon />, color: 'text-blue-400' },
                                    { id: 'Repas', icon: <Utensils />, color: 'text-orange-400' },
                                    { id: 'Transport', icon: <Car />, color: 'text-purple-400' },
                                    { id: 'Hébergement', icon: <Hotel />, color: 'text-green-400' },
                                    { id: 'Note', icon: <FileText />, color: 'text-gray-400' }
                                ].map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleAddCard(item.id)}
                                        className="p-5 bg-dark-900 rounded-3xl border border-white/5 hover:border-brand-500/30 transition-all flex flex-col items-center gap-3 group"
                                    >
                                        <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform ${item.color}`}>
                                            {item.icon}
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">{item.id}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

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

            {/* Edit Moment Off-Canvas Panel */}
            {
                editingCard && (
                    <div className="fixed inset-0 z-[110] flex justify-end">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500"
                            onClick={() => setEditingCard(null)}
                        ></div>

                        <div className="relative bg-dark-900 border-l border-white/5 w-full md:w-[480px] h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
                            {/* Panel Header */}
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-dark-800/50">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-500 mb-1">Édition de l'étape</h3>
                                    <p className="text-xl font-black italic">Détails de l'évènement</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDeleteCard(editingCard.id)}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setEditingCard(null)}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                                {/* Type/Icon Selection Section */}
                                <div className="flex flex-col items-center justify-center py-6">
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowIconSelect(!showIconSelect)}
                                            className="w-16 h-16 bg-dark-800 rounded-3xl border border-white/5 flex items-center justify-center text-brand-500 shadow-inner hover:border-brand-500/30 transition-all ring-offset-4 ring-offset-dark-900 focus:ring-2 ring-brand-500/20"
                                        >
                                            {getTypeIcon(editData.type, 32)}
                                        </button>

                                        {/* Icon Picker Popover on Click */}
                                        {showIconSelect && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-50 animate-in zoom-in fade-in duration-200">
                                                <div className="bg-dark-800 border border-white/10 rounded-2xl p-2 shadow-2xl flex gap-1 items-center whitespace-nowrap">
                                                    {EVENT_TYPES.map(t => (
                                                        <button
                                                            key={t.id}
                                                            onClick={() => {
                                                                setEditData({ ...editData, type: t.id });
                                                                setShowIconSelect(false);
                                                            }}
                                                            className={`p-2 rounded-lg transition-all ${editData.type === t.id ? 'bg-brand-500 text-white' : 'hover:bg-white/5 text-gray-500 hover:text-white'}`}
                                                            title={t.label}
                                                        >
                                                            {React.cloneElement(t.icon as React.ReactElement, { size: 18 })}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <span className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Choisir le type d'étape</span>
                                </div>

                                <div className="space-y-6">
                                    {/* Title Section */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Titre de l'évènement</label>
                                        <input
                                            type="text"
                                            value={editData.title}
                                            onChange={e => setEditData({ ...editData, title: e.target.value })}
                                            className="w-full bg-dark-800 border border-white/5 rounded-2xl h-[50px] px-6 text-xl font-black text-white focus:outline-none focus:border-brand-500 focus:bg-dark-800/80 transition-all placeholder:text-white/10"
                                            placeholder="Nommez votre moment..."
                                        />
                                    </div>

                                    <div className="space-y-4 bg-dark-800/50 p-6 rounded-3xl border border-white/5">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Heure de début</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" size={16} />
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
                                                        className="w-full bg-dark-900 border border-white/5 rounded-2xl h-[50px] pl-12 pr-4 text-white focus:outline-none focus:border-brand-500 transition-all font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                                                    {editData.duration === 'custom' ? 'Heure de fin' : 'Fin prévue'}
                                                </label>
                                                <div className="relative">
                                                    {editData.duration === 'custom' ? (
                                                        <input
                                                            type="time"
                                                            value={editData.end_time}
                                                            onChange={e => setEditData({ ...editData, end_time: e.target.value })}
                                                            className="w-full bg-dark-900 border border-brand-500/50 rounded-2xl h-[50px] px-4 text-white focus:outline-none focus:border-brand-500 transition-all font-bold animate-in fade-in duration-300"
                                                        />
                                                    ) : (
                                                        <div className="h-[50px] flex items-center px-4 bg-dark-950/50 rounded-2xl border border-white/5 text-gray-500 font-black text-lg">
                                                            {editData.end_time || '--:--'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="hidden sm:flex flex-wrap gap-2">
                                                {[
                                                    { label: '30m', val: 30 },
                                                    { label: '1h', val: 60 },
                                                    { label: '1h30', val: 90 },
                                                    { label: '2h', val: 120 },
                                                    { label: '3h', val: 180 },
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
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${editData.duration === d.val ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 px-6' : 'bg-dark-900 text-gray-400 hover:text-white border border-white/5'}`}
                                                    >
                                                        {d.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="sm:hidden">
                                                <select
                                                    value={editData.duration}
                                                    onChange={e => {
                                                        const val = e.target.value === 'custom' ? 'custom' : Number(e.target.value);
                                                        if (val === 'custom') {
                                                            setEditData({ ...editData, duration: 'custom' });
                                                            return;
                                                        }
                                                        if (!editData.start_time) return;
                                                        const [h, m] = editData.start_time.split(':').map(Number);
                                                        const totalMinutes = h * 60 + m + (val as number);
                                                        const eh = Math.floor(totalMinutes / 60) % 24;
                                                        const em = totalMinutes % 60;
                                                        const end = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
                                                        setEditData({ ...editData, duration: val, end_time: end });
                                                    }}
                                                    className="w-full bg-dark-900 border border-white/5 rounded-2xl h-[50px] px-4 text-white font-bold appearance-none focus:outline-none focus:border-brand-500"
                                                >
                                                    <option value={30}>30 minutes</option>
                                                    <option value={60}>1 heure</option>
                                                    <option value={90}>1 heure 30</option>
                                                    <option value={120}>2 heures</option>
                                                    <option value={180}>3 heures</option>
                                                    <option value="custom">Autre (Saisie manuelle)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Lieu</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Ex: Musée du Louvre"
                                                value={editData.location_text}
                                                onChange={e => setEditData({ ...editData, location_text: e.target.value })}
                                                className="w-full bg-dark-800 border border-white/5 rounded-2xl h-[50px] pl-12 pr-4 text-white focus:outline-none focus:border-brand-500 transition-all font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <CheckSquare size={16} className="text-brand-500" />
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Checklist de l'étape</h4>
                                        </div>

                                        {/* Liste des tâches déjà ajoutées pour cet évènement */}
                                        <div className="space-y-2 mb-4">
                                            {checklistItems.filter(item => item.card_id === editingCard.id).map((item) => (
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
                                                className="flex-1 bg-dark-800 border border-white/5 rounded-2xl h-[50px] px-6 text-sm text-white focus:outline-none focus:border-brand-500 transition-all font-bold"
                                                onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem()}
                                            />
                                            <button
                                                onClick={handleAddChecklistItem}
                                                className="w-[50px] h-[50px] flex items-center justify-center rounded-2xl bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-lg active:scale-95"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Notes & Envies</label>
                                        <textarea
                                            rows={4}
                                            value={editData.description}
                                            onChange={e => setEditData({ ...editData, description: e.target.value })}
                                            className="w-full bg-dark-800 border border-white/5 rounded-2xl p-6 text-white focus:outline-none focus:border-brand-500 transition-all text-sm no-scrollbar resize-none"
                                            placeholder="Précisez votre envie pour ce moment..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {hasChanges && (
                                <div className="p-8 border-t border-white/5 bg-dark-800/80 backdrop-blur-md flex justify-end animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <button
                                        onClick={handleUpdateCard}
                                        className="h-10 px-4 rounded-xl border flex items-center gap-2 transition-all active:scale-95 shadow-lg text-[10px] font-black uppercase tracking-widest bg-orange-500 border-orange-600 text-white"
                                    >
                                        Enregistrer les modifications
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Travelers Management Off-Canvas */}
            {showTravelersSheet && (
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
                                        <div key={member.id} className="flex items-center gap-4 bg-dark-800/50 p-3 rounded-2xl border border-white/5 group">
                                            <div className="w-10 h-10 rounded-full bg-dark-700 overflow-hidden flex items-center justify-center shrink-0 border border-white/10 text-xl">
                                                {member.user?.emoji || '👤'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold truncate">{member.user?.username || 'Utilisateur'}</div>
                                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                    {member.role === 'owner' ? 'Leader' : (member.role === 'editor' ? 'Éditeur' : 'Observateur')}
                                                </div>
                                            </div>
                                            {member.role !== 'owner' && (
                                                <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-500 transition-all">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Pending Invitations */}
                            {invitations.length > 0 && (
                                <section className="space-y-4">
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
                            <section className="space-y-6 pt-6 border-t border-white/5">
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
            )}

            {/* Confirmation Modal */}
            <GenericConfirmationModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                variant={confirmConfig.variant}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default TripEditor;
