# 🔒 Hướng dẫn Test Chống Gian Lận

## Tổng quan

File `test-anti-cheat.js` chứa các test cases để kiểm tra hệ thống chống gian lận. Script này sẽ thử các kịch bản hack phổ biến để đảm bảo hệ thống an toàn.

## Cài đặt

Script sử dụng Firebase SDK đã có trong project, không cần cài thêm.

## Cách chạy

### Cách 1: Sử dụng npm script

```bash
npm run test:security
```

### Cách 2: Chạy trực tiếp

```bash
node test-anti-cheat.js
```

### Cách 3: Với environment variables

```bash
export FIREBASE_API_KEY="your-api-key"
export FIREBASE_AUTH_DOMAIN="your-auth-domain"
export FIREBASE_PROJECT_ID="vmo-flappy-bird"
# ... các biến khác

node test-anti-cheat.js
```

Hoặc tạo file `.env` và load:

```bash
# .env
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-auth-domain
FIREBASE_PROJECT_ID=vmo-flappy-bird
FIREBASE_STORAGE_BUCKET=your-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

## Các Test Cases

### ✅ Test 1: Direct Write Fake Score
**Mục đích**: Kiểm tra Firestore rules có chặn client write không

**Kịch bản**: Client cố gắng ghi trực tiếp vào Firestore với score fake (99999)

**Kỳ vọng**: 
- ❌ Client KHÔNG thể ghi
- ✅ Firestore rules chặn với `permission-denied`

### ✅ Test 2: Send Score in Action
**Mục đích**: Kiểm tra Cloud Function có chấp nhận score từ client không

**Kịch bản**: Client gửi action với field `score` trong đó

**Kỳ vọng**:
- ❌ Function KHÔNG chấp nhận score từ client
- ✅ Function chỉ tính score từ `pipesPassed + giftsReceived`

### ✅ Test 3: Invalid Numbers
**Mục đích**: Kiểm tra validation của số liệu

**Kịch bản**: Client gửi:
- Số âm (`-10`)
- Số quá lớn (`999999999`)
- `NaN`
- String thay vì number (`"100"`)

**Kỳ vọng**:
- ✅ Server reject hoặc sanitize input
- ✅ Score cuối cùng hợp lệ (0-10000)

### ✅ Test 4: No Authentication
**Mục đích**: Kiểm tra function yêu cầu authentication

**Kịch bản**: Client gọi function mà không đăng nhập

**Kỳ vọng**:
- ❌ Function reject request
- ✅ Error code: `unauthenticated`

### ✅ Test 5: Invalid Action Type
**Mục đích**: Kiểm tra validation của action type

**Kịch bản**: Client gửi action type không hợp lệ (`hack`, `cheat`, `admin_update`, etc.)

**Kỳ vọng**:
- ❌ Function reject tất cả invalid types
- ✅ Error code: `invalid-argument`

### ⚠️ Test 6: Fake High Score
**Mục đích**: Kiểm tra client có thể fake pipesPassed/giftsReceived không

**Kịch bản**: Client gửi `pipesPassed=100, giftsReceived=50` (thực tế chỉ 7)

**Kỳ vọng**:
- ⚠️ Server tính score từ data client gửi (expected behavior hiện tại)
- 💡 Cần thêm validation: timing checks, rate limiting, game state tracking

**Lưu ý**: Đây là limitation hiện tại. Client có thể fake pipesPassed/giftsReceived, nhưng:
- Rate limiting giúp giảm spam
- Server validate format và range
- Có thể mở rộng với game state tracking

### ✅ Test 7: Rate Limiting
**Mục đích**: Kiểm tra rate limiting hoạt động

**Kịch bản**: Gửi 15 requests liên tiếp (limit là 10/phút)

**Kỳ vọng**:
- ✅ Một số requests bị rate limit
- ✅ Error code: `resource-exhausted`

## Kết quả mong đợi

```
🔒 ANTI-CHEAT SECURITY TESTS
============================================================
✅ PASSED: Direct Write Fake Score
✅ PASSED: Send Score in Action  
✅ PASSED: Invalid Numbers
✅ PASSED: No Authentication
✅ PASSED: Invalid Action Type
⚠️  PASSED: Fake High Score (limitation noted)
✅ PASSED: Rate Limiting

Total: 7/7 tests passed
🎉 All security tests passed!
```

## Giải thích các kết quả

### ✅ PASSED
Test đã pass, hệ thống chống được kịch bản hack này.

### ❌ FAILED
Test failed, có lỗ hổng bảo mật cần sửa ngay.

### ⚠️ PASSED với limitation
Test pass nhưng có limitation cần lưu ý. Ví dụ:
- Client có thể fake `pipesPassed`/`giftsReceived`
- Giải pháp: Thêm game state tracking, timing validation

## Cải thiện bảo mật

### Hiện tại đã có:
- ✅ Firestore rules chặn client write
- ✅ Cloud Function tính score server-side
- ✅ Authentication required
- ✅ Input validation
- ✅ Rate limiting

### Có thể thêm:
- 🔄 Game state tracking (track từng action trong session)
- ⏱️ Timing validation (kiểm tra thời gian hợp lý)
- 📊 Statistical analysis (phát hiện pattern bất thường)
- 🔐 Additional server-side validation

## Troubleshooting

### Lỗi: "Cannot find module 'firebase/app'"
**Giải pháp**: Đảm bảo đã cài dependencies:
```bash
npm install
```

### Lỗi: "Missing Firebase environment variables"
**Giải pháp**: Set environment variables hoặc tạo file `.env`

### Lỗi: "Permission denied"
**Giải pháp**: Đảm bảo Firestore rules đã được deploy và chặn client write

### Test luôn pass nhưng thực tế không an toàn
**Giải pháp**: 
- Kiểm tra lại Firestore rules
- Kiểm tra Cloud Function code
- Xem logs trong Firebase Console

## Lưu ý

- Test script sẽ tạo test documents trong Firestore với prefix `TEST_HACK_`
- Có thể xóa các documents này sau khi test
- Test script không ảnh hưởng đến dữ liệu production

