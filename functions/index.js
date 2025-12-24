/**
 * Firebase Cloud Functions - Anti-Cheat Architecture
 * 
 * Nguyên tắc bảo mật:
 * - Client chỉ gửi hành động (actions), không gửi score
 * - Server tính điểm và validate tất cả logic
 * - Chỉ Cloud Function được phép ghi vào Firestore scores
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const LEADERBOARD_COLLECTION = 'leaderboard2';
const CHEAT_LEADERBOARD_COLLECTION = 'leaderboard_cheat';

/**
 * Validate VMO ID
 * VMO ID phải là đúng 4 chữ số (0-9), chỉ cho phép spaces ở đầu/cuối
 */
function validateVmoId(vmoId) {
  if (!vmoId || typeof vmoId !== 'string') {
    return null;
  }
  
  // Trim spaces ở đầu/cuối
  const trimmed = vmoId.trim();
  
  // VMO ID phải là đúng 4 chữ số liên tiếp, không có ký tự khác
  if (!/^\d{4}$/.test(trimmed)) {
    return null;
  }
  
  return trimmed;
}

/**
 * Validate action type (REAL-TIME TRACKING VERSION)
 */
function validateAction(action) {
  if (!action || typeof action !== 'object') {
    return false;
  }

  const validActionTypes = ['game_start', 'pipe_passed', 'gift_collected', 'game_over'];
  if (!validActionTypes.includes(action.type)) {
    return false;
  }

  // Validate action data based on type
  switch (action.type) {
    case 'game_start':
      // Game start chỉ cần timestamp
      return typeof action.timestamp === 'number' && action.timestamp > 0;

    case 'pipe_passed':
      // Pipe passed chỉ cần timestamp
      return typeof action.timestamp === 'number' && action.timestamp > 0;

    case 'gift_collected':
      // Gift collected chỉ cần timestamp
      return typeof action.timestamp === 'number' && action.timestamp > 0;

    case 'game_over':
      // Game over chỉ cần timestamp và playTimeSeconds
      return (
        typeof action.timestamp === 'number' &&
        action.timestamp > 0 &&
        typeof action.playTimeSeconds === 'number' &&
        action.playTimeSeconds >= 0
      );

    default:
      return false;
  }
}

/**
 * Tính điểm từ các actions
 * Score = pipesPassed + giftsReceived
 */
function calculateScore(pipesPassed, giftsReceived) {
  const pipesScore = Math.max(0, Math.floor(pipesPassed));
  const giftsScore = Math.max(0, Math.floor(giftsReceived));
  const totalScore = pipesScore + giftsScore;
  
  // Giới hạn điểm tối đa để tránh overflow (ví dụ: 10000)
  return Math.min(totalScore, 10000);
}

/**
 * Lưu điểm số bị reject vào leaderboard_cheat
 * Lưu đầy đủ thông tin giống như lưu bình thường
 */
