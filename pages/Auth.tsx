import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Mail, Lock, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

const Auth: React.FC = () => {
    const [view, setView] = useState<'login' | 'signup' | 'forgot-password'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const returnUrl = location.state?.returnUrl || '/dashboard';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (view === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('Vérifiez vos emails pour confirmer votre inscription !');
            } else if (view === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate(returnUrl);
            } else if (view === 'forgot-password') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) throw error;
                setMessage('Un lien de réinitialisation a été envoyé à votre adresse email.');
            }
        } catch (err: any) {
            setError(err.message === 'Invalid login credentials' ? 'Identifiants invalides' : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-dark-900 text-white relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

            <Navbar />

            <div className="flex-grow flex items-center justify-center px-4 pt-20">
                <div className="w-full max-w-md p-8 rounded-3xl bg-dark-800/50 border border-white/5 backdrop-blur-md shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">
                            {view === 'signup' ? 'Créer un compte' : view === 'forgot-password' ? 'Mot de passe oublié' : 'Bon retour parmi nous'}
                        </h1>
                        <p className="text-gray-400">
                            {view === 'signup' ? 'Commencez à planifier votre aventure' : view === 'forgot-password' ? 'Nous allons vous aider à retrouver l\'accès' : 'Continuez là où vous en étiez'}
                        </p>
                    </div>

                    {message && (
                        <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3 text-green-200 text-sm">
                            <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-200 text-sm">
                            <AlertCircle size={18} className="text-red-400 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-dark-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                    placeholder="nom@exemple.com"
                                    required
                                />
                            </div>
                        </div>

                        {view !== 'forgot-password' && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-sm font-medium text-gray-300">Mot de passe</label>
                                    {view === 'login' && (
                                        <button
                                            type="button"
                                            onClick={() => setView('forgot-password')}
                                            className="text-xs text-brand-400 hover:text-brand-300 font-bold transition-colors"
                                        >
                                            Mot de passe oublié ?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-dark-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                        placeholder="••••••••"
                                        required={view !== 'forgot-password'}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {view === 'signup' ? "S'inscrire" : view === 'forgot-password' ? "Envoyer le lien" : 'Se connecter'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        {view === 'forgot-password' ? (
                            <button
                                onClick={() => setView('login')}
                                className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 mx-auto"
                            >
                                <ArrowRight size={16} className="rotate-180" /> Retour à la connexion
                            </button>
                        ) : (
                            <p className="text-gray-400">
                                {view === 'signup' ? 'Vous avez déjà un compte ?' : "Vous n'avez pas de compte ?"}{' '}
                                <button
                                    onClick={() => setView(view === 'signup' ? 'login' : 'signup')}
                                    className="text-brand-400 font-semibold hover:text-brand-300 transition-colors ml-1 cursor-pointer"
                                >
                                    {view === 'signup' ? 'Se connecter' : "S'inscrire"}
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
