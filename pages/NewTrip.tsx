import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
    ChevronLeft,
    ChevronRight,
    PlaneLanding,
    PlaneTakeoff,
    Calendar as CalendarIcon,
    Clock,
    Users,
    Zap,
    Compass,
    MessageSquare,
    Check,
    X,
    TrendingUp,
    Star,
    Sparkles,
    Plus
} from 'lucide-react';
import Navbar from '../components/Navbar';
import MapboxAutocomplete from '../components/MapboxAutocomplete';

type DateMode = 'fixed' | 'flexible';

interface TripData {
    origin: string;
    destinations: string[]; // Replaces single destination
    dateMode: DateMode;
    startDate: string;
    endDate: string;
    approxDuration: number;
    season: string;
    budget: string;
    participants: number;
    rhythm: string;
    experiences: string[];
    notes: string;
}

const NewTrip: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Multi-dest input state
    const [currentDestinationInput, setCurrentDestinationInput] = useState('');

    // Calendar state
    const [currentMonthView, setCurrentMonthView] = useState(new Date());

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const [formData, setFormData] = useState<TripData>({
        origin: '',
        destinations: [],
        dateMode: 'fixed',
        startDate: '',
        endDate: '',
        approxDuration: 5,
        season: '☀️ Été',
        budget: '€€',
        participants: 1,
        rhythm: '🚶 Standard',
        experiences: [],
        notes: ''
    });

    const updateFormData = (data: Partial<TripData>) => {
        setFormData(prev => ({ ...prev, ...data }));
        setIsDirty(true);
    };

    const addDestination = () => {
        if (currentDestinationInput.trim()) {
            setFormData(prev => ({
                ...prev,
                destinations: [...prev.destinations, currentDestinationInput.trim()]
            }));
            setCurrentDestinationInput('');
            setIsDirty(true);
        }
    };

    const removeDestination = (index: number) => {
        setFormData(prev => ({
            ...prev,
            destinations: prev.destinations.filter((_, i) => i !== index)
        }));
    };

    const categories = [
        { id: 'culture', name: 'Culture', icon: '🎭' },
        { id: 'nature', name: 'Nature', icon: '🌿' },
        { id: 'gastronomy', name: 'Gastronomie', icon: '🍜' },
        { id: 'relaxation', name: 'Détente', icon: '🏖️' },
        { id: 'adventure', name: 'Aventure', icon: '🏔️' },
        { id: 'shopping', name: 'Shopping', icon: '🛍️' },
    ];

    const budgetLevels = [
        { id: '€', label: 'Ultra serré', desc: 'Backpacker, auberges, repas locaux' },
        { id: '€€', label: 'Économique', desc: 'Hôtels simples, mix street food et restos' },
        { id: '€€€', label: 'Confort', desc: 'Beaux hôtels, activités régulières' },
        { id: '€€€€', label: 'Premium', desc: 'Luxe, expériences exclusives, confort total' },
    ];

    const rhythms = [
        { id: '🐢', label: 'Tranquille', desc: 'Prendre le temps d\'apprécier chaque lieu' },
        { id: '🚶', label: 'Standard', desc: 'Un bon équilibre entre visite et repos' },
        { id: '🏃', label: 'Rapide', desc: 'Voir beaucoup de choses en peu de temps' },
        { id: '⚡', label: 'Ultra speed', desc: 'Optimisation maximale, rythme intense' },
    ];

    const nextStep = () => setStep(s => Math.min(s + 1, 7));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const toggleExperience = (id: string) => {
        setFormData(prev => ({
            ...prev,
            experiences: prev.experiences.includes(id)
                ? prev.experiences.filter(e => e !== id)
                : [...prev.experiences, id]
        }));
    };

    const handleCreateTrip = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // Calculate duration
            let duration = formData.approxDuration;
            if (formData.dateMode === 'fixed' && formData.startDate && formData.endDate) {
                const start = new Date(formData.startDate);
                const end = new Date(formData.endDate);
                duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            }

            // Format destinations string for existing schema
            const destinationString = formData.destinations.join(', ');

            // 1. Create Trip
            const { data: trip, error: tripError } = await supabase
                .from('trips')
                .insert({
                    user_id: user.id,
                    title: `Voyage à ${destinationString || 'Nouvelle Destination'}`,
                    origin_country: formData.origin,
                    destination_country: destinationString,
                    start_date: formData.dateMode === 'fixed' ? formData.startDate : null,
                    end_date: formData.dateMode === 'fixed' ? formData.endDate : null,
                    duration_days: duration,
                    preferences: {
                        budget: formData.budget,
                        participants: formData.participants,
                        rhythm: formData.rhythm,
                        experiences: formData.experiences,
                        notes: formData.notes,
                        season: formData.dateMode === 'flexible' ? formData.season : null,
                        destinations: formData.destinations
                    }
                })
                .select()
                .single();

            if (tripError) throw tripError;

            // 2. Generate Days
            const daysToInsert = Array.from({ length: duration }).map((_, i) => {
                const dayIndex = i + 1;
                let dayDate = null;
                if (formData.dateMode === 'fixed' && formData.startDate) {
                    const d = new Date(formData.startDate);
                    d.setDate(d.getDate() + i);
                    dayDate = d.toISOString().split('T')[0];
                }
                return {
                    trip_id: trip.id,
                    day_index: dayIndex,
                    date: dayDate,
                    status: 'draft'
                };
            });

            const { error: daysError } = await supabase
                .from('trip_days')
                .insert(daysToInsert);

            if (daysError) throw daysError;

            // 3. Add Creator as Member
            const { error: memberError } = await supabase
                .from('trip_members')
                .insert({
                    trip_id: trip.id,
                    user_id: user.id,
                    role: 'owner'
                });

            if (memberError) throw memberError;

            // Reset dirty state to allow navigation without popups
            setIsDirty(false);

            // Redirect to editor day 1
            navigate(`/trips/${trip.id}/day/1`);

        } catch (error: any) {
            alert(`Erreur lors de la création : ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAbandon = () => {
        if (!isDirty) {
            navigate('/dashboard');
        } else {
            setShowExitModal(true);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-1 md:space-y-2">
                            <h2 className="text-xl md:text-2xl font-black tracking-tight">Où commence l'aventure ?</h2>
                            <p className="text-sm md:text-base text-gray-400">Définissons les bases de votre périple.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 max-w-lg mx-auto">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                                    <PlaneTakeoff size={14} className="text-brand-500" /> Localisation de départ
                                </label>
                                <MapboxAutocomplete
                                    value={formData.origin}
                                    onChange={(val) => updateFormData({ origin: val })}
                                    onSelect={(feature) => updateFormData({ origin: feature.place_name })}
                                    placeholder="Ex: France, Paris"
                                    type="any"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                                    <PlaneLanding size={14} className="text-brand-500" /> Destinations
                                </label>

                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <MapboxAutocomplete
                                            value={currentDestinationInput}
                                            onChange={setCurrentDestinationInput}
                                            onSelect={() => { }} // You might want to auto-add on select, but for now user clicks +
                                            placeholder="Ex: Japon, New York..."
                                            type="any"
                                            className="flex-1"
                                        />
                                        <button
                                            onClick={addDestination}
                                            disabled={!currentDestinationInput.trim()}
                                            className="bg-brand-500 text-white p-3 rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>

                                    {/* Destinations Chips */}
                                    {formData.destinations.length > 0 && (
                                        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            {formData.destinations.map((dest, idx) => (
                                                <div key={idx} className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2 group hover:bg-white/15 transition-colors">
                                                    <span className="font-bold text-sm">{dest}</span>
                                                    <button
                                                        onClick={() => removeDestination(idx)}
                                                        className="text-gray-400 hover:text-red-400 transition-colors p-0.5"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {formData.destinations.length === 0 && (
                                        <p className="text-[10px] text-gray-500 italic pl-1">Ajoutez au moins une destination.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-1 md:space-y-2">
                            <h2 className="text-xl md:text-2xl font-black tracking-tight">Quand partez-vous ?</h2>
                            <p className="text-sm md:text-base text-gray-400">Choisissez vos dates ou une période approximative.</p>
                        </div>

                        <div className="flex bg-dark-800 p-1 rounded-xl border border-white/5 max-w-xs mx-auto shadow-inner">
                            <button
                                onClick={() => updateFormData({ dateMode: 'fixed' })}
                                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs md:text-sm transition-all ${formData.dateMode === 'fixed' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                J'ai des dates
                            </button>
                            <button
                                onClick={() => updateFormData({ dateMode: 'flexible' })}
                                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs md:text-sm transition-all ${formData.dateMode === 'flexible' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Je suis flexible
                            </button>
                        </div>

                        {formData.dateMode === 'fixed' ? (
                            <div className="space-y-4 max-w-sm mx-auto">
                                <div className="bg-dark-800 p-4 rounded-[24px] border border-white/5 shadow-2xl">
                                    {/* Calendar Header */}
                                    <div className="flex justify-between items-center mb-4">
                                        <button
                                            onClick={() => {
                                                const d = new Date(currentMonthView);
                                                d.setMonth(d.getMonth() - 1);
                                                setCurrentMonthView(d);
                                            }}
                                            className="p-2 hover:bg-white/5 rounded-full transition-colors active:scale-95"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <h3 className="font-black text-base first-letter:uppercase">
                                            {currentMonthView.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                const d = new Date(currentMonthView);
                                                d.setMonth(d.getMonth() + 1);
                                                setCurrentMonthView(d);
                                            }}
                                            className="p-2 hover:bg-white/5 rounded-full transition-colors active:scale-95"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>

                                    {/* Days Label */}
                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(day => (
                                            <div key={day} className="text-center text-[10px] uppercase tracking-wider font-bold text-gray-500">{day}</div>
                                        ))}
                                    </div>

                                    {/* Calendar Grid */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {(() => {
                                            const days = [];
                                            const firstDayOfMonth = new Date(currentMonthView.getFullYear(), currentMonthView.getMonth(), 1);
                                            const lastDayOfMonth = new Date(currentMonthView.getFullYear(), currentMonthView.getMonth() + 1, 0);

                                            // Adjusted for Monday start (0=Sun -> 6, 1=Mon -> 0, etc.)
                                            let startPadding = firstDayOfMonth.getDay() - 1;
                                            if (startPadding === -1) startPadding = 6;

                                            for (let i = 0; i < startPadding; i++) {
                                                days.push(<div key={`pad-${i}`} className="p-1"></div>);
                                            }

                                            for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
                                                const dateString = `${currentMonthView.getFullYear()}-${String(currentMonthView.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                                const isStart = formData.startDate === dateString;
                                                const isEnd = formData.endDate === dateString;
                                                const inRange = formData.startDate && formData.endDate && dateString > formData.startDate && dateString < formData.endDate;
                                                const isPast = new Date(dateString) < new Date(new Date().setHours(0, 0, 0, 0));

                                                days.push(
                                                    <button
                                                        key={d}
                                                        disabled={isPast}
                                                        onClick={() => {
                                                            if (!formData.startDate || (formData.startDate && formData.endDate)) {
                                                                updateFormData({ startDate: dateString, endDate: '' });
                                                            } else if (dateString < formData.startDate) {
                                                                updateFormData({ startDate: dateString, endDate: '' });
                                                            } else {
                                                                updateFormData({ endDate: dateString });
                                                            }
                                                        }}
                                                        className={`relative h-9 w-full flex items-center justify-center rounded-lg text-xs font-bold transition-all
                                                            ${isStart || isEnd ? 'bg-brand-500 text-white shadow-lg z-10 scale-105' : ''}
                                                            ${inRange ? 'bg-brand-500/10 text-brand-400 rounded-none' : ''}
                                                            ${!isStart && !isEnd && !inRange ? 'hover:bg-white/10 text-gray-300 hover:text-white' : ''}
                                                            ${isPast ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}
                                                            ${isStart && inRange ? 'rounded-r-none' : ''}
                                                            ${isEnd && inRange ? 'rounded-l-none' : ''}
                                                        `}
                                                    >
                                                        {d}
                                                        {/* Visual connection for range */}
                                                        {inRange && (
                                                            <div className="absolute inset-y-0 -left-1 -right-1 bg-brand-500/10 -z-10"></div>
                                                        )}
                                                    </button>
                                                );
                                            }
                                            return days;
                                        })()}
                                    </div>
                                </div>

                                {formData.startDate && formData.endDate && (
                                    <div className="text-center animate-in fade-in zoom-in duration-300">
                                        <div className="inline-block bg-brand-500/10 border border-brand-500/20 px-4 py-2 rounded-xl shadow-lg shadow-brand-500/5">
                                            <span className="text-brand-500 font-black text-lg mr-2">
                                                {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}
                                            </span>
                                            <span className="text-white font-bold text-xs uppercase tracking-wide">jours d'aventure</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-xs mx-auto bg-dark-800 p-6 rounded-[24px] border border-white/5 shadow-2xl">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Durée estimée</label>
                                        <span className="text-2xl font-black text-white">{formData.approxDuration} <span className="text-xs font-bold text-gray-500">jours</span></span>
                                    </div>
                                    <input
                                        type="range"
                                        min="3"
                                        max="60"
                                        value={formData.approxDuration}
                                        onChange={e => updateFormData({ approxDuration: parseInt(e.target.value) })}
                                        className="w-full h-3 bg-dark-900 rounded-full appearance-none cursor-pointer accent-brand-500 shadow-inner"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                                        <span>Week-end</span>
                                        <span>2 mois</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Saison idéale</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['🌸 Printemps', '☀️ Été', '🍂 Automne', '❄️ Hiver'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => updateFormData({ season: s })}
                                                className={`py-3 rounded-xl border-2 transition-all font-bold text-xs ${formData.season === s ? 'bg-brand-500/20 border-brand-500 text-white shadow-lg' : 'bg-dark-900 border-transparent hover:bg-dark-700 text-gray-400 hover:text-white'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 6:
                return (
                    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-1 md:space-y-2">
                            <h2 className="text-xl md:text-2xl font-black tracking-tight">Quelles expériences ?</h2>
                            <p className="text-sm md:text-base text-gray-400">Ce que vous aimez.</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
                            {categories.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => toggleExperience(c.id)}
                                    className={`aspect-square p-3 rounded-2xl md:rounded-3xl border-2 flex flex-col items-center justify-center gap-3 transition-all group ${formData.experiences.includes(c.id) ? 'bg-brand-500 border-brand-500 shadow-brand-500/20 shadow-xl scale-105' : 'bg-dark-800 border-white/5 hover:border-white/20 hover:bg-dark-700'}`}
                                >
                                    <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-300">{c.icon}</span>
                                    <span className={`font-bold text-xs md:text-sm text-center ${formData.experiences.includes(c.id) ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{c.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            // ... (keep cases 3, 4, 5, 7 as they were or update similarly if needed - assuming we keep them mostly as is but let's refresh their style slightly in next pass if needed, for now focusing on replacement targets)

            case 3:
                return (
                    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-1 md:space-y-2">
                            <h2 className="text-xl md:text-2xl font-black tracking-tight">Quel est votre budget ?</h2>
                            <p className="text-sm md:text-base text-gray-400">Le niveau de confort souhaité.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                            {budgetLevels.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => updateFormData({ budget: b.id })}
                                    className={`p-4 rounded-2xl border-2 text-left transition-all group hover:scale-[1.02] ${formData.budget === b.id ? 'bg-brand-500/10 border-brand-500 shadow-xl' : 'bg-dark-800/50 border-white/5 hover:border-white/20 hover:bg-dark-800'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-lg md:text-xl font-black transition-colors ${formData.budget === b.id ? 'text-brand-500' : 'text-gray-500 group-hover:text-white'}`}>{b.id}</span>
                                        {formData.budget === b.id && <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/50"><Check size={12} className="text-white" /></div>}
                                    </div>
                                    <p className="font-bold text-sm md:text-lg mb-1 text-white">{b.label}</p>
                                    <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">{b.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-1 md:space-y-2">
                            <h2 className="text-xl md:text-2xl font-black tracking-tight">Combien d'aventuriers ?</h2>
                            <p className="text-sm md:text-base text-gray-400">Ajustez le nombre de participants.</p>
                        </div>
                        <div className="flex items-center justify-center gap-6 md:gap-12 py-6 md:py-10">
                            <button
                                onClick={() => updateFormData({ participants: Math.max(1, formData.participants - 1) })}
                                className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-dark-800 border-2 border-white/5 flex items-center justify-center text-xl md:text-2xl font-black hover:bg-dark-700 hover:border-white/20 transition-all active:scale-95 shadow-lg text-gray-400 hover:text-white"
                            >
                                -
                            </button>
                            <div className="flex flex-col items-center w-32 md:w-40">
                                <span className="text-7xl md:text-8xl leading-none font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-600 drop-shadow-2xl">{formData.participants}</span>
                                <span className="text-brand-500 uppercase font-bold tracking-[0.2em] text-[10px] md:text-xs mt-2 md:mt-4">{formData.participants > 1 ? 'Voyageurs' : 'Voyageur'}</span>
                            </div>
                            <button
                                onClick={() => updateFormData({ participants: formData.participants + 1 })}
                                className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-dark-800 border-2 border-white/5 flex items-center justify-center text-xl md:text-2xl font-black hover:bg-dark-700 hover:border-white/20 transition-all active:scale-95 shadow-lg text-gray-400 hover:text-white"
                            >
                                +
                            </button>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-1 md:space-y-2">
                            <h2 className="text-xl md:text-2xl font-black tracking-tight">À quel rythme ?</h2>
                            <p className="text-sm md:text-base text-gray-400">Intensif ou détendu ?</p>
                        </div>
                        <div className="space-y-3 md:space-y-4 max-w-md mx-auto">
                            {rhythms.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => updateFormData({ rhythm: `${r.id} ${r.label}` })}
                                    className={`w-full p-3 md:p-4 rounded-2xl md:rounded-3xl border-2 flex items-center gap-4 transition-all group hover:scale-[1.02] ${formData.rhythm.startsWith(r.id) ? 'bg-brand-500/10 border-brand-500 shadow-lg' : 'bg-dark-800/50 border-white/5 hover:border-white/20 hover:bg-dark-800'}`}
                                >
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-dark-900 rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-3xl shadow-inner border border-white/5 group-hover:scale-110 transition-transform duration-300">{r.id}</div>
                                    <div className="text-left flex-1">
                                        <p className="font-bold text-sm md:text-lg text-white mb-0.5">{r.label}</p>
                                        <p className="text-xs md:text-sm text-gray-500 leading-tight">{r.desc}</p>
                                    </div>
                                    {formData.rhythm.startsWith(r.id) && <div className="text-brand-500"><Check size={18} /></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 7:
                return (
                    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-1 md:space-y-2">
                            <h2 className="text-xl md:text-2xl font-black tracking-tight">Envies, Rêves & Contraintes</h2>
                            <p className="text-sm md:text-base text-gray-400">Dites-nous tout ce qui compte pour vous.</p>
                        </div>
                        <div className="max-w-xl mx-auto space-y-4">
                            <div className="relative group">
                                <MessageSquare className="absolute top-4 left-4 text-gray-500 group-focus-within:text-brand-500 transition-colors" size={20} />
                                <textarea
                                    value={formData.notes}
                                    onChange={e => updateFormData({ notes: e.target.value })}
                                    rows={5}
                                    className="w-full bg-dark-800 border-2 border-white/5 rounded-2xl md:rounded-3xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-brand-500 transition-all text-sm md:text-base shadow-inner placeholder:text-gray-500 resize-none leading-relaxed"
                                    placeholder="Ex: 'Je veux absolument voir le Mont Fuji', 'Pas de randonnée difficile', 'Allergique aux fruits de mer', 'On adore les petits cafés cachés'..."
                                />
                            </div>

                            <div className="bg-gradient-to-br from-brand-500/10 to-brand-500/5 p-4 rounded-xl border border-brand-500/10 flex gap-3 items-start shadow-lg">
                                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0 shadow-inner">
                                    <Sparkles className="text-brand-500" size={16} />
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed italic pt-0.5">
                                    Donnez-nous un maximum de détails : spots précis, contraintes (santé, budget, mobilité), activités de rêve... <span className="text-brand-400 font-bold">Tori IA</span> utilisera tout pour construire votre voyage parfait.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 text-white pb-24 md:pb-20 overflow-x-hidden">
            <Navbar />

            {/* Header / Recap - Static */}
            <div className="pt-24 px-4 flex justify-center">
                <div className="bg-gradient-to-br from-dark-800 via-dark-800 to-dark-900 rounded-[28px] border border-white/5 overflow-hidden shadow-2xl shadow-black/40 max-w-4xl w-full flex flex-col relative z-10">
                    {/* Progress Bar */}
                    <div className="h-1 bg-dark-800 w-full">
                        <div
                            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(249,115,22,0.6)]"
                            style={{ width: `${(step / 7) * 100}%` }}
                        ></div>
                    </div>

                    <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 overflow-hidden">

                            {/* Circular Progress */}
                            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    {/* Background Circle */}
                                    <path
                                        className="text-gray-700"
                                        d="M18 2.0845
                                        a 15.9155 15.9155 0 0 1 0 31.831
                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    {/* Progress Circle */}
                                    <path
                                        className="text-brand-500 transition-all duration-500 ease-out"
                                        strokeDasharray={`${Math.round((step / 7) * 100)}, 100`}
                                        d="M18 2.0845
                                        a 15.9155 15.9155 0 0 1 0 31.831
                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px] font-black text-brand-400">{Math.round((step / 7) * 100)}%</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth mask-linear-fade pr-4">
                                {/* Dynamic Recap Chips */}
                                {formData.origin && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-bold text-gray-300 whitespace-nowrap">
                                        <PlaneTakeoff size={12} className="text-brand-500" />
                                        <span className="truncate max-w-[100px]">{formData.origin.split(',')[0]}</span>
                                    </div>
                                )}
                                {formData.destinations.length > 0 && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-bold text-gray-300 whitespace-nowrap">
                                        <PlaneLanding size={12} className="text-brand-500" />
                                        <span className="truncate max-w-[150px]">{formData.destinations.map(d => d.split(',')[0]).join(', ')}</span>
                                    </div>
                                )}
                                {formData.startDate && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-bold text-gray-300 whitespace-nowrap">
                                        <CalendarIcon size={12} className="text-brand-500" />
                                        <span>{new Date(formData.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                        {formData.endDate && <span>- {new Date(formData.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>}
                                    </div>
                                )}
                                {formData.participants > 1 && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-bold text-gray-300 whitespace-nowrap">
                                        <Users size={12} className="text-brand-500" />
                                        <span>{formData.participants}</span>
                                    </div>
                                )}
                                {step > 3 && formData.budget && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-bold text-gray-300 whitespace-nowrap">
                                        <span className="text-brand-500 text-xs">€</span>
                                        <span>{formData.budget}</span>
                                    </div>
                                )}
                                {step > 5 && formData.rhythm && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-bold text-gray-300 whitespace-nowrap">
                                        <span className="text-base">{formData.rhythm.split(' ')[0]}</span>
                                    </div>
                                )}
                                {step > 6 && formData.experiences.length > 0 && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-bold text-gray-300 whitespace-nowrap">
                                        <Zap size={12} className="text-brand-500" />
                                        <span>{formData.experiences.length} exp.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleAbandon}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 pt-8 pb-12 animate-in fade-in duration-700">
                {renderStep()}

                {/* Navigation Buttons */}
                <div className="fixed bottom-0 left-0 right-0 p-3 md:p-6 bg-gradient-to-t from-dark-900 via-dark-900/95 to-transparent z-40">
                    <div className="max-w-3xl mx-auto flex gap-3 md:gap-4">
                        {step > 1 && (
                            <button
                                onClick={prevStep}
                                className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-dark-800 border border-white/5 flex items-center justify-center hover:bg-dark-700 hover:border-white/20 transition-all active:scale-95 shadow-xl shrink-0 text-white"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}

                        <button
                            onClick={step === 7 ? handleCreateTrip : nextStep}
                            disabled={loading || (step === 1 && (!formData.origin || formData.destinations.length === 0))}
                            className={`flex-1 h-12 md:h-16 rounded-xl md:rounded-2xl font-black text-base md:text-xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 md:gap-3 disabled:opacity-30 disabled:cursor-not-allowed ${step === 7 ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-green-500/20' : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 shadow-brand-500/20 text-white'}`}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Création...</span>
                                </div>
                            ) : (
                                <>
                                    {step === 7 ? 'Créer mon itinéraire' : 'Continuer'}
                                    {step < 7 ? <ChevronRight size={20} /> : <Zap size={20} className="fill-current animate-pulse" />}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>

            {/* Exit Confirmation Modal */}
            {showExitModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"></div>
                    <div className="relative bg-dark-800 border border-white/10 rounded-[40px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300 text-center">
                        <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Compass className="text-orange-500 animate-pulse" size={40} />
                        </div>
                        <h3 className="text-2xl font-black italic mb-2">Déjà fini ?</h3>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            Toute votre progression sera perdue si vous quittez maintenant. Continuer la planification ?
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowExitModal(false)}
                                className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-black rounded-2xl shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                            >
                                Continuer à planifier
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full py-4 bg-dark-700 hover:bg-dark-600 text-gray-400 hover:text-white font-bold rounded-2xl transition-all"
                            >
                                Abandonner le voyage
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewTrip;
