import { collection, doc, getDoc, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, ensureAnonymousAuth, functions } from '../firebase';
import { validateVmoId } from '../utils/security';

const LEADERBOARD_COLLECTION = 'leaderboard2';

/**
 * Gửi action lên Cloud Function để tính điểm (CHỐNG GIAN LẬN - REAL-TIME TRACKING)
 * Client gửi từng action khi xảy ra, server đếm và validate
 * 
 * @param {string} vmoId - VMO ID của người chơi
 * @param {string} sessionId - Session ID của game (để group actions)
 * @param {Object} action - Action object
 * @param {string} action.type - Loại action: 'pipe_passed', 'gift_collected', 'game_start', 'game_over'
 * @param {number} action.timestamp - Timestamp của action
 * @param {number} [action.playTimeSeconds] - Thời gian chơi tính bằng giây (chỉ khi game_over)
 * @returns {Promise<{success: boolean, score?: number, error?: string}>}
 */
const submitActionToServer = async (vmoId, sessionId, action) => {
  // console.log('[CLIENT] submitActionToServer - START', {
  //   vmoId,
  //   sessionId,
  //   actionType: action?.type,
  //   timestamp: action?.timestamp
  // });

  try {
    // Đảm bảo đã đăng nhập anonymous
    // console.log('[CLIENT] Ensuring anonymous auth...');
  await ensureAnonymousAuth();
    // console.log('[CLIENT] Anonymous auth successful');

  // Validate VMO ID
    // console.log('[CLIENT] Validating VMO ID:', vmoId);
  const sanitizedVmoId = validateVmoId(vmoId);
  if (!sanitizedVmoId) {
      // console.error('[CLIENT] Invalid VMO ID:', vmoId);
    return { success: false, error: 'Invalid VMO ID' };
  }
    // console.log('[CLIENT] VMO ID validated:', sanitizedVmoId);

    // Validate sessionId
    if (!sessionId || typeof sessionId !== 'string') {
      // console.error('[CLIENT] Invalid sessionId:', sessionId);
      return { success: false, error: 'Invalid sessionId' };
  }

    // Lấy Cloud Function
    // console.log('[CLIENT] Getting Cloud Function submitAction...');
    const submitAction = httpsCallable(functions, 'submitAction');

    // Gọi Cloud Function
    const requestData = {
      vmoId: sanitizedVmoId,
      sessionId: sessionId,
      action: action
    };
    // console.log('[CLIENT] Calling Cloud Function with data:', requestData);
    
    const result = await submitAction(requestData);
    // console.log('[CLIENT] Cloud Function response:', result.data);

    const data = result.data;
    
    if (data.success) {
      // console.log('[CLIENT] ✅ Success! Score from server:', data.score);
      return {
        success: true,
        score: data.score,
        message: data.message,
        pipesCount: data.pipesCount,
        giftsCount: data.giftsCount
      };
    } else {
      // console.error('[CLIENT] ❌ Function returned error:', data.error);
      return {
        success: false,
        error: data.error || 'Unknown error'
      };
    }
  } catch (error) {
    // console.error('[CLIENT] ❌ Error calling submitAction:', {
    //   code: error.code,
    //   message: error.message,
    //   details: error.details,
    //   stack: error.stack
    // });
    
    // Xử lý các loại lỗi từ Cloud Function
    if (error.code === 'unauthenticated') {
      // console.error('[CLIENT] Authentication error');
      return {
        success: false,
        error: 'User must be authenticated'
      };
    } else if (error.code === 'invalid-argument') {
      // console.error('[CLIENT] Invalid argument:', error.message);
      return {
        success: false,
        error: error.message || 'Invalid action format'
      };
    } else if (error.code === 'resource-exhausted') {
      // console.error('[CLIENT] Rate limit exceeded');
      return {
        success: false,
        error: 'Too many requests. Please try again later.'
      };
    } else if (error.code === 'permission-denied') {
      // console.error('[CLIENT] Permission denied:', error.message);
      return {
        success: false,
        error: error.message || 'Permission denied'
      };
    } else {
      // console.error('[CLIENT] Unknown error:', error);
      return {
        success: false,
        error: error.message || 'Failed to submit action'
      };
    }
  }
};

