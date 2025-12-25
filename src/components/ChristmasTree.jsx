import React from 'react';
import './ChristmasTree.css';

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
