# ✅ Real-Time Action Tracking Implementation

## Đã triển khai

### 1. **Client Side (App.jsx & firebaseService.js)**

#### Thay đổi:
- ✅ Thêm `gameSessionIdRef` để track session
- ✅ Tạo session ID khi game start
- ✅ Gửi `game_start` action khi game bắt đầu
- ✅ Gửi `pipe_passed` action **real-time** khi pass pipe
- ✅ Gửi `gift_collected` action **real-time** khi collect gift
- ✅ Gửi `game_over` action khi game kết thúc (không gửi totals)

#### Functions mới:
```javascript
submitGameStart(vmoId, sessionId)      // Khi game bắt đầu
submitPipePassed(vmoId, sessionId)    // Khi pass pipe
submitGiftCollected(vmoId, sessionId) // Khi collect gift
savePlayerScore(vmoId, sessionId, playTimeSeconds) // Khi game over
```

### 2. **Server Side (Cloud Function)**

#### Thay đổi:
- ✅ Validate `sessionId` trong request
- ✅ Lưu từng action vào Firestore subcollection: `leaderboard2/{vmoId}/sessions/{sessionId}/actions`
- ✅ Khi `game_over`: Đếm actions từ session thay vì tin client totals
- ✅ Validate giới hạn hợp lý: MAX_PIPES = 1000, MAX_GIFTS = 1000
- ✅ Reject nếu vượt quá giới hạn hợp lý

#### Flow mới:
```
1. game_start → Tạo session document
2. pipe_passed → Lưu action vào session/actions
3. gift_collected → Lưu action vào session/actions
4. game_over → Đếm actions → Tính điểm → Update leaderboard
```

## Bảo mật

### ✅ Đã chống được:
1. **Fake totals**: Client không thể fake `pipesPassed`/`giftsReceived` vì server đếm từ actions
2. **Fake high values**: Server reject nếu > 1000 pipes hoặc > 1000 gifts
3. **Batch fake**: Phải fake từng action một (khó hơn nhiều)

### ⚠️ Vẫn có thể fake (nhưng khó hơn):
1. **Fake individual actions**: Vẫn có thể gửi fake `pipe_passed` actions
   - **Giải pháp**: Thêm rate limiting per action (đã có)
   - **Giải pháp**: Validate timestamp hợp lý giữa các actions
   - **Giải pháp**: Validate thứ tự actions (pipe phải có trước gift)

### 🔄 Có thể cải thiện thêm:
1. **Timestamp validation**: Kiểm tra khoảng cách thời gian hợp lý giữa actions
2. **Action order validation**: Validate thứ tự actions hợp lý
3. **Session timeout**: Xóa session cũ sau một thời gian
4. **Duplicate detection**: Phát hiện actions trùng lặp

## Firestore Structure

```
leaderboard2/
  {vmoId}/
    score: number
    updatedAt: timestamp
    pipesPassed: number
    giftsReceived: number
    lastSessionId: string
    sessions/
      {sessionId}/
        vmoId: string
        startedAt: timestamp
        createdAt: timestamp
        actions/
          {actionId}/
            type: string ('pipe_passed' | 'gift_collected')
            timestamp: number
            serverReceivedAt: number
```

## Testing

### Test fake pipes/gifts:
```bash
node test-fake-pipes-gifts.js
```

### Expected behavior:
- ✅ Normal values → Accepted
- ✅ Fake high values (> 1000) → Rejected
- ✅ Server counts from actions, not client totals

## Deploy

```bash
npm run firebase:deploy:functions
```

## Notes

- Actions được gửi async, không block game nếu fail
- Session ID được tạo khi game start
- Server đếm actions khi game_over
- Rate limiting vẫn áp dụng (10 requests/phút)

