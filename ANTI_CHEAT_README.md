# Kiến trúc Chống Gian Lận - Firebase Cloud Functions

## Tổng quan

Hệ thống chống gian lận được thiết kế để đảm bảo:
- ✅ Người chơi **KHÔNG THỂ** tự tạo/chỉnh sửa điểm
- ✅ Client chỉ gửi **hành động (actions)**, không gửi score
- ✅ Server tính điểm và validate tất cả logic
- ✅ Chỉ Cloud Function được phép ghi vào Firestore

## Kiến trúc

```
Client (React App)
    ↓ Gửi { action, vmoId }
Cloud Function (submitAction)
    ↓ Validate & Tính điểm
Firestore (leaderboard collection)
    ↓ Chỉ Cloud Function có quyền write
```

## Cấu trúc Files

```
functions/
├── index.js              # Cloud Function submitAction
├── package.json          # Dependencies (Node.js 18)
└── .eslintrc.js         # ESLint config

firebase.json            # Firebase project config
firestore.rules          # Security rules (chặn client write)
client-example.js        # Ví dụ tích hợp vào client
DEPLOY.md                # Hướng dẫn deploy chi tiết
```

## Cloud Function: submitAction

### Input

```javascript
{
  vmoId: string,        // VMO ID của người chơi
  action: {
    type: string,       // 'pipe_passed' | 'gift_collected' | 'game_over'
    timestamp: number,  // Timestamp của action
    
    // Chỉ khi type === 'game_over':
    pipesPassed: number,      // Số pipes đã pass
    giftsReceived: number,    // Số gifts đã nhận
    playTimeSeconds?: number  // Thời gian chơi (optional)
  }
}
```

### Output

```javascript
{
  success: boolean,
  score: number,        // Điểm từ server (không phải từ client)
  message?: string,
  previousScore?: number
}
```

### Validation

1. ✅ **Authentication**: Yêu cầu Firebase Auth
2. ✅ **VMO ID**: Validate format và length
3. ✅ **Action**: Validate type và data structure
4. ✅ **Rate Limiting**: Tối đa 10 requests/phút
5. ✅ **Score Calculation**: Server tính điểm = pipesPassed + giftsReceived

## Firestore Security Rules

```javascript
match /leaderboard/{vmoId} {
  allow read: if true;   // Cho phép đọc để hiển thị leaderboard
  allow write: if false; // CHẶN tất cả write từ client
}
```

**Lưu ý**: Chỉ Cloud Function (dùng Admin SDK) mới có quyền ghi.

## Tích hợp vào Client

### Bước 1: Cập nhật firebase.js

Đảm bảo đã import `getFunctions`:

```javascript
import { getFunctions } from 'firebase/functions';
export const functions = getFunctions();
```

### Bước 2: Tạo service mới

Copy code từ `client-example.js` vào `src/services/firebaseService.js` hoặc tạo file mới.

### Bước 3: Thay thế savePlayerScore

Trong `App.jsx`, thay thế:

```javascript
// CŨ (không an toàn)
savePlayerScore(vmoId, score, gameState)

// MỚI (an toàn)
import { onGameOver } from './services/firebaseService';

const finalScore = await onGameOver(
  vmoId,
  pipesPassedRef.current,
  giftsReceivedRef.current,
  Math.floor((Date.now() - gameStartTimeRef.current) / 1000)
);

if (finalScore !== null) {
  setScore(finalScore); // Dùng score từ server
  loadLeaderboard();
}
```

## Deploy

### Quick Deploy

```bash
# 1. Cài dependencies
cd functions && npm install && cd ..

# 2. Deploy functions và rules
firebase deploy --only functions,firestore:rules
```

Xem chi tiết trong `DEPLOY.md`.

## Bảo mật

### ✅ Đã implement

- [x] Client không thể gửi score
- [x] Server tính điểm từ actions
- [x] Firestore rules chặn client write
- [x] Rate limiting chống spam
- [x] Authentication required
- [x] Input validation

### ⚠️ Lưu ý

1. **Không có secret ở client**: Tất cả validation ở server
2. **Không hash ở client**: Hash không có tác dụng nếu secret ở client
3. **Không tin dữ liệu từ client**: Server validate và tính toán lại tất cả

## Testing

### Test với Firebase Emulator

```bash
firebase emulators:start --only functions,firestore
```

### Test từ client

```javascript
import { onGameOver } from './client-example';

// Test
onGameOver('2088', 10, 5, 120)
  .then(score => console.log('Score:', score))
  .catch(err => console.error('Error:', err));
```

## Troubleshooting

### Lỗi: "User must be authenticated"

- Đảm bảo đã gọi `ensureAnonymousAuth()` trước khi gọi function

### Lỗi: "Invalid action format"

- Kiểm tra action object có đúng structure không
- Xem ví dụ trong `client-example.js`

### Lỗi: "Too many requests"

- Rate limit: 10 requests/phút
- Đợi 1 phút hoặc điều chỉnh trong `functions/index.js`

## Tóm tắt

✅ **Client**: Chỉ gửi actions (pipe_passed, gift_collected, game_over)  
✅ **Server**: Tính điểm và validate  
✅ **Firestore**: Chỉ Cloud Function được ghi  
✅ **Security**: Rate limiting + Authentication + Validation  

**Kết quả**: Người chơi không thể tự tạo/chỉnh sửa điểm! 🎉

