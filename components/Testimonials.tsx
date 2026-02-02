import React from 'react';
import { Testimonial } from '../types';

const Testimonials: React.FC = () => {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Sarah Jenkins",
      role: "Solo Traveler",
      content: "Finally, an app that doesn't force me into a rigid list. I can see my whole week in Japan at a glance and move things around when plans change.",
      avatar: "https://picsum.photos/100/100?random=10"
    },
    {
      id: 2,
      name: "David Chen",
      role: "Digital Nomad",
      content: "The AI suggestions are actually useful because they consider geography. It doesn't suggest a restaurant on the other side of the city.",
      avatar: "https://picsum.photos/100/100?random=11"
    },
    {
      id: 3,
      name: "Elena Rodriguez",
      role: "Family Trip Planner",
      content: "Managing a trip for 6 people was a nightmare until Wayo. The visual timeline helped everyone understand the schedule immediately.",
      avatar: "https://picsum.photos/100/100?random=12"
    }
  ];

  return (
    <section id="testimonials" className="py-24 bg-dark-900 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-white mb-16">
          Loved by explorers everywhere
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.id} className="bg-dark-800 p-8 rounded-2xl border border-white/5 relative">
              <div className="text-brand-500 text-6xl font-serif absolute top-4 left-6 opacity-20">"</div>
              <p className="text-gray-300 relative z-10 mb-6 italic">
                {t.content}
              </p>
              <div className="flex items-center gap-4">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full border border-white/10" />
                <div>
                  <h4 className="text-white font-semibold">{t.name}</h4>
                  <p className="text-xs text-brand-400 uppercase tracking-wide">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Social Proof Logos */}
        <div className="mt-20 pt-10 border-t border-white/5 flex flex-wrap justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
             {['Airbnb', 'Booking.com', 'Skyscanner', 'Uber'].map(brand => (
                 <span key={brand} className="text-xl font-bold text-white">{brand}</span>
             ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;