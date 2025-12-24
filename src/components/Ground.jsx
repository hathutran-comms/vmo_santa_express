import React from 'react';
import './Ground.css';
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
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
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/