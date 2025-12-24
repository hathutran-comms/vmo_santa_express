# Hướng dẫn Deploy Firebase Cloud Functions

## Yêu cầu

1. Node.js 18+ đã được cài đặt
2. Firebase CLI đã được cài đặt (local trong project): `npm install --save-dev firebase-tools` ✅ **Đã cài**
3. Đã đăng nhập Firebase: `npm run firebase:login` hoặc `npx firebase login`
4. Đã khởi tạo Firebase project: `npm run firebase:init` hoặc `npx firebase init` (nếu chưa)

## Các bước deploy

### 1. Cài đặt dependencies cho Functions

```bash
cd functions
npm install
cd ..
```

### 2. Đăng nhập Firebase (nếu chưa)

```bash
npm run firebase:login
# hoặc
npx firebase login
```

### 3. Deploy Cloud Functions

```bash
npm run firebase:deploy:functions
# hoặc
npx firebase deploy --only functions
```

Hoặc deploy cụ thể function `submitAction`:

```bash
npx firebase deploy --only functions:submitAction
```

### 4. Deploy Firestore Security Rules

```bash
npm run firebase:deploy:rules
# hoặc
npx firebase deploy --only firestore:rules
```

### 5. Deploy tất cả (Functions + Rules) - **KHUYẾN NGHỊ**

```bash
npm run firebase:deploy
# hoặc
npx firebase deploy --only functions,firestore:rules
```

## Kiểm tra sau khi deploy

### Test Cloud Function từ Firebase Console

1. Vào Firebase Console > Functions
2. Tìm function `submitAction`
3. Click vào function để xem logs và metrics

### Test từ client code

Sử dụng code trong `client-example.js` để test:

```javascript
import { onGameOver } from './client-example';

// Test với dữ liệu mẫu
onGameOver('2088', 10, 5, 120)
  .then(score => {
    console.log('Final score:', score);
  })
  .catch(err => {
    console.error('Error:', err);
  });
```

## Troubleshooting

### Lỗi: "Functions did not deploy properly"

- Kiểm tra Node.js version: `node --version` (phải >= 18)
- Kiểm tra dependencies: `cd functions && npm install`
- Kiểm tra syntax: `cd functions && npm run lint`

### Lỗi: "Permission denied"

- Đảm bảo đã login: `npm run firebase:login` hoặc `npx firebase login`
- Đảm bảo có quyền deploy trên project: `npx firebase projects:list`

### Lỗi: "firebase: command not found"

- Firebase CLI đã được cài local trong project
- Sử dụng `npm run firebase:*` hoặc `npx firebase` thay vì `firebase` trực tiếp

### Lỗi: "Firestore rules deployment failed"

- Kiểm tra syntax của `firestore.rules`
- Đảm bảo file `firebase.json` đúng cấu trúc

## Cấu trúc files sau khi deploy

```
vmo_santa_flabby_bird/
├── functions/
│   ├── index.js          # Cloud Function code
│   ├── package.json      # Dependencies
│   └── node_modules/     # Installed packages
├── firebase.json         # Firebase config
├── firestore.rules       # Security rules
└── client-example.js     # Client integration example
```

## Lưu ý quan trọng

1. **Không commit secrets**: Đảm bảo `.env` và các file chứa secrets không được commit
2. **Test trước khi deploy**: Sử dụng Firebase Emulator để test local trước
3. **Monitor logs**: Sau khi deploy, theo dõi logs để phát hiện lỗi
4. **Rate limiting**: Function có rate limiting (10 requests/phút), điều chỉnh nếu cần

## Firebase Emulator (Test local)

Để test local trước khi deploy:

```bash
# Cài đặt emulator
npx firebase init emulators

# Chạy emulator
npx firebase emulators:start --only functions,firestore

# Test từ client với emulator
# Sử dụng useEmulator trong firebase.js:
import { connectFunctionsEmulator } from 'firebase/functions';
const functions = getFunctions();
connectFunctionsEmulator(functions, 'localhost', 5001);
```

