import React, { useState } from 'react';
import { Map, Menu, X, User } from 'lucide-react';
import ToriLogo from './ToriLogo';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (hash: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/' + hash);
    } else {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <ToriLogo size={48} color="white" className="group-hover:rotate-12 transition-transform duration-500" />
            <span className="text-2xl font-black tracking-tighter text-white uppercase ml-1">Tori</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {!user && (
              <>
                <button onClick={() => handleNavClick('#features')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer bg-transparent border-none">Fonctionnalités</button>
                <button onClick={() => handleNavClick('#workflow')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer bg-transparent border-none">Comment ça marche</button>
                <button onClick={() => handleNavClick('#testimonials')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer bg-transparent border-none">Témoignages</button>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard" className="hidden md:flex items-center gap-2 text-sm font-medium text-white hover:text-brand-400 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center">
                  {profile?.emoji || <User size={14} />}
                </div>
                <span>Mes voyages</span>
              </Link>
            ) : (
              <Link to="/auth" className="hidden md:block text-sm font-medium text-white hover:text-brand-400 transition-colors cursor-pointer">Se connecter</Link>
            )}

            {!user && (
              <Link to="/auth" className="bg-white text-dark-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer" id="get-started-btn">
                Commencer
              </Link>
            )}

            <div
              className="md:hidden text-white cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-dark-900/95 backdrop-blur-xl border-b border-white/10 py-6 px-4 space-y-4 animate-in slide-in-from-top duration-300 shadow-2xl">
            {!user ? (
              <>
                <button
                  className="block w-full text-left text-base font-medium text-gray-300 hover:text-white transition-colors cursor-pointer py-2"
                  onClick={() => handleNavClick('#features')}
                >
                  Fonctionnalités
                </button>
                <button
                  className="block w-full text-left text-base font-medium text-gray-300 hover:text-white transition-colors cursor-pointer py-2"
                  onClick={() => handleNavClick('#workflow')}
                >
                  Comment ça marche
                </button>
                <button
                  className="block w-full text-left text-base font-medium text-gray-300 hover:text-white transition-colors cursor-pointer py-2"
                  onClick={() => handleNavClick('#testimonials')}
                >
                  Témoignages
                </button>
              </>
            ) : null}
            <div className={`pt-4 ${!user ? 'border-t border-white/10' : ''}`}>
              {user ? (
                <Link
                  to="/dashboard"
                  className="block text-base font-medium text-white hover:text-brand-400 transition-colors cursor-pointer py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Aller à Mes voyages
                </Link>
              ) : (
                <Link
                  to="/auth"
                  className="block text-base font-medium text-white hover:text-brand-400 transition-colors cursor-pointer py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Se connecter
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;