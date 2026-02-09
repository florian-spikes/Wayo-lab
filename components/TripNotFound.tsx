import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, Map } from 'lucide-react';
import ToriLogo from './ToriLogo';

const TripNotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="relative z-10 max-w-md w-full animate-in zoom-in duration-500">
                {/* Icon / Logo Container */}
                <div className="mx-auto w-32 h-32 bg-dark-800/50 border border-white/5 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-brand-500/10 relative group">
                    <div className="absolute inset-0 border border-white/5 rounded-full animate-[spin_10s_linear_infinite] opacity-30"></div>
                    <ToriLogo size={64} className="text-brand-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-transform group-hover:scale-110 duration-500" />

                    <div className="absolute bottom-0 right-0 w-10 h-10 bg-dark-800 rounded-full border border-white/10 flex items-center justify-center text-gray-500">
                        <Map size={20} className="text-gray-400" />
                    </div>
                </div>

                {/* Text Content */}
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                    Voyage <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-orange-600">introuvable</span>
                </h1>

                <p className="text-gray-400 text-lg mb-10 leading-relaxed font-medium">
                    Oups ! Ce voyage semble avoir disparu des radars, ou vous n'avez pas les droits pour y accéder.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="h-12 px-8 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black uppercase tracking-widest text-xs transition-all hover:shadow-lg hover:shadow-brand-500/25 hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
                    >
                        <LayoutDashboard size={16} />
                        Tableau de bord
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="h-12 px-8 rounded-xl bg-dark-800 hover:bg-dark-700 border border-white/10 hover:border-white/20 text-white font-black uppercase tracking-widest text-xs transition-all hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
                    >
                        <Home size={16} />
                        Accueil
                    </button>
                </div>
            </div>

            {/* Footer decoration */}
            <div className="absolute bottom-8 text-dark-700 font-mono text-xs uppercase tracking-[0.3em]">
                Error 404 • Trip Not Found
            </div>
        </div>
    );
};

export default TripNotFound;
