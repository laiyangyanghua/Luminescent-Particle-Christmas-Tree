import React from 'react';
import { Maximize2, Minimize2, Rotate3d, Wand2 } from 'lucide-react';

interface UIOverlayProps {
  isExploded: boolean;
  toggleExplosion: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ isExploded, toggleExplosion }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      {/* Header */}
      <div className="text-white drop-shadow-lg">
        <h1 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: '"Mountains of Christmas", serif' }}>
          Merry Christmas
        </h1>
        <p className="text-blue-200 text-sm md:text-base mt-2 opacity-80 max-w-md font-light">
          Experience the magic. Drag to rotate. Tap the tree or the button below to release the spirit.
        </p>
      </div>

      {/* Controls Container */}
      <div className="flex flex-col items-center gap-4 pointer-events-auto pb-8">
        
        {/* Helper Hint */}
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 text-white/70 text-xs md:text-sm animate-pulse">
           <Rotate3d size={16} />
           <span>Rotate 360°</span>
        </div>

        {/* Main Action Button */}
        <button
          onClick={toggleExplosion}
          className={`
            group relative flex items-center justify-center gap-3 px-8 py-4 rounded-full 
            transition-all duration-500 ease-out transform hover:scale-105 active:scale-95
            ${isExploded 
              ? 'bg-gradient-to-r from-emerald-600 to-green-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]' 
              : 'bg-gradient-to-r from-rose-600 to-pink-600 shadow-[0_0_30px_rgba(244,63,94,0.4)]'
            }
          `}
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-full bg-white/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {isExploded ? (
            <>
              <Minimize2 className="w-5 h-5 text-white" />
              <span className="text-white font-semibold tracking-wide uppercase text-sm">Reform Tree</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 text-white animate-bounce" />
              <span className="text-white font-semibold tracking-wide uppercase text-sm">Explode Magic</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UIOverlay;
