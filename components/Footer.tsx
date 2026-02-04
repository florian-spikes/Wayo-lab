import React from 'react';
import { Map, Github, Twitter, Instagram } from 'lucide-react';
import ToriLogo from './ToriLogo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-950 border-t border-white/5 pt-20 pb-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6 group">
              <ToriLogo size={48} color="white" className="group-hover:rotate-12 transition-transform duration-500" />
              <span className="text-2xl font-black tracking-tighter text-white uppercase ml-1">Tori</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Organisez votre voyage, jour par jour, sans stress. La plateforme visuelle pour les explorateurs modernes.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-500 hover:text-white transition-colors"><Github size={20} /></a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors"><Instagram size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Produit</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><a href="#workflow" className="hover:text-white transition-colors">Comment ça marche</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Assistant IA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Version Mobile</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Ressources</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Aide & Support</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Conseils de voyage</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Communauté</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Partenariats</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Légal</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-xs">
          <p>© 2026 Tori. Tous droits réservés.</p>
          <p>Fait avec ❤️ pour les voyageurs du monde entier.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;