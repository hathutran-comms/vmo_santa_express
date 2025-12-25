import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './EnterID.css';

const EnterID = ({ onSubmit, onCancel }) => {
  const [vmoId, setVmoId] = useState(['', '', '', '']);
  const [showWarning, setShowWarning] = useState(false);
  const inputRefs = useRef([null, null, null, null]);
  const MAX_LENGTH = 4;
  const snowflakes = useMemo(() => (
    [...Array(50)].map(() => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${8 + Math.random() * 6}s`,
      sway: `${4 + Math.random() * 4}s`,
      drift: `${-8 + Math.random() * 16}px`,
      size: `8px`,
      opacity: 0.6 + Math.random() * 0.4,
    }))
  ), []);

  const focusInput = (targetIndex) => {
    setTimeout(() => {
      inputRefs.current[targetIndex]?.focus();
    }, 0);
  };

  const focusFirstEmpty = () => {
    const emptyIndex = vmoId.findIndex((digit) => digit === '');
    return emptyIndex === -1 ? MAX_LENGTH - 1 : emptyIndex;
  };

  // Focus first input on mount
  useEffect(() => {
    focusInput(0);
    // Try to play background music when EnterID mounts
    const playBgMusic = () => {
      if (window.bgMusicRef) {
        const promise = window.bgMusicRef.play();
        if (promise !== undefined) {
          promise
            .then(() => {
              // console.log('Background music playing in EnterID');
            })
            .catch(err => {
              // console.log('Music play still blocked in EnterID:', err);
            });
        }
      }
    };
    playBgMusic();
  }, []);

  const handleInputChange = (index, input) => {
    const rawValue = typeof input === 'string' ? input : input?.target?.value || '';
    // Keep only last digit
    const value = rawValue.replace(/[^0-9]/g, '').slice(-1);

    setVmoId((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setShowWarning(false);

    // Auto-focus next input after state updates
    if (value && index < MAX_LENGTH - 1) {
      setTimeout(() => focusInput(index + 1), 10);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!vmoId[index] && index > 0) {
        // Move to previous input if current is empty
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      } else if (vmoId[index]) {
        // Clear current input
        setVmoId((prev) => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < MAX_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    } else if (e.key.length === 1 && /^[0-9]$/.test(e.key)) {
      // Handle direct number input
      e.preventDefault();
      handleInputChange(index, { target: { value: e.key } });
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, MAX_LENGTH);
    const newVmoId = ['', '', '', ''];
    pastedData.split('').forEach((char, i) => {
      if (i < MAX_LENGTH) {
        newVmoId[i] = char;
      }
    });
    setVmoId(newVmoId);
    setShowWarning(false);
    
    // Focus the next empty input or last input
    const nextIndex = Math.min(pastedData.length, MAX_LENGTH - 1);
    setTimeout(() => {
      inputRefs.current[nextIndex]?.focus();
    }, 0);
  };

  const handleConfirmClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    const fullId = vmoId.join('');
    
    if (fullId.length === MAX_LENGTH) {
      onSubmit(fullId);
    } else {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 2000);
    }
  };

  // Allow typing digits without manually focusing each input
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const isDigit = e.key.length === 1 && /^[0-9]$/.test(e.key);
      const isBackspace = e.key === 'Backspace';
      if (!isDigit && !isBackspace) return;
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      e.preventDefault();

      if (isDigit) {
        const targetIndex = focusFirstEmpty();
        handleInputChange(targetIndex, e.key);
        const nextIndex = Math.min(targetIndex + 1, MAX_LENGTH - 1);
        setTimeout(() => focusInput(nextIndex), 0);
      } else if (isBackspace) {
        let targetIndex = -1;
        for (let i = MAX_LENGTH - 1; i >= 0; i -= 1) {
          if (vmoId[i]) {
            targetIndex = i;
            break;
          }
        }

        if (targetIndex === -1) {
          focusInput(0);
          return;
        }

        setVmoId((prev) => {
          const next = [...prev];
          next[targetIndex] = '';
          return next;
        });
        focusInput(targetIndex);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [vmoId]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      const fullId = vmoId.join('');
      if (fullId.length === MAX_LENGTH) {
        onSubmit(fullId);
      } else {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 2000);
      }
    }
  }, [vmoId, onSubmit]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const fullId = vmoId.join('');

  return (
    <div className="enter-id-wrapper">
    <div className="enter-id-overlay">
      <div className="snowflakes">
        {snowflakes.map((flake, i) => (
          <div
            key={i}
            className="snowflake"
            style={{
              left: flake.left,
              animationDelay: flake.delay,
              '--snow-duration': flake.duration,
              '--snow-sway': flake.sway,
              '--snow-drift': flake.drift,
              width: flake.size,
              height: flake.size,
              opacity: flake.opacity,
            }}
          />
        ))}
      </div>
      <div className="enter-id-container">
        <div className="enter-id-content">
          <img 
            src="/assets/vmo_id.png" 
            alt="VMO_ID" 
            className="vmo-id-label"
          />
          
          <div className="input-boxes-container">
            {vmoId.map((digit, index) => (
              <div
                key={index}
                className={`input-box ${showWarning ? 'input-error' : ''}`}
                onClick={() => focusInput(index)}
              >
                {digit && (
                  <img
                    src={`/assets/${digit}.png`}
                    alt={digit}
                    className="digit-image-display"
                  />
                )}
                <input
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleInputChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="hidden-input"
                  autoComplete="off"
                />
              </div>
            ))}
          </div>
          
          <button className="resume-button" onClick={handleConfirmClick}>
            <img src="/assets/Game_Paused/Resume_BTN.png" alt="Confirm" />
          </button>
          
          {showWarning && (
            <div className="warning-message">
              Please enter 4 digits
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default EnterID;
