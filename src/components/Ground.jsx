import React from 'react';
import './Ground.css';

const Ground = ({ gameWidth, gameStarted, gameOver }) => {
  // Animation should run when game started and not over
  const shouldAnimate = gameStarted && !gameOver;
  
  return (
    <div className="ground-container">
      <div 
        className={`ground-tiles ${shouldAnimate ? 'moving' : ''}`}
        style={{
          height: `calc(80px * var(--scale, 1))`,
          backgroundImage: 'url(/assets/tiles.png)',
          backgroundRepeat: 'repeat-x',
          backgroundSize: `calc(336px * var(--scale, 1)) calc(80px * var(--scale, 1))`,
          backgroundPosition: '0 0',
          imageRendering: 'pixelated',
        }}
      >
      </div>
    </div>
  );
};

export default Ground;
