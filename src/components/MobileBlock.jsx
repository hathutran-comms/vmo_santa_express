import React, { useEffect } from 'react';
import './MobileBlock.css';

const MobileBlock = () => {
  // Chặn mọi interaction khi là mobile
  useEffect(() => {
    // Prevent all touch events
    const preventTouch = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Prevent all keyboard events
    const preventKeyboard = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Prevent scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    // Add event listeners
    document.addEventListener('touchstart', preventTouch, { passive: false });
    document.addEventListener('touchmove', preventTouch, { passive: false });
    document.addEventListener('touchend', preventTouch, { passive: false });
    document.addEventListener('keydown', preventKeyboard);
    document.addEventListener('keyup', preventKeyboard);
    document.addEventListener('keypress', preventKeyboard);

    return () => {
      document.removeEventListener('touchstart', preventTouch);
      document.removeEventListener('touchmove', preventTouch);
      document.removeEventListener('touchend', preventTouch);
      document.removeEventListener('keydown', preventKeyboard);
      document.removeEventListener('keyup', preventKeyboard);
      document.removeEventListener('keypress', preventKeyboard);
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, []);

  return (
    <div className="mobile-block-overlay">
      <div className="mobile-block-container">
        <div className="mobile-block-content">
          <div className="mobile-block-icon">📱</div>
          <h1 className="mobile-block-title">Mobile Not Supported</h1>
          <p className="mobile-block-message">
            This game is only available on desktop/PC.
          </p>
          <p className="mobile-block-instruction">
            Please switch to a desktop computer or laptop to play.
          </p>
          <div className="mobile-block-details">
            <p>For the best gaming experience, please use:</p>
            <ul>
              <li>🖥️ Desktop Computer</li>
              <li>💻 Laptop</li>
              <li>⌨️ Keyboard & Mouse</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileBlock;

