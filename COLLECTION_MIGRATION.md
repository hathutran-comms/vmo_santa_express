# 🔄 Migration: leaderboard → leaderboard2

## Tổng quan

Đã chuyển từ collection `leaderboard` sang `leaderboard2` trên Firebase. Tất cả logic giữ nguyên, chỉ thay đổi tên collection.

## Files đã cập nhật

### 1. **Client Service** (`src/services/firebaseService.js`)
```javascript
// CŨ
const LEADERBOARD_COLLECTION = 'leaderboard';

// MỚI
const LEADERBOARD_COLLECTION = 'leaderboard2';
```

### 2. **Cloud Function** (`functions/index.js`)
```javascript
// CŨ
const LEADERBOARD_COLLECTION = 'leaderboard';

// MỚI
const LEADERBOARD_COLLECTION = 'leaderboard2';
```

### 3. **Firestore Rules** (`firestore.rules`)
```javascript
// CŨ
match /leaderboard/{vmoId} {

// MỚI
match /leaderboard2/{vmoId} {
```

## Logic giữ nguyên

- ✅ Tất cả validation logic
- ✅ Score calculation
- ✅ Rate limiting
- ✅ Authentication
- ✅ Security rules (chặn client write)
- ✅ API functions (savePlayerScore, getTop10Leaderboard, getPlayerHighScore)

## Deploy

Cần deploy lại Firestore rules:

```bash
npm run firebase:deploy:rules
```

Cloud Function không cần deploy lại (chỉ đổi constant, code không thay đổi), nhưng nên deploy để đảm bảo:

```bash
npm run firebase:deploy:functions
```

Hoặc deploy tất cả:

```bash
npm run firebase:deploy
```

## Lưu ý

- **Collection cũ (`leaderboard`)**: Vẫn tồn tại trong Firestore nhưng không được sử dụng nữa
- **Collection mới (`leaderboard2`)**: Sẽ được tạo tự động khi có data đầu tiên
- **Migration data**: Nếu cần migrate data từ `leaderboard` sang `leaderboard2`, cần script riêng
- **Backward compatibility**: Code cũ sẽ không hoạt động với collection mới (expected)

## Kiểm tra

Sau khi deploy, kiểm tra:

1. **Firestore Console**: Xem collection `leaderboard2` đã được tạo chưa
2. **Test game**: Chơi game và kiểm tra điểm có được lưu vào `leaderboard2` không
3. **Leaderboard**: Kiểm tra leaderboard có hiển thị đúng không

## Rollback (nếu cần)

Nếu cần rollback về `leaderboard`:

1. Revert các thay đổi trong 3 files trên
2. Deploy lại rules và functions
3. Data trong `leaderboard2` sẽ không được sử dụng

