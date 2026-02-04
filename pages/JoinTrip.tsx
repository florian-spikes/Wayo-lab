import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, ArrowRight, CheckCircle2, AlertTriangle, User, Home, ArrowLeft } from 'lucide-react';
import ToriLogo from '../components/ToriLogo';

const JoinTrip: React.FC = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [invitation, setInvitation] = useState<any>(null);
    const [trip, setTrip] = useState<any>(null);

    useEffect(() => {
        if (!token) {
            setError('Lien d\'invitation invalide.');
            setLoading(false);
            return;
        }
        checkInvitation();
    }, [token]);

    const checkInvitation = async () => {
        try {
            // Try RPC first, fallback to old queries if RPC doesn't exist
            const { data: rpcData, error: rpcError } = await supabase
                .rpc('get_invitation_details', { invitation_token: token });

            if (rpcError && rpcError.code === 'PGRST202') {
                // RPC doesn't exist, use fallback
                console.warn('Using fallback for invitation check');

                // Fallback: Old 2-step query
                const { data: inviteData, error: inviteError } = await supabase
                    .from('trip_invitations')
                    .select('*')
                    .eq('token', token)
                    .single();

                if (inviteError || !inviteData) {
                    throw new Error('Invitation introuvable ou expirée.');
                }

                if (inviteData.status !== 'pending') {
                    throw new Error('Cette invitation a déjà été utilisée.');
                }

                const expiresAt = new Date(inviteData.expires_at);
                if (expiresAt < new Date()) {
                    throw new Error('Ce lien d\'invitation a expiré.');
                }

                // Fetch trip separately (might fail due to RLS)
                const { data: tripData, error: tripError } = await supabase
                    .from('trips')
                    .select('id, title, destination_country, start_date, end_date, user_id')
                    .eq('id', inviteData.trip_id)
                    .single();

                if (tripError || !tripData) {
                    throw new Error('Ce voyage n\'existe plus.');
                }

                // Fetch owner profile
                const { data: ownerProfile } = await supabase
                    .from('profiles')
                    .select('username, emoji')
                    .eq('id', tripData.user_id)
                    .single();

                setInvitation(inviteData as any);
                setTrip({
                    ...tripData,
                    owner: ownerProfile || { username: 'Voyageur', emoji: '👤' }
                } as any);
            } else if (rpcError) {
                throw new Error('Erreur lors de la récupération de l\'invitation.');
            } else if (!rpcData || rpcData.length === 0) {
                throw new Error('Invitation introuvable ou expirée.');
            } else {
                // RPC succeeded
                const invitationData = rpcData[0];
                const invitation = {
                    id: invitationData.invitation_id,
                    trip_id: invitationData.trip_id,
                    token: invitationData.token,
                    status: invitationData.status,
                    expires_at: invitationData.expires_at
                };

                const trip = {
                    id: invitationData.trip_id,
                    title: invitationData.trip_title,
                    destination_country: invitationData.trip_destination,
                    start_date: invitationData.trip_start,
                    end_date: invitationData.trip_end,
                    owner: {
                        username: invitationData.owner_username || 'Voyageur',
                        emoji: invitationData.owner_emoji || '👤'
                    }
                };

                setInvitation(invitation as any);
                setTrip(trip as any);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Invitation introuvable ou expirée.');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!user) {
            navigate('/auth', { state: { returnUrl: `/join/${token}` } });
            return;
        }

        try {
            setLoading(true);

            // Try RPC first, fallback to direct operations if RPC doesn't exist
            const { data: rpcData, error: rpcError } = await supabase
                .rpc('accept_invitation', { invitation_token: token });

            if (rpcError && rpcError.code === 'PGRST202') {
                // RPC doesn't exist, use fallback
                console.warn('Using fallback for accept invitation');

                if (!invitation?.trip_id) {
                    throw new Error('Invitation invalide');
                }

                // Insert into trip_members
                const { error: memberError } = await supabase
                    .from('trip_members')
                    .insert({
                        trip_id: invitation.trip_id,
                        user_id: user.id,
                        role: 'viewer'
                    });

                if (memberError && memberError.code !== '23505') {
                    // Ignore unique violation (already member)
                    throw memberError;
                }

                // Update invitation status
                await supabase
                    .from('trip_invitations')
                    .update({ status: 'accepted' })
                    .eq('id', invitation.id);

                navigate(`/trips/${invitation.trip_id}/day/1`);
            } else if (rpcError) {
                throw new Error(rpcError.message || 'Erreur lors de l\'acceptation');
            } else if (!rpcData || !rpcData.trip_id) {
                throw new Error('Erreur lors de l\'acceptation de l\'invitation');
            } else {
                // RPC succeeded
                navigate(`/trips/${rpcData.trip_id}/day/1`);
            }

        } catch (err: any) {
            alert('Erreur: ' + err.message);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col bg-dark-900 text-white relative overflow-hidden">
                {/* Ambient Background */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-red-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

                <nav className="p-6">
                    <div onClick={() => navigate('/')} className="cursor-pointer inline-block">
                        <ToriLogo size="sm" />
                    </div>
                </nav>

                <div className="flex-1 flex items-center justify-center px-4">
                    <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto border border-red-500/20 shadow-2xl shadow-red-500/10 rotate-3">
                            <AlertTriangle size={40} className="text-red-500" />
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl font-black italic">
                                Oups !
                            </h1>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                {error}
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 mx-auto"
                        >
                            <Home size={16} />
                            Retour au Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-dark-900 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

            <nav className="p-6">
                <div onClick={() => navigate('/')} className="cursor-pointer inline-block">
                    <ToriLogo size="sm" />
                </div>
            </nav>

            <div className="flex-1 flex items-center justify-center px-4 pb-20">
                <div className="w-full max-w-md bg-dark-800/50 border border-white/5 backdrop-blur-md rounded-[32px] p-8 shadow-2xl animate-in zoom-in duration-300">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-brand-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-brand-500 border border-brand-500/20 shadow-lg shadow-brand-500/10 transform -rotate-3">
                            <User size={36} />
                        </div>
                        <h1 className="text-3xl font-black text-white leading-tight mb-2">Invitation</h1>
                        <p className="text-gray-400">
                            Rejoignez le voyage de <span className="text-white font-bold">{trip?.owner?.username || 'un voyageur'}</span> {trip?.owner?.emoji}
                        </p>
                    </div>

                    {/* Trip Preview Card */}
                    <div className="bg-dark-900/80 rounded-3xl p-6 border border-white/5 mb-8 relative overflow-hidden group hover:border-brand-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-bl-[100px] -mr-10 -mt-10 transition-all group-hover:scale-110 pointer-events-none"></div>

                        <h2 className="text-2xl font-black text-white mb-6 relative z-10">{trip?.title}</h2>

                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center gap-4 text-sm text-gray-300">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-brand-500 shrink-0">
                                    <MapPin size={16} />
                                </div>
                                <span className="font-medium">{trip?.destination_country || 'Destination inconnue'}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-300">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-brand-500 shrink-0">
                                    <Calendar size={16} />
                                </div>
                                <span className="font-medium">
                                    {trip?.start_date ? new Date(trip.start_date).toLocaleDateString(undefined, { day: 'numeric', month: 'long' }) : 'Date flexible'}
                                    {trip?.end_date && ` - ${new Date(trip.end_date).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleAccept}
                            className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-brand-500/25 active:scale-95 flex items-center justify-center gap-3"
                        >
                            {user ? 'Accepter et Rejoindre' : 'Se connecter pour rejoindre'}
                            <ArrowRight size={18} />
                        </button>
                        {!user && (
                            <p className="text-center text-[10px] uppercase tracking-wider text-gray-500 mt-4 font-bold">
                                Compte requis
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JoinTrip;
