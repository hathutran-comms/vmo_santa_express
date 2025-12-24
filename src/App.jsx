/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Santa from './components/Santa';
import PipePair from './components/Pipe';
import Gift from './components/Gift';
import Score from './components/Score';
import Smoke from './components/Smoke';
import Ground from './components/Ground';
import ChristmasTree from './components/ChristmasTree';
import Decor from './components/Decor';
import Intro from './components/Intro';
import MainMenu from './components/MainMenu';
import FloatingGiftbox from './components/FloatingGiftbox';
import EnterID from './components/EnterID';
import LoadingScreen from './components/LoadingScreen';
import LeaderboardOverlay from './components/LeaderboardOverlay';
import MobileBlock from './components/MobileBlock';
import TimeBlock from './components/TimeBlock';
import { savePlayerScore, getTop10Leaderboard, getPlayerHighScore, submitPipePassed, submitGiftCollected, submitGameStart } from './services/firebaseService';
import './App.css';
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
// Audio files
const createSound = (src) => {
  const audio = new Audio(src);
  audio.volume = 0.3;
  return audio;
};
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
const soundFiles = {
  wing: '/assets/audio/wing.wav',
  point: '/assets/audio/point.wav',
  hit: '/assets/audio/hit.wav',
  die: '/assets/audio/die.wav',
  swoosh: '/assets/audio/swoosh.wav'
};

// Background music
const bgMusic = new Audio('/assets/audio/funny_bg.mp3');
bgMusic.volume = 0.4;
bgMusic.loop = true;

// Expose bgMusic globally so LoadingScreen can access it immediately
if (typeof window !== 'undefined') {
  window.bgMusicRef = bgMusic;
}
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
// Base dimensions (reference size: 500x750)
const BASE_PIPE_WIDTH = 90;
// Gap between pipes (scaled proportionally for all devices)
// Reduced for higher difficulty - gap is ~26.7% of reference height (200/750)
const BASE_PIPE_GAP = 200; // Reduced from 280 for harder gameplay
const PIPE_SPEED = 3;
const BASE_SANTA_SIZE = 100;
const BASE_SANTA_HITBOX_PADDING = 20; // Reduce hitbox by 20px on each side
const GIFT_DROP_INTERVAL = 3000; // Drop gift every 3 seconds
const GIFT_DROP_INTERVAL_MOBILE = 5000; // Drop gift every 5 seconds on mobile (less frequent)
const GIFT_FALL_SPEED = 2;
const GIFT_GRAVITY = 0.3;
const BASE_GIFT_SIZE = 60;
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
// Detect mobile device
const detectMobileDevice = () => {
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768 && 'ontouchstart' in window) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

// Khung giờ cho phép mobile: 09:00 - 09:15 ngày 25/12/2025 (giờ Việt Nam UTC+7)
const MOBILE_ALLOWED_START = new Date('2025-12-25T09:00:00+07:00').getTime();
const MOBILE_ALLOWED_END = new Date('2025-12-25T09:15:00+07:00').getTime();

// Khung giờ cho phép desktop: 11:00 - 15:00 ngày 25/12/2025 (giờ Việt Nam UTC+7)
const DESKTOP_ALLOWED_START = new Date('2025-12-25T11:00:00+07:00').getTime();
const DESKTOP_ALLOWED_END = new Date('2025-12-25T15:00:00+07:00').getTime();

/**
 * Kiểm tra xem có đang trong khung giờ cho phép mobile không
 * @returns {boolean} true nếu đang trong khung giờ cho phép mobile
 */
const isMobileAllowedTime = () => {
  const now = Date.now();
  return now >= MOBILE_ALLOWED_START && now <= MOBILE_ALLOWED_END;
};

/**
 * Kiểm tra xem có đang trong khung giờ cho phép desktop không
 * @returns {boolean} true nếu đang trong khung giờ cho phép desktop
 */
const isDesktopAllowedTime = () => {
  const now = Date.now();
  return now >= DESKTOP_ALLOWED_START && now <= DESKTOP_ALLOWED_END;
};

// Detect mobile device - CHẶN HOÀN TOÀN MOBILE (trừ khung giờ đặc biệt)
// Note: isMobile sẽ được tính trong component dựa trên state

const GAME_EXPIRATION_TIME = new Date('2025-12-25T15:00:00+07:00').getTime();

