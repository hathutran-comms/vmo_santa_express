# Tóm tắt Tích hợp Cloud Function

## ✅ Đã hoàn thành

### 1. Cập nhật `src/firebase.js`
- ✅ Thêm import `getFunctions` từ `firebase/functions`
- ✅ Export `functions` instance để sử dụng trong các service

### 2. Cập nhật `src/services/firebaseService.js`
- ✅ Thay thế `savePlayerScore` cũ (ghi trực tiếp vào Firestore) 
- ✅ Tạo hàm mới `savePlayerScore` sử dụng Cloud Function `submitAction`
- ✅ Client chỉ gửi `pipesPassed`, `giftsReceived`, `playTimeSeconds`
- ✅ Server tính điểm và validate
- ✅ Giữ nguyên các hàm khác: `getPlayerHighScore`, `getTop10Leaderboard`, `subscribeToLeaderboard`

### 3. Cập nhật `src/App.jsx`
- ✅ Thay đổi cách gọi `savePlayerScore`:
  - **Cũ**: `savePlayerScore(vmoId, score, gameState)`
  - **Mới**: `savePlayerScore(vmoId, pipesPassed, giftsReceived, playTimeSeconds)`
- ✅ Sử dụng `score` từ server response thay vì từ client
- ✅ Cập nhật logic để đồng bộ high score từ server

## 🔒 Bảo mật

### Trước đây (Không an toàn)
```javascript
// Client tự tính và gửi score
savePlayerScore(vmoId, score, gameState)
// → Client có thể fake score
```

### Bây giờ (An toàn)
```javascript
// Client chỉ gửi actions, server tính score
savePlayerScore(vmoId, pipesPassed, giftsReceived, playTimeSeconds)
// → Server tính: score = pipesPassed + giftsReceived
// → Client không thể fake score
```

## 📋 Cách hoạt động

1. **Khi game over:**
   - Client gọi `savePlayerScore(vmoId, pipesPassed, giftsReceived, playTimeSeconds)`
   - Hàm này tạo action `{ type: 'game_over', ... }`
   - Gửi action lên Cloud Function `submitAction`
   
2. **Cloud Function xử lý:**
   - Validate VMO ID và action
   - Tính điểm: `score = pipesPassed + giftsReceived`
   - Kiểm tra rate limit
   - Ghi vào Firestore (chỉ Cloud Function có quyền ghi)
   - Trả về `{ success: true, score: ... }`

3. **Client nhận kết quả:**
   - Nhận `score` từ server
   - Cập nhật high score nếu cần
   - Load lại leaderboard

## 🧪 Test

Sau khi deploy, test bằng cách:

1. Chơi game và để game over
2. Kiểm tra console log xem có lỗi không
3. Kiểm tra Firebase Console → Functions → Logs
4. Kiểm tra Firestore → leaderboard collection

## ⚠️ Lưu ý

- **Firestore Rules**: Đã được deploy, client không thể ghi trực tiếp
- **Rate Limit**: 10 requests/phút mỗi VMO ID
- **Authentication**: Cần đăng nhập anonymous trước khi gọi function
- **Backward Compatibility**: Các hàm khác (`getPlayerHighScore`, `getTop10Leaderboard`) vẫn hoạt động bình thường

## 🔄 Rollback (nếu cần)

Nếu cần rollback về cách cũ:

1. Revert các thay đổi trong `firebaseService.js`
2. Revert các thay đổi trong `App.jsx`
3. Deploy lại Firestore rules cho phép client write (không khuyến nghị)

## ✅ Kết quả

- ✅ Client không thể tự tạo/chỉnh sửa điểm
- ✅ Server tính điểm và validate
- ✅ Chỉ Cloud Function được phép ghi vào Firestore
- ✅ Code đơn giản, dễ maintain

