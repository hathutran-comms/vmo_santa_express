/**
 * CLIENT EXAMPLE - Cách gọi Cloud Function submitAction
 * 
 * File này là ví dụ về cách tích hợp Cloud Function vào client code
 * Copy logic này vào file firebaseService.js hoặc App.jsx của bạn
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { ensureAnonymousAuth } from './src/firebase';

/**
 * Gửi action lên Cloud Function để tính điểm
 * 
 * @param {string} vmoId - VMO ID của người chơi
 * @param {Object} action - Action object
 * @param {string} action.type - Loại action: 'pipe_passed', 'gift_collected', 'game_over'
 * @param {number} action.timestamp - Timestamp của action
 * @param {number} [action.pipesPassed] - Số pipes đã pass (chỉ khi game_over)
 * @param {number} [action.giftsReceived] - Số gifts đã nhận (chỉ khi game_over)
 * @param {number} [action.playTimeSeconds] - Thời gian chơi tính bằng giây (chỉ khi game_over)
 * @returns {Promise<{success: boolean, score: number}>}
 */
export const submitActionToServer = async (vmoId, action) => {
  try {
    // Đảm bảo đã đăng nhập anonymous
    await ensureAnonymousAuth();

    // Lấy Cloud Functions instance
    const functions = getFunctions();
    const submitAction = httpsCallable(functions, 'submitAction');

    // Gọi Cloud Function
    const result = await submitAction({
      vmoId: vmoId,
      action: action
    });

    const data = result.data;
    
    if (data.success) {
      return {
        success: true,
        score: data.score,
        message: data.message
      };
    } else {
      return {
        success: false,
        error: data.error || 'Unknown error'
      };
    }
  } catch (error) {
    console.error('Error calling submitAction:', error);
    
    // Xử lý các loại lỗi từ Cloud Function
    if (error.code === 'unauthenticated') {
      return {
        success: false,
        error: 'User must be authenticated'
      };
    } else if (error.code === 'invalid-argument') {
      return {
        success: false,
        error: error.message || 'Invalid action format'
      };
    } else if (error.code === 'resource-exhausted') {
      return {
        success: false,
        error: 'Too many requests. Please try again later.'
      };
    } else {
      return {
        success: false,
        error: error.message || 'Failed to submit action'
      };
    }
  }
};

/**
 * Ví dụ sử dụng trong game:
 */

// Ví dụ 1: Khi pass một pipe
export const onPipePassed = async (vmoId) => {
  const action = {
    type: 'pipe_passed',
    timestamp: Date.now()
  };
  
  const result = await submitActionToServer(vmoId, action);
  console.log('Pipe passed:', result);
};

// Ví dụ 2: Khi collect một gift
export const onGiftCollected = async (vmoId) => {
  const action = {
    type: 'gift_collected',
    timestamp: Date.now()
  };
  
  const result = await submitActionToServer(vmoId, action);
  console.log('Gift collected:', result);
};

// Ví dụ 3: Khi game over - GỬI ĐIỂM CUỐI CÙNG
export const onGameOver = async (vmoId, pipesPassed, giftsReceived, playTimeSeconds) => {
  const action = {
    type: 'game_over',
    timestamp: Date.now(),
    pipesPassed: pipesPassed,
    giftsReceived: giftsReceived,
    playTimeSeconds: playTimeSeconds
  };
  
  const result = await submitActionToServer(vmoId, action);
  
  if (result.success) {
    console.log('Game over - Final score:', result.score);
    return result.score; // Trả về điểm từ server
  } else {
    console.error('Failed to submit game over:', result.error);
    return null;
  }
};

/**
 * Tích hợp vào App.jsx:
 * 
 * Thay thế đoạn code này trong useEffect khi gameOver:
 * 
 * // CŨ (không an toàn):
 * savePlayerScore(vmoId, score, gameState)
 * 
 * // MỚI (an toàn):
 * const finalScore = await onGameOver(
 *   vmoId,
 *   pipesPassedRef.current,
 *   giftsReceivedRef.current,
 *   Math.floor((Date.now() - gameStartTimeRef.current) / 1000)
 * );
 * 
 * if (finalScore !== null) {
 *   setScore(finalScore); // Cập nhật score từ server
 *   loadLeaderboard();
 * }
 */

