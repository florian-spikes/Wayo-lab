import React from 'react';
import { PlusCircle, Wand2, Share2 } from 'lucide-react';

const Workflow: React.FC = () => {
  const steps = [
    {
      id: "01",
      title: "Draft your vision",
      description: "Dump all your ideas onto the canvas. Don't worry about the order yet. Just drag, drop, and collect places you love.",
      icon: <PlusCircle className="text-brand-500" size={24} />,
      color: "from-brand-500/20 to-transparent"
    },
    {
      id: "02",
      title: "Refine with AI",
      description: "Ask Wayo to optimize the route, suggest lunch spots between museums, or estimate travel times between cities.",
      icon: <Wand2 className="text-purple-500" size={24} />,
      color: "from-purple-500/20 to-transparent"
    },
    {
      id: "03",
      title: "Sync & Go",
      description: "Finalize the timeline and sync it to your phone. Share a read-only visual link with friends or family.",
      icon: <Share2 className="text-blue-500" size={24} />,
      color: "from-blue-500/20 to-transparent"
    }
  ];

  return (
    <section id="workflow" className="py-24 bg-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Heading */}
          <div>
            <div className="text-brand-500 font-mono text-sm tracking-widest mb-4">HOW IT WORKS</div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Simple workflow built <br /> for clarity.
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              From the first spark of inspiration to the final airport transfer, everything flows in a structure that keeps your excitement moving without friction.
            </p>
          </div>

          {/* Right Column: Steps */}
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.id} className="relative group">
                <div className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl`} />
                <div className="relative p-6 rounded-2xl border border-white/5 bg-dark-900/50 hover:bg-dark-900/80 transition-colors flex gap-6 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <span className="block text-2xl font-bold text-white/20 mb-2">{step.id}</span>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      {step.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{step.description}</p>
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