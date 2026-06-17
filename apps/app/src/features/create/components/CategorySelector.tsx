import React from "react";

interface CategorySelectorProps {
  onSelectCategory: (cat: 'sports' | 'movies' | 'dining' | 'custom') => void;
}

export const CategorySelector = ({ onSelectCategory }: CategorySelectorProps) => {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden h-full text-left">
      <div className="flex-1 overflow-y-auto scrollbar-none px-5 pt-3.5 pb-24">
        {/* Opener Header */}
        <div className="mb-6 mt-2.5 animate-fade-in text-left">
          <h2 className="font-display font-semibold text-[28px] leading-tight tracking-tight text-white mb-1.5">
            What’s the <span className="italic font-serif text-[#FF6B2C] font-semibold">move?</span>
          </h2>
          <p className="text-zinc-500 text-xs leading-relaxed font-semibold">
            Choose what you're coordinating.
          </p>
        </div>

        {/* Predefined Categories */}
        <div className="space-y-4 mb-2">
          {[
            {
              id: 'sports' as const,
              title: 'Sports',
              subtitle: 'Coordinate basketball, badminton, soccer, etc.',
              image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800'
            },
            {
              id: 'movies' as const,
              title: 'Movies',
              subtitle: 'IMAX screenings, premieres and movie nights',
              image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=800'
            },
            {
              id: 'dining' as const,
              title: 'Dining and Drinks',
              subtitle: 'Gourmet restaurant dinners, cafes or brewery drinks',
              image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=800'
            },
            {
              id: 'custom' as const,
              title: 'Create Your Own Plan',
              subtitle: 'Coffee runs, road trips, house parties and anything else',
              image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800'
            }
          ].map((item) => (
            <div 
              key={item.id}
              onClick={() => onSelectCategory(item.id)}
              className="group rounded-[24px] relative overflow-hidden bg-zinc-950 border border-white/5 transition-all duration-300 cursor-pointer h-[120px] hover:border-white/10"
            >
              <img 
                src={item.image} 
                alt={item.title} 
                className="absolute inset-0 w-full h-full object-cover transition-all duration-500 brightness-[0.4] group-hover:brightness-[0.5] group-hover:scale-[1.01]"
                referrerPolicy="no-referrer"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent"></div>
              
              <div className="absolute inset-x-0 bottom-0 p-5 text-left">
                <h3 className="font-display font-semibold text-[17px] text-zinc-100 group-hover:text-white transition-colors duration-150">
                  {item.title}
                </h3>
                <p className="text-zinc-400 text-[11px] mt-0.5 font-medium max-w-[245px] leading-tight">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
