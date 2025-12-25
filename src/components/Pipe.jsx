import React from 'react';
import './Pipe.css';

const PipePair = React.memo(({ pipeX, topPipeHeight, gap, gameHeight }) => {
  const pipeHeight = topPipeHeight + 40;
  
  return (
    <>
      {/* Top Pipe only */}
      <div
        className="pipe pipe-top"
        style={{
          left: `${pipeX}px`,
          height: `${pipeHeight}px`,
          top: '-20px',
          // Allow the pipe cap to extend beyond the body without being clipped
          overflow: 'visible',
        }}
      >
        <img 
          src="/assets/red_pipe.png" 
          alt="pipe"
          className="pipe-image"
          style={{
            // Slightly widen the image so the pipe cap can overhang like desktop
            width: 'calc(100% + 12px * var(--scale, 1))',
            marginLeft: 'calc(-6px * var(--scale, 1))',
            height: '100%',
            // Keep aspect ratio so short pipes are not squished
            objectFit: 'cover',
            // Anchor to the head so short pipes crop the body, not the cap
            objectPosition: 'top center',
            transform: 'rotate(180deg)',
            transformOrigin: 'center center',
            display: 'block',
          }}
        />
      </div>
    </>
  );
});

PipePair.displayName = 'PipePair';

export default PipePair;
