// verifyHash.js
// Chương trình kiểm tra lại hash của record leaderboard

// ĐẶT GIÁ TRỊ NÀY GIỐNG VỚI LÚC BUILD GAME
const HASH_SECRET = 'SANTA_HASH_FALLBACK'; // hoặc chuỗi VITE_HASH_SECRET bạn đang dùng

// Hàm hash FNV-1a 32-bit (giống trong src/utils/security.js)
function fnv1aHash32(str) {
  let hash = 0x811c9dc5; // offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0; // FNV prime
  }
  return hash >>> 0;
}

// Hàm tạo hash y hệt trên front-end
function createDataHash(vmoId, score, timestamp) {
  const payload = `${vmoId}|${score}|${timestamp}|${HASH_SECRET}`;
  const hash = fnv1aHash32(payload);
  return hash.toString(36); // base36 cho gọn
}

// Ví dụ: kiểm tra 1 record
function verifyOneRecord() {
  // THAY BẰNG GIÁ TRỊ LẤY TỪ FIRESTORE
  const vmoId = '2088';
  const score = 835;
  const updatedAt = 1766401305218;
  const storedHash = 'gc0qqm'; // hash đọc từ document

  const computed = createDataHash(vmoId, score, updatedAt);

  console.log('vmoId     :', vmoId);
  console.log('score     :', score);
  console.log('updatedAt :', updatedAt);
  console.log('expected  :', storedHash);
  console.log('computed  :', computed);
  console.log('VALID?    :', storedHash === computed ? '✅ Đúng' : '❌ Sai');
}

verifyOneRecord();