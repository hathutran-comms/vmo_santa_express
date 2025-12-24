# 🔓 Phân tích Khả năng Hack - Fake Requests

## ⚠️ CÓ THỂ HACK - Nhưng khó hơn nhiều so với cách cũ

### ❌ **Cách cũ (trước real-time tracking):**
```javascript
// Hacker chỉ cần 1 request:
POST /submitAction
{
  vmoId: "0001",
  action: {
    type: "game_over",
    pipesPassed: 999999,  // ← Fake số lớn
    giftsReceived: 999999
  }
}
→ Score = 1,999,998 điểm (RẤT DỄ HACK)
```

### ⚠️ **Cách mới (real-time tracking):**
```javascript
// Hacker phải gửi NHIỀU requests:
POST /submitAction {type: "game_start"}      // Request 1
POST /submitAction {type: "pipe_passed"}     // Request 2
POST /submitAction {type: "pipe_passed"}     // Request 3
POST /submitAction {type: "pipe_passed"}     // Request 4
... (100 lần)
POST /submitAction {type: "game_over"}       // Request 101
→ Score = 100 điểm (KHÓ HƠN NHIỀU, nhưng vẫn có thể)
```

---

## 🔓 Các cách hack có thể

### 1. **Fake nhiều pipe_passed actions** ⚠️

**Cách hack:**
```javascript
// Script tự động gửi nhiều requests
for (let i = 0; i < 1000; i++) {
  await fetch('https://us-central1-vmo-flappy-bird.cloudfunctions.net/submitAction', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        vmoId: "0001",
        sessionId: "fake_session_123",
        action: {
          type: "pipe_passed",
          timestamp: Date.now()
        }
      }
    })
  });
}

// Sau đó gửi game_over
await fetch('...', {
  body: JSON.stringify({
    data: {
      vmoId: "0001",
      sessionId: "fake_session_123",
      action: {
        type: "game_over",
        timestamp: Date.now(),
        playTimeSeconds: 60
      }
    }
  })
});
```

**Kết quả:** Score = 1000 điểm (fake)

**Hiện tại:** ✅ **CÓ THỂ HACK** - Server chấp nhận tất cả actions

---

### 2. **Replay Attack** ⚠️

**Cách hack:**
```javascript
// Ghi lại actions từ một game hợp lệ
const validActions = [
  {type: "game_start", timestamp: 1000},
  {type: "pipe_passed", timestamp: 2000},
  {type: "pipe_passed", timestamp: 3000},
  // ...
];

// Replay lại với sessionId mới
for (const action of validActions) {
  await submitAction({
    vmoId: "0001",
    sessionId: "new_session",
    action: action
  });
}
```

**Kết quả:** Có thể replay lại game tốt nhiều lần

**Hiện tại:** ✅ **CÓ THỂ HACK** - Không có validation timestamp/session

---

### 3. **Session Hijacking** ⚠️

**Cách hack:**
```javascript
// Lấy sessionId từ một game hợp lệ của người khác
const stolenSessionId = "session_1234567890_abc";

// Gửi actions vào session đó
await submitAction({
  vmoId: "victim_vmo_id",
  sessionId: stolenSessionId,
  action: {type: "pipe_passed", timestamp: Date.now()}
});
```

**Kết quả:** Có thể thêm actions vào session của người khác

**Hiện tại:** ⚠️ **CÓ THỂ HACK** - Không validate session ownership

---

## 🛡️ Các biện pháp phòng thủ hiện tại

### ✅ **Đã có:**
1. ✅ **Authentication**: Phải đăng nhập Firebase Auth
2. ✅ **VMO ID validation**: Chỉ chấp nhận 4 chữ số
3. ✅ **Action type validation**: Chỉ chấp nhận valid types
4. ✅ **Server-side counting**: Server đếm từ database, không tin client
5. ✅ **Real-time tracking**: Phải fake từng action một

### ❌ **Chưa có:**
1. ❌ **Rate limiting**: Đã xóa (để hỗ trợ người chơi giỏi)
2. ❌ **Timing validation**: Không kiểm tra actions quá nhanh
3. ❌ **Session ownership**: Không validate session thuộc về user nào
4. ❌ **Timestamp validation**: Không kiểm tra timestamp hợp lý
5. ❌ **Duplicate detection**: Không phát hiện actions trùng lặp
6. ❌ **Game duration validation**: Không kiểm tra thời gian chơi hợp lý

---

## 💡 Cách cải thiện

### 1. **Thêm Session Ownership Validation**