const isGameExpired = () => {
  return Date.now() >= GAME_EXPIRATION_TIME;
};
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
function App() {
  const [showLoading, setShowLoading] = useState(true);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showEnterID, setShowEnterID] = useState(false);
  const [vmoId, setVmoId] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  // Track mobile allowed time state (real-time)
  const [isMobileAllowed, setIsMobileAllowed] = useState(isMobileAllowedTime());
  const [isMobileDevice, setIsMobileDevice] = useState(detectMobileDevice());
  // Track desktop allowed time state (real-time)
  const [isDesktopAllowed, setIsDesktopAllowed] = useState(isDesktopAllowedTime());
  
  // Calculate isMobile based on state (reactive)
  const isMobile = isMobileDevice && !isMobileAllowed;
  
  // Check if device is allowed to play (mobile trong khung giờ đặc biệt hoặc desktop trong khung giờ)
  const isDeviceAllowed = (isMobileDevice && isMobileAllowed) || (!isMobileDevice && isDesktopAllowed);
  
  // Reference dimensions for scaling (base game size)
  const REFERENCE_WIDTH = 500;
  const REFERENCE_HEIGHT = 750;
  const [gameWidth, setGameWidth] = useState(REFERENCE_WIDTH);
  const [gameHeight, setGameHeight] = useState(REFERENCE_HEIGHT);
  // Calculate initial Santa Y position (40% from top of reference height)
  const initialSantaY = REFERENCE_HEIGHT * 0.4;
  const [santaY, setSantaY] = useState(initialSantaY);
  const [santaVelocity, setSantaVelocity] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [pipes, setPipes] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [smokes, setSmokes] = useState([]);
  const [decors, setDecors] = useState([]);
  const [floatingGiftboxes, setFloatingGiftboxes] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [pipeGap, setPipeGap] = useState(BASE_PIPE_GAP);
  const [enableSmoke, setEnableSmoke] = useState(!isMobileDevice); // Disable smoke on mobile for performance
  const [leaderboard, setLeaderboard] = useState([]);
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [gameExpired, setGameExpired] = useState(isGameExpired());
  const hasRecordedScoreRef = useRef(false);
  const gameStartTimeRef = useRef(null);
  const pipesPassedRef = useRef(0);
  const giftsReceivedRef = useRef(0);
  const gameSessionIdRef = useRef(null); // Session ID để track actions real-time
  /**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
  // Check for game expiration every second and reload if expired
  useEffect(() => {
    const expirationCheckInterval = setInterval(() => {
      if (isGameExpired() && !gameExpired) {
        // Game just expired, reload the page
        window.location.reload();
      }
    }, 1000); // Check every second
    
    return () => clearInterval(expirationCheckInterval);
  }, [gameExpired]);

  // Check mobile and desktop allowed time every second (real-time)
  useEffect(() => {
    const timeCheckInterval = setInterval(() => {
      const mobileAllowed = isMobileAllowedTime();
      const desktopAllowed = isDesktopAllowedTime();
      
      setIsMobileAllowed(mobileAllowed);
      setIsDesktopAllowed(desktopAllowed);
      
      // Nếu hết khung giờ cho phép, reload để chặn lại
      if (isMobileDevice && !mobileAllowed && isMobileAllowed) {
        // Mobile hết khung giờ đặc biệt
        window.location.reload();
      } else if (!isMobileDevice && !desktopAllowed && isDesktopAllowed) {
        // Desktop hết khung giờ
        window.location.reload();
      }
    }, 1000); // Check every second
    
    return () => clearInterval(timeCheckInterval);
  }, [isMobileDevice, isMobileAllowed, isDesktopAllowed]);
  /**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
  // Calculate scale factors based on current game dimensions
  const scaleX = gameWidth / REFERENCE_WIDTH;
  const scaleY = gameHeight / REFERENCE_HEIGHT;
  const scale = Math.min(scaleX, scaleY); // Use uniform scaling to maintain aspect ratio
  
  const gameLoopRef = useRef(null);
  const pipeTimerRef = useRef(null);
  const giftTimerRef = useRef(null);
  const decorTimerRef = useRef(null);
  const scoredPipesRef = useRef(new Set());
  const collectedGiftboxesRef = useRef(new Set());
  const gameContainerRef = useRef(null);
  const santaYRef = useRef(REFERENCE_HEIGHT * 0.4);
  const bgMusicRef = useRef(bgMusic);
  const musicStartedRef = useRef(false);
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
  // Play sound helper function - creates new audio instance each time
  const playSound = useCallback((soundName) => {
    if (soundFiles[soundName]) {
      const sound = createSound(soundFiles[soundName]);
      sound.play().catch(err => {/* console.log('Audio play failed:', err); */});
    }
  }, []);

  // Handle music toggle
  const handleMusicToggle = useCallback((e) => {
    e.stopPropagation();
    setIsMusicOn((prev) => {
      const newState = !prev;
      if (window.bgMusicRef) {
        if (newState) {
          window.bgMusicRef.play().catch(err => {/* console.log('Audio play failed:', err); */});
        } else {
          window.bgMusicRef.pause();
        }
      }
      return newState;
    });
  }, []);
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
  // Ensure background music starts on first user interaction
  useEffect(() => {
    const tryPlayMusic = () => {
      if (!musicStartedRef.current && window.bgMusicRef) {
        const promise = window.bgMusicRef.play();
        if (promise !== undefined) {
          promise
            .then(() => {
              musicStartedRef.current = true;
              // console.log('Background music started');
            })
            .catch(() => {
              // Music will play on next interaction
            });
        }
      }
    };
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
    // Try on click, touch, and keydown
    window.addEventListener('click', tryPlayMusic);
    window.addEventListener('touchstart', tryPlayMusic);
    window.addEventListener('keydown', tryPlayMusic);

    return () => {
      window.removeEventListener('click', tryPlayMusic);
      window.removeEventListener('touchstart', tryPlayMusic);
      window.removeEventListener('keydown', tryPlayMusic);
    };
  }, []);
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
  // Update santaYRef whenever santaY changes
  useEffect(() => {
    santaYRef.current = santaY;
  }, [santaY]);

  // Update initial Santa position when game dimensions change (only if game hasn't started)
  useEffect(() => {
    if (!gameStarted && !gameOver) {
      const newInitialY = gameHeight * 0.4;
      setSantaY(newInitialY);
      santaYRef.current = newInitialY;
    }
  }, [gameHeight, gameStarted, gameOver]);

  // Load leaderboard từ Firebase
  const loadLeaderboard = useCallback(async () => {
    try {
      const top10 = await getTop10Leaderboard();
      setLeaderboard(top10);
    } catch (error) {
      setLeaderboard([]);
    }
  }, []);
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
  // Load high score from localStorage (local high score vẫn lưu local)
  useEffect(() => {
    const savedHighScore = localStorage.getItem('santaFlappyHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Start background music on component mount (loading screen)
  useEffect(() => {
    const playMusic = () => {
      bgMusicRef.current.play().catch(err => {/* console.log('Background music autoplay failed:', err); */});
    };
    
    // Try to play immediately
    playMusic();
    /**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
    // Also try on first user interaction (for browsers that block autoplay)
    const handleInteraction = () => {
      playMusic();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
    
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
  // Update game dimensions responsively
  useEffect(() => {
    const updateDimensions = () => {
      if (isMobile || window.innerWidth <= 800) {
        // Mobile: use full screen dimensions
        const screenHeight = window.innerHeight;
        setGameWidth(window.innerWidth);
        setGameHeight(screenHeight);
        // Mobile: gap scales proportionally with screen height
        // Gap ratio: BASE_PIPE_GAP / REFERENCE_HEIGHT = 200 / 750 = ~0.267 (26.7%)
        const calculatedGap = Math.round(screenHeight * (BASE_PIPE_GAP / REFERENCE_HEIGHT));
        // Clamp gap to ensure playability (minimum 150px, maximum 240px for consistent difficulty)
        const finalGap = Math.max(150, Math.min(calculatedGap, 180));
        setPipeGap(finalGap);
      } else {
        // Desktop: maintain aspect ratio, scale to fit viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const aspectRatio = REFERENCE_WIDTH / REFERENCE_HEIGHT;
        
        let newWidth, newHeight;
        if (viewportWidth / viewportHeight > aspectRatio) {
          // Viewport is wider, fit to height
          newHeight = Math.min(viewportHeight * 0.9, REFERENCE_HEIGHT);
          newWidth = newHeight * aspectRatio;
        } else {
          // Viewport is taller, fit to width
          newWidth = Math.min(viewportWidth * 0.9, REFERENCE_WIDTH);
          newHeight = newWidth / aspectRatio;
        }
        
        setGameWidth(newWidth);
        setGameHeight(newHeight);
        // Desktop: gap scales proportionally with game height
        // Gap ratio: BASE_PIPE_GAP / REFERENCE_HEIGHT = 200 / 750 = ~0.267 (26.7%)
        setPipeGap(Math.round(newHeight * (BASE_PIPE_GAP / REFERENCE_HEIGHT)));
      }
    };
    /**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('santaFlappyHighScore', score.toString());
    }
  }, [score, highScore]);

  // Lưu điểm vào Firebase khi game over - SỬ DỤNG CLOUD FUNCTION (CHỐNG GIAN LẬN)
  // Server tính điểm từ pipesPassed và giftsReceived, client không gửi score
  useEffect(() => {
    // console.log('[App] Game over check:', {
    //   gameOver,
    //   hasRecordedScore: hasRecordedScoreRef.current,
    //   vmoId,
    //   vmoIdValid: vmoId && vmoId.trim() !== ''
    // });
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
    if (gameOver && !hasRecordedScoreRef.current && vmoId && vmoId.trim() !== '') {
      // Tính thời gian chơi
      const playTimeSeconds = gameStartTimeRef.current 
        ? Math.floor((Date.now() - gameStartTimeRef.current) / 1000)
        : 0;
      
      // console.log('[App] 🎮 Game Over - Saving score', {
      //   vmoId,
      //   pipesPassed: pipesPassedRef.current,
      //   giftsReceived: giftsReceivedRef.current,
      //   playTimeSeconds,
      //   currentScore: score,
      //   currentHighScore: highScore
      // });
      
      // Load high score từ Firebase TRƯỚC khi save để đảm bảo so sánh đúng
      getPlayerHighScore(vmoId)
        .then((firebaseHighScore) => {
          // console.log('[App] Current high score from Firestore:', firebaseHighScore);
          
          // Cập nhật highScore state nếu Firebase có giá trị cao hơn
          if (firebaseHighScore > highScore) {
            setHighScore(firebaseHighScore);
          }
          
          // Gọi Cloud Function để lưu điểm
          // Server sẽ tổng hợp từ các actions đã nhận được trong session
          // console.log('[App] Calling savePlayerScore:', {
          //   vmoId,
          //   sessionId: gameSessionIdRef.current,
          //   playTimeSeconds,
          //   pipesPassed: pipesPassedRef.current,
          //   giftsReceived: giftsReceivedRef.current
          // });
              
          return savePlayerScore(
            vmoId,
            gameSessionIdRef.current || `session_${Date.now()}`,
            playTimeSeconds
          );
        })
        .then((result) => {
          // console.log('[App] savePlayerScore response:', result);
          /**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
          if (result.success && result.score !== undefined) {
            // Sử dụng score từ server (không phải từ client)
            const serverScore = result.score;
            // console.log('[App] ✅ Score saved successfully!', {
            //   serverScore,
            //   previousHighScore: highScore,
            //   message: result.message,
            //   previousScore: result.previousScore,
            //   pipesCount: result.pipesCount,
            //   giftsCount: result.giftsCount
            // });
            
            // Luôn cập nhật high score từ server response
            // Server trả về score mới nếu cao hơn, hoặc previousScore nếu không
            setHighScore(serverScore);
            
            // Lưu vào localStorage để đồng bộ
            localStorage.setItem('santaFlappyHighScore', serverScore.toString());
            
            // Load lại leaderboard sau khi lưu thành công
            // console.log('[App] Reloading leaderboard...');
            loadLeaderboard();
            
            // Load lại high score từ Firebase một lần nữa để đảm bảo đồng bộ hoàn toàn
            getPlayerHighScore(vmoId)
              .then((firebaseHighScore) => {
                // console.log('[App] Final high score from Firestore:', firebaseHighScore);
                if (firebaseHighScore > 0) {
                  setHighScore(firebaseHighScore);
                  localStorage.setItem('santaFlappyHighScore', firebaseHighScore.toString());
                }
              })
              .catch((err) => {
                // console.error('[App] Error loading high score:', err);
              });
          } else {
            // Nếu lỗi, vẫn hiển thị score hiện tại
            // console.error('[App] ❌ Failed to save score:', {
            //   success: result.success,
            //   error: result.error,
            //   score: result.score
            // });
          }
        })
        .catch((error) => {
          // console.error('[App] ❌ Error saving score:', {
          //   error,
          //   message: error.message,
          //   stack: error.stack
          // });
        });
      
      hasRecordedScoreRef.current = true;
      // console.log('[App] Set hasRecordedScoreRef to true');
    } else if (!gameOver) {
      hasRecordedScoreRef.current = false;
      // console.log('[App] Reset hasRecordedScoreRef (game not over)');
    }
  }, [gameOver, vmoId, loadLeaderboard, highScore]);

  // Load leaderboard khi mở leaderboard overlay
  useEffect(() => {
    if (showLeaderboard) {
      loadLeaderboard();
    }
  }, [showLeaderboard, loadLeaderboard]);

  const resetGame = useCallback(() => {
      playSound('swoosh');
      setSantaY(gameHeight * 0.4);
      setSantaVelocity(0);
      setRotation(0);
      setIsDead(false);
      setPipes([]);
      setGifts([]);
      setSmokes([]);
      setDecors([]);
      setScore(0);
      setGameOver(false);
      setGameStarted(false);
      setShowLeaderboard(false);
      scoredPipesRef.current.clear();
      collectedGiftboxesRef.current.clear();
      gameStartTimeRef.current = null;
      pipesPassedRef.current = 0;
      giftsReceivedRef.current = 0;
      gameSessionIdRef.current = null;
  }, [gameHeight, playSound]);

  const jump = useCallback(() => {
    // Don't allow jumping when loading, intro, or enter ID is showing, or game expired
    if (showLoading || showIntro || showEnterID || showLeaderboard || gameOver || gameExpired) {
      return;
    }
    
    // Calculate scale for jump strength
    const currentScale = Math.min(gameWidth / REFERENCE_WIDTH, gameHeight / REFERENCE_HEIGHT);
    const scaledJumpStrength = JUMP_STRENGTH * currentScale;
    
    if (!gameStarted) {
      setGameStarted(true);
      gameStartTimeRef.current = Date.now();
      pipesPassedRef.current = 0;
      giftsReceivedRef.current = 0;
      collectedGiftboxesRef.current.clear();
      
      // Tạo session ID cho game này
      gameSessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Gửi game_start action lên server
      if (vmoId && vmoId.trim() !== '') {
        // console.log('[App] Sending game_start:', {
        //   vmoId,
        //   sessionId: gameSessionIdRef.current
        // });
        submitGameStart(vmoId, gameSessionIdRef.current).catch(err => {
          // console.error('[App] Error sending game_start:', err);
        });
      } else {
        // console.warn('[App] Cannot send game_start - vmoId is empty');
      }
      
      playSound('wing');
      setSantaVelocity(scaledJumpStrength);
      // Add smoke effect (disabled on mobile for performance)
      if (enableSmoke) {
        const santaLeft = gameWidth * 0.15;
        setSmokes(prev => [...prev, {
          id: Date.now(),
          x: santaLeft - 50,
          y: santaYRef.current,
          frame: 0,
          createdAt: Date.now()
        }]);
      }
    } else if (!isDead) {
      playSound('wing');
      setSantaVelocity(scaledJumpStrength);
      // Add smoke effect (disabled on mobile for performance)
      if (enableSmoke) {
        const santaLeft = gameWidth * 0.15;
        setSmokes(prev => [...prev, {
          id: Date.now(),
          x: santaLeft - 60,
          y: santaYRef.current,
          frame: 0,
          createdAt: Date.now()
        }]);
      }
    }
  }, [gameOver, gameStarted, isDead, playSound, gameWidth, gameHeight, enableSmoke, showLoading, showIntro, showEnterID, showMainMenu, gameExpired]);

  // Handle keyboard and touch input
  useEffect(() => {
    const isInteractiveTarget = (target) => {
      if (!target) return false;
      const closest = target.closest?.('.game-over-actions, .enter-id-container, .music-toggle-btn, .leaderboard-btn');
      return Boolean(closest);
    };

    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };

    const handleTouch = (e) => {
      if (gameOver || showLoading || showIntro || showEnterID || showLeaderboard) return;
      if (isInteractiveTarget(e.target)) return;
      e.preventDefault();
      jump();
    };

    const handleClick = (e) => {
      if (gameOver || showLoading || showIntro || showEnterID || showLeaderboard) return;
      if (isInteractiveTarget(e.target)) return;
      // Only trigger jump if clicking on game container, not other elements
      if (e.target === gameContainerRef.current || 
          gameContainerRef.current?.contains(e.target)) {
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    // Add touch/click listeners to game container instead of window
    const container = gameContainerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouch, { passive: false });
      container.addEventListener('click', handleClick);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (container) {
        container.removeEventListener('touchstart', handleTouch);
        container.removeEventListener('click', handleClick);
      }
    };
  }, [jump, gameOver, showLoading, showIntro, showEnterID, showLeaderboard]);

  // Ngăn người chơi zoom (Ctrl + +/-/0, Ctrl + scroll) để tránh làm game dễ hơn
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      // Các phím zoom phổ biến: +, -, =, 0
      if (
        e.key === '+' ||
        e.key === '-' ||
        e.key === '=' ||
        e.key === '0' ||
        e.code === 'NumpadAdd' ||
        e.code === 'NumpadSubtract'
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Generate pipes
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const generatePipe = () => {
        // Calculate scale once for this function
        const pipeScale = Math.min(gameWidth / REFERENCE_WIDTH, gameHeight / REFERENCE_HEIGHT);
        
        setPipes((prevPipes) => {
          // Calculate scaled target distance between pipes (edge to edge)
          const baseTargetDistance = 200; // Target distance between pipe edges for consistent spacing
          const targetDistance = baseTargetDistance * pipeScale;
          const basePipeWidth = BASE_PIPE_WIDTH * pipeScale;
          
          if (prevPipes.length > 0) {
            const lastPipe = prevPipes[prevPipes.length - 1];
            // Check actual position - ensure consistent distance between pipe edges
            // Last pipe right edge is at lastPipe.x + basePipeWidth
            // New pipe left edge will be at gameWidth
            // Distance between edges = gameWidth - (lastPipe.x + basePipeWidth)
            const lastPipeRightEdge = lastPipe.x + basePipeWidth;
            const distanceBetweenEdges = gameWidth - lastPipeRightEdge;
            
            // Spawn when distance reaches target (with tolerance for timing)
            // This ensures consistent spacing regardless of game loop timing
            const minDistance = targetDistance - (20 * pipeScale); // Allow small variation
            const maxDistance = targetDistance + (30 * pipeScale); // Prevent huge gaps
            
            if (distanceBetweenEdges < minDistance) {
              return prevPipes; // Too close, don't spawn yet
          }
          
            // If distance is too large, spawn immediately to prevent huge gaps
            // This handles cases where game loop was slow or frame rate dropped
            if (distanceBetweenEdges > maxDistance) {
              // Spawn immediately - distance is already too large
              // Continue to create new pipe below
            } else if (distanceBetweenEdges < targetDistance) {
              // Not quite at target yet, wait a bit more
              return prevPipes;
            }
            // Distance is at or near target, spawn new pipe
          }
          
          // Random tree properties first
          const types = ['fantasy', 'green', 'greenTeal'];
          const treeType = types[Math.floor(Math.random() * types.length)];
          
          // Random tree size with more variation
          const sizes = ['small', 'medium', 'large'];
          const treeSize = sizes[Math.floor(Math.random() * sizes.length)];
          
          // Tree heights based on size - wider range for more variation (scaled)
          const baseTreeHeights = { small: 200, medium: 300, large: 400 };
          const treeHeight = baseTreeHeights[treeSize] * pipeScale;
          const pipeGroundHeight = 80 * pipeScale;
          
          // Use dynamic gap from state instead of fixed value
          const currentGap = pipeGap;
          
          // Calculate tree top position (from top of screen)
          // Use current gameHeight to ensure proper calculations
          const currentGameHeight = gameHeight;
          const treeTopY = currentGameHeight - pipeGroundHeight - treeHeight;
          
          // Pipe top height = tree top - gap
          // This ensures gap is always exactly currentGap regardless of tree size
          // Calculate pipe height to maintain exact gap
          const height = treeTopY - currentGap;
          
          // Safety check: ensure pipe height is not negative
          if (height < 0) {
            return prevPipes;
          }
          
          const newPipe = {
            id: Date.now(),
            x: gameWidth,
            topHeight: height,
            passed: false,
            treeType,
            treeSize,
          };
          
          return [...prevPipes, newPipe];
        });
      };
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
      // Generate first pipe after a longer delay to give player time to prepare
      const firstPipeTimeout = setTimeout(generatePipe, 3000); // 3 seconds delay

      // Check for new pipes more frequently to ensure consistent spacing
      // Higher frequency = more consistent spacing, but slightly more CPU usage
      pipeTimerRef.current = setInterval(generatePipe, 100); // Check every 100ms for better consistency

      return () => {
        clearTimeout(firstPipeTimeout);
        if (pipeTimerRef.current) {
          clearInterval(pipeTimerRef.current);
        }
      };
    }
  }, [gameStarted, gameOver, gameWidth, gameHeight, pipeGap]);

  // Generate floating giftboxes independently (not tied to pipes)
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const spawnGiftbox = () => {
        setFloatingGiftboxes((prevGiftboxes) => {
          // Check if last giftbox is far enough
          if (prevGiftboxes.length > 0) {
            const lastGiftbox = prevGiftboxes[prevGiftboxes.length - 1];
            const currentScale = Math.min(gameWidth / REFERENCE_WIDTH, gameHeight / REFERENCE_HEIGHT);
            const minDistance = 300 * currentScale; // Minimum distance between giftboxes
            if (lastGiftbox.x > gameWidth - minDistance) {
              return prevGiftboxes; // Don't spawn yet
            }
          }
          
          // Simple random Y position without collision checking
          const currentScale = Math.min(gameWidth / REFERENCE_WIDTH, gameHeight / REFERENCE_HEIGHT);
          const giftboxGroundHeight = 80 * currentScale;
          const safeZoneTop = 100 * currentScale; // Avoid top area
          const safeZoneBottom = gameHeight - giftboxGroundHeight - (150 * currentScale); // Avoid ground area
          
          // Random Y position
          const randomY = safeZoneTop + Math.random() * (safeZoneBottom - safeZoneTop);
          
          return [
            ...prevGiftboxes,
            {
              id: Date.now() + Math.random(),
              x: gameWidth,
              initialY: randomY,
              animationOffset: Math.random() * Math.PI * 2,
            },
          ];
        });
      };
      /**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
      // Spawn giftbox every 3-5 seconds randomly
      const scheduleNextGiftbox = () => {
        const delay = 3000 + Math.random() * 2000; // 3-5 seconds
        const giftboxTimer = setTimeout(() => {
          if (gameStarted && !gameOver) {
            spawnGiftbox();
            scheduleNextGiftbox();
          }
        }, delay);
        
        return giftboxTimer;
      };
      
      const timer = scheduleNextGiftbox();
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [gameStarted, gameOver, gameWidth, gameHeight]);
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
  // Generate decorations (similar to pipes)
  useEffect(() => {
    // Temporarily disabled decorations
    /*
    if (gameStarted && !gameOver) {
      const generateDecor = () => {
        // 60% chance to spawn a decor
        if (Math.random() < 0.6) {
          // Random type: 1 (48x96) or 2 (152x96)
          const decorType = Math.random() < 0.5 ? 1 : 2;
          
          // Check if there's enough space from last decor and pipes
          setDecors((prev) => {
            // Check distance from last decor
            const lastDecor = prev[prev.length - 1];
            const minDecorDistance = 150;
            
            if (lastDecor && (gameWidth - lastDecor.x) < minDecorDistance) {
              return prev; // Too close to last decor
            }
            
            // Check collision with pipes/trees
            const minTreeDistance = 20;
            const treeWidthEstimate = 200;
            
            const tooCloseToTree = pipes.some(pipe => {
              const pipeLeft = pipe.x;
              const treeLeft = pipeLeft;
              const treeRight = pipeLeft + treeWidthEstimate;
              
              const decorLeft = gameWidth;
              const decorRight = gameWidth + 200;
              
              return (
                (decorLeft < treeRight + minTreeDistance && decorRight > treeLeft - minTreeDistance)
              );
            });
            
            if (tooCloseToTree) {
              return prev;
            }
            
            return [
              ...prev,
              {
                id: Date.now() + Math.random(),
                x: gameWidth,
                type: decorType,
              },
            ];
          });
        }
      };

      // Generate decors - less frequently on mobile for performance
      const scheduleNextDecor = () => {
        const delay = isMobile 
          ? Math.random() * 1400 + 1000  // 1-2.4s on mobile (less frequent)
          : Math.random() * 700 + 500;   // 0.5-1.2s on desktop
        decorTimerRef.current = setTimeout(() => {
          if (gameStarted && !gameOver) {
            generateDecor();
            scheduleNextDecor();
          }
        }, delay);
      };
      scheduleNextDecor();

      return () => {
        if (decorTimerRef.current) {
          clearTimeout(decorTimerRef.current);
        }
      };
    }
    */
  }, [gameStarted, gameOver, gameWidth]);
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
  // Generate gifts (disabled on mobile for performance)
  useEffect(() => {
    if (gameStarted && !gameOver && !isMobile) {
      const dropGift = () => {
        const currentScale = Math.min(gameWidth / REFERENCE_WIDTH, gameHeight / REFERENCE_HEIGHT);
        const santaLeft = gameWidth * 0.15;
        const giftSpriteIndex = Math.floor(Math.random() * 8); // Random gift from 0-7
        const currentSantaSize = BASE_SANTA_SIZE * currentScale;
        const currentGiftSize = BASE_GIFT_SIZE * currentScale;
        
        const newGift = {
          id: Date.now() + Math.random(), // Ensure unique ID
          x: santaLeft + currentSantaSize / 2 - currentGiftSize / 2, // Center under Santa
          y: santaYRef.current + currentSantaSize, // Use ref to get current Santa Y position
          spriteIndex: giftSpriteIndex,
          velocityY: 0,
          isBreaking: false,
          breakingTime: 0, // Track how long it's been breaking
        };
        
        setGifts((prev) => [...prev, newGift]);
      };

      // Start dropping gifts after a short delay
      const giftInterval = GIFT_DROP_INTERVAL;
      const initialDelay = setTimeout(() => {
        dropGift();
        giftTimerRef.current = setInterval(dropGift, giftInterval);
      }, 1000);

      return () => {
        clearTimeout(initialDelay);
        if (giftTimerRef.current) {
          clearInterval(giftTimerRef.current);
        }
      };
    }
  }, [gameStarted, gameOver, gameWidth]);
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
  // Game loop - optimized for mobile performance
  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Use requestAnimationFrame for better performance
      // Target 60 FPS for all devices (mobile can handle it with optimizations)
      let animationFrameId = null;
      let lastTime = performance.now();
      
      const gameLoop = (currentTime) => {
        const deltaTime = currentTime - lastTime;
        
        // Run at 30 FPS on mobile for better performance, 60 FPS on desktop
        const targetFrameTime = 16.67; // 30fps vs 60fps
        if (deltaTime >= targetFrameTime) {
          lastTime = currentTime;
          
          // Calculate speed multiplier for consistent physics
          const speedMultiplier = deltaTime / targetFrameTime;
          
          // Get current positions for collision detection
          const currentSantaY = santaYRef.current;
          const santaLeftPos = gameWidth * 0.15;
          
          // Calculate scaled sizes based on current game dimensions
          const currentScale = Math.min(gameWidth / REFERENCE_WIDTH, gameHeight / REFERENCE_HEIGHT);
          const currentSantaSize = BASE_SANTA_SIZE * currentScale;
          const currentPipeWidth = BASE_PIPE_WIDTH * currentScale;
          const currentGiftSize = BASE_GIFT_SIZE * currentScale;
          /**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
          // Scale pipe speed to maintain consistent relative speed across all screen sizes
          const scaledPipeSpeed = PIPE_SPEED * currentScale;
          
          // Scale physics values to maintain consistent gameplay across all screen sizes
          const scaledGravity = GRAVITY * currentScale;
          const scaledGiftGravity = GIFT_GRAVITY * currentScale;
          
          // Scale ground height proportionally
          const BASE_GROUND_HEIGHT = 80;
          const groundHeight = BASE_GROUND_HEIGHT * currentScale;
        
          // Hitbox padding scales proportionally
          const hitboxPaddingLeft = BASE_SANTA_HITBOX_PADDING * currentScale;
          const hitboxPaddingRight = (BASE_SANTA_HITBOX_PADDING / 2) * currentScale;
          const hitboxPaddingTop = BASE_SANTA_HITBOX_PADDING * currentScale;
          const hitboxPaddingBottom = (BASE_SANTA_HITBOX_PADDING / 2) * currentScale;
          
          const santaLeft = santaLeftPos + hitboxPaddingLeft;
          const santaRight = santaLeftPos + currentSantaSize - hitboxPaddingRight;
          const santaTop = currentSantaY + hitboxPaddingTop;
          const santaBottom = currentSantaY + currentSantaSize - hitboxPaddingBottom;

          // Update santa position
          setSantaY((y) => {
          const newY = y + (santaVelocity * speedMultiplier);
          const groundLevel = gameHeight - groundHeight;
          
          // Calculate Santa's bottom position with hitbox padding
          const santaBottomEdge = newY + currentSantaSize - hitboxPaddingBottom;
          
          // Check ground collision using hitbox
          if (santaBottomEdge >= groundLevel) {
            if (!isDead) {
              playSound('hit');
              setTimeout(() => playSound('die'), 100);
              setIsDead(true);
            }
            // Stop at ground level and trigger game over
            if (!gameOver) {
              setTimeout(() => setGameOver(true), 500);
            }/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
            // Return position where bottom of hitbox touches ground
            return groundLevel - currentSantaSize + hitboxPaddingBottom;
          }
          
          // Check ceiling collision using hitbox
          const santaTopEdge = newY + hitboxPaddingTop;
          
          if (santaTopEdge < 0) {
            if (!isDead) {
              playSound('hit');
              setTimeout(() => playSound('die'), 100);
              setIsDead(true);
            }
            return -hitboxPaddingTop;
          }
          
            return newY;
          });

          // Update santa velocity
          // Stop applying gravity when at ground level
          // groundHeight already calculated above
          const groundLevelForVelocity = gameHeight - groundHeight;
          const santaBottomEdgeForVelocity = santaY + currentSantaSize - hitboxPaddingBottom;
          
          if (isDead && santaBottomEdgeForVelocity < groundLevelForVelocity) {
            setSantaVelocity((v) => v + (scaledGravity * speedMultiplier));
          } else if (!isDead && santaBottomEdgeForVelocity < groundLevelForVelocity) {
            setSantaVelocity((v) => v + (scaledGravity * speedMultiplier));
          } else {
            // At ground, stop velocity
            setSantaVelocity(0);
          }
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
          // Update rotation based on velocity (handle death spin)
          if (isDead) {
            // Continuous spin when dead
            setRotation((r) => r + 10);
          } else {
            const newRotation = Math.min(Math.max(santaVelocity * 5, -45), 45);
            setRotation(newRotation);
          }

          // Update pipes position and check collision
          // Remove pipes that are far off-screen to reduce memory usage
          setPipes((prevPipes) => {
          const updatedPipes = prevPipes
            .map((pipe) => ({
              ...pipe,
              x: pipe.x - (scaledPipeSpeed * speedMultiplier),
            }))
            .filter((pipe) => {
              const currentScale = Math.min(gameWidth / REFERENCE_WIDTH, gameHeight / REFERENCE_HEIGHT);
              return pipe.x > -BASE_PIPE_WIDTH * currentScale * 2;
            }); // Keep slightly more for smooth transitions

          // Check collision and scoring with each pipe
          updatedPipes.forEach((pipe) => {
            const pipeLeft = pipe.x;
            const pipeRight = pipe.x + currentPipeWidth;

            // Check if santa passed the pipe for scoring
            // Use center of Santa instead of right edge for more reliable scoring
            const santaCenter = santaLeftPos + currentSantaSize / 2;
            if (!scoredPipesRef.current.has(pipe.id) && santaCenter > pipeRight) {
              scoredPipesRef.current.add(pipe.id);
              pipesPassedRef.current += 1;
              playSound('point');
              const newScore = pipesPassedRef.current + giftsReceivedRef.current;
              // Score = pipesPassed + giftsReceived
              setScore(newScore);
              
              // Gửi pipe_passed action lên server real-time
              if (vmoId && vmoId.trim() !== '' && gameSessionIdRef.current) {
                // console.log('[App] Sending pipe_passed:', {
                //   vmoId,
                //   sessionId: gameSessionIdRef.current,
                //   pipesPassed: pipesPassedRef.current
                // });
                submitPipePassed(vmoId, gameSessionIdRef.current).catch(err => {
                  // console.error('[App] Error sending pipe_passed:', err);
                });
              } else {
                // console.warn('[App] Cannot send pipe_passed:', {
                //   hasVmoId: !!vmoId,
                //   hasSessionId: !!gameSessionIdRef.current
                // });
              }
            }
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
            // Check collision with top pipe
            if (santaRight > pipeLeft && santaLeft < pipeRight) {
              if (santaTop < pipe.topHeight) {
                if (!isDead) {
                  playSound('hit');
                  setTimeout(() => playSound('die'), 100);
                  setIsDead(true);
                }
              }
            }
            
            // Check collision with Christmas tree (bottom obstacle)
            // Use currentScale and groundHeight already calculated above
            const baseTreeHeights = { small: 200, medium: 300, large: 400 };
            const treeHeight = baseTreeHeights[pipe.treeSize] * currentScale;
            const treeHitboxHeightReduction = 0; // No reduction - full height hitbox
            
            // Convert tree position to top-down coordinates
            // Tree is positioned from bottom, so treeTop (in top-down coords) = gameHeight - groundHeight - treeHeight
            const treeTopY = gameHeight - groundHeight - treeHeight + treeHitboxHeightReduction;
            const treeBottomY = gameHeight - groundHeight;
            
            // Tree collision: Santa overlaps with tree area
            // Use full width hitbox
            const treeHitboxPadding = 0; // Full width hitbox
            if (santaRight > (pipeLeft + treeHitboxPadding) && santaLeft < (pipeRight - treeHitboxPadding)) {
              // Check if any part of Santa is inside the tree (using top-down Y coordinates)
              if (santaBottom > treeTopY && santaTop < treeBottomY) {
                if (!isDead) {
                  playSound('hit');
                  setTimeout(() => playSound('die'), 100);
                  setIsDead(true);
                }
              }
            }
          });

            return updatedPipes;
          });
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
          // Update floating giftboxes position and check collision
          setFloatingGiftboxes((prevGiftboxes) => {
            // Use same hitbox as main collision detection
            const giftboxSantaLeft = santaLeft;
            const giftboxSantaRight = santaRight;
            const giftboxSantaTop = santaTop;
            const giftboxSantaBottom = santaBottom;
            
            return prevGiftboxes
              .map((giftbox) => {
                // Nếu giftbox đã được collect (có trong Set hoặc có flag collected), remove ngay
                if (giftbox.collected || collectedGiftboxesRef.current.has(giftbox.id)) {
                  return null;
                }
                
                const newGiftbox = {
                  ...giftbox,
                  x: giftbox.x - (scaledPipeSpeed * speedMultiplier),
                };
                
                // Check collision with Santa - đảm bảo chỉ collect một lần bằng Set
                if (!isDead) {
                  // currentScale already calculated above
                  const giftboxSize = 60 * currentScale; // Scale giftbox size
                  const giftboxLeft = giftbox.x;
                  const giftboxRight = giftbox.x + giftboxSize;
                  const giftboxTop = giftbox.initialY;
                  const giftboxBottom = giftbox.initialY + giftboxSize;
                  
                  const collision = 
                    giftboxSantaRight > giftboxLeft &&
                    giftboxSantaLeft < giftboxRight &&
                    giftboxSantaBottom > giftboxTop &&
                    giftboxSantaTop < giftboxBottom;
                  
                  if (collision) {
                    // Đánh dấu ngay lập tức để tránh collect nhiều lần
                    collectedGiftboxesRef.current.add(giftbox.id);
                    
                    // Collect giftbox - đảm bảo chỉ collect một lần
                    playSound('point');
                    giftsReceivedRef.current += 1;
                    const newScore = pipesPassedRef.current + giftsReceivedRef.current;
                    // Score = pipesPassed + giftsReceived
                    setScore(newScore); 
                    
                    // Gửi gift_collected action lên server real-time
                    if (vmoId && vmoId.trim() !== '' && gameSessionIdRef.current) {
                      // console.log('[App] Sending gift_collected:', {
                      //   vmoId,
                      //   sessionId: gameSessionIdRef.current,
                      //   giftsReceived: giftsReceivedRef.current
                      // });
                      submitGiftCollected(vmoId, gameSessionIdRef.current).catch(err => {
                        // console.error('[App] Error sending gift_collected:', err);
                      });
                    } else {
                      // console.warn('[App] Cannot send gift_collected:', {
                      //   hasVmoId: !!vmoId,
                      //   hasSessionId: !!gameSessionIdRef.current
                      // });
                    }
                    
                    // Return null để remove khỏi array
                    return null;
                  }
                }
                
                return newGiftbox;
              })
              .filter((giftbox) => giftbox && giftbox.x > -100); // Remove when off screen or collected
          });
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
          // Update decorations position (only on desktop)
          if (!isMobile) {
            setDecors((prevDecors) => {
            return prevDecors
              .map((decor) => ({
                ...decor,
                x: decor.x - (scaledPipeSpeed * speedMultiplier),
              }))
              .filter((decor) => decor.x > -200); // Remove when off screen
            });
          }

          // Update gifts position (skip on mobile since gifts are disabled)
          if (!isMobile) {
          setGifts((prevGifts) => {
          const updatedGifts = prevGifts.map((gift) => {
            let newVelocityY = gift.velocityY + (scaledGiftGravity * speedMultiplier);
            let newY = gift.y + (newVelocityY * speedMultiplier);
            let isBreaking = gift.isBreaking; // Keep existing breaking state
            let breakingTime = gift.breakingTime || 0;

            // Only check collision if not already breaking
            if (!isBreaking) {
              // Check collision with pipes
              pipes.forEach((pipe) => {
                const giftLeft = gift.x;
                  const giftRight = gift.x + currentGiftSize;
                const giftTop = newY;
                  const giftBottom = newY + currentGiftSize;

                const pipeLeft = pipe.x;
                const pipeRight = pipe.x + currentPipeWidth;

                // Check if gift overlaps with pipe horizontally
                if (giftRight > pipeLeft && giftLeft < pipeRight) {
                  // Check if gift hits top or bottom pipe
                  if (giftTop < pipe.topHeight || giftBottom > pipe.topHeight + pipeGap) {
                    isBreaking = true;
                  }
                }
              });
            }
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
            // If breaking, stop falling and increment breaking time
            if (isBreaking) {
              breakingTime += 1;
              newVelocityY = 0; // Stop falling
              newY = gift.y; // Keep position
            }

            return {
              ...gift,
              y: newY,
              velocityY: newVelocityY,
              isBreaking: isBreaking,
              breakingTime: breakingTime,
            };
          });

          // Remove gifts that have been breaking for too long (30 frames = 0.5 seconds) or are off screen
          return updatedGifts.filter((gift) => {
            if (gift.isBreaking && gift.breakingTime > 30) {
              return false; // Remove after breaking animation
            }
            return gift.y < gameHeight + 100; // Allow some overflow
          });
          });
          }

          // Update smoke animations (only on desktop)
          if (!isMobile) {
            setSmokes((prevSmokes) => {
            const now = Date.now();
            return prevSmokes
              .map((smoke) => {
                const elapsed = now - smoke.createdAt;
                const frame = Math.floor(elapsed / 50); // 50ms per frame
                return {
                  ...smoke,
                  frame: frame,
                };
              })
              .filter((smoke) => smoke.frame < 7); // Remove after 7 frames
            });
          }
        }
        /**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
        // Continue animation loop
        animationFrameId = requestAnimationFrame(gameLoop);
      };
      
      // Start the animation loop
      animationFrameId = requestAnimationFrame(gameLoop);
      gameLoopRef.current = animationFrameId;

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }
  }, [gameStarted, gameOver, santaVelocity, santaY, gameHeight, gameWidth, isDead, isMobile, pipeGap, playSound]);

  const handlePlay = () => {
    setShowMainMenu(false);
    // Music already playing from loading screen
    // Start game directly, don't show intro again
  };

  const handleLeaderboard = () => {
    setShowMainMenu(false);
    setShowLeaderboard(true);
  };

  const handleCredits = () => {
    setShowMainMenu(false);
    setShowCredits(true);
  };
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
  // Filter objects in viewport for better performance (only render visible objects)
  // Use larger margins to avoid recalculation overhead
  const visiblePipes = useMemo(() => {
    const viewportMargin = 300; // Increased from 200
    return pipes.filter((pipe) => pipe.x > -viewportMargin && pipe.x < gameWidth + viewportMargin);
  }, [pipes, gameWidth]);

  const visibleGifts = useMemo(() => {
    const viewportMargin = 150; // Increased from 100
    return gifts.filter((gift) => 
      gift.x > -viewportMargin && gift.x < gameWidth + viewportMargin && gift.y < gameHeight + viewportMargin
    );
  }, [gifts, gameWidth, gameHeight]);

  const visibleFloatingGiftboxes = useMemo(() => {
    const viewportMargin = 250; // Increased from 200
    return floatingGiftboxes.filter((giftbox) => 
      giftbox.x > -viewportMargin && giftbox.x < gameWidth + viewportMargin
    );
  }, [floatingGiftboxes, gameWidth]);

  const visibleDecors = useMemo(() => {
    if (isMobile) return [];
    return decors.filter((decor) => decor.x > -200 && decor.x < gameWidth + 200);
  }, [decors, gameWidth, isMobile]);

  // Snow overlay for in-game window (disabled on mobile for performance)
  const snowflakes = useMemo(() => (
    isMobile ? [] : [...Array(25)].map(() => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${8 + Math.random() * 6}s`,
      sway: `${4 + Math.random() * 4}s`,
      drift: `${-8 + Math.random() * 16}px`,
      size: `8px`,
      opacity: 0.6 + Math.random() * 0.4,
    }))
  ), [isMobile]);
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
  // Set CSS variables on document root for all components to use
  useEffect(() => {
    document.documentElement.style.setProperty('--scale', scale);
    document.documentElement.style.setProperty('--game-scale', scale);
    document.documentElement.style.setProperty('--game-scale-x', scaleX);
    document.documentElement.style.setProperty('--game-scale-y', scaleY);
    document.documentElement.style.setProperty('--game-width', `${gameWidth}px`);
    document.documentElement.style.setProperty('--game-height', `${gameHeight}px`);
    document.documentElement.style.setProperty('--reference-width', `${REFERENCE_WIDTH}px`);
    document.documentElement.style.setProperty('--reference-height', `${REFERENCE_HEIGHT}px`);
  }, [scale, scaleX, scaleY, gameWidth, gameHeight]);

  // Keep background music playing continuously (no pause on game over)

  // Chặn nếu ngoài khung giờ cho phép
  // Mobile: chỉ chơi được trong khung giờ đặc biệt (09:00-09:15)
  // Desktop: chỉ chơi được trong khung giờ (11:00-15:00)
  if (!isDeviceAllowed) {
    if (isMobileDevice && !isMobileAllowed) {
      // Mobile ngoài khung giờ đặc biệt
      return <MobileBlock />;
    } else if (!isMobileDevice && !isDesktopAllowed) {
      // Desktop ngoài khung giờ
      return <TimeBlock isMobileDevice={false} />;
    }
  }

  return (
    <div 
      style={{
        '--scale': scale,
        '--scale-x': scaleX,
        '--scale-y': scaleY,
        '--game-width': `${gameWidth}px`,
        '--game-height': `${gameHeight}px`,
      }}
    >
      {/* Global branch logo for non-game screens */}
      {(showLoading || showIntro || showEnterID || showMainMenu) && (
      <img
        src="/assets/branch.png"
        alt="Branch logo"
          className="branch-logo-global"
      />
      )}

      {showLeaderboard && (
        <LeaderboardOverlay 
          entries={leaderboard} 
          onClose={() => setShowLeaderboard(false)} 
        />
      )}

      {showLoading && <LoadingScreen onComplete={() => {
        setShowLoading(false);
        setShowEnterID(true);
      }} />}

      {/* MainMenu removed as requested */}
      {/* {showMainMenu && (
        <MainMenu 
          onPlay={handlePlay}
          onLeaderboard={handleLeaderboard}
          onCredits={handleCredits}
        />
      )} */}

      {showIntro && <Intro onComplete={() => {
        setShowIntro(false);
        // Skip main menu, game starts directly after intro
      }} />}

      {showEnterID && <EnterID 
        onSubmit={(id) => {
          setVmoId(id);
          setShowEnterID(false);
          setShowIntro(true);
        }} 
        onCancel={() => {
          setShowEnterID(false);
          setShowIntro(true);
        }}
      />}
      
      <div className="game-wrapper">
        <div 
          className={`game-container ${showLoading || showIntro || showEnterID || showMainMenu ? 'intro-active' : ''}`} 
          ref={gameContainerRef}
          style={{
            '--scale': scale,
            '--scale-x': scaleX,
            '--scale-y': scaleY,
            '--game-width': `${gameWidth}px`,
            '--game-height': `${gameHeight}px`,
            width: `${gameWidth}px`,
            height: `${gameHeight}px`,
          }}
        >
        {/* Branch logo anchored to game window only during play */}
        <img
          src="/assets/branch.png"
          alt="Branch logo"
          className="branch-logo-game"
        />

        {/* Music toggle button - only show when not actively playing game */}
        {(showLoading || showIntro || showEnterID || showMainMenu || !gameStarted) && (
          <>
            <button
              className="music-toggle-btn"
              onClick={handleMusicToggle}
              aria-label={isMusicOn ? 'Turn off music' : 'Turn on music'}
              title={isMusicOn ? 'Turn off music' : 'Turn on music'}
            >
              <img 
                src={isMusicOn ? '/assets/music_on.png' : '/assets/music_off.png'} 
                alt={isMusicOn ? 'Music on' : 'Music off'} 
              />
            </button>

            {/* Leaderboard button */}
            <button
              className="leaderboard-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowLeaderboard(true);
              }}
              aria-label="Show leaderboard"
              title="Show leaderboard"
            >
              <img 
                src="/assets/glass.png" 
                alt="Leaderboard" 
              />
            </button>
          </>
        )}

        {/* Snow overlay only during gameplay window */}
        {!(showLoading || showIntro || showEnterID || showMainMenu) && (
          <div className="game-snowflakes">
            {snowflakes.map((flake, i) => (
              <div
                key={i}
                className="game-snowflake"
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
        )}

        {/* Dark overlay when game over */}
        {gameOver && !showLeaderboard && (
          <div className="game-over-darken" />
        )}

        <Score 
          score={score} 
          highScore={highScore}
          gameStarted={gameStarted}
          gameOver={gameOver && !showLeaderboard}
          onRetry={resetGame}
          onShowLeaderboard={() => setShowLeaderboard(true)}
          gameExpired={gameExpired}
        />
        
        <Santa santaY={santaY} rotation={rotation} isDead={isDead} />
      
      {/* Only render pipes in viewport for better performance */}
      {visiblePipes.map((pipe) => (
        <React.Fragment key={pipe.id}>
          <PipePair
            pipeX={pipe.x}
            topPipeHeight={pipe.topHeight}
            gap={pipeGap}
            gameHeight={gameHeight}
          />
          <ChristmasTree
            treeX={pipe.x}
            gap={pipeGap}
            gameHeight={gameHeight}
            type={pipe.treeType}
            size={pipe.treeSize}
          />
        </React.Fragment>
      ))}

      {/* Floating giftboxes - disabled on mobile */}
      {visibleFloatingGiftboxes.map((giftbox) => (
        <FloatingGiftbox
          key={giftbox.id}
          x={giftbox.x}
          y={giftbox.initialY}
        />
      ))}

      {/* Only render gifts in viewport */}
      {visibleGifts.map((gift) => (
        <Gift
          key={gift.id}
          giftX={gift.x}
          giftY={gift.y}
          spriteIndex={gift.spriteIndex}
          isBreaking={gift.isBreaking}
        />
      ))}

      {/* Smoke effects - disabled on mobile */}
      {!isMobile && smokes.map((smoke) => (
        <Smoke
          key={smoke.id}
          x={smoke.x}
          y={smoke.y}
          frame={smoke.frame}
        />
      ))}

      {/* Decorations - disabled on mobile for performance */}
      {visibleDecors.map((decor) => (
        <Decor
          key={decor.id}
          x={decor.x}
          gameHeight={gameHeight}
          type={decor.type}
        />
      ))}

      <Ground gameWidth={gameWidth} gameStarted={gameStarted} gameOver={gameOver} />
        </div>
      </div>
    </div>
  );
}

export default App;
/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/