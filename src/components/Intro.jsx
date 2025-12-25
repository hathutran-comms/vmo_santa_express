import React, { useState, useEffect, useMemo } from 'react';
import './Intro.css';

const SCRIPTS = [
  {
    id: 1,
    sprite: 'santa_popup',
    text: "Ho Ho Ho! Hey there, VMOers! 🎅 I'm on my way with a sleigh full of gifts for you! 🎁"
  },
  {
    id: 2,
    sprite: 'santa_popup',
    text: "But oh dear, the sky is full of giant candy canes! Help me fly through them to deliver your presents on time. Ready to save Christmas?\n Let's fly!"
  }
];

const Intro = ({ onComplete }) => {
  const [currentScript, setCurrentScript] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
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

  const script = SCRIPTS[currentScript];
  const fullText = script.text;

  // Typing animation
  useEffect(() => {
    if (charIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 30);
      return () => clearTimeout(timeout);
    }
  }, [charIndex, fullText]);

  // Reset when changing script
  useEffect(() => {
    setDisplayedText('');
    setCharIndex(0);
  }, [currentScript]);

  const playPointSound = () => {
    const audio = new window.Audio('/assets/audio/point.ogg');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const handleNext = () => {
    playPointSound();
    if (charIndex < fullText.length) {
      // Skip typing animation
      setDisplayedText(fullText);
      setCharIndex(fullText.length);
    } else if (currentScript < SCRIPTS.length - 1) {
      // Next script
      setCurrentScript(currentScript + 1);
    } else {
      // Complete intro
      onComplete();
    }
  };

  const handleSkip = () => {
    playPointSound();
    onComplete();
  };

  return (
    <div className="intro-wrapper">
    <div className="intro-container" onClick={handleNext}>
      <div className="snowflakes">
        {snowflakes.map((flake, i) => (
          <div key={i} className="snowflake" style={{
            left: flake.left,
            animationDelay: flake.delay,
            '--snow-duration': flake.duration,
            '--snow-sway': flake.sway,
            '--snow-drift': flake.drift,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
          }} />
        ))}
      </div>

      <div className="intro-card" onClick={handleNext}>
        <img src="/assets/santa_popup.png" alt="Santa" className="intro-santa" />
        <img src="/assets/dialog.png" alt="Dialog" className="dialog-bubble" />
        <div className="dialog-text-box">
          {displayedText.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < displayedText.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
          {charIndex < fullText.length && <span className="cursor">▋</span>}
        </div>

        <button className="skip-button" onClick={(e) => {
          e.stopPropagation();
          handleSkip();
        }}>
          <img src="/assets/skip.png" alt="Skip" />
        </button>
        </div>
      </div>
    </div>
  );
};

export default Intro;