async function saveToCheatLeaderboard(vmoId, sessionId, uid, calculatedScore, pipesCount, giftsCount, playTimeSeconds, gameStartTime, gameEndTime, gameDuration, reportedDuration, rejectionReason, additionalData = {}) {
  try {
    const cheatDocRef = db.collection(CHEAT_LEADERBOARD_COLLECTION).doc(vmoId);
    const timestamp = Date.now();
    
    const cheatData = {
      vmoId: vmoId,
      score: calculatedScore,
      pipesPassed: pipesCount,
      giftsReceived: giftsCount,
      playTimeSeconds: playTimeSeconds || 0,
      sessionId: sessionId,
      uid: uid,
      rejectionReason: rejectionReason, // Lý do bị reject
      gameStartTime: gameStartTime,
      gameEndTime: gameEndTime,
      gameDuration: gameDuration,
      reportedDuration: reportedDuration,
      lastActionType: 'game_over',
      lastActionTimestamp: gameEndTime,
      updatedAt: timestamp,
      createdAt: timestamp,
      ...additionalData // Thêm các thông tin bổ sung nếu có
    };
    
    // Lưu vào cheat leaderboard (merge để có thể có nhiều records cho cùng vmoId)
    // Sử dụng sessionId làm document ID để mỗi session có một record riêng
    const cheatSessionDocRef = cheatDocRef.collection('sessions').doc(sessionId);
    await cheatSessionDocRef.set(cheatData);
    
    // Cũng lưu vào document chính với timestamp để dễ query
    await cheatDocRef.set({
      lastCheatAt: timestamp,
      lastRejectionReason: rejectionReason,
      lastSessionId: sessionId,
      lastScore: calculatedScore,
      lastPipesPassed: pipesCount,
      lastGiftsReceived: giftsCount
    }, { merge: true });
    
    console.log('[FUNCTION] 💾 Saved to cheat leaderboard:', {
      vmoId,
      sessionId,
      score: calculatedScore,
      rejectionReason,
      timestamp: new Date(timestamp).toISOString()
    });
  } catch (error) {
    // Log error nhưng không throw để không ảnh hưởng đến flow chính
    console.error('[FUNCTION] ❌ Error saving to cheat leaderboard:', {
      error: error.message,
      vmoId,
      sessionId,
      rejectionReason,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Rate limiting đã được xóa để hỗ trợ real-time tracking
 * Với real-time tracking, mỗi action được gửi riêng biệt:
 * - game_start: 1
 * - pipe_passed: có thể rất nhiều (người chơi giỏi)
 * - gift_collected: có thể rất nhiều
 * - game_over: 1
 * 
 * Rate limiting sẽ được xử lý ở tầng khác nếu cần (ví dụ: Firebase App Check, Cloud Armor)
 */

/**
 * Callable Cloud Function: submitAction
 * 
 * Yêu cầu:
 * - Người dùng phải đăng nhập Firebase Auth
 * - Nhận { action } từ client
 * - Validate action hợp lệ
 * - Tính điểm server-side
 * - Ghi vào Firestore
 * - Trả về { success, score }
 */
exports.submitAction = functions.https.onCall(async (data, context) => {
  console.log('[FUNCTION] submitAction - START', {
    timestamp: new Date().toISOString(),
    uid: context.auth?.uid,
    vmoId: data?.vmoId,
    actionType: data?.action?.type
  });

  // 1. Kiểm tra authentication
  if (!context.auth) {
    console.error('[FUNCTION] ❌ Authentication failed - no auth context', {
      timestamp: new Date().toISOString(),
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      rawData: JSON.stringify(data)
    });
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const uid = context.auth.uid;
  console.log('[FUNCTION] ✅ Authenticated user:', {
    uid,
    timestamp: new Date().toISOString()
  });

  // 2. Validate và extract data
  const { action, vmoId, sessionId } = data;
  console.log('[FUNCTION] Received data:', {
    vmoId,
    sessionId,
    actionType: action?.type,
    action: JSON.stringify(action)
  });
  
  // Validate sessionId
  if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 100) {
    console.error('[FUNCTION] ❌ Invalid sessionId:', {
      sessionId,
      sessionIdType: typeof sessionId,
      sessionIdLength: sessionId?.length,
      vmoId: data?.vmoId,
      actionType: data?.action?.type,
      uid,
      timestamp: new Date().toISOString(),
      fullData: JSON.stringify(data)
    });
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid sessionId'
    );
  }

  if (!action) {
    console.error('[FUNCTION] ❌ Missing action parameter', {
      vmoId: data?.vmoId,
      sessionId,
      uid,
      hasAction: !!data?.action,
      dataKeys: data ? Object.keys(data) : [],
      timestamp: new Date().toISOString(),
      fullData: JSON.stringify(data)
    });
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing action parameter'
    );
  }

  // Validate VMO ID
  console.log('[FUNCTION] Validating VMO ID:', {
    vmoId,
    vmoIdType: typeof vmoId,
    vmoIdLength: vmoId?.length,
    sessionId,
    actionType: action?.type,
    uid
  });
  const sanitizedVmoId = validateVmoId(vmoId);
  if (!sanitizedVmoId) {
    console.error('[FUNCTION] ❌ Invalid VMO ID:', {
      vmoId,
      vmoIdType: typeof vmoId,
      vmoIdLength: vmoId?.length,
      sessionId,
      actionType: action?.type,
      actionTimestamp: action?.timestamp,
      uid,
      timestamp: new Date().toISOString(),
      fullAction: JSON.stringify(action),
      fullData: JSON.stringify(data)
    });
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid VMO ID'
    );
  }
  console.log('[FUNCTION] ✅ VMO ID validated:', {
    originalVmoId: vmoId,
    sanitizedVmoId,
    sessionId,
    actionType: action?.type
  });

  // Validate action
  console.log('[FUNCTION] Validating action:', {
    actionType: action?.type,
    actionTimestamp: action?.timestamp,
    playTimeSeconds: action?.playTimeSeconds,
    actionKeys: action ? Object.keys(action) : [],
    vmoId: sanitizedVmoId,
    sessionId,
    uid
  });
  if (!validateAction(action)) {
    console.error('[FUNCTION] ❌ Invalid action format:', {
      action: JSON.stringify(action),
      actionType: action?.type,
      actionTypeValid: action?.type && ['game_start', 'pipe_passed', 'gift_collected', 'game_over'].includes(action.type),
      actionTimestamp: action?.timestamp,
      actionTimestampType: typeof action?.timestamp,
      actionTimestampValid: typeof action?.timestamp === 'number' && action.timestamp > 0,
      playTimeSeconds: action?.playTimeSeconds,
      playTimeSecondsType: typeof action?.playTimeSeconds,
      vmoId: sanitizedVmoId,
      sessionId,
      uid,
      timestamp: new Date().toISOString(),
      fullData: JSON.stringify(data)
    });
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid action format'
    );
  }
  console.log('[FUNCTION] ✅ Action validated:', {
    actionType: action.type,
    actionTimestamp: action.timestamp,
    vmoId: sanitizedVmoId,
    sessionId
  });

  // Rate limiting đã được xóa để hỗ trợ real-time tracking
  // Người chơi giỏi có thể gửi nhiều actions trong một game

  try {
    const playerDocRef = db.collection(LEADERBOARD_COLLECTION).doc(sanitizedVmoId);
    const sessionDocRef = playerDocRef.collection('sessions').doc(sessionId);
    const sessionActionsRef = sessionDocRef.collection('actions');
    
    console.log('[FUNCTION] Processing action:', {
      vmoId: sanitizedVmoId,
      sessionId,
      actionType: action.type
    });

    // Xử lý theo loại action
    if (action.type === 'game_start') {
      // Kiểm tra xem session đã tồn tại chưa (chống game_start trùng lặp)
      const existingSession = await sessionDocRef.get();
      if (existingSession.exists) {
        const existingData = existingSession.data();
        // Nếu session đã có game_over, cho phép tạo session mới
        if (!existingData.gameOverAt) {
          console.error('[FUNCTION] ❌ Session already exists and not ended', {
            vmoId: sanitizedVmoId,
            sessionId,
            uid,
            existingSessionData: existingData,
            actionTimestamp: action.timestamp,
            serverTime: Date.now(),
            timestamp: new Date().toISOString()
          });
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Session already exists. Please end the current game before starting a new one.'
          );
        }
      }
      
      // Validate timestamp không thể trong tương lai
      const serverTimeNow = Date.now();
      const MAX_FUTURE_TIMESTAMP_DIFF = 5000; // 5 giây
      if (action.timestamp > serverTimeNow + MAX_FUTURE_TIMESTAMP_DIFF) {
        console.error('[FUNCTION] ❌ Timestamp in the future', {
          vmoId: sanitizedVmoId,
          sessionId,
          uid,
          clientTimestamp: action.timestamp,
          serverTimestamp: serverTimeNow,
          diff: action.timestamp - serverTimeNow,
          maxAllowedDiff: MAX_FUTURE_TIMESTAMP_DIFF,
          clientTime: new Date(action.timestamp).toISOString(),
          serverTime: new Date(serverTimeNow).toISOString(),
          timestamp: new Date().toISOString()
        });
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Action timestamp cannot be in the future'
        );
      }
      
      // Game start: Khởi tạo session với uid để validate ownership
      await sessionDocRef.set({
        vmoId: sanitizedVmoId,
        uid: uid, // Lưu uid để validate ownership
        startedAt: action.timestamp,
        createdAt: Date.now(),
        gameOverAt: null // Reset gameOverAt khi start game mới
      }, { merge: true });
      
      // Lưu action vào session
      await sessionActionsRef.add({
        type: action.type,
        timestamp: action.timestamp,
        serverReceivedAt: Date.now()
      });
      
      console.log('[FUNCTION] ✅ Game session started');
      return {
        success: true,
        message: 'Game session started'
      };
    } else {
      // Validate session ownership cho các actions khác
      const sessionDoc = await sessionDocRef.get();
      if (!sessionDoc.exists) {
        console.error('[FUNCTION] ❌ Session does not exist', {
          vmoId: sanitizedVmoId,
          sessionId,
          uid,
          actionType: action.type,
          actionTimestamp: action.timestamp,
          timestamp: new Date().toISOString()
        });
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Session does not exist. Please start a game first.'
        );
      }
      
      const sessionData = sessionDoc.data();
      console.log('[FUNCTION] Session data:', {
        vmoId: sanitizedVmoId,
        sessionId,
        sessionUid: sessionData.uid,
        currentUid: uid,
        match: sessionData.uid === uid,
        sessionStartedAt: sessionData.startedAt,
        gameOverAt: sessionData.gameOverAt,
        actionType: action.type
      });
      
      if (sessionData.uid !== uid) {
        console.error('[FUNCTION] ❌ Session ownership mismatch', {
          vmoId: sanitizedVmoId,
          sessionId,
          sessionUid: sessionData.uid,
          currentUid: uid,
          actionType: action.type,
          actionTimestamp: action.timestamp,
          sessionStartedAt: sessionData.startedAt,
          timestamp: new Date().toISOString()
        });
        throw new functions.https.HttpsError(
          'permission-denied',
          'Session does not belong to you'
        );
      }
      
      // Validate session không thể reuse sau game_over
      if (sessionData.gameOverAt) {
        console.error('[FUNCTION] ❌ Session already ended (game_over already called)', {
          vmoId: sanitizedVmoId,
          sessionId,
          uid,
          actionType: action.type,
          actionTimestamp: action.timestamp,
          sessionGameOverAt: sessionData.gameOverAt,
          sessionStartedAt: sessionData.startedAt,
          finalScore: sessionData.finalScore,
          timestamp: new Date().toISOString()
        });
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Session has already ended. Please start a new game.'
        );
      }
      
      // Validate timestamp không thể trong tương lai (cho phép sai số 5 giây do network delay)
      const serverTimeNow = Date.now();
      const MAX_FUTURE_TIMESTAMP_DIFF = 5000; // 5 giây
      if (action.timestamp > serverTimeNow + MAX_FUTURE_TIMESTAMP_DIFF) {
        console.error('[FUNCTION] ❌ Timestamp in the future:', {
          clientTimestamp: action.timestamp,
          serverTimestamp: serverTimeNow,
          diff: action.timestamp - serverTimeNow
        });
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Action timestamp cannot be in the future'
        );
      }
      
      // Validate thứ tự actions hợp lý
      // Kiểm tra xem đã có game_start chưa
      const gameStartQuery = await sessionActionsRef
        .where('type', '==', 'game_start')
        .limit(1)
        .get();
      
      if (gameStartQuery.empty && action.type !== 'game_start') {
        console.error('[FUNCTION] ❌ No game_start found before this action', {
          vmoId: sanitizedVmoId,
          sessionId,
          uid,
          actionType: action.type,
          actionTimestamp: action.timestamp,
          gameStartQueryEmpty: gameStartQuery.empty,
          sessionStartedAt: sessionData.startedAt,
          timestamp: new Date().toISOString()
        });
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Game must be started before submitting other actions'
        );
      }
      
      // Kiểm tra xem đã có game_over chưa (không cho phép actions sau game_over)
      const gameOverQuery = await sessionActionsRef
        .where('type', '==', 'game_over')
        .limit(1)
        .get();
      
      if (!gameOverQuery.empty && action.type !== 'game_over') {
        console.error('[FUNCTION] ❌ Game already over, cannot submit more actions', {
          vmoId: sanitizedVmoId,
          sessionId,
          uid,
          actionType: action.type,
          actionTimestamp: action.timestamp,
          gameOverExists: !gameOverQuery.empty,
          existingGameOver: gameOverQuery.docs[0]?.data(),
          sessionGameOverAt: sessionData.gameOverAt,
          timestamp: new Date().toISOString()
        });
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Game has already ended. Cannot submit more actions.'
        );
      }
      
      // Duplicate detection: Kiểm tra không có action trùng lặp
      // Một action được coi là duplicate nếu có cùng type và timestamp (trong vòng 100ms)
      const DUPLICATE_TIME_WINDOW = 100; // 100ms window
      try {
        const duplicateCheckQuery = await sessionActionsRef
          .where('type', '==', action.type)
          .where('timestamp', '>=', action.timestamp - DUPLICATE_TIME_WINDOW)
          .where('timestamp', '<=', action.timestamp + DUPLICATE_TIME_WINDOW)
          .limit(1)
          .get();
        
        if (!duplicateCheckQuery.empty) {
          const existingAction = duplicateCheckQuery.docs[0].data();
          console.error('[FUNCTION] ❌ Duplicate action detected:', {
            vmoId: sanitizedVmoId,
            sessionId,
            uid,
            actionType: action.type,
            actionTimestamp: action.timestamp,
            existingActionType: existingAction.type,
            existingActionTimestamp: existingAction.timestamp,
            existingActionServerReceivedAt: existingAction.serverReceivedAt,
            duplicateTimeWindow: DUPLICATE_TIME_WINDOW,
            timeDiff: Math.abs(action.timestamp - existingAction.timestamp),
            sessionStartedAt: sessionData.startedAt,
            serverTime: Date.now(),
            timestamp: new Date().toISOString()
          });
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Duplicate action detected. This action was already submitted.'
          );
        }
      } catch (queryError) {
        // Nếu query fail do thiếu index, log warning nhưng không block
        // Vì đây là validation phụ, không phải bắt buộc
        // Index sẽ được build và query sẽ hoạt động sau
        if (queryError.message && queryError.message.includes('index')) {
          console.warn('[FUNCTION] ⚠️ Duplicate check query failed (index may be building):', {
            error: queryError.message,
            vmoId: sanitizedVmoId,
            sessionId,
            uid,
            actionType: action.type,
            actionTimestamp: action.timestamp,
            timestamp: new Date().toISOString()
          });
          // Tiếp tục xử lý action (không block để tránh false positive khi index đang build)
        } else {
          // Nếu là lỗi khác (như duplicate thật), throw lại
          console.error('[FUNCTION] ❌ Duplicate check query error:', {
            error: queryError.message,
            errorStack: queryError.stack,
            vmoId: sanitizedVmoId,
            sessionId,
            uid,
            actionType: action.type,
            actionTimestamp: action.timestamp,
            timestamp: new Date().toISOString()
          });
          throw queryError;
        }
      }
      
      // Validate số lượng actions trong session (chống fake nhiều actions)
      // QUAN TRỌNG: game_over LUÔN được phép qua để tránh mất điểm của người chơi giỏi
      const MAX_ACTIONS_PER_SESSION = 5000; // Tăng limit cho người chơi giỏi (500 pipes + 150 gifts + overhead)
      
      // Chỉ validate limit cho các actions thông thường, KHÔNG chặn game_over
      if (action.type !== 'game_over') {
        const actionsCountSnapshot = await sessionActionsRef.count().get();
        const actionsCount = actionsCountSnapshot.data().count;
        
        console.log('[FUNCTION] Actions count check:', {
          actionsCount,
          maxAllowed: MAX_ACTIONS_PER_SESSION,
          actionType: action.type
        });
        
        if (actionsCount >= MAX_ACTIONS_PER_SESSION) {
          console.error('[FUNCTION] ❌ Too many actions in session', {
            vmoId: sanitizedVmoId,
            sessionId,
            uid,
            actionType: action.type,
            actionsCount,
            maxAllowed: MAX_ACTIONS_PER_SESSION,
            excess: actionsCount - MAX_ACTIONS_PER_SESSION,
            sessionStartedAt: sessionData.startedAt,
            currentTime: Date.now(),
            sessionDuration: Date.now() - (sessionData.startedAt || Date.now()),
            timestamp: new Date().toISOString()
          });
          throw new functions.https.HttpsError(
            'resource-exhausted',
            'Too many actions in this session. Maximum allowed: ' + MAX_ACTIONS_PER_SESSION
          );
        }
      } else {
        // game_over: Chỉ log warning nếu quá nhiều actions, nhưng vẫn cho phép
        const actionsCountSnapshot = await sessionActionsRef.count().get();
        const actionsCount = actionsCountSnapshot.data().count;
        if (actionsCount > MAX_ACTIONS_PER_SESSION) {
          console.warn('[FUNCTION] ⚠️ Game over with many actions:', {
            actionsCount,
            maxRecommended: MAX_ACTIONS_PER_SESSION,
            note: 'Allowing game_over to complete to prevent score loss'
          });
        }
      }
      
      // Validate timing cho pipe_passed và gift_collected (chống actions quá nhanh)
      // TỐI ƯU: Chỉ lấy action cuối cùng thay vì query toàn bộ collection
      if (action.type === 'pipe_passed' || action.type === 'gift_collected') {
        const MIN_TIME_BETWEEN_ACTIONS = 50; // 50ms giữa các actions (hợp lý cho game nhanh)
        
        try {
          // TỐI ƯU: Chỉ lấy 1 document cuối cùng thay vì scan toàn bộ
          // Sử dụng orderBy + limit(1) để chỉ lấy action mới nhất cùng loại
          const lastActionQuery = await sessionActionsRef
            .where('type', '==', action.type)
            .orderBy('serverReceivedAt', 'desc')
            .limit(1)
            .get();
          
          if (!lastActionQuery.empty) {
            const lastActionDoc = lastActionQuery.docs[0];
            const lastAction = lastActionDoc.data();
            
            // Sử dụng serverReceivedAt thay vì client timestamp để tránh fake
            const serverTimeNow = Date.now();
            const lastServerTime = lastAction.serverReceivedAt || lastAction.timestamp;
            const timeDiff = serverTimeNow - lastServerTime;
            
            console.log('[FUNCTION] Timing validation (server-side):', {
              actionType: action.type,
              lastServerTime,
              currentServerTime: serverTimeNow,
              timeDiff,
              minRequired: MIN_TIME_BETWEEN_ACTIONS
            });
            
            if (timeDiff < MIN_TIME_BETWEEN_ACTIONS) {
              console.error('[FUNCTION] ❌ Actions too fast (server-validated)', {
                vmoId: sanitizedVmoId,
                sessionId,
                uid,
                actionType: action.type,
                actionTimestamp: action.timestamp,
                lastActionTimestamp: lastAction.timestamp,
                lastActionServerReceivedAt: lastAction.serverReceivedAt,
                lastActionType: lastAction.type,
                serverTimeNow,
                lastServerTime,
                timeDiff,
                minRequired: MIN_TIME_BETWEEN_ACTIONS,
                violation: `Time diff ${timeDiff}ms < minimum ${MIN_TIME_BETWEEN_ACTIONS}ms`,
                sessionStartedAt: sessionData.startedAt,
                timestamp: new Date().toISOString()
              });
              throw new functions.https.HttpsError(
                'invalid-argument',
                'Actions are too fast. Minimum time between actions: ' + MIN_TIME_BETWEEN_ACTIONS + 'ms'
              );
            }
          }
        } catch (queryError) {
          // Nếu query fail (có thể do thiếu index), log warning nhưng không block
          // Vì đây là validation phụ, không phải bắt buộc
          console.warn('[FUNCTION] ⚠️ Timing validation query failed (non-blocking):', {
            error: queryError.message,
            errorStack: queryError.stack,
            vmoId: sanitizedVmoId,
            sessionId,
            uid,
            actionType: action.type,
            actionTimestamp: action.timestamp,
            timestamp: new Date().toISOString()
          });
          // Tiếp tục xử lý action (không block để tránh false positive)
        }
      }
      
      // Lưu action vào session với SERVER TIMESTAMP
      const serverTimestamp = Date.now();
      await sessionActionsRef.add({
        type: action.type,
        timestamp: action.timestamp, // Giữ client timestamp để validate duration
        serverReceivedAt: serverTimestamp, // Server timestamp để validate timing
        serverProcessedAt: Date.now() // Timestamp khi server xử lý xong
      });
      
      if (action.type === 'pipe_passed' || action.type === 'gift_collected') {
        // Pipe passed hoặc gift collected: Chỉ lưu action, không tính điểm
        console.log('[FUNCTION] ✅ Action recorded:', action.type);
        return {
          success: true,
          message: 'Action recorded'
        };
      } else if (action.type === 'game_over') {
        // Game over: Đếm actions từ session và tính điểm
        console.log('[FUNCTION] Processing game_over - Counting actions from session');
        
        // Validate game duration hợp lý
        const sessionData = sessionDoc.data();
        const gameStartTime = sessionData.startedAt;
        const gameDuration = action.timestamp - gameStartTime;
        const reportedDuration = (action.playTimeSeconds || 0) * 1000;
        
        console.log('[FUNCTION] Game duration validation:', {
          gameStartTime,
          gameEndTime: action.timestamp,
          gameDuration,
          reportedDuration,
          difference: Math.abs(gameDuration - reportedDuration),
          differencePercent: reportedDuration > 0 ? (Math.abs(gameDuration - reportedDuration) / reportedDuration * 100).toFixed(2) + '%' : 'N/A'
        });
        
        // Kiểm tra duration hợp lý (±50% sai số cho phép - nới lỏng để tránh false positive)
        // Chỉ validate nếu game duration > 5 giây (tránh validate cho game quá ngắn)
        if (reportedDuration > 5000 && gameDuration > 5000) {
          const differencePercent = Math.abs(gameDuration - reportedDuration) / reportedDuration;
          if (differencePercent > 0.5) {
            // Tính điểm trước khi reject
            const [pipesCountSnapshot, giftsCountSnapshot] = await Promise.all([
              sessionActionsRef.where('type', '==', 'pipe_passed').count().get(),
              sessionActionsRef.where('type', '==', 'gift_collected').count().get()
            ]);
            const pipesCount = pipesCountSnapshot.data().count;
            const giftsCount = giftsCountSnapshot.data().count;
            const calculatedScore = calculateScore(pipesCount, giftsCount);
            
            // Lưu vào cheat leaderboard
            await saveToCheatLeaderboard(
              sanitizedVmoId,
              sessionId,
              uid,
              calculatedScore,
              pipesCount,
              giftsCount,
              action.playTimeSeconds,
              gameStartTime,
              action.timestamp,
              gameDuration,
              reportedDuration,
              'Invalid game duration - difference too large',
              {
                difference: Math.abs(gameDuration - reportedDuration),
                differencePercent: (differencePercent * 100).toFixed(2) + '%',
                violation: `Difference ${(differencePercent * 100).toFixed(2)}% > 50% allowed`
              }
            );
            
            console.error('[FUNCTION] ❌ Invalid game duration - difference too large:', {
              vmoId: sanitizedVmoId,
              sessionId,
              uid,
              gameStartTime,
              gameEndTime: action.timestamp,
              gameDuration,
              reportedDuration,
              difference: Math.abs(gameDuration - reportedDuration),
              differencePercent: (differencePercent * 100).toFixed(2) + '%',
              violation: `Difference ${(differencePercent * 100).toFixed(2)}% > 50% allowed`,
              actionTimestamp: action.timestamp,
              playTimeSeconds: action.playTimeSeconds,
              serverTime: Date.now(),
              timestamp: new Date().toISOString()
            });
            throw new functions.https.HttpsError(
              'invalid-argument',
              'Invalid game duration. Duration mismatch detected.'
            );
          }
        }
        
        // TỐI ƯU: Đếm pipes và gifts bằng count() query thay vì lấy toàn bộ documents
        // Điều này giảm đáng kể chi phí và latency
        const [pipesCountSnapshot, giftsCountSnapshot, totalCountSnapshot] = await Promise.all([
          sessionActionsRef.where('type', '==', 'pipe_passed').count().get(),
          sessionActionsRef.where('type', '==', 'gift_collected').count().get(),
          sessionActionsRef.count().get()
        ]);
        
        const pipesCount = pipesCountSnapshot.data().count;
        const giftsCount = giftsCountSnapshot.data().count;
        const totalActions = totalCountSnapshot.data().count;
        
        console.log('[FUNCTION] Actions counted (optimized):', {
          pipesCount,
          giftsCount,
          totalActions
        });
      
      // Validate số lượng actions hợp lý dựa trên thời gian chơi
      const actionsPerSecond = totalActions / Math.max(gameDuration / 1000, 1);
      // Giới hạn hợp lý: 1 giây chỉ đủ cho 2-3 actions (pipes + gifts)
      // Người chơi giỏi nhất cũng không thể vượt quá 3 actions/giây
      const MAX_ACTIONS_PER_SECOND = 3;
      
      console.log('[FUNCTION] Actions per second validation:', {
        totalActions,
        gameDurationSeconds: (gameDuration / 1000).toFixed(2),
        actionsPerSecond: actionsPerSecond.toFixed(2),
        maxAllowed: MAX_ACTIONS_PER_SECOND
      });
      
      if (actionsPerSecond > MAX_ACTIONS_PER_SECOND) {
        // Lưu vào cheat leaderboard
        await saveToCheatLeaderboard(
          sanitizedVmoId,
          sessionId,
          uid,
          calculatedScore,
          pipesCount,
          giftsCount,
          action.playTimeSeconds,
          gameStartTime,
          action.timestamp,
          gameDuration,
          reportedDuration,
          'Too many actions per second',
          {
            totalActions,
            actionsPerSecond: actionsPerSecond.toFixed(2),
            maxAllowed: MAX_ACTIONS_PER_SECOND,
            violation: `${actionsPerSecond.toFixed(2)} actions/sec > ${MAX_ACTIONS_PER_SECOND} actions/sec`
          }
        );
        
        console.error('[FUNCTION] ❌ Too many actions per second', {
          vmoId: sanitizedVmoId,
          sessionId,
          uid,
          totalActions,
          gameDuration,
          gameDurationSeconds: (gameDuration / 1000).toFixed(2),
          actionsPerSecond: actionsPerSecond.toFixed(2),
          maxAllowed: MAX_ACTIONS_PER_SECOND,
          violation: `${actionsPerSecond.toFixed(2)} actions/sec > ${MAX_ACTIONS_PER_SECOND} actions/sec`,
          pipesCount,
          giftsCount,
          gameStartTime,
          gameEndTime: action.timestamp,
          reportedDuration,
          timestamp: new Date().toISOString()
        });
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Too many actions per second. Maximum allowed: ' + MAX_ACTIONS_PER_SECOND + ' actions/sec'
        );
      }
      
      // Validate số lượng pipes/gifts hợp lý dựa trên thời gian chơi
      // Trong game thực tế:
      // - Pipes spawn mỗi ~1-2 giây (target distance 200px, speed 3px/frame, 60fps ≈ 1.1s, 30fps ≈ 2.2s)
      // - Người chơi giỏi có thể pass khoảng 0.5-0.8 pipes/giây
      // - Gifts spawn mỗi 3-5 giây, người chơi giỏi có thể collect 0.2-0.3 gifts/giây
      const gameDurationSeconds = gameDuration / 1000;
      
      // Giới hạn thực tế dựa trên game mechanics:
      // - Pipes: Tối đa 0.8 pipes/giây (rất giỏi, pipes spawn mỗi 1-2 giây)
      // - Gifts: Tối đa 0.3 gifts/giây (rất giỏi, gifts spawn mỗi 3-5 giây)
      const MAX_PIPES_PER_SECOND = 0.8; // Giảm từ 2.5 xuống 0.8 (thực tế hơn)
      const MAX_GIFTS_PER_SECOND = 0.5; // Giảm từ 1.0 xuống 0.3 (thực tế hơn)
      
      const pipesPerSecond = pipesCount / Math.max(gameDurationSeconds, 1);
      const giftsPerSecond = giftsCount / Math.max(gameDurationSeconds, 1);
      
      console.log('[FUNCTION] Pipes/Gifts per second validation:', {
        pipesCount,
        giftsCount,
        gameDurationSeconds: gameDurationSeconds.toFixed(2),
        pipesPerSecond: pipesPerSecond.toFixed(2),
        giftsPerSecond: giftsPerSecond.toFixed(2),
        maxPipesPerSecond: MAX_PIPES_PER_SECOND,
        maxGiftsPerSecond: MAX_GIFTS_PER_SECOND
      });
      
      if (pipesPerSecond > MAX_PIPES_PER_SECOND) {
        // Lưu vào cheat leaderboard
        await saveToCheatLeaderboard(
          sanitizedVmoId,
          sessionId,
          uid,
          calculatedScore,
          pipesCount,
          giftsCount,
          action.playTimeSeconds,
          gameStartTime,
          action.timestamp,
          gameDuration,
          reportedDuration,
          'Too many pipes per second',
          {
            pipesPerSecond: pipesPerSecond.toFixed(2),
            maxAllowed: MAX_PIPES_PER_SECOND,
            violation: `${pipesPerSecond.toFixed(2)} pipes/sec > ${MAX_PIPES_PER_SECOND} pipes/sec`,
            totalActions
          }
        );
        
        console.error('[FUNCTION] ❌ Too many pipes per second', {
          vmoId: sanitizedVmoId,
          sessionId,
          uid,
          pipesCount,
          gameDuration,
          gameDurationSeconds: (gameDuration / 1000).toFixed(2),
          pipesPerSecond: pipesPerSecond.toFixed(2),
          maxAllowed: MAX_PIPES_PER_SECOND,
          violation: `${pipesPerSecond.toFixed(2)} pipes/sec > ${MAX_PIPES_PER_SECOND} pipes/sec`,
          giftsCount,
          totalActions,
          gameStartTime,
          gameEndTime: action.timestamp,
          reportedDuration,
          timestamp: new Date().toISOString()
        });
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Too many pipes passed per second. Maximum allowed: ' + MAX_PIPES_PER_SECOND + ' pipes/sec'
        );
      }
      
      if (giftsPerSecond > MAX_GIFTS_PER_SECOND) {
        // Lưu vào cheat leaderboard
        await saveToCheatLeaderboard(
          sanitizedVmoId,
          sessionId,
          uid,
          calculatedScore,
          pipesCount,
          giftsCount,
          action.playTimeSeconds,
          gameStartTime,
          action.timestamp,
          gameDuration,
          reportedDuration,
          'Too many gifts per second',
          {
            giftsPerSecond: giftsPerSecond.toFixed(2),
            maxAllowed: MAX_GIFTS_PER_SECOND,
            violation: `${giftsPerSecond.toFixed(2)} gifts/sec > ${MAX_GIFTS_PER_SECOND} gifts/sec`,
            totalActions
          }
        );
        
        console.error('[FUNCTION] ❌ Too many gifts per second', {
          vmoId: sanitizedVmoId,
          sessionId,
          uid,
          giftsCount,
          gameDuration,
          gameDurationSeconds: (gameDuration / 1000).toFixed(2),
          giftsPerSecond: giftsPerSecond.toFixed(2),
          maxAllowed: MAX_GIFTS_PER_SECOND,
          violation: `${giftsPerSecond.toFixed(2)} gifts/sec > ${MAX_GIFTS_PER_SECOND} gifts/sec`,
          pipesCount,
          totalActions,
          gameStartTime,
          gameEndTime: action.timestamp,
          reportedDuration,
          timestamp: new Date().toISOString()
        });
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Too many gifts collected per second. Maximum allowed: ' + MAX_GIFTS_PER_SECOND + ' gifts/sec'
        );
      }
      
      // LỚP PHÒNG THỦ QUAN TRỌNG: Tính thời gian trung bình giữa các pipes
      // Pipes spawn mỗi ~1-2 giây trong game thực tế
      // Nếu thời gian trung bình giữa pipes quá ngắn → HACK
      if (pipesCount > 0 && gameDurationSeconds > 0) {
        const averageTimeBetweenPipes = gameDurationSeconds / pipesCount;
        
        // Trong game thực tế:
        // - Pipes spawn với target distance 200px, speed 3px/frame
        // - Với 60fps: 200/3/60 ≈ 1.1 giây giữa các pipes
        // - Với 30fps: 200/3/30 ≈ 2.2 giây giữa các pipes
        // - Người chơi giỏi có thể pass pipes nhanh hơn một chút, nhưng không thể < 0.8 giây/pipe
        const MIN_TIME_BETWEEN_PIPES = 0.8; // Tối thiểu 0.8 giây giữa các pipes
        
        console.log('[FUNCTION] Average time between pipes validation (CRITICAL):', {
          pipesCount,
          gameDurationSeconds: gameDurationSeconds.toFixed(2),
          averageTimeBetweenPipes: averageTimeBetweenPipes.toFixed(2),
          minRequired: MIN_TIME_BETWEEN_PIPES,
          difference: (MIN_TIME_BETWEEN_PIPES - averageTimeBetweenPipes).toFixed(2)
        });
        
        if (averageTimeBetweenPipes < MIN_TIME_BETWEEN_PIPES) {
          // Lưu vào cheat leaderboard
          await saveToCheatLeaderboard(
            sanitizedVmoId,
            sessionId,
            uid,
            calculatedScore,
            pipesCount,
            giftsCount,
            action.playTimeSeconds,
            gameStartTime,
            action.timestamp,
            gameDuration,
            reportedDuration,
            'Pipes passed too fast - HACK DETECTED',
            {
              averageTimeBetweenPipes: averageTimeBetweenPipes.toFixed(2),
              minRequired: MIN_TIME_BETWEEN_PIPES,
              violation: `Average ${averageTimeBetweenPipes.toFixed(2)}s/pipe < minimum ${MIN_TIME_BETWEEN_PIPES}s/pipe`,
              pipesPerSecond: (pipesCount / gameDurationSeconds).toFixed(2),
              totalActions
            }
          );
          
          console.error('[FUNCTION] ❌ Pipes passed too fast - HACK DETECTED!', {
            vmoId: sanitizedVmoId,
            sessionId,
            uid,
            pipesCount,
            giftsCount,
            totalActions,
            gameDuration,
            gameDurationSeconds: gameDurationSeconds.toFixed(2),
            gameStartTime,
            gameEndTime: action.timestamp,
            reportedDuration,
            averageTimeBetweenPipes: averageTimeBetweenPipes.toFixed(2),
            minRequired: MIN_TIME_BETWEEN_PIPES,
            violation: `Average ${averageTimeBetweenPipes.toFixed(2)}s/pipe < minimum ${MIN_TIME_BETWEEN_PIPES}s/pipe`,
            pipesPerSecond: (pipesCount / gameDurationSeconds).toFixed(2),
            calculatedScore,
            previousScore,
            timestamp: new Date().toISOString()
          });
          throw new functions.https.HttpsError(
            'invalid-argument',
            `Pipes are being passed too fast. Average time between pipes: ${averageTimeBetweenPipes.toFixed(2)}s (minimum: ${MIN_TIME_BETWEEN_PIPES}s). This is physically impossible in the game.`
          );
        }
        
        // Thêm validation: Nếu có quá nhiều pipes trong thời gian ngắn → HACK
        // Ví dụ: 100 pipes trong 50 giây = 0.5s/pipe → KHÔNG THỂ
        if (pipesCount > 10) {
          const maxPossiblePipes = Math.floor(gameDurationSeconds / MIN_TIME_BETWEEN_PIPES);
          
          console.log('[FUNCTION] Maximum possible pipes validation:', {
            pipesCount,
            gameDurationSeconds: gameDurationSeconds.toFixed(2),
            maxPossiblePipes,
            excess: pipesCount - maxPossiblePipes
          });
          
          if (pipesCount > maxPossiblePipes) {
            // Lưu vào cheat leaderboard
            await saveToCheatLeaderboard(
              sanitizedVmoId,
              sessionId,
              uid,
              calculatedScore,
              pipesCount,
              giftsCount,
              action.playTimeSeconds,
              gameStartTime,
              action.timestamp,
              gameDuration,
              reportedDuration,
              'Too many pipes for game duration - HACK DETECTED',
              {
                maxPossiblePipes,
                excess: pipesCount - maxPossiblePipes,
                minTimeBetweenPipes: MIN_TIME_BETWEEN_PIPES,
                averageTimeBetweenPipes: (gameDurationSeconds / pipesCount).toFixed(2),
                totalActions
              }
            );
            
            console.error('[FUNCTION] ❌ Too many pipes for game duration - HACK DETECTED!', {
              vmoId: sanitizedVmoId,
              sessionId,
              uid,
              pipesCount,
              giftsCount,
              totalActions,
              gameDuration,
              gameDurationSeconds: gameDurationSeconds.toFixed(2),
              gameStartTime,
              gameEndTime: action.timestamp,
              reportedDuration,
              maxPossiblePipes,
              excess: pipesCount - maxPossiblePipes,
              minTimeBetweenPipes: MIN_TIME_BETWEEN_PIPES,
              averageTimeBetweenPipes: (gameDurationSeconds / pipesCount).toFixed(2),
              calculatedScore,
              previousScore,
              timestamp: new Date().toISOString()
            });
            throw new functions.https.HttpsError(
              'invalid-argument',
              `Too many pipes for game duration. Got ${pipesCount} pipes in ${gameDurationSeconds.toFixed(2)}s, but maximum possible is ${maxPossiblePipes} pipes (${MIN_TIME_BETWEEN_PIPES}s per pipe).`
            );
          }
        }
      }
      
      // Thêm validation: Tỷ lệ pipes/gifts hợp lý
      // Trong game thực tế, có nhiều pipes hơn gifts (gifts spawn ít hơn)
      // Nhưng không thể chỉ có pipes mà không có gifts (suspicious pattern)
      if (pipesCount > 20 && giftsCount === 0) {
        // Lưu vào cheat leaderboard
        await saveToCheatLeaderboard(
          sanitizedVmoId,
          sessionId,
          uid,
          calculatedScore,
          pipesCount,
          giftsCount,
          action.playTimeSeconds,
          gameStartTime,
          action.timestamp,
          gameDuration,
          reportedDuration,
          'Suspicious pattern: Many pipes but no gifts',
          {
            totalActions
          }
        );
        
        console.error('[FUNCTION] ❌ Suspicious pattern: Many pipes but no gifts', {
          vmoId: sanitizedVmoId,
          sessionId,
          uid,
          pipesCount,
          giftsCount,
          totalActions,
          gameDuration,
          gameDurationSeconds: (gameDuration / 1000).toFixed(2),
          gameStartTime,
          gameEndTime: action.timestamp,
          reportedDuration,
          calculatedScore,
          previousScore,
          timestamp: new Date().toISOString()
        });
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Suspicious game pattern detected. Too many pipes without any gifts.'
        );
      }
      
      // Tính điểm từ actions đã đếm (real-time tracking)
      const calculatedScore = calculateScore(pipesCount, giftsCount);
      
      // Lấy điểm cao nhất hiện tại
      const docSnap = await playerDocRef.get();
      const exists = docSnap.exists;
      const currentData = exists ? docSnap.data() : null;
      const previousScore = currentData?.score || 0;
      
      console.log('[FUNCTION] Score calculation:', {
        pipesCount,
        giftsCount,
        calculatedScore,
        previousScore,
        willUpdate: calculatedScore > previousScore
      });

      // Đánh dấu session đã kết thúc (chống reuse session)
      await sessionDocRef.update({
        gameOverAt: Date.now(),
        finalScore: calculatedScore,
        finalPipesPassed: pipesCount,
        finalGiftsReceived: giftsCount
      });

      // Chỉ cập nhật nếu điểm mới cao hơn điểm cũ
      if (calculatedScore > previousScore) {
        const timestamp = Date.now();
        
        const updateData = {
          vmoId: sanitizedVmoId,
          score: calculatedScore,
          updatedAt: timestamp,
          pipesPassed: pipesCount,
          giftsReceived: giftsCount,
          playTimeSeconds: action.playTimeSeconds || 0,
          lastSessionId: sessionId,
          lastActionType: action.type,
          lastActionTimestamp: action.timestamp
        };

        console.log('[FUNCTION] Writing to Firestore:', updateData);
        
        await playerDocRef.set(updateData, { merge: true });
        
        console.log('[FUNCTION] ✅ Successfully wrote to Firestore');

        return {
          success: true,
          score: calculatedScore,
          previousScore: previousScore,
          pipesCount,
          giftsCount,
          message: 'Score updated successfully'
        };
      } else {
        console.log('[FUNCTION] ⚠️ New score is not higher than previous');                                                                                                             
        return {
          success: true,
          score: previousScore,             
          pipesCount,
          giftsCount,
          message: 'Score not higher than current high score'
        };
      }
    }
    }

  } catch (error) {
    // Log đầy đủ thông số khi có lỗi
    const errorContext = {
      timestamp: new Date().toISOString(),
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      errorStack: error.stack,
      errorDetails: error.details,
      uid: context.auth?.uid,
      vmoId: data?.vmoId,
      sanitizedVmoId: sanitizedVmoId || data?.vmoId,
      sessionId: data?.sessionId,
      actionType: data?.action?.type,
      actionTimestamp: data?.action?.timestamp,
      playTimeSeconds: data?.action?.playTimeSeconds,
      fullAction: data?.action ? JSON.stringify(data.action) : null,
      fullData: JSON.stringify(data),
      serverTime: Date.now(),
      serverTimeISO: new Date().toISOString()
    };
    
    console.error('[FUNCTION] ❌ Error in submitAction:', errorContext);
    
    // Nếu là HttpsError từ validation, throw lại nguyên bản
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Các lỗi khác wrap thành internal error
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while processing your request: ' + error.message
    );
  }
});

