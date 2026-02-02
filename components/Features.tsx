import React from 'react';
import { Layout, BrainCircuit, Clock, ArrowRight } from 'lucide-react';
import { Feature } from '../types';

const FeatureCard: React.FC<Feature> = ({ title, description, icon }) => (
  <div className="group p-8 rounded-3xl bg-dark-800/50 border border-white/5 hover:border-brand-500/30 transition-all duration-300 hover:bg-dark-800">
    <div className="w-14 h-14 bg-dark-900 rounded-2xl flex items-center justify-center text-brand-500 mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5 shadow-lg">
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
    <p className="text-gray-400 leading-relaxed mb-6">
      {description}
    </p>
    <a href="#" className="inline-flex items-center text-brand-400 text-sm font-semibold group-hover:gap-2 transition-all">
      Learn more <ArrowRight size={14} className="ml-1" />
    </a>
  </div>
);

const Features: React.FC = () => {
  const features: Feature[] = [
    {
      title: "Infinite Canvas",
      description: "Break free from linear lists. Zoom out to see your whole trip, zoom in to plan the minute details. Connect activities spatially and temporally.",
      icon: <Layout size={28} />
    },
    {
      title: "Non-Intrusive AI",
      description: "Our Copilot doesn't dictate your trip; it enhances it. Get smart suggestions for filling gaps, optimizing routes, and finding hidden gems based on your vibe.",
      icon: <BrainCircuit size={28} />
    },
    {
      title: "Time-Aware Logic",
      description: "Wayo understands travel time. Move a card, and the entire schedule adapts. It automatically flags impossible connections or rushed transfers.",
      icon: <Clock size={28} />
    }
  ];

  return (
    <section id="features" className="py-24 bg-dark-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Planned like a human. <br />
            <span className="text-gray-500">Powered by intelligence.</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Most travel apps are just glorified spreadsheets. Wayo is a workspace designed for the messy, creative process of exploration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;