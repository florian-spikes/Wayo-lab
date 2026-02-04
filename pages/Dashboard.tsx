import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Calendar, Map, Clock, Plus, ChevronRight, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Trip {
    id: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    duration_days: number | null;
    preferences?: {
        emoji?: string;
    };
}

const Dashboard: React.FC = () => {
    const { user, profile, signOut } = useAuth();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        const fetchTrips = async () => {
            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erreur lors du chargement des voyages :', error);
            } else {
                setTrips(data || []);
            }
            setLoading(false);
        };

        fetchTrips();
    }, [user]);

    const handleSignOut = async () => {
        try {
            setLoading(true);
            await signOut();
            navigate('/', { replace: true });
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Erreur lors de la déconnexion');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-900 text-white">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                {/* Header User Profile */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-4 bg-dark-800/30 hover:bg-dark-800/60 p-4 rounded-2xl border border-white/5 hover:border-brand-500/30 transition-all group cursor-pointer text-left"
                    >
                        <div className="w-16 h-16 rounded-full bg-dark-800 border-2 border-brand-500/30 group-hover:border-brand-500 flex items-center justify-center text-3xl transition-colors">
                            {profile?.emoji || '👤'}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                Bonjour, {profile?.username || user?.email?.split('@')[0]} ! 👋
                                <ChevronRight size={18} className="text-gray-600 group-hover:text-brand-500 transition-colors group-hover:translate-x-1" />
                            </h1>
                            <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                                <Map size={14} />
                                <span>{profile?.location || 'Explorateur du monde'}</span>
                            </div>
                        </div>
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSignOut}
                            className="bg-dark-800 hover:bg-dark-700 text-gray-300 px-4 py-2 rounded-lg border border-white/5 transition-colors flex items-center gap-2 text-sm cursor-pointer"
                        >
                            <LogOut size={16} /> Se déconnecter
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-dark-800/50 p-6 rounded-2xl border border-white/5">
                        <p className="text-gray-400 text-sm mb-1">Total Voyages</p>
                        <p className="text-3xl font-bold text-white">{trips.length}</p>
                    </div>
                    <div className="bg-dark-800/50 p-6 rounded-2xl border border-white/5">
                        <p className="text-gray-400 text-sm mb-1">À venir</p>
                        <p className="text-3xl font-bold text-brand-500">
                            {trips.filter(t => t.start_date && new Date(t.start_date) > new Date()).length}
                        </p>
                    </div>
                    <div
                        onClick={() => navigate('/new-trip')}
                        className="bg-dark-800/50 p-6 rounded-2xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-brand-500/30 transition-colors"
                    >
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Nouvelle aventure</p>
                            <p className="font-bold text-white">Créer un voyage</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                            <Plus size={20} />
                        </div>
                    </div>
                </div>

                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Map size={20} className="text-brand-500" />
                    Vos itinéraires
                </h2>

                {trips.length === 0 ? (
                    <div className="text-center py-20 bg-dark-800/30 rounded-3xl border border-white/5 border-dashed">
                        <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                            <Map size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Aucun voyage pour le moment</h3>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto">Commencez par planifier votre première aventure en cliquant sur le bouton ci-dessous.</p>
                        <button
                            onClick={() => navigate('/new-trip')}
                            className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl font-bold transition-colors cursor-pointer inline-flex items-center gap-2"
                        >
                            <Plus size={18} /> Planifier un voyage
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trips.map((trip) => (
                            <div
                                key={trip.id}
                                onClick={() => navigate(`/trips/${trip.id}/day/1`)}
                                className="group bg-dark-800/40 border border-white/5 hover:border-brand-500/20 rounded-3xl p-6 transition-all duration-500 hover:bg-dark-800/80 cursor-pointer flex flex-col h-full shadow-xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                    <Map size={120} />
                                </div>

                                <div className="relative z-10 flex-grow">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-16 h-16 rounded-[24px] bg-dark-900 border border-white/10 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 group-hover:border-brand-500/30 transition-all duration-500">
                                            {trip.preferences?.emoji || '🚩'}
                                        </div>
                                        <div className="flex -space-x-2">
                                            {['👤', '🦊', '🐱'].map((emoji, i) => (
                                                <div key={i} className="w-8 h-8 rounded-full bg-dark-900 border-2 border-dark-800 flex items-center justify-center text-sm shadow-lg">
                                                    {emoji}
                                                </div>
                                            ))}
                                            <div className="w-8 h-8 rounded-full bg-brand-500/10 border-2 border-dark-800 flex items-center justify-center text-[10px] font-black text-brand-500 shadow-lg">
                                                +1
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-white mb-2 group-hover:text-brand-400 transition-colors line-clamp-1">{trip.title}</h3>

                                    <div className="space-y-3 text-gray-400 text-sm font-bold">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-brand-500" />
                                            <span>
                                                {trip.start_date ? new Date(trip.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Flexible'}
                                                {trip.end_date ? ` — ${new Date(trip.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-gray-500" />
                                            <span>{trip.duration_days || 0} jours d'aventure</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative z-10 mt-8 pt-5 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">Explorer l'itinéraire</span>
                                    <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main >
        </div >
    );
};

export default Dashboard;
