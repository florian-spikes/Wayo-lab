import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import ToriLogo from '../components/ToriLogo';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col bg-dark-900 text-white relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

            <nav className="p-6 relative z-10">
                <div onClick={() => navigate('/')} className="cursor-pointer inline-block">
                    <ToriLogo size="sm" />
                </div>
            </nav>

            <div className="flex-1 flex items-center justify-center px-4 relative z-10">
                <div className="max-w-xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">

                    {/* Visual Element */}
                    <div className="relative inline-block">
                        <div className="w-32 h-32 bg-dark-800 border border-white/5 rounded-[40px] flex items-center justify-center mx-auto shadow-2xl relative z-10">
                            <Compass size={64} className="text-brand-500 animate-[spin_10s_linear_infinite]" />
                        </div>
                        {/* 404 Text Background */}
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] font-black text-white/[0.03] select-none z-0">
                            404
                        </span>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter leading-tight">
                            Escale <span className="text-brand-500">imprévue</span>.
                        </h1>
                        <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
                            On dirait que votre boussole s'est affolée. La destination que vous cherchez n'existe pas ou a été déplacée.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 active:scale-95"
                        >
                            <ArrowLeft size={18} />
                            Retour
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-3 active:scale-95"
                        >
                            <Home size={18} />
                            Vers le Dashboard
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer decoration */}
            <div className="p-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
                Tori Travels — Destination Perdue
            </div>
        </div>
    );
};

export default NotFound;
