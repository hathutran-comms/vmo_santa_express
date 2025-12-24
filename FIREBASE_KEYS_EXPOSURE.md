# 🔍 Firebase API Keys Bị Lộ Ở Đâu?

## 📍 Các Vị Trí Firebase Keys Bị Expose

### 1. **Trong Source Code** (Development)

**File**: `src/firebase.js:19-24`
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.FIREBASE_API_KEY,  // ← Keys được load từ env
  authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.FIREBASE_PROJECT_ID,
  // ...
};
```

**File**: `vite.config.js:62-68`
```javascript
define: {
  'import.meta.env.FIREBASE_API_KEY': JSON.stringify(firebaseConfig.FIREBASE_API_KEY),
  // ← Keys được embed vào bundle khi build
}
```

---

### 2. **Trong Production Bundle** (Build Output)

Khi chạy `npm run build`, Vite sẽ:
1. Đọc environment variables từ `.env` hoặc system env
2. **Embed trực tiếp** vào JavaScript bundle
3. Bundle được deploy lên server và download về browser

**File bundle**: `dist/assets/firebase-vendor-*.js` hoặc `dist/assets/index-*.js`

**Có thể tìm thấy**:
```javascript
// Trong bundle (đã minify):
const firebaseConfig = {
  apiKey: "AIzaSyC...",  // ← API key được hardcode vào bundle
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ...
};
```

---

### 3. **Trong Browser** (Runtime)

Sau khi bundle được load vào browser:

#### a) **Browser DevTools → Sources**
- Mở F12 → Sources tab
- Tìm file `firebase-vendor-*.js` hoặc `index-*.js`
- Search "apiKey" → Sẽ thấy Firebase config

#### b) **Browser DevTools → Console**
```javascript
// Có thể access Firebase config từ console:
import { initializeApp } from 'firebase/app';
// Hoặc nếu đã initialize:
firebase.app().options.apiKey  // ← Trả về API key
```

#### c) **Network Tab**
- Xem các requests đến Firebase
- Headers hoặc request body có thể chứa API key

#### d) **View Page Source**
- Right-click → View Page Source
- Search "apiKey" → Có thể thấy trong inline scripts

---

## 🔍 Cách Kiểm Tra

### 1. Kiểm tra trong Bundle đã build:
```bash
# Tìm API key trong bundle
grep -r "apiKey" dist/assets/*.js

# Hoặc search pattern Firebase key (bắt đầu bằng AIza)
strings dist/assets/firebase-vendor-*.js | grep "AIza"
```

### 2. Kiểm tra trong Browser:
1. Mở website
2. F12 → Console
3. Gõ: `firebase.app().options` (nếu đã init)
4. Hoặc search trong Sources tab: "apiKey"

---

## ⚠️ Tại Sao Đây Là Vấn Đề?

### Firebase API Keys là **PUBLIC KEYS** (không phải secrets)
- ✅ **Bình thường**: Firebase keys được thiết kế để expose trong client
- ✅ **An toàn**: Keys chỉ cho phép access với quyền hạn đã cấu hình
- ⚠️ **Nhưng**: Nếu không restrict, ai cũng có thể dùng key của bạn

### Rủi ro nếu không restrict:
1. **Quota abuse**: Người khác dùng key của bạn → tốn quota
2. **Spam requests**: Gửi nhiều requests → tốn tiền
3. **Unauthorized access**: Nếu rules không chặt → có thể access data

---

## ✅ Giải Pháp Bảo Vệ

### 1. **Restrict API Keys trong Firebase Console** (QUAN TRỌNG)

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. **APIs & Services** → **Credentials**
4. Tìm API key của bạn (Web API Key)
5. Click **Edit**
6. **Application restrictions**:
   - Chọn **HTTP referrers (web sites)**
   - Thêm domain của bạn: `https://yourdomain.com/*`
   - Thêm localhost cho dev: `http://localhost:*`
7. **API restrictions**:
   - Chọn **Restrict key**
   - Chỉ enable các APIs cần thiết:
     - Firebase Authentication API
     - Cloud Firestore API
     - Cloud Functions API
8. **Save**

### 2. **Enable Firebase App Check** (KHUYẾN NGHỊ)

Firebase App Check giúp:
- Verify requests đến từ app hợp lệ
- Chống bot và abuse
- Bảo vệ backend resources

**Cách enable**:
1. Firebase Console → **App Check**
2. Register app
3. Chọn provider (reCAPTCHA v3 cho web)
4. Enable trong Cloud Functions

### 3. **Firestore Security Rules** (ĐÃ CÓ)

✅ Đã có rules chặn client write trực tiếp:
```javascript
match /leaderboard2/{vmoId} {
  allow read: if true;
  allow create: if false;  // ← Chặn client write
  allow update: if false;
  allow delete: if false;
}
```

### 4. **Cloud Functions Authentication** (ĐÃ CÓ)

✅ Đã yêu cầu authentication:
```javascript
if (!context.auth) {
  throw new functions.https.HttpsError('unauthenticated', ...);
}
```

---

## 📊 Tóm Tắt

| Vị trí | Có lộ không? | Mức độ nguy hiểm | Giải pháp |
|--------|--------------|------------------|-----------|
| Source code | ✅ Có (bình thường) | 🟢 Low | Dùng env vars (đã có) |
| Production bundle | ✅ Có (bình thường) | 🟡 Medium | Restrict keys |
| Browser DevTools | ✅ Có (bình thường) | 🟡 Medium | App Check |
| Network requests | ✅ Có (bình thường) | 🟡 Medium | Restrict keys |

---

## 🎯 Kết Luận

**Firebase API keys BỊ LỘ là BÌNH THƯỜNG** vì:
- ✅ Firebase thiết kế keys để public
- ✅ Security dựa vào **Rules** và **Restrictions**, không phải ẩn keys
- ✅ Backend đã được bảo vệ tốt (Security Rules + Auth)

**Nhưng nên làm**:
1. ✅ **Restrict API keys** trong Google Cloud Console
2. ✅ **Enable Firebase App Check**
3. ✅ **Review Security Rules** thường xuyên

**Điều quan trọng**: Keys bị lộ không phải vấn đề nếu đã restrict đúng cách! 🔒