/**
 * Gửi action real-time khi pipe được pass
 * Server sẽ đếm và validate action này
 * 
 * @param {string} vmoId - ID của người chơi
 * @param {string} sessionId - Session ID của game
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const submitPipePassed = async (vmoId, sessionId) => {
  const action = {
    type: 'pipe_passed',
    timestamp: Date.now()
  };
  
  return await submitActionToServer(vmoId, sessionId, action);
      };
      
/**
 * Gửi action real-time khi gift được collect
 * Server sẽ đếm và validate action này
 * 
 * @param {string} vmoId - ID của người chơi
 * @param {string} sessionId - Session ID của game
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const submitGiftCollected = async (vmoId, sessionId) => {
  const action = {
    type: 'gift_collected',
    timestamp: Date.now()
  };
  
  return await submitActionToServer(vmoId, sessionId, action);
      };
      
/**
 * Gửi action khi game bắt đầu (để tạo session)
 * 
 * @param {string} vmoId - ID của người chơi
 * @param {string} sessionId - Session ID của game
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const submitGameStart = async (vmoId, sessionId) => {
  const action = {
    type: 'game_start',
    timestamp: Date.now()
  };
  
  return await submitActionToServer(vmoId, sessionId, action);
};

/**
 * Lưu điểm khi game over - REAL-TIME TRACKING VERSION
 * Server sẽ tổng hợp từ các actions đã nhận được trong session
 * 
 * @param {string} vmoId - ID của người chơi
 * @param {string} sessionId - Session ID của game
 * @param {number} playTimeSeconds - Thời gian chơi (giây)
 * @returns {Promise<{success: boolean, score?: number, error?: string}>}
 */
export const savePlayerScore = async (vmoId, sessionId, playTimeSeconds = 0) => {
  const action = {
    type: 'game_over',
    timestamp: Date.now(),
    playTimeSeconds: Math.max(0, Math.floor(playTimeSeconds))
  };
  
  return await submitActionToServer(vmoId, sessionId, action);
};

/**
 * Lấy điểm cao nhất của một người chơi từ Firebase
 * @param {string} vmoId - VMO ID của người chơi
 * @returns {Promise<number>} Điểm cao nhất hoặc 0 nếu không có
 */
export const getPlayerHighScore = async (vmoId) => {
  try {
    const sanitizedVmoId = validateVmoId(vmoId);
    if (!sanitizedVmoId) {
      return 0;
    }

    const playerDocRef = doc(db, LEADERBOARD_COLLECTION, sanitizedVmoId);
    const docSnap = await getDoc(playerDocRef);
    
    if (!docSnap.exists()) {
      return 0;
    }
    
    const data = docSnap.data();
    return data?.score || 0;
  } catch (error) {
    return 0;
  }
};

/**
 * Lấy top 10 người chơi điểm cao nhất
 * @returns {Promise<Array>} Mảng các entry leaderboard
 */
export const getTop10Leaderboard = async () => {
  try {
    const leaderboardRef = collection(db, LEADERBOARD_COLLECTION);
    const q = query(leaderboardRef, orderBy('score', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    // Chuyển đổi snapshot thành mảng
    const entries = [];
    querySnapshot.forEach((doc) => {
      const entry = doc.data();
      // Validate và sanitize dữ liệu
      const score = typeof entry.score === 'number' && entry.score >= 0 && entry.score <= 10000 
        ? Math.floor(entry.score) 
        : 0;
      const vmoId = typeof entry.vmoId === 'string' && entry.vmoId.length <= 10
        ? entry.vmoId.slice(0, 10)
        : doc.id.slice(0, 10);
      
      if (score > 0) { // Chỉ lấy entries có điểm hợp lệ
        entries.push({
          id: doc.id,
          vmoId: vmoId,
          score: score
        });
      }
    });
    
    return entries;
  } catch (error) {
    return [];
  }
};

/**
 * Lắng nghe thay đổi của leaderboard (real-time)
 * @param {Function} callback - Hàm callback được gọi khi có thay đổi
 * @returns {Function} Hàm để unsubscribe
 */
export const subscribeToLeaderboard = (callback) => {
  try {
    const leaderboardRef = collection(db, LEADERBOARD_COLLECTION);
    const q = query(leaderboardRef, orderBy('score', 'desc'), limit(10));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        callback([]);
        return;
      }
      
      const entries = [];
      querySnapshot.forEach((doc) => {
        const entry = doc.data();
        // Validate và sanitize dữ liệu
        const score = typeof entry.score === 'number' && entry.score >= 0 && entry.score <= 10000 
          ? Math.floor(entry.score) 
          : 0;
        const vmoId = typeof entry.vmoId === 'string' && entry.vmoId.length <= 10
          ? entry.vmoId.slice(0, 10)
          : doc.id.slice(0, 10);
        
        if (score > 0) { // Chỉ lấy entries có điểm hợp lệ
          entries.push({
            id: doc.id,
            vmoId: vmoId,
            score: score
          });
        }
      });
      
      callback(entries);
    }, (error) => {
      callback([]);
    });
    
    return unsubscribe;
  } catch (error) {
    return () => {};
  }
};
