import React from 'react';
import './FloatingGiftbox.css';
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
const FloatingGiftbox = React.memo(({ x, y }) => {
  return (
    <div
      className="floating-giftbox"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <img
        src="/assets/Giftbox-1.png"
        alt="floating giftbox"
        style={{
          width: `calc(60px * var(--scale, 1))`,
          height: 'auto',
          imageRendering: 'auto',
        }}
      />
    </div>
  );
});

FloatingGiftbox.displayName = 'FloatingGiftbox';

export default FloatingGiftbox;
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/