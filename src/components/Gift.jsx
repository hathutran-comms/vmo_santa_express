import React from 'react';
import './Gift.css';

const Gift = React.memo(({ giftX, giftY, spriteIndex, isBreaking }) => {
  // Calculate sprite position based on index
  // Grid is 4x4 (2048x2048):
  // Row 0-1: Intact gifts (8 gifts)
  // Row 3: Breaking/Broken gifts (use for broken state)
  let row, col;
  
  if (isBreaking) {
    // Use breaking sprites from row 3 only (last row)
    row = 3;
    col = spriteIndex % 4; // Use same gift type but broken version
  } else {
    // Use intact sprites from row 0-1
    const spritePositions = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
    ];
    const position = spritePositions[spriteIndex % spritePositions.length];
    row = position.row;
    col = position.col;
  }

  const spriteSize = 512; // Each sprite is 512x512 (2048/4)
  const offsetX = col * spriteSize;
  const offsetY = row * spriteSize;

  return (
    <div
      className={`gift ${isBreaking ? 'breaking' : ''}`}
      style={{
        left: `${giftX}px`,
        top: `${giftY}px`,
      }}
    >
      <img
        src="/assets/gift.png"
        alt="gift"
        style={{
          objectFit: 'none',
          objectPosition: `-${offsetX}px -${offsetY}px`,
          width: '2048px',
          height: '2048px',
          transform: `scale(calc(0.12 * var(--scale, 1)))`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
});

Gift.displayName = 'Gift';

export default Gift;
