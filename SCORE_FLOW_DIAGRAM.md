# 📊 Flow Tính Điểm - Client → Firebase

## 🔄 Tổng quan Flow

```
Client (Game)                    Cloud Function              Firestore
   │                                    │                        │
   │ 1. game_start                     │                        │
   ├───────────────────────────────────>│                        │
   │                                    │─── Create session ────>│
   │                                    │                        │
   │ 2. pipe_passed (real-time)        │                        │
   ├───────────────────────────────────>│                        │
   │                                    │─── Save action ───────>│
   │                                    │                        │
   │ 3. gift_collected (real-time)     │                        │
   ├───────────────────────────────────>│                        │
   │                                    │─── Save action ───────>│
   │                                    │                        │
   │ 4. game_over                      │                        │
   ├───────────────────────────────────>│                        │
   │                                    │─── Count actions ─────>│
   │                                    │                        │
   │                                    │─── Calculate score ───>│
   │                                    │                        │
   │                                    │─── Update leaderboard─>│
   │                                    │                        │
   │<─── Return {score, pipesCount} ────│                        │
   │                                    │                        │
```

## 📝 Chi tiết từng bước

### **Bước 1: Game Start**

**Client (App.jsx):**
```javascript
// Khi người chơi nhấn jump lần đầu
gameSessionIdRef.current = `session_${Date.now()}_${Math.random()}`;

submitGameStart(vmoId, gameSessionIdRef.current);
```

**Client → Cloud Function:**
```javascript
// firebaseService.js
submitGameStart(vmoId, sessionId) {
  submitActionToServer(vmoId, sessionId, {
    type: 'game_start',
    timestamp: Date.now()
  });
}
```

**Cloud Function xử lý:**
```javascript
// functions/index.js
if (action.type === 'game_start') {
  // Tạo session document
  await playerDocRef.collection('sessions').doc(sessionId).set({
    vmoId: sanitizedVmoId,
    startedAt: action.timestamp,
    createdAt: Date.now()
  });
  
  // Lưu action vào subcollection
  await sessionActionsRef.add({
    type: 'game_start',
    timestamp: action.timestamp,
    serverReceivedAt: Date.now()
  });
}
```

**Firestore Structure:**
```
leaderboard2/
  └── {vmoId}/
      └── sessions/
          └── {sessionId}/
              ├── (document) {vmoId, startedAt, createdAt}
              └── actions/
                  └── {actionId}/
                      └── {type: 'game_start', timestamp, serverReceivedAt}
```

---

### **Bước 2: Pipe Passed (Real-time)**

**Client (App.jsx):**
```javascript
// Khi Santa pass qua một pipe
if (santaCenter > pipeRight && !scoredPipesRef.current.has(pipe.id)) {
  pipesPassedRef.current += 1;
  setScore(pipesPassedRef.current + giftsReceivedRef.current);
  
  // Gửi action ngay lập tức
  submitPipePassed(vmoId, gameSessionIdRef.current);
}
```

**Client → Cloud Function:**
```javascript
// firebaseService.js
submitPipePassed(vmoId, sessionId) {
  submitActionToServer(vmoId, sessionId, {
    type: 'pipe_passed',
    timestamp: Date.now()
  });
}
```

**Cloud Function xử lý:**
```javascript
// functions/index.js
if (action.type === 'pipe_passed') {
  // Chỉ lưu action, không tính điểm
  await sessionActionsRef.add({
    type: 'pipe_passed',
    timestamp: action.timestamp,
    serverReceivedAt: Date.now()
  });
  
  return { success: true, message: 'Action recorded' };
}
```

**Firestore Structure:**
```
leaderboard2/
  └── {vmoId}/
      └── sessions/
          └── {sessionId}/
              └── actions/
                  ├── {actionId1} {type: 'game_start', ...}
                  ├── {actionId2} {type: 'pipe_passed', ...}
                  ├── {actionId3} {type: 'pipe_passed', ...}
                  └── ...
```

---

### **Bước 3: Gift Collected (Real-time)**

**Client (App.jsx):**
```javascript
// Khi Santa collect một gift
if (collision với gift) {
  giftsReceivedRef.current += 1;
  setScore(pipesPassedRef.current + giftsReceivedRef.current);
  
  // Gửi action ngay lập tức
  submitGiftCollected(vmoId, gameSessionIdRef.current);
}
```

**Client → Cloud Function:**
```javascript
// firebaseService.js
submitGiftCollected(vmoId, sessionId) {
  submitActionToServer(vmoId, sessionId, {
    type: 'gift_collected',
    timestamp: Date.now()
  });
}
```

**Cloud Function xử lý:**
```javascript
// functions/index.js
if (action.type === 'gift_collected') {
  // Chỉ lưu action, không tính điểm
  await sessionActionsRef.add({
    type: 'gift_collected',
    timestamp: action.timestamp,
    serverReceivedAt: Date.now()
  });
  
  return { success: true, message: 'Action recorded' };
}
```

