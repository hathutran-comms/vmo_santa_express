import React from 'react';
import './FloatingGiftbox.css';

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
