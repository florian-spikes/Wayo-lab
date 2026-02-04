import React from 'react';

const StickyCTA: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-dark-800/90 backdrop-blur-xl border-t border-white/10 py-4 px-4 z-50 transition-transform duration-500 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-white font-medium text-center sm:text-left">
          Prêt à partir l'esprit tranquille ? <span className="text-brand-400 hidden lg:inline">Commencez votre timeline aujourd'hui.</span>
        </p>
        <div className="flex w-full sm:w-auto gap-2">
          <input
            type="email"
            placeholder="votre@email.com"
            className="flex-1 sm:w-64 bg-dark-900 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
          <button className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer">
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyCTA;