import React from 'react';
import './Smoke.css';

const SPRITE_SIZE = 1024; // 3072/3 = 1024
const SMOKE_DISPLAY_SIZE = 80; // Display size in pixels

const Smoke = React.memo(({ x, y, frame }) => {
  // Calculate sprite position based on frame (0-6)
  // Assuming 7 frames arranged in a grid
  const row = Math.floor(frame / 3);
  const col = frame % 3;
  
  const offsetX = col * SPRITE_SIZE;
  const offsetY = row * SPRITE_SIZE;
  
  return (
    <div 
      className="smoke"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${SMOKE_DISPLAY_SIZE}px`,
        height: `${SMOKE_DISPLAY_SIZE}px`,
      }}
    >
      <img 
        src="/assets/smoke.png"
        alt="smoke"
        style={{
          width: `${3072}px`,
          height: `${3072}px`,
          objectFit: 'none',
          objectPosition: `-${offsetX}px -${offsetY}px`,
          transform: `scale(${SMOKE_DISPLAY_SIZE / SPRITE_SIZE})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
});

Smoke.displayName = 'Smoke';

export default Smoke;
