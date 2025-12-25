import React from 'react';
import './Decor.css';

const Decor = ({ x, gameHeight, type = 1 }) => {
  const groundHeight = 80;
  const scale = 2; // Scale 2x
  
  // Two types of decorations
  const decorTypes = {
    1: {
      spriteWidth: 48,
      spriteHeight: 96,
      bgPosition: '0px 0px', // Second sprite at (0, 0, 152, 96) - different width crops different area
    }
  };
  
  const currentType = decorTypes[type] || decorTypes[1];
  const decorWidth = currentType.spriteWidth * scale;
  const decorHeight = currentType.spriteHeight * scale;
  
  return (
    <div
      className="decor"
      style={{
        left: `${x}px`,
        bottom: `${groundHeight - 10}px`, // Position higher to touch ground naturally
        width: `${decorWidth}px`,
        height: `${decorHeight}px`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${currentType.spriteWidth}px`,
          height: `${currentType.spriteHeight}px`,
          backgroundImage: 'url(/assets/decor.png)',
          backgroundPosition: currentType.bgPosition,
          backgroundRepeat: 'no-repeat',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};

export default Decor;
