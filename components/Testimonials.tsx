import React from 'react';

const testimonials = [
  {
    content: "Enfin un outil qui me permet de voir mon voyage physiquement. L'organisation jour par jour a tout changé pour notre famille.",
    author: "Marie L.",
    role: "Voyageuse en famille",
    avatar: "https://i.pravatar.cc/150?u=marie"
  },
  {
    content: "L'IA m'a suggéré un restaurant incroyable à Kyoto que je n'aurais jamais trouvé seul. J'ai adoré garder le contrôle final.",
    author: "Thomas B.",
    role: "Aventurier solo",
    avatar: "https://i.pravatar.cc/150?u=thomas"
  },
  {
    content: "Partager l'itinéraire avec mes amis a évité toutes les discussions sans fin. Tout le monde savait quoi faire et quand.",
    author: "Sophie R.",
    role: "Organisatrice de groupe",
    avatar: "https://i.pravatar.cc/150?u=sophie"
  }
];

const Testimonials: React.FC = () => {
  return (
    <section id="testimonials" className="py-24 px-4 bg-dark-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ce que disent nos voyageurs</h2>
          <p className="text-gray-400 text-lg">Rejoignez des milliers de personnes qui voyagent sans stress.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-dark-800/50 p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-brand-500/20 transition-all">
              <div className="text-brand-500 text-6xl font-serif absolute top-4 left-6 opacity-20">"</div>
              <p className="text-gray-300 relative z-10 mb-6 italic">
                {t.content}
              </p>
              <div className="flex items-center gap-4 relative z-10">
                <img src={t.avatar} alt={t.author} className="w-12 h-12 rounded-full border border-white/10" />
                <div>
                  <h4 className="font-bold text-white">{t.author}</h4>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-12 border-t border-white/5">
          <p className="text-center text-gray-500 text-sm font-semibold uppercase tracking-widest mb-8">Ils nous font confiance</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {['AIRBNB', 'BOOKING', 'EXPEDIA', 'SKYSCANNER', 'TRIPADVISOR'].map(brand => (
              <span key={brand} className="text-xl font-bold text-white">{brand}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;