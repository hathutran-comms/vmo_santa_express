/**
 * Security utilities để chống hack và manipulation
 */

// Secret để tạo hash; đặt qua env để có thể thay đổi sau này
const HASH_SECRET = import.meta.env.VITE_HASH_SECRET || 'SANTA_HASH_FALLBACK';

// FNV-1a 32-bit hash (deterministic, đủ nhẹ để chạy sync trên client)
const fnv1aHash32 = (str) => {
  let hash = 0x811c9dc5; // offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0; // FNV prime
  }
  return hash >>> 0;
};

/**
 * Validate và sanitize VMO ID
 * VMO ID phải là đúng 4 chữ số (0-9), chỉ cho phép spaces ở đầu/cuối
 * @param {string} vmoId - VMO ID cần validate
 * @returns {string|null} - VMO ID đã được sanitize hoặc null nếu invalid
 */
export const validateVmoId = (vmoId) => {
  if (!vmoId || typeof vmoId !== 'string') {
    return null;
  }
  
  // Trim spaces ở đầu/cuối
  const trimmed = vmoId.trim();
  
  // VMO ID phải là đúng 4 chữ số liên tiếp, không có ký tự khác
  if (!/^\d{4}$/.test(trimmed)) {
    return null;
  }
  
  return trimmed;
};

/**
 * Validate điểm số
 * @param {number} score - Điểm số cần validate
 * @param {number} previousScore - Điểm số trước đó (nếu có)
 * @returns {boolean} - true nếu hợp lệ
 */
export const validateScore = (score, previousScore = 0) => {
  // Không còn chặn điểm, luôn cho phép
  return true;
};

/**
 * Validate game state trước khi lưu điểm
 * @param {Object} gameState - Trạng thái game
 * @returns {boolean} - true nếu game state hợp lệ
 */
export const validateGameState = (gameState) => {
  // Không còn kiểm tra logic game, luôn cho phép lưu
  return true;
};

/**
 * Sanitize string để chống XSS
 * @param {string} str - String cần sanitize
 * @returns {string} - String đã được sanitize
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') {
    return '';
  }

  // Escape HTML special characters
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Rate limiting: Kiểm tra số lần lưu điểm trong một khoảng thời gian
 * @param {string} vmoId - VMO ID
 * @returns {boolean} - true nếu có thể lưu
 */
export const checkRateLimit = (vmoId) => {
  // Không giới hạn số lần lưu nữa, luôn cho phép
  return true;
};

/**
 * Tạo hash đơn giản để verify tính toàn vẹn của dữ liệu
 * @param {string} vmoId - VMO ID
 * @param {number} score - Điểm số
 * @param {number} timestamp - Timestamp
 * @returns {string} - Hash string
 */
export const createDataHash = (vmoId, score, timestamp) => {
  // Dùng HASH_SECRET để có thể verify sau này (dù secret ở client không tuyệt đối an toàn)
  const payload = `${vmoId}|${score}|${timestamp}|${HASH_SECRET}`;
  const hash = fnv1aHash32(payload);
  return hash.toString(36); // base36 cho gọn
};
