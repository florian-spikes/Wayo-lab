import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Calendar, Map, Clock, Plus, ChevronRight, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Trip, TripMember } from '../types';

const Dashboard: React.FC = () => {
    const { user, profile, signOut } = useAuth();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        const fetchTripsAndMembers = async () => {
            // 1. Fetch Trips (using RPC or fallback)
            let loadedTrips: Trip[] = [];

            const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_trips');

            if (!rpcError && rpcData) {
                loadedTrips = rpcData;
            } else {
                console.error('Erreur RPC, fallback standard', rpcError);
                const { data: fallbackData } = await supabase
                    .from('trips')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                loadedTrips = (fallbackData || []) as any; // Cast as Trip for now
            }

            if (loadedTrips.length === 0) {
                setTrips([]);
                setLoading(false);
                return;
            }

            // 2. Fetch Members for ALL loaded trips
            const tripIds = loadedTrips.map(t => t.id);
            const { data: membersData } = await supabase
                .from('trip_members')
                .select('trip_id, user_id, role')
                .in('trip_id', tripIds);

            // 3. Fetch Profiles for those members
            const userIds = membersData ? Array.from(new Set(membersData.map(m => m.user_id))) : [];
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, username, emoji')
                .in('id', userIds);

            // 4. Enrich Trips with Members
            const enrichedTrips = loadedTrips.map(trip => {
                const tripMembersRaw = membersData?.filter(m => m.trip_id === trip.id) || [];

                // Map to TripMember with nested User Profile
                const membersWithProfile: TripMember[] = tripMembersRaw.map(tm => ({
                    id: `${tm.trip_id}-${tm.user_id}`, // Fake ID sufficient for display if actual not needed
                    trip_id: tm.trip_id,
                    user_id: tm.user_id,
                    role: tm.role,
                    user: profilesData?.find(p => p.id === tm.user_id)
                }));

                return {
                    ...trip,
                    members: membersWithProfile
                };
            });

            setTrips(enrichedTrips);
            setLoading(false);
        };

        fetchTripsAndMembers();
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header Section */}
                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                        Hello, {profile?.username || user?.email?.split('@')[0]} <span className="text-brand-500">.</span>
                    </h1>
                    <p className="text-gray-400 text-base font-medium">Prêt pour votre prochaine aventure ?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* New Trip Card */}
                    <div
                        onClick={() => navigate('/new-trip')}
                        className="group bg-gradient-to-br from-dark-800 via-dark-800 to-dark-900 border border-dashed border-white/10 hover:border-brand-500/50 rounded-[28px] p-6 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[280px] hover:shadow-xl hover:shadow-brand-500/10"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-dark-900/80 border border-white/5 flex items-center justify-center text-gray-400 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300 mb-5 shadow-xl">
                            <Plus size={28} />
                        </div>
                        <h3 className="text-lg font-black text-white mb-1.5 group-hover:text-brand-500 transition-colors">Créer un voyage</h3>
                        <p className="text-gray-500 text-sm text-center max-w-[180px] group-hover:text-gray-400 transition-colors">
                            Planifiez votre prochaine évasion
                        </p>
                    </div>

                    {/* Trip Cards */}
                    {trips.map((trip) => (
                        <div
                            key={trip.id}
                            onClick={() => navigate(`/trips/${trip.id}/day/1`)}
                            className="group bg-gradient-to-br from-dark-800 via-dark-800 to-dark-900 border border-white/5 hover:border-brand-500/30 rounded-[28px] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 cursor-pointer flex flex-col h-full relative overflow-hidden min-h-[280px]"
                        >
                            {/* Background Pattern */}
                            <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500">
                                <Map size={120} />
                            </div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-dark-900/80 border border-white/5 flex items-center justify-center text-4xl shadow-2xl group-hover:scale-105 group-hover:rotate-2 transition-transform duration-500">
                                        {trip.preferences?.emoji || '🚩'}
                                    </div>

                                    {/* Members Avatars */}
                                    <div className="flex -space-x-2">
                                        {trip.members && trip.members.length > 0 ? (
                                            <>
                                                {trip.members.slice(0, 3).map((member) => (
                                                    <div key={member.user_id} className="w-9 h-9 rounded-full bg-dark-700 border-2 border-dark-800 flex items-center justify-center text-base shadow-lg" title={member.user?.username}>
                                                        {member.user?.emoji || '👤'}
                                                    </div>
                                                ))}
                                                {trip.members.length > 3 && (
                                                    <div className="w-9 h-9 rounded-full bg-brand-500/10 border-2 border-dark-800 flex items-center justify-center text-[10px] font-black text-brand-500 shadow-lg">
                                                        +{trip.members.length - 3}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-dark-700 border-2 border-dark-800 flex items-center justify-center text-base shadow-lg">
                                                👤
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <h3 className="text-xl font-black text-white mb-3 group-hover:text-brand-500 transition-colors line-clamp-1 tracking-tight">{trip.title}</h3>

                                    <div className="flex flex-wrap gap-2">
                                        <div className="flex items-center gap-2 text-gray-400 text-[11px] font-bold bg-dark-900/60 px-3 py-1.5 rounded-lg border border-white/5">
                                            <Calendar size={12} className="text-brand-500/70" />
                                            <span>
                                                {trip.start_date ? new Date(trip.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Date flexible'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400 text-[11px] font-bold bg-dark-900/60 px-3 py-1.5 rounded-lg border border-white/5">
                                            <Clock size={12} className="text-gray-500" />
                                            <span>{trip.duration_days || 0} jours</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;


