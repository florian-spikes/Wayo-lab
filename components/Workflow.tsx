import React from 'react';
import { Layout, MessageSquare, CheckCircle } from 'lucide-react';

const steps = [
  {
    id: '01',
    title: "Visualisez votre itinéraire",
    description: "Chaque journée est construite comme une timeline simple, lisible et modifiable à volonté pour comprendre où vous allez et quand.",
    icon: <Layout className="text-blue-400" />,
    color: "from-blue-500/20 to-blue-500/0"
  },
  {
    id: '02',
    title: "Laissez-vous inspirer",
    description: "Profitez d'une IA qui vous suggère des idées de visites et d'activités selon vos envies, tout en vous laissant le contrôle total.",
    icon: <MessageSquare className="text-brand-400" />,
    color: "from-brand-500/20 to-brand-500/0"
  },
  {
    id: '03',
    title: "Partez l'esprit tranquille",
    description: "Validez vos journées pour figer votre itinéraire. Accédez à vos checklists intelligentes et votre carnet de bord récapitulatif.",
    icon: <CheckCircle className="text-green-400" />,
    color: "from-green-500/20 to-green-500/0"
  }
];

const Workflow: React.FC = () => {
  return (
    <section id="workflow" className="py-24 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Une organisation bâtie <br /> pour la clarté.
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              De l'étincelle de l'idée au départ final, tout est structuré pour maintenir votre enthousiasme sans la friction de l'organisation.
            </p>
          </div>

          <div className="space-y-6 flex-1">
            {steps.map((step) => (
              <div key={step.id} className="relative group cursor-pointer">
                <div className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl`} />
                <div className="relative p-6 rounded-2xl border border-white/5 bg-dark-900/50 hover:bg-dark-900/80 transition-colors flex gap-6 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-12 h-12 rounded-xl bg-dark-900 border border-white/10 flex items-center justify-center">
                      {step.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Workflow;