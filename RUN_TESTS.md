# 🧪 Hướng dẫn chạy các Test Anti-Cheat

## Các file test có sẵn:

1. **test-vmo-id-validation.js** - Test validation VMO ID (4 chữ số)
2. **test-realtime-tracking.js** - Test real-time action tracking
3. **test-fake-pipes-gifts.js** - Test chống fake pipes/gifts
4. **test-anti-cheat.js** - Test tổng hợp anti-cheat
5. **test-anti-cheat-quick.js** - Test nhanh

## Cách chạy:

### 1. Test VMO ID Validation (không cần Firebase)
```bash
node test-vmo-id-validation.js
```

### 2. Test Real-time Tracking (cần Firebase config)
```bash
node test-realtime-tracking.js
```

### 3. Test Fake Pipes/Gifts (cần Firebase config)
```bash
node test-fake-pipes-gifts.js
```

### 4. Test Anti-Cheat Comprehensive (cần Firebase config)
```bash
npm run test:security
# hoặc
node test-anti-cheat.js
```

### 5. Chạy tất cả tests
```bash
node run-all-tests.js
```

## Yêu cầu:

- Node.js đã cài đặt
- File `.env` với Firebase config (cho các test cần Firebase):
  ```
  FIREBASE_API_KEY=your_api_key
  FIREBASE_AUTH_DOMAIN=your_auth_domain
  FIREBASE_PROJECT_ID=vmo-flappy-bird
  FIREBASE_STORAGE_BUCKET=your_storage_bucket
  FIREBASE_MESSAGING_SENDER_ID=your_sender_id
  FIREBASE_APP_ID=your_app_id
  ```

## Kết quả mong đợi:

### ✅ test-vmo-id-validation.js
- Test các trường hợp hợp lệ: 4 chữ số, có spaces ở đầu/cuối
- Test các trường hợp không hợp lệ: 3 chữ số, 5 chữ số, chữ cái, số thập phân, etc.

### ✅ test-realtime-tracking.js
- Test normal game flow: gửi actions và verify server đếm đúng
- Test fake actions: gửi nhiều actions và verify server chấp nhận

### ✅ test-fake-pipes-gifts.js
- Test fake high values: verify server reject hoặc đếm đúng từ actions
- Test với real-time tracking: verify server chỉ tin actions, không tin totals

### ✅ test-anti-cheat.js
- Test authentication
- Test invalid inputs
- Test rate limiting (đã xóa)
- Test VMO ID validation
- Test action validation

## Lưu ý:

- Các test cần Firebase sẽ tạo dữ liệu test trong Firestore
- Test có thể mất vài giây để hoàn thành
- Nếu test fail, kiểm tra Firebase config và network connection