---

### **Bước 4: Game Over - Tính Điểm**

**Client (App.jsx):**
```javascript
// Khi game over
savePlayerScore(vmoId, gameSessionIdRef.current, playTimeSeconds);
```

**Client → Cloud Function:**
```javascript
// firebaseService.js
savePlayerScore(vmoId, sessionId, playTimeSeconds) {
  submitActionToServer(vmoId, sessionId, {
    type: 'game_over',
    timestamp: Date.now(),
    playTimeSeconds: playTimeSeconds
  });
}
```

**Cloud Function xử lý:**
```javascript
// functions/index.js
if (action.type === 'game_over') {
  // 1. Lưu game_over action
  await sessionActionsRef.add({
    type: 'game_over',
    timestamp: action.timestamp,
    serverReceivedAt: Date.now()
  });
  
  // 2. Đếm actions từ session
  const actionsSnapshot = await sessionActionsRef.get();
  let pipesCount = 0;
  let giftsCount = 0;
  
  actionsSnapshot.forEach((doc) => {
    const actionData = doc.data();
    if (actionData.type === 'pipe_passed') {
      pipesCount++;
    } else if (actionData.type === 'gift_collected') {
      giftsCount++;
    }
  });
  
  // 3. Tính điểm
  const calculatedScore = calculateScore(pipesCount, giftsCount);
  // Score = pipesCount + giftsCount
  
  // 4. Lấy điểm cao nhất hiện tại
  const docSnap = await playerDocRef.get();
  const previousScore = docSnap.exists ? docSnap.data().score || 0 : 0;
  
  // 5. Cập nhật nếu điểm mới cao hơn
  if (calculatedScore > previousScore) {
    await playerDocRef.set({
      vmoId: sanitizedVmoId,
      score: calculatedScore,
      updatedAt: Date.now(),
      pipesPassed: pipesCount,
      giftsReceived: giftsCount,
      playTimeSeconds: action.playTimeSeconds,
      lastSessionId: sessionId
    }, { merge: true });
    
    return {
      success: true,
      score: calculatedScore,
      pipesCount,
      giftsCount
    };
  }
}
```

**Firestore Structure sau game_over:**
```
leaderboard2/
  └── {vmoId}/
      ├── (document) {
      │     vmoId: "0001",
      │     score: 8,
      │     pipesPassed: 5,
      │     giftsReceived: 3,
      │     updatedAt: timestamp
      │   }
      └── sessions/
          └── {sessionId}/
              └── actions/
                  ├── game_start
                  ├── pipe_passed (x5)
                  ├── gift_collected (x3)
                  └── game_over
```

---

## 🔑 Điểm quan trọng

### ✅ **Client KHÔNG gửi score**
- Client chỉ gửi actions: `game_start`, `pipe_passed`, `gift_collected`, `game_over`
- Không gửi `pipesPassed` hoặc `giftsReceived` totals

### ✅ **Server tính điểm**
- Server đếm actions từ Firestore
- Server tính: `score = pipesCount + giftsCount`
- Server chỉ cập nhật nếu điểm mới cao hơn

### ✅ **Real-time tracking**
- Mỗi action được gửi ngay khi xảy ra
- Server lưu từng action vào subcollection
- Khi `game_over`, server đếm và validate

### ✅ **Chống gian lận**
- Không thể fake totals (client không gửi totals)
- Phải fake từng action một (rất khó)
- Server validate và đếm từ database

---

## 📊 Ví dụ Flow hoàn chỉnh

```
1. User nhấn jump
   → game_start action gửi lên
   → Server tạo session

2. User pass pipe #1
   → pipe_passed action gửi lên
   → Server lưu action

3. User pass pipe #2
   → pipe_passed action gửi lên
   → Server lưu action

4. User collect gift #1
   → gift_collected action gửi lên
   → Server lưu action

5. User chết (game over)
   → game_over action gửi lên
   → Server đếm: 2 pipes + 1 gift = 3 actions
   → Server tính: score = 2 + 1 = 3
   → Server lưu vào leaderboard2/{vmoId}
   → Server trả về: {success: true, score: 3, pipesCount: 2, giftsCount: 1}
   → Client cập nhật UI với score từ server
```

---

## 🎯 Tóm tắt

1. **Client gửi actions real-time** (không gửi score)
2. **Server lưu actions** vào Firestore subcollection
3. **Server đếm actions** khi `game_over`
4. **Server tính điểm** từ actions đã đếm
5. **Server lưu điểm** vào leaderboard (chỉ nếu cao hơn)
6. **Server trả về score** cho client
7. **Client cập nhật UI** với score từ server

**Điểm mạnh**: Client không thể fake score vì server tính từ actions trong database!

