import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env vars without prefix
  const env = loadEnv(mode, process.cwd(), '')
  
  // Get Firebase config from env
  const firebaseConfig = {
    FIREBASE_API_KEY: env.FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: env.FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_DATABASE_URL: env.FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL,
    FIREBASE_PROJECT_ID: env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: env.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: env.FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: env.FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  }
  
  const isProduction = mode === 'production'
  
  return {
    plugins: [react()],
    base: '/',
    resolve: {
      // Đảm bảo chỉ có 1 instance React
      dedupe: ['react', 'react-dom'],
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false, // Giữ console.log để debug
          drop_debugger: true,
          pure_funcs: ['console.debug', 'console.trace'], // Chỉ xóa debug/trace
          passes: 2, // Giảm từ 3 xuống 2 để tránh lỗi
          unsafe: false, // Tắt unsafe để tránh lỗi React
          unsafe_comps: false,
          unsafe_math: false,
          unsafe_methods: false,
        },
        format: {
          comments: false, // Xóa tất cả comments
          beautify: false, // Không format lại code
        },
        mangle: {
          properties: {
            regex: /^_/ // Chỉ mangle properties bắt đầu bằng _
          }
        },
      },
      sourcemap: false, // Tắt source maps trong production để ẩn code
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Tách vendor chunks nhưng đảm bảo React không bị duplicate
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('firebase')) {
                return 'firebase-vendor';
              }
              // Các dependencies khác
              return 'vendor';
            }
          },
          // Compact output
          compact: true,
        },
      },
      // Tăng chunk size limit để code được minify tốt hơn
      chunkSizeWarningLimit: 1000,
    },
    define: {
      'import.meta.env.FIREBASE_API_KEY': JSON.stringify(firebaseConfig.FIREBASE_API_KEY),
      'import.meta.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(firebaseConfig.FIREBASE_AUTH_DOMAIN),
      'import.meta.env.FIREBASE_DATABASE_URL': JSON.stringify(firebaseConfig.FIREBASE_DATABASE_URL),
      'import.meta.env.FIREBASE_PROJECT_ID': JSON.stringify(firebaseConfig.FIREBASE_PROJECT_ID),
      'import.meta.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(firebaseConfig.FIREBASE_STORAGE_BUCKET),
      'import.meta.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(firebaseConfig.FIREBASE_MESSAGING_SENDER_ID),
      'import.meta.env.FIREBASE_APP_ID': JSON.stringify(firebaseConfig.FIREBASE_APP_ID),
    },
  }
})
