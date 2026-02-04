import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    MapPin,
    Smile,
    Mail,
    Calendar,
    ChevronLeft,
    Save,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    Check,
    X
} from 'lucide-react';
import Navbar from '../components/Navbar';

// --- Composant Modale Personnalisé ---
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    confirmText?: string;
    cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({
    isOpen, onClose, onConfirm, title, message, type, confirmText = "Confirmer", cancelText = "Annuler"
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="relative bg-dark-800 border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                        <AlertCircle size={24} />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                        <p className="text-gray-400 text-sm">{message}</p>
                    </div>

                    <div className="flex gap-3 w-full mt-6">
                        {type === 'confirm' && (
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 bg-dark-900 hover:bg-dark-700 text-white font-semibold rounded-xl transition-all border border-white/5 cursor-pointer"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (onConfirm) onConfirm();
                                onClose();
                            }}
                            className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/20 cursor-pointer"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Page Profil ---
const Profile: React.FC = () => {
    const { user, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();

    // États du formulaire
    const [emoji, setEmoji] = useState(profile?.emoji || '✈️');
    const [location, setLocation] = useState(profile?.location || '');

    // États mot de passe (simplifié à 2 champs)
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // États des modales
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'alert' | 'confirm';
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'alert'
    });

    // Catégories d'emojis
    const emojiCategories = [
        { name: 'Voyage', emojis: ['✈️', '🌍', '🏝️', '🏔️', '🏕️', '🏙️', '🎒', '📸', '⛵', '🗺️', '🚅', '🏨', '🎟️', '🚲', '🌋', '⛺'] },
        { name: 'Animaux', emojis: ['🦊', '🐻', '🐼', '🦁', '🐯', '🐨', '🐘', '🦒', '🦓', '🦘', '🦥', '🦦', '🦅', '🦉', '🐢', '🐈'] },
        { name: 'Nature', emojis: ['🌲', '🌵', '🌻', '🍃', '🌊', '❄️', '🔥', '⭐', '🌙', '☀️', '🌈', '🌩️'] }
    ];

    // Détection des changements
    useEffect(() => {
        const hasProfileChanges =
            emoji !== (profile?.emoji || '✈️') ||
            location !== (profile?.location || '');

        const hasPasswordChanges = newPassword !== '' || currentPassword !== '';

        setIsDirty(hasProfileChanges || hasPasswordChanges);
    }, [emoji, location, currentPassword, newPassword, profile]);

    // Alerte navigateur pour les changements non enregistrés
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

    const showAlert = (title: string, message: string) => {
        setModalConfig({ isOpen: true, title, message, type: 'alert' });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setModalConfig({ isOpen: true, title, message, type: 'confirm', onConfirm });
    };

    const handleBack = () => {
        if (isDirty) {
            showConfirm(
                "Modifications non enregistrées",
                "Voulez-vous vraiment quitter ? Vos changements seront perdus.",
                () => navigate(-1)
            );
        } else {
            navigate(-1);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setSuccessMessage('');

        try {
            // 1. Mise à jour Profil (Emoji & Localisation)
            if (emoji !== profile?.emoji || location !== profile?.location) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        emoji,
                        location: location.trim(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id);

                if (profileError) throw profileError;
            }

            // 2. Mise à jour Mot de Passe
            if (newPassword) {
                if (!currentPassword) {
                    throw new Error("Veuillez saisir votre mot de passe actuel.");
                }
                if (newPassword.length < 6) {
                    throw new Error("Le nouveau mot de passe doit faire au moins 6 caractères.");
                }

                // Vérification du mot de passe actuel par ré-authentification
                const { error: verifyError } = await supabase.auth.signInWithPassword({
                    email: user.email!,
                    password: currentPassword
                });

                if (verifyError) {
                    showAlert("Erreur de mot de passe", "L'ancien mot de passe saisi est incorrect.");
                    setLoading(false);
                    return;
                }

                const { error: pwdError } = await supabase.auth.updateUser({
                    password: newPassword
                });

                if (pwdError) throw pwdError;

                setCurrentPassword('');
                setNewPassword('');
            }

            await refreshProfile();
            setIsDirty(false);
            setSuccessMessage('Profil mis à jour avec succès !');

            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (error: any) {
            showAlert("Action impossible", error.message || "Une erreur est survenue lors de la mise à jour.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    const registrationDate = new Date(user.created_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="min-h-screen bg-dark-900 text-white pb-20">
            <Navbar />

            {/* Modal Global */}
            <Modal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText={modalConfig.type === 'confirm' ? "Quitter" : "OK"}
                cancelText="Rester"
            />

            {/* Fullscreen Centered Emoji Picker */}
            {showEmojiPicker && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowEmojiPicker(false)}></div>
                    <div className="relative bg-dark-800 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Choisir un Emoji</h3>
                            <button onClick={() => setShowEmojiPicker(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {emojiCategories.map(category => (
                                <div key={category.name} className="px-1">
                                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-widest">{category.name}</p>
                                    <div className="grid grid-cols-5 gap-3">
                                        {category.emojis.map(e => (
                                            <button
                                                key={e}
                                                type="button"
                                                onClick={() => {
                                                    setEmoji(e);
                                                    setShowEmojiPicker(false);
                                                }}
                                                className={`w-14 h-14 flex items-center justify-center rounded-xl text-3xl hover:bg-white/10 transition-all ${emoji === e ? 'bg-brand-500/20 ring-2 ring-brand-500/50 scale-105' : 'bg-dark-900'}`}
                                            >
                                                {e}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-3xl mx-auto px-4 pt-32">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group cursor-pointer"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Retour
                </button>

                <div className="bg-dark-800/50 border border-white/5 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
                    {/* Header Info avec Date */}
                    <div className="bg-gradient-to-r from-brand-600/20 to-blue-600/20 p-8 border-b border-white/5">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(true)}
                                className="w-24 h-24 rounded-full bg-dark-900 border-2 border-brand-500/50 flex items-center justify-center text-5xl shadow-xl hover:border-brand-500 transition-all cursor-pointer group relative"
                            >
                                {emoji}
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Smile size={24} className="text-white" />
                                </div>
                            </button>

                            <div className="text-center md:text-left">
                                <h1 className="text-3xl font-bold mb-1">{profile?.username || user.email?.split('@')[0]}</h1>
                                <div className="space-y-1">
                                    <p className="text-gray-300 flex items-center justify-center md:justify-start gap-2 text-sm">
                                        <Mail size={14} className="text-gray-500" /> {user.email}
                                    </p>
                                    <p className="text-gray-500 font-light flex items-center justify-center md:justify-start gap-2 text-xs">
                                        <Calendar size={12} /> Utilisateur Tori depuis le {registrationDate}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="p-8 space-y-10">
                        {/* Section Localisation */}
                        <div className="space-y-6">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-brand-500 flex items-center gap-2">
                                <MapPin size={16} /> Localisation
                            </h2>

                            <div className="space-y-2">
                                <label className="text-sm text-gray-400 ml-1 font-medium">Ville actuelle</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Ex: Paris, France"
                                        className="w-full bg-dark-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-brand-500 transition-all font-medium"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 ml-1 italic">* Le nom d'utilisateur n'est pas modifiable.</p>
                            </div>
                        </div>

                        {/* Section Sécurité Simplifiée */}
                        <div className="space-y-6 pt-6 border-t border-white/5">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-brand-500 flex items-center gap-2">
                                <Lock size={16} /> Sécurité & Mot de passe
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 ml-1 font-medium">Ancien mot de passe</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Mot de passe actuel"
                                            className="w-full bg-dark-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-12 text-white focus:outline-none focus:border-brand-500 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 ml-1 font-medium">Nouveau mot de passe</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Nouveau (min 6 char.)"
                                            className="w-full bg-dark-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-12 text-white focus:outline-none focus:border-brand-500 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between gap-4 pt-8 border-t border-white/5">
                            <p className={`text-sm font-medium transition-all ${successMessage ? 'text-green-400 opacity-100 flex items-center gap-2' : 'text-gray-500 opacity-0'}`}>
                                <Check size={16} /> {successMessage}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="px-6 py-3 bg-dark-900 hover:bg-dark-700 text-white font-semibold rounded-xl transition-all border border-white/5 cursor-pointer"
                                >
                                    Fermer
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !isDirty}
                                    className="px-8 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2 cursor-pointer min-w-[140px] justify-center"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Enregistrer
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Profile;
