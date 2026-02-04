import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, ArrowRight, CheckCircle2, AlertTriangle, User } from 'lucide-react';
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
            // 1. Fetch invitation
            const { data: inviteData, error: inviteError } = await supabase
                .from('trip_invitations')
                .select('*, trip:trip_id (id, title, destination_country, start_date, end_date, creator:created_by (email))')
                .eq('token', token)
                .single();

            if (inviteError || !inviteData) {
                console.error('Invite error', inviteError);
                throw new Error('Invitation introuvable ou expirée.');
            }

            if (inviteData.status !== 'pending') {
                throw new Error('Cette invitation a déjà été utilisée ou a expiré.');
            }

            setInvitation(inviteData);
            setTrip(inviteData.trip);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!user) {
            // Redirect to login with return URL
            navigate('/auth', { state: { returnUrl: `/join/${token}` } });
            return;
        }

        try {
            setLoading(true);

            // 1. Add to members
            const { error: memberError } = await supabase.from('trip_members').insert({
                trip_id: invitation.trip_id,
                user_id: user.id,
                role: invitation.role
            });

            if (memberError) {
                // Ignore if unique violation (already member)
                if (memberError.code !== '23505') throw memberError;
            }

            // 2. Update invitation status
            await supabase.from('trip_invitations')
                .update({ status: 'accepted' })
                .eq('id', invitation.id);

            // 3. Redirect to trip
            navigate(`/trips/${invitation.trip_id}/day/1`);

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
            <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6">
                    <AlertTriangle size={40} />
                </div>
                <h1 className="text-2xl font-black text-white mb-2">Oups !</h1>
                <p className="text-gray-400 mb-8">{error}</p>
                <button onClick={() => navigate('/')} className="px-6 py-3 bg-white/5 rounded-xl text-white font-bold hover:bg-white/10 transition-colors">
                    Retour à l'accueil
                </button>
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
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-500 border border-brand-500/20 shadow-lg shadow-brand-500/10 transform rotate-3">
                            <User size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-white leading-tight mb-2">Invitation au voyage</h1>
                        <p className="text-gray-400">
                            Vous avez été invité à rejoindre <br />
                            <span className="text-white font-bold">{trip?.creator?.email}</span>
                        </p>
                    </div>

                    {/* Trip Preview Card */}
                    <div className="bg-dark-900 rounded-2xl p-6 border border-white/5 mb-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-brand-500/10 rounded-bl-[100px] -mr-10 -mt-10 transition-all group-hover:scale-110"></div>

                        <h2 className="text-xl font-black text-white mb-4 relative z-10">{trip?.title}</h2>

                        <div className="space-y-3 relative z-10">
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <MapPin size={16} className="text-brand-500" />
                                <span>{trip?.destination_country || 'Destination inconnue'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <Calendar size={16} className="text-brand-500" />
                                <span>
                                    {trip?.start_date ? new Date(trip.start_date).toLocaleDateString() : 'Date flexible'}
                                    {trip?.end_date && ` - ${new Date(trip.end_date).toLocaleDateString()}`}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-brand-500/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-brand-500 border border-brand-500/20">
                            <CheckCircle2 size={12} />
                            Rôle : {invitation?.role === 'owner' ? 'Administrateur' : (invitation?.role === 'editor' ? 'Éditeur' : 'Observateur')}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleAccept}
                            className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-brand-500/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            {user ? 'Rejoindre le voyage' : 'Se connecter pour rejoindre'}
                            <ArrowRight size={16} />
                        </button>
                        {!user && (
                            <p className="text-center text-xs text-gray-500 mt-4">
                                Vous serez redirigé vers la page de connexion.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JoinTrip;
