# 🔧 Fix Best Score Logic

## Vấn đề

- Điểm vẫn lưu vào collection `leaderboard` (cũ) thay vì `leaderboard2`
- Best score không được cập nhật đúng

## Đã sửa

### 1. **Collection Migration**
- ✅ Đã đổi `LEADERBOARD_COLLECTION` từ `'leaderboard'` → `'leaderboard2'`
- ✅ Đã deploy Cloud Function với collection mới
- ✅ Đã deploy Firestore Rules với collection mới

### 2. **Best Score Logic** (Cải thiện)

**Vấn đề cũ:**
- So sánh `serverScore > highScore` nhưng `highScore` có thể từ localStorage (không sync với Firebase)
- Không load highScore từ Firebase trước khi so sánh

**Đã sửa:**
1. **Load highScore từ Firebase TRƯỚC khi save**
   ```javascript
   getPlayerHighScore(vmoId)
     .then((firebaseHighScore) => {
       // Cập nhật highScore state
       // Sau đó mới save
     })
   ```

2. **Luôn cập nhật highScore từ server response**
   ```javascript
   // Server trả về score mới nếu cao hơn, hoặc previousScore nếu không
   setHighScore(serverScore);
   localStorage.setItem('santaFlappyHighScore', serverScore.toString());
   ```

3. **Load lại từ Firebase sau khi save để đảm bảo đồng bộ**
   ```javascript
   getPlayerHighScore(vmoId)
     .then((firebaseHighScore) => {
       // Cập nhật lại để đảm bảo sync
     })
   ```

## Flow mới

```
Game Over
  ↓
Load highScore từ Firebase (leaderboard2)
  ↓
Cập nhật highScore state nếu cần
  ↓
Gọi Cloud Function savePlayerScore
  ↓
Server tính score và so sánh với previousScore
  ↓
Nếu cao hơn → Update Firestore (leaderboard2)
  ↓
Trả về score (newScore hoặc previousScore)
  ↓
Client cập nhật highScore từ server response
  ↓
Lưu vào localStorage
  ↓
Load lại từ Firebase để đảm bảo sync
```

## Kiểm tra

1. **Collection**: Kiểm tra Firestore Console → Collection `leaderboard2` đã được tạo và có data
2. **Best Score**: Kiểm tra best score có được cập nhật đúng không
3. **Logs**: Xem console logs để debug:
   - `[App] Current high score from Firestore`
   - `[App] savePlayerScore response`
   - `[FUNCTION] Score calculation`
   - `[FUNCTION] Writing to Firestore`

## Deploy Status

- ✅ Firestore Rules: Đã deploy với `leaderboard2`
- ✅ Cloud Function: Đã deploy với `leaderboard2`
- ✅ Client Code: Đã cập nhật với `leaderboard2`

## Lưu ý

- Collection cũ `leaderboard` vẫn tồn tại nhưng không được sử dụng
- Best score giờ sẽ luôn sync với Firebase
- localStorage chỉ là cache, Firebase là source of truth

