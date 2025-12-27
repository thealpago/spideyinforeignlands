import React, { useState, useEffect, useRef } from 'react';
import useInputStore from '../store/inputStore';

interface MobileControlsProps {
  visible: boolean;
}

const MobileControls: React.FC<MobileControlsProps> = ({ visible }) => {
  const { setTouchInput } = useInputStore();
  const [activeButtons, setActiveButtons] = useState<Set<string>>(new Set());
  const touchStartRefs = useRef<{ [key: string]: { x: number; y: number } }>({});

  // Touch event handlers
  const handleTouchStart = (button: string, clientX: number, clientY: number) => {
    setActiveButtons(prev => new Set(prev).add(button));
    touchStartRefs.current[button] = { x: clientX, y: clientY };
    
    // Update touch input based on button
    switch (button) {
      case 'forward':
        setTouchInput({ leftStickY: -1 });
        break;
      case 'backward':
        setTouchInput({ leftStickY: 1 });
        break;
      case 'left':
        setTouchInput({ leftStickX: -1 });
        break;
      case 'right':
        setTouchInput({ leftStickX: 1 });
        break;
    }
  };

  const handleTouchEnd = (button: string) => {
    setActiveButtons(prev => {
      const newSet = new Set(prev);
      newSet.delete(button);
      return newSet;
    });
    delete touchStartRefs.current[button];
    
    // Reset touch input when button is released
    setTouchInput({ 
      leftStickX: 0, 
      leftStickY: 0 
    });
  };

  const handleTouchMove = (button: string, clientX: number, clientY: number) => {
    // Optional: Handle drag-based sensitivity
    const start = touchStartRefs.current[button];
    if (start) {
      const deltaX = clientX - start.x;
      const deltaY = clientY - start.y;
      // Could be used for variable sensitivity based on drag distance
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Direction controls - bottom right */}
      {/* Steering Controls - Bottom Left */}
      <div className="absolute bottom-12 left-12 pointer-events-auto">
        <div className="relative w-48 h-48">
          {/* Steering Wheel Visual */}
          <div className={`w-full h-full rounded-full border-4 transition-transform duration-200 ${
            activeButtons.has('left') ? '-rotate-45' : activeButtons.has('right') ? 'rotate-45' : 'rotate-0'
          } ${
            (activeButtons.has('left') || activeButtons.has('right'))
              ? 'border-white/60 bg-white/10'
              : 'border-white/30 bg-transparent'
          }`}>
            {/* Steering Wheel Spokes */}
            <div className="absolute inset-0 flex items-center justify-center">
               <svg className="w-full h-full text-white/40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4">
                 <circle cx="50" cy="50" r="46" />
                 <path d="M50 50 L50 4" />
                 <path d="M50 50 L15 75" />
                 <path d="M50 50 L85 75" />
                 {/* Decorative inner circle */}
                 <circle cx="50" cy="50" r="12" fill="currentColor" className="text-white/20" stroke="none" />
               </svg>
            </div>
          </div>

          {/* Left Turn Touch Zone */}
          <button
            className="absolute top-0 left-0 w-1/2 h-full z-10 opacity-0 active:opacity-10 transition-opacity bg-white hover:bg-white/20"
            onTouchStart={(e) => {
              e.preventDefault();
              const touch = e.touches[0];
              handleTouchStart('left', touch.clientX, touch.clientY);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleTouchEnd('left');
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              const touch = e.touches[0];
              handleTouchMove('left', touch.clientX, touch.clientY);
            }}
            aria-label="Turn Left"
          />

          {/* Right Turn Touch Zone */}
          <button
            className="absolute top-0 right-0 w-1/2 h-full z-10 opacity-0 active:opacity-10 transition-opacity bg-white hover:bg-white/20"
            onTouchStart={(e) => {
              e.preventDefault();
              const touch = e.touches[0];
              handleTouchStart('right', touch.clientX, touch.clientY);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleTouchEnd('right');
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              const touch = e.touches[0];
              handleTouchMove('right', touch.clientX, touch.clientY);
            }}
            aria-label="Turn Right"
          />
        </div>
      </div>

      {/* Pedal Controls - Bottom Right */}
      <div className="absolute bottom-8 right-8 pointer-events-auto flex gap-6 items-end">
        {/* Brake Pedal (Backward) */}
        <button
          className={`relative w-24 h-20 rounded-lg border-2 transition-all duration-150 transform origin-bottom ${
            activeButtons.has('backward')
              ? 'bg-red-500/30 border-red-400 scale-95'
              : 'bg-black/20 border-white/30 hover:bg-white/10'
          }`}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleTouchStart('backward', touch.clientX, touch.clientY);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleTouchEnd('backward');
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleTouchMove('backward', touch.clientX, touch.clientY);
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
             <svg className="w-10 h-10 text-white/80" viewBox="0 0 24 24" fill="currentColor">
               <path d="M4 8h16v12H4z" opacity="0.5"/>
               <path d="M6 10h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
               <path d="M6 14h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
               <path d="M6 18h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
             </svg>
          </div>
        </button>

        {/* Gas Pedal (Forward) */}
        <button
          className={`relative w-20 h-32 rounded-lg border-2 transition-all duration-150 transform origin-bottom ${
            activeButtons.has('forward')
              ? 'bg-green-500/30 border-green-400 scale-95 rotate-x-12'
              : 'bg-black/20 border-white/30 hover:bg-white/10'
          }`}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleTouchStart('forward', touch.clientX, touch.clientY);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleTouchEnd('forward');
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleTouchMove('forward', touch.clientX, touch.clientY);
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <svg className="w-10 h-16 text-white/80" viewBox="0 0 24 40" fill="currentColor">
               <rect x="6" y="4" width="12" height="32" rx="2" opacity="0.5" />
               <line x1="12" y1="8" x2="12" y2="32" stroke="white" strokeWidth="2" />
               <line x1="8" y1="12" x2="16" y2="12" stroke="white" strokeWidth="1" />
               <line x1="8" y1="18" x2="16" y2="18" stroke="white" strokeWidth="1" />
               <line x1="8" y1="24" x2="16" y2="24" stroke="white" strokeWidth="1" />
             </svg>
          </div>
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-white/60 text-xs pointer-events-auto">
        <div>Touch controls active</div>
      </div>
    </div>
  );
};

export default MobileControls;
