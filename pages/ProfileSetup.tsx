import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Smile, User as UserIcon, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';

const ProfileSetup: React.FC = () => {
    const { user, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [emoji, setEmoji] = useState('✈️');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);

    // [Auto-correction] Si l'utilisateur a déjà complété son profil, 
    // on l'envoie direct au dashboard s'il atterrit ici par erreur
    useEffect(() => {
        if (profile?.completed) {
            navigate('/dashboard', { replace: true });
        }
    }, [profile, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submit profile setup triggered');

        if (!user) {
            console.error('No user found in session');
            alert("Votre session a expiré. Veuillez vous reconnecter.");
            navigate('/auth');
            return;
        }

        setLoading(true);
        try {
            const updates = {
                id: user.id,
                username: username.trim(),
                emoji,
                location: location.trim(),
                updated_at: new Date().toISOString(),
                completed: true
            };

            console.log('Sending updates to profiles table:', updates);
            const { data, error } = await supabase
                .from('profiles')
                .upsert(updates, { onConflict: 'id' })
                .select();

            if (error) {
                console.error('Supabase upsert error:', error);
                throw error;
            }

            console.log('Profile updated successfully:', data);
            await refreshProfile();
            navigate('/dashboard', { replace: true });

        } catch (error: any) {
            console.error('Profile setup catch error:', error);
            alert(`Erreur de sauvegarde : ${error.message || 'Problème technique'}`);
        } finally {
            setLoading(false);
        }
    };

    const emojis = ['✈️', '🌍', '🏝️', '🏔️', '🏕️', '🏙️', '🎒', '📸'];

    if (profile === undefined) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-dark-900 text-white relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

            <Navbar />

            <div className="flex-grow flex items-center justify-center px-4 pt-20">
                <div className="w-full max-w-lg p-8 rounded-3xl bg-dark-800/50 border border-white/5 backdrop-blur-md shadow-2xl">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold mb-3">Dites-nous en plus sur vous</h1>
                        <p className="text-gray-400">Personnalisez votre expérience Tori</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Emoji Selection */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-24 h-24 rounded-full bg-dark-900 border-2 border-brand-500/50 flex items-center justify-center text-5xl shadow-lg shadow-brand-500/10 relative">
                                {emoji}
                                <div className="absolute bottom-0 right-0 bg-brand-500 rounded-full p-1.5 border-4 border-dark-800">
                                    <Smile size={14} className="text-white" />
                                </div>
                            </div>
                            <div className="flex gap-2 bg-dark-900/50 p-2 rounded-xl border border-white/5 overflow-x-auto max-w-full no-scrollbar">
                                {emojis.map(e => (
                                    <button
                                        key={e}
                                        type="button"
                                        onClick={() => setEmoji(e)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-lg text-xl hover:bg-white/10 transition-colors ${emoji === e ? 'bg-white/10 border border-white/20' : ''}`}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Nom d'utilisateur</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="NomDeVoyageur"
                                        className="w-full bg-dark-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Localisation (Ville ou Paris)</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Paris, France"
                                        className="w-full bg-dark-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {loading ? 'Enregistrement...' : 'Terminer mon profil'}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileSetup;
