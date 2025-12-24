# 🔍 Hướng dẫn Debug với Logging

## ✅ Đã thêm logging vào:

1. **Client Side** (`src/services/firebaseService.js` & `src/App.jsx`)
   - Log khi bắt đầu save score
   - Log authentication
   - Log validation
   - Log request/response từ Cloud Function
   - Log errors chi tiết

2. **Server Side** (`functions/index.js`)
   - Log khi function được gọi
   - Log authentication check
   - Log validation steps
   - Log score calculation
   - Log Firestore operations
   - Log errors chi tiết

## 📋 Cách xem logs

### 1. Client Logs (Browser Console)

Mở **Browser DevTools** (F12) → **Console** tab:

```
[App] 🎮 Game Over - Saving score
[CLIENT] savePlayerScore - Called
[CLIENT] submitActionToServer - START
[CLIENT] Ensuring anonymous auth...
[CLIENT] Anonymous auth successful
[CLIENT] Validating VMO ID: 2088
[CLIENT] VMO ID validated: 2088
[CLIENT] Calling Cloud Function with data: {...}
[CLIENT] Cloud Function response: {...}
[CLIENT] ✅ Success! Score from server: 15
[App] ✅ Score saved successfully!
```

### 2. Server Logs (Firebase Console)

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project `vmo flappy bird`
3. Vào **Functions** → **Logs**
4. Tìm function `submitAction`

Hoặc dùng CLI:

```bash
npx firebase functions:log --only submitAction
```

Logs sẽ hiển thị:

```
[FUNCTION] submitAction - START
[FUNCTION] ✅ Authenticated user: abc123...
[FUNCTION] Received data: {...}
[FUNCTION] ✅ VMO ID validated: 2088
[FUNCTION] Processing game_over action
[FUNCTION] Score calculation: {...}
[FUNCTION] ✅ New score is higher! Will update
[FUNCTION] Writing to Firestore: {...}
[FUNCTION] ✅ Successfully wrote to Firestore
```

## 🚀 Deploy lại Function để có logging mới

```bash
npm run firebase:deploy:functions
# hoặc
npx firebase deploy --only functions:submitAction
```

## 🔍 Các điểm cần kiểm tra khi debug

### 1. Client không gọi function?

**Kiểm tra:**
- `[App] Game over check:` - Xem điều kiện có đúng không
- `hasRecordedScore` có phải `true` không?
- `vmoId` có giá trị không?

### 2. Authentication failed?

**Kiểm tra:**
- `[CLIENT] Anonymous auth successful` - Có log này không?
- Nếu không có → Kiểm tra Firebase config

### 3. Function không nhận được request?

**Kiểm tra:**
- `[CLIENT] Calling Cloud Function with data:` - Có log này không?
- `[FUNCTION] submitAction - START` - Có log này trong Firebase Console không?
- Nếu không có → Kiểm tra function đã deploy chưa

### 4. Validation failed?

**Kiểm tra:**
- `[FUNCTION] ❌ Invalid VMO ID` - VMO ID có đúng format không?
- `[FUNCTION] ❌ Invalid action format` - Action object có đúng structure không?

### 5. Score không được cập nhật?

**Kiểm tra:**
- `[FUNCTION] Score calculation:` - Score được tính đúng không?
- `[FUNCTION] ⚠️ New score is not higher` - Score mới có cao hơn score cũ không?
- `[FUNCTION] Writing to Firestore:` - Có log này không?
- `[FUNCTION] ✅ Successfully wrote to Firestore` - Có log này không?

### 6. Firestore write failed?

**Kiểm tra:**
- `[FUNCTION] ❌ Error in submitAction:` - Xem error message
- Kiểm tra Firestore Rules có đúng không
- Kiểm tra Cloud Function có quyền ghi không (Admin SDK)

## 📊 Flow hoàn chỉnh với logs

```
[App] 🎮 Game Over - Saving score
  ↓
[CLIENT] savePlayerScore - Called
  ↓
[CLIENT] submitActionToServer - START
  ↓
[CLIENT] Ensuring anonymous auth...
  ↓
[CLIENT] Anonymous auth successful
  ↓
[CLIENT] Validating VMO ID
  ↓
[CLIENT] VMO ID validated
  ↓
[CLIENT] Calling Cloud Function
  ↓
[FUNCTION] submitAction - START
  ↓
[FUNCTION] ✅ Authenticated user
  ↓
[FUNCTION] Validating VMO ID
  ↓
[FUNCTION] ✅ VMO ID validated
  ↓
[FUNCTION] Validating action
  ↓
[FUNCTION] ✅ Action validated
  ↓
[FUNCTION] Checking rate limit
  ↓
[FUNCTION] ✅ Rate limit check passed
  ↓
[FUNCTION] Getting player document
  ↓
[FUNCTION] Processing game_over action
  ↓
[FUNCTION] Score calculation
  ↓
[FUNCTION] ✅ New score is higher! Will update
  ↓
[FUNCTION] Writing to Firestore
  ↓
[FUNCTION] ✅ Successfully wrote to Firestore
  ↓
[CLIENT] ✅ Success! Score from server
  ↓
[App] ✅ Score saved successfully!
```

## ⚠️ Lưu ý

- Logs sẽ hiển thị trong **Browser Console** (client) và **Firebase Console** (server)
- Đảm bảo đã deploy lại function sau khi thêm logging
- Nếu không thấy logs, kiểm tra:
  - Function đã deploy chưa?
  - Browser console có bị filter không?
  - Firebase Console logs có được enable không?

## 🐛 Common Issues

### Issue: Không thấy logs trong Firebase Console

**Giải pháp:**
- Đợi vài giây (logs có thể delay)
- Refresh Firebase Console
- Kiểm tra function đã được gọi chưa (xem client logs)

### Issue: Logs quá nhiều

**Giải pháp:**
- Có thể tắt một số logs không cần thiết
- Hoặc filter logs trong console

### Issue: Function không được gọi

**Giải pháp:**
- Kiểm tra `[App] Game over check:` log
- Kiểm tra `hasRecordedScoreRef.current` có phải `false` không
- Kiểm tra `vmoId` có giá trị không

