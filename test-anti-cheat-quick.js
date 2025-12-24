/**
 * Quick Test - Chạy test nhanh với config từ browser
 * 
 * Cách dùng:
 * 1. Mở app trong browser (npm run dev)
 * 2. F12 → Console
 * 3. Copy output của: JSON.stringify(firebase.app().options, null, 2)
 * 4. Paste vào biến FIREBASE_CONFIG_JSON bên dưới
 * 5. Chạy: node test-anti-cheat-quick.js
 */

// ============================================
// PASTE FIREBASE CONFIG TỪ BROWSER VÀO ĐÂY
// ============================================
const FIREBASE_CONFIG_JSON = `
{
  "apiKey": "PASTE_YOUR_CONFIG_HERE",
  "authDomain": "PASTE_YOUR_CONFIG_HERE",
  "projectId": "vmo-flappy-bird",
  "storageBucket": "PASTE_YOUR_CONFIG_HERE",
  "messagingSenderId": "PASTE_YOUR_CONFIG_HERE",
  "appId": "PASTE_YOUR_CONFIG_HERE"
}
`;

// Import test script
import('./test-anti-cheat.js').catch(() => {
  console.log('❌ Cannot import test script');
  console.log('📝 Please update FIREBASE_CONFIG_JSON above with your Firebase config');
  console.log('📝 Or use: npm run test:security');
});

