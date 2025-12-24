import React from 'react';
import './MainMenu.css';
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
const MainMenu = ({ onPlay, onLeaderboard, onCredits }) => {
  return (
    <div className="main-menu">
      <div className="menu-background">
        <div className="menu-content">
          <button 
            className="menu-button play-button"
            onClick={onPlay}
          >
            <img src="/assets/Buttons/BTN_Orange_01.png" alt="Play" />
          </button>
          
          <button 
            className="menu-button leaderboard-button"
            onClick={onLeaderboard}
          >
            <img src="/assets/Buttons/BTN_Orange_03.png" alt="Leaderboard" />
          </button>
          
          <button 
            className="menu-button credits-button"
            onClick={onCredits}
          >
            <img src="/assets/Buttons/BTN_Orange_04.png" alt="Credits" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/