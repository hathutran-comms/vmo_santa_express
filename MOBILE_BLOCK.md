# 📱 Mobile Block - Chặn Người Chơi Mobile

## Tổng quan

Game đã được cấu hình để **chặn hoàn toàn** người chơi trên mobile devices. Khi phát hiện mobile, sẽ hiển thị thông báo yêu cầu chuyển sang PC và không cho phép tiếp tục.

## Tính năng

### ✅ Detection
- Detect mobile devices qua User Agent
- Detect touch devices
- Detect screen width <= 768px với touch support

### ✅ Blocking
- Hiển thị message yêu cầu chuyển sang PC
- Chặn tất cả touch events
- Chặn tất cả keyboard events
- Chặn scrolling
- Không cho phép tương tác với game

## Files đã tạo/cập nhật

### 1. **Component: MobileBlock** (`src/components/MobileBlock.jsx`)
- Component hiển thị message khi detect mobile
- Chặn mọi interaction (touch, keyboard, scroll)
- UI đẹp với animation

### 2. **Styles: MobileBlock.css** (`src/components/MobileBlock.css`)
- Styling cho mobile block overlay
- Responsive design
- Animation effects

### 3. **App.jsx**
- Import MobileBlock component
- Check `isMobile` trước khi render game
- Return MobileBlock nếu là mobile

## Mobile Detection Logic

```javascript
const isMobile = 
  /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (window.innerWidth <= 768 && 'ontouchstart' in window) ||
  (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
```

### Các thiết bị bị chặn:
- ✅ iPhone
- ✅ iPad
- ✅ Android phones/tablets
- ✅ Các thiết bị touch khác
- ✅ Màn hình <= 768px với touch support

## UI Message

Khi detect mobile, hiển thị:

```
📱 Mobile Not Supported

This game is only available on desktop/PC.

Please switch to a desktop computer or laptop to play.

For the best gaming experience, please use:
🖥️ Desktop Computer
💻 Laptop
⌨️ Keyboard & Mouse
```

## Behavior

1. **Khi load trên mobile:**
   - App detect mobile ngay lập tức
   - Hiển thị MobileBlock component
   - Chặn tất cả interactions

2. **Không thể bypass:**
   - Touch events bị chặn
   - Keyboard events bị chặn
   - Scrolling bị chặn
   - Không thể tương tác với game

3. **Chỉ có thể chơi trên:**
   - Desktop Computer
   - Laptop
   - PC với keyboard & mouse

## Testing

### Test trên Desktop:
```bash
npm run dev
# Mở browser → F12 → Toggle device toolbar
# Chọn mobile device → Sẽ thấy MobileBlock
```

### Test trên Mobile thật:
- Mở game trên mobile browser
- Sẽ thấy message yêu cầu chuyển sang PC
- Không thể tương tác với game

## Lưu ý

- Detection dựa trên User Agent và screen size
- Có thể bypass bằng cách thay đổi User Agent trong DevTools (nhưng đây là expected behavior cho testing)
- Production: Người dùng mobile thật sẽ bị chặn hoàn toàn

