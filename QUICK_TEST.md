# 🚀 Quick Test - Chạy Test Chống Gian Lận

## Cách nhanh nhất

### Bước 1: Lấy Firebase Config từ Browser

1. Chạy app: `npm run dev`
2. Mở browser → F12 → Console
3. Gõ lệnh này và copy output:

```javascript
JSON.stringify(firebase.app().options, null, 2)
```

### Bước 2: Set Environment Variables

Tạo file `.env.test` hoặc export trực tiếp:

```bash
# Copy config từ browser và set như sau:
export FIREBASE_API_KEY="your-api-key-from-browser"
export FIREBASE_AUTH_DOMAIN="your-auth-domain-from-browser"
export FIREBASE_PROJECT_ID="vmo-flappy-bird"
export FIREBASE_STORAGE_BUCKET="your-storage-bucket"
export FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
export FIREBASE_APP_ID="your-app-id"
```

### Bước 3: Chạy Test

```bash
# Load env vars và chạy test
source .env.test  # hoặc export từng biến
npm run test:security
```

## Hoặc Hardcode (Chỉ để test)

Sửa file `test-anti-cheat.js`, tìm dòng:

```javascript
} else {
  // Nếu không có env vars, yêu cầu user set hoặc hardcode
```

Và thay bằng:

```javascript
} else {
  // Hardcode config (CHỈ ĐỂ TEST, KHÔNG COMMIT)
  firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    projectId: "vmo-flappy-bird",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
  };
}
```

Sau đó chạy: `npm run test:security`

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

## Troubleshooting

### "Missing Firebase config"
→ Set environment variables hoặc hardcode config trong script

### "Permission denied"
→ Đảm bảo Firestore rules đã được deploy

### "Function not found"
→ Đảm bảo Cloud Function đã được deploy:
```bash
npm run firebase:deploy:functions
```

