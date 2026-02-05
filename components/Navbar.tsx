import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { User, Map, LogOut, ChevronRight } from 'lucide-react';
import ToriLogo from './ToriLogo';

const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  // Only show simplified navbar if logged in, otherwise show classic (or hide? User said "menu unique et dynamique pour les utilisateurs connectés").
  // Let's assume for non-logged in users we might want to keep some landing page nav, or maybe just simplified login.
  // The user prompt specifically focused on "utilisateurs connectés".
  // For now I will implement the floating version for ALL, but adapted.

  if (!user) return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center pointer-events-none">
      <div className="pointer-events-auto">
        <Link to="/" className="flex items-center gap-2 group">
          <ToriLogo size={40} color="white" />
          <span className="text-xl font-black uppercase text-white tracking-widest">Tori</span>
        </Link>
      </div>
      <div className="pointer-events-auto">
        <Link to="/auth" className="bg-white text-dark-900 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">
          Se connecter
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <nav className="bg-dark-900/90 backdrop-blur-2xl border border-white/10 rounded-full px-2 py-2 flex items-center shadow-2xl shadow-black/50 gap-2">
        {/* Left: My Trips */}
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-4 py-2 rounded-full hover:bg-white/5 transition-all text-white group"
        >
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform">
            <Map size={16} />
          </div>
          <span className="text-sm font-bold tracking-tight">Mes voyages</span>
        </Link>

        <div className="w-px h-6 bg-white/10 mx-1"></div>

        {/* Right: Profile */}
        <Link
          to="/profile"
          className="flex items-center gap-3 px-4 py-2 rounded-full hover:bg-white/5 transition-all text-white group"
        >
          <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors hidden sm:block">
            {profile?.username || user.email?.split('@')[0]}
          </span>
          <div className="w-8 h-8 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center text-lg overflow-hidden group-hover:border-brand-500/50 transition-colors">
            {profile?.emoji || <User size={16} />}
          </div>
        </Link>
      </nav>
    </div>
  );
};

export default Navbar;