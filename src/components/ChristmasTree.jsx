import React from 'react';
import './ChristmasTree.css';
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
const ChristmasTree = React.memo(({ treeX, gap, gameHeight, type, size }) => {
  // Determine height based on size (larger = taller, fills more gap)
  const baseHeights = {
    small: 200,
    medium: 300,
    large: 400
  };
  
  const baseTreeHeight = baseHeights[size];
  const treeHitboxPadding = 0; // Remove padding for full width hitbox
  const treeHitboxHeightReduction = 0; // Reduce hitbox height from top
  
  return (
    <div
      className="christmas-tree"
      style={{
        left: `${treeX}px`,
        bottom: `calc(60px * var(--scale, 1))`,
        height: `calc((${baseTreeHeight}px + 20px) * var(--scale, 1))`,
        width: `calc(90px * var(--scale, 1))`, // Match PIPE_WIDTH
      }}
    >
      <img
        src="/assets/red_pipe.png"
        alt="tree"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '100%',
          // Preserve aspect ratio to avoid squishing on short columns
          objectFit: 'cover',
          // Keep the pipe head visible on short columns (anchor at top)
          objectPosition: 'top center',
          display: 'block',
        }}
      />
    </div>
  );
});

ChristmasTree.displayName = 'ChristmasTree';

export default ChristmasTree;
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/