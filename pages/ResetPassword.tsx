import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import ToriLogo from '../components/ToriLogo';
import Navbar from '../components/Navbar';

const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 3000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-dark-900 text-white relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

            <Navbar />

            <div className="flex-grow flex items-center justify-center px-4 pt-20">
                <div className="w-full max-w-md p-8 rounded-[32px] bg-dark-800/50 border border-white/5 backdrop-blur-md shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black italic mb-2">
                            Nouveau <span className="text-brand-500">départ</span>
                        </h1>
                        <p className="text-gray-400">
                            Choisissez un mot de passe robuste pour votre compte Tori.
                        </p>
                    </div>

                    {success ? (
                        <div className="text-center space-y-4 py-4">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500 mb-4">
                                <CheckCircle2 size={32} />
                            </div>
                            <h2 className="text-xl font-bold">Mot de passe mis à jour !</h2>
                            <p className="text-gray-400 text-sm">
                                Redirection vers votre dashboard dans quelques instants...
                            </p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-200 text-sm">
                                    <AlertCircle size={18} className="text-red-400 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Nouveau mot de passe</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-dark-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-bold"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Confirmer le mot de passe</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-dark-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-bold"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 bg-brand-500 hover:bg-brand-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-3 mt-6 cursor-pointer disabled:opacity-50 active:scale-95"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Mettre à jour
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