```javascript
// functions/index.js
if (action.type === 'game_start') {
  // Lưu uid vào session
  await playerDocRef.collection('sessions').doc(sessionId).set({
    vmoId: sanitizedVmoId,
    uid: uid,  // ← Thêm uid
    startedAt: action.timestamp,
    createdAt: Date.now()
  });
}

// Khi nhận action, kiểm tra session ownership
const sessionDoc = await playerDocRef.collection('sessions').doc(sessionId).get();
if (!sessionDoc.exists || sessionDoc.data().uid !== uid) {
  throw new functions.https.HttpsError('permission-denied', 'Session does not belong to you');
}
```

### 2. **Thêm Timing Validation**

```javascript
// Kiểm tra actions không thể quá nhanh
const MIN_TIME_BETWEEN_PIPES = 500; // 500ms giữa các pipes
const lastPipeAction = await sessionActionsRef
  .where('type', '==', 'pipe_passed')
  .orderBy('timestamp', 'desc')
  .limit(1)
  .get();

if (!lastPipeAction.empty) {
  const lastTimestamp = lastPipeAction.docs[0].data().timestamp;
  const timeDiff = action.timestamp - lastTimestamp;
  if (timeDiff < MIN_TIME_BETWEEN_PIPES) {
    throw new functions.https.HttpsError('invalid-argument', 'Actions too fast');
  }
}
```

### 3. **Thêm Game Duration Validation**

```javascript
if (action.type === 'game_over') {
  const sessionDoc = await playerDocRef.collection('sessions').doc(sessionId).get();
  const gameStartTime = sessionDoc.data().startedAt;
  const gameDuration = action.timestamp - gameStartTime;
  const reportedDuration = action.playTimeSeconds * 1000;
  
  // Kiểm tra duration hợp lý (±10% sai số)
  if (Math.abs(gameDuration - reportedDuration) > reportedDuration * 0.1) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid game duration');
  }
  
  // Kiểm tra không thể có quá nhiều actions trong thời gian ngắn
  const actionsPerSecond = actionsSnapshot.size / (gameDuration / 1000);
  if (actionsPerSecond > 10) { // Hợp lý: < 10 actions/giây
    throw new functions.https.HttpsError('invalid-argument', 'Too many actions');
  }
}
```

### 4. **Thêm Duplicate Detection**

```javascript
// Kiểm tra không có actions trùng lặp
const duplicateCheck = await sessionActionsRef
  .where('type', '==', action.type)
  .where('timestamp', '==', action.timestamp)
  .get();

if (!duplicateCheck.empty) {
  throw new functions.https.HttpsError('invalid-argument', 'Duplicate action');
}
```

### 5. **Thêm Rate Limiting per Session**

```javascript
// Giới hạn số actions trong một session
const MAX_ACTIONS_PER_SESSION = 500; // Hợp lý cho một game

const actionsCount = await sessionActionsRef.count().get();
if (actionsCount.data().count >= MAX_ACTIONS_PER_SESSION) {
  throw new functions.https.HttpsError('resource-exhausted', 'Too many actions in session');
}
```

---

## 📊 Đánh giá hiện tại

### ✅ **Đã chống được:**
- Fake totals trực tiếp (không thể gửi `pipesPassed: 999999`)
- Modify game logic (không ảnh hưởng vì server validate)
- Direct Firestore write (bị chặn bởi Security Rules)

### ⚠️ **Vẫn có thể hack (nhưng khó hơn):**
- Fake nhiều actions (phải gửi nhiều requests)
- Replay attacks (có thể replay game tốt)
- Session hijacking (có thể dùng session của người khác)

### 🎯 **Điểm số: 6/10**
- Tốt hơn cách cũ rất nhiều
- Nhưng vẫn có thể hack nếu hacker kiên nhẫn
- Cần thêm validation để chặt chẽ hơn

---

## 💡 Khuyến nghị

### Option 1: Giữ nguyên (Khuyến nghị cho game nhỏ)
- ✅ Đã chống được hầu hết các hack đơn giản
- ✅ Fake khó hơn nhiều so với cách cũ
- ⚠️ Vẫn có thể hack nếu hacker kiên nhẫn

### Option 2: Thêm validation (Nếu cần chặt chẽ hơn)
- ✅ Thêm session ownership validation
- ✅ Thêm timing validation
- ✅ Thêm game duration validation
- ✅ Thêm duplicate detection
- ✅ Thêm rate limiting per session

---

## 🔒 Kết luận

**CÓ THỂ HACK**, nhưng:
- ✅ Khó hơn rất nhiều so với cách cũ
- ✅ Phải fake từng action một (rất tốn thời gian)
- ✅ Dễ phát hiện hơn (nhiều requests trong thời gian ngắn)
- ⚠️ Vẫn có thể hack nếu hacker kiên nhẫn và có kỹ năng

**Để chặt chẽ hơn**, nên thêm:
1. Session ownership validation
2. Timing validation
3. Game duration validation
4. Duplicate detection

