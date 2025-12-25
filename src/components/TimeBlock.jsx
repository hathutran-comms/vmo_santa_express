import React, { useEffect } from 'react';
import './TimeBlock.css';
/**
 * 
 *
      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
const TimeBlock = ({ isMobileDevice }) => {
  // Chặn mọi interaction khi ngoài khung giờ
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

  // Format time for display
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const MOBILE_START = new Date('2025-12-25T09:00:00+07:00');
  const MOBILE_END = new Date('2025-12-25T09:15:00+07:00');
  const DESKTOP_START = new Date('2025-12-25T11:00:00+07:00');
  const DESKTOP_END = new Date('2025-12-25T15:00:00+07:00');

  return (
    <div className="time-block-overlay">
      <div className="time-block-container">
        <div className="time-block-content">
          <div className="time-block-icon">⏰</div>
          <h1 className="time-block-title">Game Chưa Mở</h1>
          <p className="time-block-message">
            {isMobileDevice 
              ? 'Game chỉ mở cho mobile trong khung giờ đặc biệt.'
              : 'Game chỉ mở trong khung giờ quy định.'}
          </p>
          <div className="time-block-schedule">
            {isMobileDevice ? (
              <>
                <p className="time-block-label">Khung giờ cho Mobile:</p>
                <p className="time-block-time">
                  {formatTime(MOBILE_START)} - {formatTime(MOBILE_END)} ngày 25/12/2025
                </p>
              </>
            ) : (
              <>
                <p className="time-block-label">Khung giờ cho Desktop:</p>
                <p className="time-block-time">
                  {formatTime(DESKTOP_START)} - {formatTime(DESKTOP_END)} ngày 25/12/2025
                </p>
              </>
            )}
          </div>
          <p className="time-block-instruction">
            Chơi game vui vẻ
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimeBlock;

