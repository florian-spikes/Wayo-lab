import React from 'react';
import { Map, Menu } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold">
              <Map size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Wayo</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">How it Works</a>
            <a href="#testimonials" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Stories</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="hidden md:block text-sm font-medium text-white hover:text-brand-400 transition-colors">Sign In</a>
            <button className="bg-white text-dark-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors">
              Start Planning
            </button>
            <div className="md:hidden text-white">
              <Menu size={24} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;