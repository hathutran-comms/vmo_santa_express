# 🚀 Hướng dẫn Deploy Nhanh

## ✅ Đã hoàn thành

- [x] Firebase CLI đã được cài đặt local
- [x] Các script npm đã được thêm vào package.json

## 📋 Các bước tiếp theo

### Bước 1: Đăng nhập Firebase

```bash
npm run firebase:login
```

Hoặc:

```bash
npx firebase login
```

Lệnh này sẽ mở trình duyệt để đăng nhập Firebase. Chọn tài khoản Google của bạn.

### Bước 2: Cài đặt dependencies cho Functions

```bash
cd functions
npm install
cd ..
```

### Bước 3: Deploy Functions và Rules

```bash
npm run firebase:deploy
```

Hoặc:

```bash
npx firebase deploy --only functions,firestore:rules
```

## 🎯 Lệnh nhanh

| Mục đích | Lệnh |
|----------|------|
| Đăng nhập Firebase | `npm run firebase:login` |
| Deploy tất cả | `npm run firebase:deploy` |
| Deploy chỉ Functions | `npm run firebase:deploy:functions` |
| Deploy chỉ Rules | `npm run firebase:deploy:rules` |
| Xem danh sách projects | `npx firebase projects:list` |

## ⚠️ Lưu ý

1. **Lần đầu tiên**: Cần đăng nhập Firebase (`npm run firebase:login`)
2. **Chọn project**: Nếu có nhiều Firebase projects, chọn đúng project của bạn
3. **Kiểm tra**: Sau khi deploy, vào Firebase Console để kiểm tra function đã được deploy chưa

## 🔍 Kiểm tra sau khi deploy

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Vào **Functions** → Kiểm tra function `submitAction` đã có
4. Vào **Firestore** → **Rules** → Kiểm tra rules đã được cập nhật

## ❓ Gặp lỗi?

Xem file `DEPLOY.md` để biết chi tiết troubleshooting.

