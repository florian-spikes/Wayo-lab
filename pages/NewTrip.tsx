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
    Sparkles
} from 'lucide-react';
import Navbar from '../components/Navbar';

type DateMode = 'fixed' | 'flexible';

interface TripData {
    origin: string;
    destination: string;
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
        destination: '',
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

            // 1. Create Trip
            const { data: trip, error: tripError } = await supabase
                .from('trips')
                .insert({
                    user_id: user.id,
                    title: `Voyage à ${formData.destination || 'Nouvelle Destination'}`,
                    origin_country: formData.origin,
                    destination_country: formData.destination,
                    start_date: formData.dateMode === 'fixed' ? formData.startDate : null,
                    end_date: formData.dateMode === 'fixed' ? formData.endDate : null,
                    duration_days: duration,
                    preferences: {
                        budget: formData.budget,
                        participants: formData.participants,
                        rhythm: formData.rhythm,
                        experiences: formData.experiences,
                        notes: formData.notes,
                        season: formData.dateMode === 'flexible' ? formData.season : null
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
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold italic tracking-tight">Où commence l'aventure ?</h2>
                            <p className="text-gray-400">Définissons les bases de votre périple.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                                    <PlaneTakeoff size={18} className="text-brand-500" /> Pays de départ
                                </label>
                                <input
                                    type="text"
                                    value={formData.origin}
                                    onChange={e => updateFormData({ origin: e.target.value })}
                                    placeholder="Ex: France, Paris"
                                    className="w-full bg-dark-800 border-2 border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-brand-500 transition-all text-lg shadow-inner"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                                    <PlaneLanding size={18} className="text-brand-500" /> Pays d'arrivée / Destination
                                </label>
                                <input
                                    type="text"
                                    value={formData.destination}
                                    onChange={e => updateFormData({ destination: e.target.value })}
                                    placeholder="Ex: Japon, Tokyo"
                                    className="w-full bg-dark-800 border-2 border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-brand-500 transition-all text-lg shadow-inner"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold italic tracking-tight">Quand partez-vous ?</h2>
                            <p className="text-gray-400">Choisissez vos dates ou une période approximative.</p>
                        </div>

                        <div className="flex bg-dark-800 p-1 rounded-2xl border border-white/5 max-w-sm mx-auto shadow-inner">
                            <button
                                onClick={() => updateFormData({ dateMode: 'fixed' })}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.dateMode === 'fixed' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                J'ai des dates
                            </button>
                            <button
                                onClick={() => updateFormData({ dateMode: 'flexible' })}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.dateMode === 'flexible' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Mode flexible
                            </button>
                        </div>

                        {formData.dateMode === 'fixed' ? (
                            <div className="space-y-6 max-w-md mx-auto">
                                <div className="bg-dark-800 p-6 rounded-[32px] border border-white/5 shadow-2xl">
                                    {/* Calendar Header */}
                                    <div className="flex justify-between items-center mb-6">
                                        <button
                                            onClick={() => {
                                                const d = new Date(currentMonthView);
                                                d.setMonth(d.getMonth() - 1);
                                                setCurrentMonthView(d);
                                            }}
                                            className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <h3 className="font-black text-lg first-letter:uppercase">
                                            {currentMonthView.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                const d = new Date(currentMonthView);
                                                d.setMonth(d.getMonth() + 1);
                                                setCurrentMonthView(d);
                                            }}
                                            className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>

                                    {/* Days Label */}
                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(day => (
                                            <div key={day} className="text-center text-[10px] font-black text-gray-600 py-1">{day}</div>
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
                                                days.push(<div key={`pad-${i}`} className="p-2"></div>);
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
                                                        className={`relative p-2 h-10 w-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all
                                                            ${isStart || isEnd ? 'bg-brand-500 text-white shadow-lg z-10' : ''}
                                                            ${inRange ? 'bg-brand-500/10 text-brand-400 rounded-none' : ''}
                                                            ${!isStart && !isEnd && !inRange ? 'hover:bg-white/5' : ''}
                                                            ${isPast ? 'opacity-10 cursor-not-allowed' : 'cursor-pointer'}
                                                        `}
                                                    >
                                                        {d}
                                                        {/* Visual connection for range */}
                                                        {inRange && (
                                                            <div className="absolute inset-0 bg-brand-500/5 -z-10"></div>
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
                                        <div className="inline-block bg-brand-500/10 border border-brand-500/20 px-6 py-2 rounded-2xl">
                                            <span className="text-brand-500 font-black text-lg">
                                                {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} jours
                                            </span>
                                            <span className="text-gray-500 text-sm font-bold ml-2">de voyage prévu</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-10 max-w-md mx-auto">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <label className="text-sm font-bold text-gray-400">Durée approximative</label>
                                        <span className="text-2xl font-black text-brand-500">{formData.approxDuration} jours</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        value={formData.approxDuration}
                                        onChange={e => updateFormData({ approxDuration: parseInt(e.target.value) })}
                                        className="w-full h-3 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-brand-500 shadow-inner"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-gray-400">Saison préférée</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['🌸 Printemps', '☀️ Été', '🍂 Automne', '❄️ Hiver'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => updateFormData({ season: s })}
                                                className={`py-4 rounded-2xl border-2 transition-all font-bold ${formData.season === s ? 'bg-brand-500/20 border-brand-500 text-white shadow-lg' : 'bg-dark-800 border-white/5 text-gray-400 hover:border-white/10'}`}
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
            case 3:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold italic tracking-tight">Quel est votre budget ?</h2>
                            <p className="text-gray-400">Choisissez le niveau de confort qui vous correspond.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                            {budgetLevels.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => updateFormData({ budget: b.id })}
                                    className={`p-6 rounded-3xl border-2 text-left transition-all group ${formData.budget === b.id ? 'bg-brand-500/10 border-brand-500 shadow-xl' : 'bg-dark-800/50 border-white/5 hover:border-white/10'}`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`text-2xl font-black transition-colors ${formData.budget === b.id ? 'text-brand-500' : 'text-gray-500'}`}>{b.id}</span>
                                        {formData.budget === b.id && <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center"><Check size={14} /></div>}
                                    </div>
                                    <p className="font-bold text-lg mb-1">{b.label}</p>
                                    <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">{b.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold italic tracking-tight">Combien d'aventuriers ?</h2>
                            <p className="text-gray-400">Ajustez le nombre de participants.</p>
                        </div>
                        <div className="flex items-center justify-center gap-10 py-10">
                            <button
                                onClick={() => updateFormData({ participants: Math.max(1, formData.participants - 1) })}
                                className="w-20 h-20 rounded-3xl bg-dark-800 border-2 border-white/5 flex items-center justify-center text-3xl font-black hover:bg-dark-700 transition-all active:scale-95 shadow-lg"
                            >
                                -
                            </button>
                            <div className="flex flex-col items-center">
                                <span className="text-8xl font-black text-white drop-shadow-glow">{formData.participants}</span>
                                <span className="text-gray-500 uppercase font-black tracking-widest text-xs mt-2">{formData.participants > 1 ? 'Voyageurs' : 'Voyageur'}</span>
                            </div>
                            <button
                                onClick={() => updateFormData({ participants: formData.participants + 1 })}
                                className="w-20 h-20 rounded-3xl bg-dark-800 border-2 border-white/5 flex items-center justify-center text-3xl font-black hover:bg-dark-700 transition-all active:scale-95 shadow-lg"
                            >
                                +
                            </button>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold italic tracking-tight">À quel rythme ?</h2>
                            <p className="text-gray-400">Plutôt farniente ou marathon de visites ?</p>
                        </div>
                        <div className="space-y-4 max-w-md mx-auto">
                            {rhythms.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => updateFormData({ rhythm: `${r.id} ${r.label}` })}
                                    className={`w-full p-5 rounded-3xl border-2 flex items-center gap-5 transition-all ${formData.rhythm.startsWith(r.id) ? 'bg-brand-500/10 border-brand-500 shadow-lg' : 'bg-dark-800/50 border-white/5 hover:border-white/10'}`}
                                >
                                    <div className="w-14 h-14 bg-dark-900 rounded-2xl flex items-center justify-center text-3xl shadow-inner">{r.id}</div>
                                    <div className="text-left">
                                        <p className="font-bold text-lg">{r.label}</p>
                                        <p className="text-sm text-gray-500">{r.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold italic tracking-tight">Quelles expériences ?</h2>
                            <p className="text-gray-400">Sélectionnez ce que vous aimez (plusieurs choix possibles).</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                            {categories.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => toggleExperience(c.id)}
                                    className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${formData.experiences.includes(c.id) ? 'bg-brand-500 border-brand-500 shadow-brand-500/20 shadow-xl' : 'bg-dark-800 border-white/5 hover:border-white/10'}`}
                                >
                                    <span className="text-4xl">{c.icon}</span>
                                    <span className={`font-bold ${formData.experiences.includes(c.id) ? 'text-white' : 'text-gray-400'}`}>{c.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 7:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold italic tracking-tight">Envies & Contraintes</h2>
                            <p className="text-gray-400">Une précision ? Un besoin spécifique ? Dites-nous tout.</p>
                        </div>
                        <div className="max-w-xl mx-auto space-y-6">
                            <div className="relative">
                                <MessageSquare className="absolute top-6 left-6 text-gray-600" size={24} />
                                <textarea
                                    value={formData.notes}
                                    onChange={e => updateFormData({ notes: e.target.value })}
                                    rows={8}
                                    className="w-full bg-dark-800 border-2 border-white/5 rounded-3xl py-6 pl-16 pr-6 text-white focus:outline-none focus:border-brand-500 transition-all text-lg shadow-inner placeholder:text-gray-600"
                                    placeholder="Ex: 'On voyage avec un bébé', 'Pas plus de 2h de route par jour', 'On veut surtout manger local'..."
                                />
                            </div>

                            <div className="bg-brand-500/5 p-6 rounded-2xl border border-brand-500/20 flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                                    <Sparkles className="text-brand-500" size={20} />
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed italic">
                                    Ces informations permettront à <span className="text-brand-400 font-bold">Utiliser Tori IA</span> de personnaliser chaque instant de votre futur itinéraire.
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
        <div className="min-h-screen bg-dark-900 text-white pb-20 overflow-x-hidden">
            <Navbar />

            {/* Sticky Recap / Header */}
            <div className="fixed top-20 left-0 right-0 z-40 bg-dark-900/80 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center">
                <div className="max-w-3xl mx-auto w-full flex justify-between items-center">
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
                        <span className="bg-brand-500 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter shrink-0">Étape {step}/7</span>
                        <div className="flex items-center gap-2 whitespace-nowrap text-xs font-bold text-gray-500 uppercase tracking-widest">
                            {formData.origin && <span className="text-white flex items-center gap-1"><PlaneTakeoff size={12} className="text-brand-500" /> {formData.origin}</span>}
                            {formData.destination && <span className="text-white flex items-center gap-1"><ChevronRight size={12} /> {formData.destination}</span>}
                            {formData.participants > 1 && <span className="text-white flex items-center gap-1"><Users size={12} /> {formData.participants}</span>}
                        </div>
                    </div>
                    <button
                        onClick={handleAbandon}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="fixed top-36 left-0 right-0 z-40 h-1 bg-dark-800">
                <div
                    className="h-full bg-brand-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                    style={{ width: `${(step / 7) * 100}%` }}
                ></div>
            </div>

            <main className="max-w-3xl mx-auto px-4 pt-48 pb-32">
                {renderStep()}

                {/* Navigation Buttons */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-dark-900 via-dark-900/90 to-transparent z-40">
                    <div className="max-w-3xl mx-auto flex gap-4">
                        {step > 1 && (
                            <button
                                onClick={prevStep}
                                className="w-16 h-16 rounded-2xl bg-dark-800 border border-white/5 flex items-center justify-center hover:bg-dark-700 transition-all active:scale-95 shadow-lg shrink-0"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}

                        <button
                            onClick={step === 7 ? handleCreateTrip : nextStep}
                            disabled={loading || (step === 1 && (!formData.origin || !formData.destination))}
                            className={`flex-1 h-16 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed ${step === 7 ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20' : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/20'}`}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    {step === 7 ? 'Créer mon itinéraire' : 'Continuer'}
                                    {step < 7 ? <ChevronRight size={24} /> : <Zap size={20} className="fill-current" />}
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
