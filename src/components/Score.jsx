import React from 'react';
import './Score.css';
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
const NumberDisplay = ({ number }) => {
  const digits = number.toString().split('');
  
  return (
    <div className="number-display">
      {digits.map((digit, index) => (
        <img
          key={index}
          src={`/assets/${digit}.png`}
          alt={digit}
          className="digit-image"
        />
      ))}
    </div>
  );
};

const Score = ({ score, highScore, gameStarted, gameOver, onRetry, onShowLeaderboard, gameExpired }) => {
  const playPointSound = () => {
    const audio = new window.Audio('/assets/audio/point.ogg');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
  const handleRetryClick = () => {
    playPointSound();
    if (typeof onRetry === 'function') {
      onRetry();
    }
  };

  const handleShowLeaderboard = () => {
    playPointSound();
    if (typeof onShowLeaderboard === 'function') {
      onShowLeaderboard();
    }
  };

  return (
    <div className={`score-container ${gameOver ? 'game-over-active' : ''}`}>
      {!gameStarted && !gameOver && (
        <div className="start-message">
          <img
            src="/assets/santa_express.png"
            alt="Santa Express"
            className="start-title"
          />
          <p>{gameExpired ? 'Game Finished - Check Your Score' : 'Tap or Press Space to Start'}</p>
        </div>
      )}
      
      {gameStarted && !gameOver && (
        <div className="current-score">
          <NumberDisplay number={score} />
        </div>
      )}
      
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-card">
            <img
              src="/assets/gameover.png"
              alt="Game Over"
              className="game-over-title"
            />
            <div className="game-over-scores ka1-font">
              <div className="score-row-ka1">
                <span className="score-label-ka1">SCORE</span>
                <span className="score-value-ka1">{score}</span>
              </div>
              <div className="score-row-ka1">
                <span className="score-label-ka1">BEST</span>
                <span className="score-value-ka1">{highScore}</span>
              </div>
            </div>

            <div className="game-over-actions" aria-hidden="true">
              <button
                className="game-over-btn"
                type="button"
                onClick={handleRetryClick}
                aria-label="Retry"
              >
                <img src="/assets/retry.png" alt="Retry" />
              </button>
              <button
                className="game-over-btn"
                type="button"
                onClick={handleShowLeaderboard}
                aria-label="Leaderboard"
              >
                <img src="/assets/leaderboard.png" alt="Leaderboard" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Score;
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/