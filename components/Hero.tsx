import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import InteractiveCanvas from './InteractiveCanvas';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-1/4 -right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles size={12} />
            <span>Assistant IA disponible</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
            Organisez votre voyage,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-yellow-200">
              jour par jour, sans stress.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Préparer un voyage ne devrait jamais être une source d’angoisse.
            Avec Tori, vous visualisez, structurez et finalisez votre voyage en toute sérénité, du premier jour au dernier.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button className="w-full sm:w-auto px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 group cursor-pointer">
              Commencer gratuitement
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-semibold text-lg transition-all backdrop-blur-sm cursor-pointer">
              Voir la démo
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-400">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <img key={i} src={`https://picsum.photos/40/40?random=${i}`} alt={`Voyageur ${i}`} className="w-8 h-8 rounded-full border-2 border-dark-900" />
              ))}
            </div>
            <p>Déjà utilisé par +2 000 voyageurs</p>
          </div>
        </div>

        <div className="flex-1 w-full relative">
          <InteractiveCanvas />
        </div>
      </div>
    </section>
  );
};

export default Hero;