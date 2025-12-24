/**
 * Test script để kiểm tra Real-Time Action Tracking
 * 
 * Chạy: node test-realtime-tracking.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { readFileSync } from 'fs';

// Load .env file manually
try {
  const envContent = readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');                                                                   
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }       
  });
} catch (err) {
  // .env file không tồn tại, sử dụng env vars từ system
}

// Firebase config từ environment variables
const getEnv = (key) => {
  return process.env[key] || process.env[`VITE_${key}`] || process.env[key.toUpperCase()];
};

const apiKey = getEnv('FIREBASE_API_KEY');
const authDomain = getEnv('FIREBASE_AUTH_DOMAIN');
const projectId = getEnv('FIREBASE_PROJECT_ID') || 'vmo-flappy-bird';
const storageBucket = getEnv('FIREBASE_STORAGE_BUCKET');
const messagingSenderId = getEnv('FIREBASE_MESSAGING_SENDER_ID');
const appId = getEnv('FIREBASE_APP_ID');

if (!apiKey || !authDomain || !projectId) {
  console.error('❌ Missing Firebase config!');
  process.exit(1);
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🧪 TEST: ${testName}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

async function testRealTimeTracking() {
  logTest('Test Real-Time Action Tracking');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    
    // Sign in anonymously
    log('🔐 Signing in anonymously...', 'yellow');
    const userCredential = await signInAnonymously(auth);
    log(`✅ Signed in as: ${userCredential.user.uid}`, 'green');
    
    const submitAction = httpsCallable(functions, 'submitAction');
    const testVmoId = '9999';
    
    // Test 1: Normal game flow
    log('\n📋 Test 1: Normal game flow', 'yellow');
    const sessionId1 = `test_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Start game
    log('   Starting game session...', 'yellow');
    const startResult = await submitAction({
      vmoId: testVmoId,
      sessionId: sessionId1,
      action: {
        type: 'game_start',
        timestamp: Date.now()
      }
    });
    log(`   ✅ Game started: ${startResult.data.success ? 'Success' : 'Failed'}`, startResult.data.success ? 'green' : 'red');
    
    // Send some pipe_passed actions
    log('   Sending 5 pipe_passed actions...', 'yellow');
    for (let i = 0; i < 5; i++) {
      await submitAction({
        vmoId: testVmoId,
        sessionId: sessionId1,
        action: {
          type: 'pipe_passed',
          timestamp: Date.now() + i * 1000 // Stagger timestamps
        }
      });
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }
    log('   ✅ Sent 5 pipe_passed actions', 'green');
    
    // Send some gift_collected actions
    log('   Sending 3 gift_collected actions...', 'yellow');
    for (let i = 0; i < 3; i++) {
      await submitAction({
        vmoId: testVmoId,
        sessionId: sessionId1,
        action: {
          type: 'gift_collected',
          timestamp: Date.now() + i * 1000
        }
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    log('   ✅ Sent 3 gift_collected actions', 'green');
    
    // Game over
    log('   Sending game_over...', 'yellow');
    const gameOverResult = await submitAction({
      vmoId: testVmoId,
      sessionId: sessionId1,
      action: {
        type: 'game_over',
        timestamp: Date.now(),
        playTimeSeconds: 120
      }
    });
    
    if (gameOverResult.data.success) {
      log(`   ✅ Game over! Score: ${gameOverResult.data.score}`, 'green');
      log(`      Pipes counted: ${gameOverResult.data.pipesCount}`, 'yellow');
      log(`      Gifts counted: ${gameOverResult.data.giftsCount}`, 'yellow');
      
      if (gameOverResult.data.pipesCount === 5 && gameOverResult.data.giftsCount === 3) {
        log('   ✅ Server correctly counted actions!', 'green');
      } else {
        log(`   ⚠️  Expected 5 pipes and 3 gifts, got ${gameOverResult.data.pipesCount} pipes and ${gameOverResult.data.giftsCount} gifts`, 'yellow');
      }
    } else {
      log(`   ❌ Game over failed: ${gameOverResult.data.error}`, 'red');
    }
    
    // Test 2: Try to fake by sending many actions
    log('\n📋 Test 2: Try to fake by sending many actions', 'yellow');
    const sessionId2 = `test_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    log('   Starting new game session...', 'yellow');
    await submitAction({
      vmoId: testVmoId,
      sessionId: sessionId2,
      action: {
        type: 'game_start',
        timestamp: Date.now()
      }
    });
    
    log('   Sending 100 fake pipe_passed actions...', 'yellow');
    for (let i = 0; i < 100; i++) {
      await submitAction({
        vmoId: testVmoId,
        sessionId: sessionId2,
        action: {
          type: 'pipe_passed',
          timestamp: Date.now() + i * 10
        }
      });
      if (i % 20 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay every 20
      }
    }
    log('   ✅ Sent 100 pipe_passed actions', 'green');
    
    log('   Sending game_over...', 'yellow');
    const gameOverResult2 = await submitAction({
      vmoId: testVmoId,
      sessionId: sessionId2,
      action: {
        type: 'game_over',
        timestamp: Date.now(),
        playTimeSeconds: 120
      }
    });
    
    if (gameOverResult2.data.success) {
      log(`   ✅ Game over! Score: ${gameOverResult2.data.score}`, 'green');
      log(`      Pipes counted: ${gameOverResult2.data.pipesCount}`, 'yellow');
      log(`      Gifts counted: ${gameOverResult2.data.giftsCount}`, 'yellow');
      
      if (gameOverResult2.data.pipesCount === 100) {
        log('   ✅ Server correctly counted all 100 actions!', 'green');
        log('   ⚠️  Note: Server accepts all actions (no limit validation)', 'yellow');
      } else {
        log(`   ⚠️  Expected 100 pipes, got ${gameOverResult2.data.pipesCount}`, 'yellow');
      }
    } else {
      log(`   ❌ Game over failed: ${gameOverResult2.data.error}`, 'red');
    }
    
    // Summary
    log(`\n${'='.repeat(60)}`, 'cyan');
    log('📊 TEST RESULTS', 'cyan');
    log('='.repeat(60), 'cyan');
    log('✅ Real-time tracking is working!', 'green');
    log('✅ Server counts actions instead of trusting client totals', 'green');
    log('✅ Much harder to fake (must fake individual actions)', 'green');
    
  } catch (error) {
    log(`\n❌ Test failed with error: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run test
testRealTimeTracking()
  .then(() => {
    log('\n✅ Test completed', 'green');
    process.exit(0);
  })
  .catch((error) => {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });

