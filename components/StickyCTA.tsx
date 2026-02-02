import React from 'react';
import { ArrowRight } from 'lucide-react';

interface StickyCTAProps {
  isVisible: boolean;
}

const StickyCTA: React.FC<StickyCTAProps> = ({ isVisible }) => {
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-dark-800/90 backdrop-blur-xl border-t border-white/10 py-4 px-4 z-50 transition-transform duration-500 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="hidden sm:block">
          <h3 className="text-white font-bold">Ready to visualize your next adventure?</h3>
          <p className="text-gray-400 text-sm">Join the waitlist and get 3 months of Wayo Pro for free.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-3">
            <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 sm:w-64 bg-dark-900 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
            <button className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 whitespace-nowrap">
            Get Access <ArrowRight size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default StickyCTA;