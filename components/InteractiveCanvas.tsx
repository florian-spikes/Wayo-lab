import React from 'react';
import { Coffee, MapPin, Bus, Camera, GripVertical, Sparkles } from 'lucide-react';
import { CanvasCardProps } from '../types';

const Card: React.FC<CanvasCardProps> = ({ title, time, type, x, y, delay = 0 }) => {
  const icons = {
    activity: <Camera size={16} className="text-purple-400" />,
    food: <Coffee size={16} className="text-brand-400" />,
    transport: <Bus size={16} className="text-blue-400" />,
  };

  return (
    <div
      className="absolute bg-dark-800 border border-white/10 rounded-xl p-3 shadow-2xl w-48 animate-float"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}s`
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono text-gray-500">{time}</span>
        <GripVertical size={14} className="text-gray-600 cursor-grab" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
          {icons[type]}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white leading-tight">{title}</h4>
          <p className="text-[10px] text-gray-400">Tokyo, Japon</p>
        </div>
      </div>
    </div>
  );
};

const InteractiveCanvas: React.FC = () => {
  return (
    <div className="relative w-full aspect-square md:aspect-[4/3] bg-dark-800/50 rounded-3xl border border-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* Connection Lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <path d="M 190 80 C 190 150, 320 150, 320 200" stroke="#333" strokeWidth="2" fill="none" strokeDasharray="4 4" />
        <path d="M 320 280 C 320 320, 200 320, 200 380" stroke="#333" strokeWidth="2" fill="none" strokeDasharray="4 4" />
      </svg>

      {/* Floating UI Elements indicating Tools */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="w-10 h-10 rounded-lg bg-dark-700 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-600 cursor-pointer transition-colors">
            {i === 0 ? <MapPin size={18} /> : i === 1 ? <Coffee size={18} /> : <Camera size={18} />}
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="relative w-full h-full z-10 scale-75 md:scale-100 origin-center">
        <Card
          title="Café du matin"
          time="09h00"
          type="food"
          x={10}
          y={10}
          delay={0}
        />
        <Card
          title="Temple Senso-ji"
          time="10h30"
          type="activity"
          x={45}
          y={35}
          delay={1.5}
        />
        <Card
          title="Gare de Shinjuku"
          time="14h00"
          type="transport"
          x={15}
          y={65}
          delay={3}
        />

        {/* Suggestion Bubble (AI) */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 bg-gradient-to-br from-brand-600 to-brand-500 p-4 rounded-xl shadow-lg w-56 animate-pulse-slow">
          <div className="flex items-center gap-2 mb-2 text-white border-b border-white/20 pb-2">
            <Sparkles size={14} />
            <span className="text-xs font-bold uppercase tracking-wide">Utiliser Tori IA</span>
          </div>
          <p className="text-xs text-white/90 leading-relaxed">
            Puisque vous visitez Senso-ji, je vous suggère de déjeuner à <strong>Asakusa Imahan</strong>. Cela s'insère parfaitement dans votre créneau de 1h30.
          </p>
          <div className="mt-3 flex gap-2">
            <button className="flex-1 bg-white text-brand-600 text-[10px] font-bold py-1.5 rounded shadow hover:bg-gray-100">Ajouter</button>
            <button className="px-2 text-white/70 hover:text-white"><div className="w-4 h-4 border border-white/50 rounded-full flex items-center justify-center text-[8px]">✕</div></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCanvas;