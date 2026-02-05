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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
                {/* Simplified Header */}
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                        Hello, {profile?.username || user?.email?.split('@')[0]} <span className="text-brand-500">.</span>
                    </h1>
                    <p className="text-gray-400 text-lg font-medium">Prêt pour votre prochaine aventure ?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* New Trip Card - Always first */}
                    <div
                        onClick={() => navigate('/new-trip')}
                        className="group bg-dark-800/20 border-2 border-dashed border-white/10 hover:border-brand-500/50 rounded-[32px] p-6 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[300px] hover:bg-brand-500/5"
                    >
                        <div className="w-20 h-20 rounded-full bg-dark-800 border border-white/5 flex items-center justify-center text-gray-400 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300 mb-6 shadow-xl">
                            <Plus size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-500 transition-colors">Créer un voyage</h3>
                        <p className="text-gray-500 text-sm text-center max-w-[200px] group-hover:text-gray-400 transition-colors">
                            Planifiez votre prochaine évasion en quelques clics
                        </p>
                    </div>

                    {/* Trip Cards */}
                    {trips.map((trip) => (
                        <div
                            key={trip.id}
                            onClick={() => navigate(`/trips/${trip.id}/day/1`)}
                            className="group bg-dark-800 border border-white/5 hover:border-brand-500/30 rounded-[32px] p-8 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] cursor-pointer flex flex-col h-full relative overflow-hidden min-h-[300px]"
                        >
                            {/* Background Pattern/Gradient */}
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500">
                                <Map size={140} />
                            </div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-20 h-20 rounded-[28px] bg-dark-900 border border-white/5 flex items-center justify-center text-5xl shadow-2xl group-hover:scale-105 group-hover:rotate-3 transition-transform duration-500">
                                        {trip.preferences?.emoji || '🚩'}
                                    </div>

                                    {/* Members Pill */}
                                    <div className="flex -space-x-3">
                                        {trip.members && trip.members.length > 0 ? (
                                            <>
                                                {trip.members.slice(0, 3).map((member) => (
                                                    <div key={member.user_id} className="w-10 h-10 rounded-full bg-dark-900 border-2 border-dark-800 flex items-center justify-center text-lg shadow-lg relative z-10" title={member.user?.username}>
                                                        {member.user?.emoji || '👤'}
                                                    </div>
                                                ))}
                                                {trip.members.length > 3 && (
                                                    <div className="w-10 h-10 rounded-full bg-brand-500/10 border-2 border-dark-800 flex items-center justify-center text-xs font-black text-brand-500 shadow-lg z-20">
                                                        +{trip.members.length - 3}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-dark-900 border-2 border-dark-800 flex items-center justify-center text-lg shadow-lg">
                                                👤
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <h3 className="text-2xl font-black text-white mb-3 group-hover:text-brand-500 transition-colors line-clamp-1 leading-tight tracking-tight">{trip.title}</h3>

                                    <div className="flex flex-col gap-2.5">
                                        <div className="flex items-center gap-2.5 text-gray-400 text-sm font-bold bg-white/5 w-fit px-3 py-1.5 rounded-lg">
                                            <Calendar size={14} className="text-brand-500" />
                                            <span>
                                                {trip.start_date ? new Date(trip.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Date flexible'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-gray-400 text-sm font-bold bg-white/5 w-fit px-3 py-1.5 rounded-lg">
                                            <Clock size={14} className="text-gray-500" />
                                            <span>{trip.duration_days || 0} jours</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main >
        </div >
    );
};

export default Dashboard;


