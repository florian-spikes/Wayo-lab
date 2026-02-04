import React from 'react';
import { Plane, Brain, Calendar, Users, Smartphone, Zap, ArrowRight } from 'lucide-react';

const features = [
  {
    title: "Un voyage clair, enfin",
    description: "Fini les notes éparpillées et les plans flous. Une vue visuelle et intuitive organisée jour par jour.",
    icon: <Plane size={28} />
  },
  {
    title: "Une IA assistante, jamais intrusive",
    description: "L'IA vous inspire et suggère des idées, mais vous gardez toujours le contrôle total sur vos choix.",
    icon: <Brain size={28} />
  },
  {
    title: "Validez, verrouillez, partez",
    description: "Quand une journée est prête, vous la validez. Un itinéraire fiable et un sentiment de maîtrise total.",
    icon: <Calendar size={28} />
  },
  {
    title: "Voyagez à plusieurs, simplement",
    description: "Invitez vos proches en un lien. Famille ou amis, tout le monde voit le même plan sans confusion.",
    icon: <Users size={28} />
  },
  {
    title: "Pensée pour le mobile",
    description: "Utilisable d'une main, fluide et rapide. Aussi agréable sur téléphone que sur grand écran.",
    icon: <Smartphone size={28} />
  },
  {
    title: "Zéro stress avant le départ",
    description: "Checklists intelligentes et carnet de bord récapitulatif pour ne plus rien oublier.",
    icon: <Zap size={28} />
  }
];

const FeatureCard: React.FC<any> = ({ title, description, icon }) => (
  <div className="group p-8 rounded-3xl bg-dark-800/50 border border-white/5 hover:border-brand-500/30 transition-all duration-300 hover:bg-dark-800 cursor-pointer">
    <div className="w-14 h-14 bg-dark-900 rounded-2xl flex items-center justify-center text-brand-500 mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5 shadow-lg">
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
    <p className="text-gray-300 leading-relaxed mb-6">
      {description}
    </p>
    <div className="inline-flex items-center text-brand-400 text-sm font-semibold group-hover:gap-2 transition-all cursor-pointer">
      En savoir plus <ArrowRight size={14} className="ml-1" />
    </div>
  </div>
);

const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 px-4 bg-dark-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Pourquoi choisir Tori ?</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Une organisation visuelle et intuitive pour transformer votre préparation de voyage en plaisir.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;