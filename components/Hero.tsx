import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import InteractiveCanvas from './InteractiveCanvas';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles size={12} />
              <span>AI Copilot Beta Live</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
              Your Journey,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-yellow-200">
                Visualized.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Stop fighting with spreadsheets. Wayo turns your itinerary into an infinite, collaborative canvas. 
              Drag, drop, and let our AI handle the logistics.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button className="w-full sm:w-auto px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 group">
                Start Free Trial
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-semibold text-lg transition-all backdrop-blur-sm">
                View Demo
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-500">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <img key={i} src={`https://picsum.photos/40/40?random=${i}`} alt="User" className="w-8 h-8 rounded-full border-2 border-dark-900" />
                ))}
              </div>
              <p>Trusted by 2,000+ travelers</p>
            </div>
          </div>

          {/* Visual Canvas Mockup */}
          <div className="flex-1 w-full relative">
            <InteractiveCanvas />
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;