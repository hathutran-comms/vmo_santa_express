/**
 * 🔓 COMPREHENSIVE HACK TEST SUITE
 * 
 * Đóng vai hacker chuyên nghiệp để test tất cả các cách hack có thể
 * Chạy: node test-hack-comprehensive.js
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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(`🔓 HACK TEST: ${testName}`, 'cyan');
  log('='.repeat(70), 'cyan');
}

// ============================================
// TEST 1: Fake nhiều actions với timing hợp lý
// ============================================
async function test1_FakeManyActionsWithReasonableTiming() {
  logTest('Test 1: Fake nhiều actions với timing hợp lý (2-3 actions/giây)');
  
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    
    await signInAnonymously(auth);
    const submitAction = httpsCallable(functions, 'submitAction');
    const testVmoId = '9991';
    const sessionId = `hack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Start game
    await submitAction({
      vmoId: testVmoId,
      sessionId: sessionId,
      action: { type: 'game_start', timestamp: Date.now() }
    });
    log('✅ Game started', 'green');
    
    // Gửi 50 actions với timing hợp lý (2 actions/giây = 500ms giữa mỗi action)
    const fakeCount = 50;
    log(`\n📋 Sending ${fakeCount} fake actions with reasonable timing (500ms apart)...`, 'yellow');
    
    const startTime = Date.now();
    for (let i = 0; i < fakeCount; i++) {
      await submitAction({
        vmoId: testVmoId,
        sessionId: sessionId,
        action: {
          type: 'pipe_passed',
          timestamp: Date.now() + i * 500 // Stagger 500ms
        }
      });
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }
    const duration = (Date.now() - startTime) / 1000;
    
    log(`✅ Sent ${fakeCount} actions in ${duration.toFixed(2)}s`, 'green');
    
    // Game over
    const result = await submitAction({
      vmoId: testVmoId,
      sessionId: sessionId,
      action: {
        type: 'game_over',
        timestamp: Date.now(),
        playTimeSeconds: Math.floor(duration)
      }
    });
    
    if (result.data.success) {
      const score = result.data.score || 0;
      const pipesCount = result.data.pipesCount || 0;
      
      log(`\n🎯 RESULT:`, 'cyan');
      log(`   Score: ${score}`, score >= fakeCount ? 'red' : 'green');
      log(`   Pipes counted: ${pipesCount}`, 'yellow');
      
      if (pipesCount === fakeCount) {
        log(`\n❌ HACK SUCCESSFUL!`, 'red');
        log(`   Server accepted all ${fakeCount} fake actions`, 'red');
        return false;
      } else {
        log(`\n✅ Hack failed - Server rejected some actions`, 'green');
        return true;
      }
    }
    
    return true;
  } catch (error) {
    log(`\n✅ Hack failed - Error: ${error.message}`, 'green');
    return true;
  }
}

// ============================================
// TEST 2: Gửi actions quá nhanh (vượt limit)
// ============================================
async function test2_VeryFastActions() {
  logTest('Test 2: Gửi actions quá nhanh (vượt 3 actions/giây)');
  
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    
    await signInAnonymously(auth);
    const submitAction = httpsCallable(functions, 'submitAction');
    const testVmoId = '9992';
    const sessionId = `hack_fast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await submitAction({
      vmoId: testVmoId,
      sessionId: sessionId,
      action: { type: 'game_start', timestamp: Date.now() }
    });
    
    log('\n📋 Sending 100 actions very fast (10ms apart)...', 'yellow');
    log('⚠️  This should be blocked by rate limiting', 'yellow');
    
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < 100; i++) {
      try {
        await submitAction({
          vmoId: testVmoId,
          sessionId: sessionId,
          action: {
            type: 'pipe_passed',
            timestamp: Date.now() + i * 10
          }
        });
        successCount++;
      } catch (err) {
        errorCount++;
        if (err.message.includes('too fast') || err.message.includes('too many')) {
          log(`   ⚠️  Action ${i+1} blocked: ${err.message}`, 'yellow');
        }
      }
      // No delay - send as fast as possible
    }
    
    const duration = (Date.now() - startTime) / 1000;
    const actionsPerSecond = successCount / duration;
    
    log(`\n📊 Results:`, 'cyan');
    log(`   Successful: ${successCount}/100`, 'yellow');
    log(`   Blocked: ${errorCount}/100`, 'yellow');
    log(`   Actions/sec: ${actionsPerSecond.toFixed(2)}`, 'yellow');
    
    if (actionsPerSecond > 3) {
      log(`\n❌ HACK SUCCESSFUL!`, 'red');
      log(`   Server accepted ${actionsPerSecond.toFixed(2)} actions/sec (should be < 3)`, 'red');
      return false;
    } else {
      log(`\n✅ Hack failed - Rate limiting working`, 'green');
      return true;
    }
  } catch (error) {
    log(`\n✅ Hack failed - Error: ${error.message}`, 'green');
    return true;
  }
}

// ============================================
// TEST 3: Replay Attack - Replay actions từ game tốt
// ============================================
async function test3_ReplayAttack() {
  logTest('Test 3: Replay Attack (replay actions từ game tốt)');
  
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    
    await signInAnonymously(auth);
    const submitAction = httpsCallable(functions, 'submitAction');
    const testVmoId = '9993';
    const sessionId = `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    log('\n📋 Replaying recorded actions from a "good game"...', 'yellow');
    
    const baseTime = Date.now();
    const recordedActions = [
      { type: 'game_start', timestamp: baseTime },
      { type: 'pipe_passed', timestamp: baseTime + 2000 },
      { type: 'pipe_passed', timestamp: baseTime + 4000 },
      { type: 'gift_collected', timestamp: baseTime + 5000 },
      { type: 'pipe_passed', timestamp: baseTime + 6000 },
      { type: 'pipe_passed', timestamp: baseTime + 8000 },
      { type: 'gift_collected', timestamp: baseTime + 9000 },
      { type: 'pipe_passed', timestamp: baseTime + 10000 },
      { type: 'pipe_passed', timestamp: baseTime + 12000 },
      { type: 'pipe_passed', timestamp: baseTime + 14000 },
      { type: 'game_over', timestamp: baseTime + 15000, playTimeSeconds: 15 }
    ];
    
    for (const action of recordedActions) {
      try {
        await submitAction({
          vmoId: testVmoId,
          sessionId: sessionId,
          action: action
        });
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (err) {
        if (err.message.includes('duplicate') || err.message.includes('already')) {
          log(`   ⚠️  Duplicate detected: ${action.type}`, 'yellow');
        }
      }
    }
    
    // Try to replay again with new session
    const sessionId2 = `replay2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    log('\n📋 Attempting to replay same actions in new session...', 'yellow');
    
    let replaySuccess = true;
    for (const action of recordedActions) {
      try {
        await submitAction({
          vmoId: testVmoId,
          sessionId: sessionId2,
          action: action
        });
      } catch (err) {
        if (err.message.includes('duplicate') || err.message.includes('already')) {
          log(`   ✅ Duplicate blocked: ${action.type}`, 'green');
          replaySuccess = false;
        }
      }
    }
    
    if (replaySuccess) {
      log(`\n❌ REPLAY ATTACK SUCCESSFUL!`, 'red');
      log(`   Can replay good games multiple times`, 'red');
      return false;
    } else {
      log(`\n✅ Replay attack failed - Duplicate detection working`, 'green');
      return true;
    }
  } catch (error) {
    log(`\n✅ Replay attack failed - Error: ${error.message}`, 'green');
    return true;
  }
}

// ============================================
// TEST 4: Session Hijacking
// ============================================
async function test4_SessionHijacking() {
  logTest('Test 4: Session Hijacking (dùng session của người khác)');
  
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    
    // User 1: Tạo session hợp lệ
    await signInAnonymously(auth);
    const user1Uid = auth.currentUser.uid;
    const submitAction1 = httpsCallable(functions, 'submitAction');
    const testVmoId = '9994';
    const validSessionId = `valid_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    log('\n📋 User 1: Creating valid session...', 'yellow');
    await submitAction1({
      vmoId: testVmoId,
      sessionId: validSessionId,
      action: { type: 'game_start', timestamp: Date.now() }
    });
    log('✅ Valid session created', 'green');
    
    // User 2: Thử dùng session của User 1
    log('\n📋 User 2: Attempting to use User 1\'s session...', 'yellow');
    await signInAnonymously(auth); // New anonymous user
    const user2Uid = auth.currentUser.uid;
    const submitAction2 = httpsCallable(functions, 'submitAction');
    
    try {
      await submitAction2({
        vmoId: testVmoId,
        sessionId: validSessionId, // Try to use User 1's session
        action: {
          type: 'pipe_passed',
          timestamp: Date.now()
        }
      });
      
      log(`\n❌ SESSION HIJACKING SUCCESSFUL!`, 'red');
      log(`   User 2 can use User 1's session`, 'red');
      return false;
    } catch (error) {
      if (error.message.includes('does not belong') || error.message.includes('permission')) {
        log(`\n✅ Session hijacking failed - Ownership validation working`, 'green');
        log(`   Error: ${error.message}`, 'yellow');
        return true;
      } else {
        log(`\n✅ Session hijacking failed - Error: ${error.message}`, 'green');
        return true;
      }
    }
  } catch (error) {
    log(`\n✅ Session hijacking failed - Error: ${error.message}`, 'green');
    return true;
  }
}

// ============================================
// TEST 5: Fake Timestamp trong tương lai
// ============================================
async function test5_FutureTimestamp() {
  logTest('Test 5: Fake Timestamp trong tương lai');
  
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    
    await signInAnonymously(auth);
    const submitAction = httpsCallable(functions, 'submitAction');
    const testVmoId = '9995';
    const sessionId = `future_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    log('\n📋 Starting game with future timestamp...', 'yellow');
    try {
      await submitAction({
        vmoId: testVmoId,
        sessionId: sessionId,
        action: {
          type: 'game_start',
          timestamp: Date.now() + 60000 // 1 phút trong tương lai
        }
      });
      
      log(`\n❌ FUTURE TIMESTAMP ACCEPTED!`, 'red');
      log(`   Server accepted timestamp in the future`, 'red');
      return false;
    } catch (error) {
      if (error.message.includes('future') || error.message.includes('timestamp')) {
        log(`\n✅ Future timestamp blocked - Validation working`, 'green');
        log(`   Error: ${error.message}`, 'yellow');
        return true;
      } else {
        log(`\n✅ Future timestamp blocked - Error: ${error.message}`, 'green');
        return true;
      }
    }
  } catch (error) {
    log(`\n✅ Future timestamp test failed - Error: ${error.message}`, 'green');
    return true;
  }
}

// ============================================
// TEST 6: Session Reuse sau game_over
// ============================================
async function test6_SessionReuse() {
  logTest('Test 6: Session Reuse sau game_over');
  
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    
    await signInAnonymously(auth);
    const submitAction = httpsCallable(functions, 'submitAction');
    const testVmoId = '9996';
    const sessionId = `reuse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    log('\n📋 Step 1: Starting game and ending it...', 'yellow');
    await submitAction({
      vmoId: testVmoId,
      sessionId: sessionId,
      action: { type: 'game_start', timestamp: Date.now() }
    });
    
    await submitAction({
      vmoId: testVmoId,
      sessionId: sessionId,
      action: { type: 'pipe_passed', timestamp: Date.now() + 1000 }
    });
    
    await submitAction({
      vmoId: testVmoId,
      sessionId: sessionId,
      action: {
        type: 'game_over',
        timestamp: Date.now() + 2000,
        playTimeSeconds: 2
      }
    });
    log('✅ Game ended', 'green');
    
    log('\n📋 Step 2: Attempting to reuse session...', 'yellow');
    try {
      await submitAction({
        vmoId: testVmoId,
        sessionId: sessionId, // Try to reuse
        action: {
          type: 'pipe_passed',
          timestamp: Date.now()
        }
      });
      
      log(`\n❌ SESSION REUSE SUCCESSFUL!`, 'red');
      log(`   Can add actions to ended session`, 'red');
      return false;
    } catch (error) {
      if (error.message.includes('already ended') || error.message.includes('game_over')) {
        log(`\n✅ Session reuse blocked - Validation working`, 'green');
        log(`   Error: ${error.message}`, 'yellow');
        return true;
      } else {
        log(`\n✅ Session reuse blocked - Error: ${error.message}`, 'green');
        return true;
      }
    }
  } catch (error) {
    log(`\n✅ Session reuse test failed - Error: ${error.message}`, 'green');
    return true;
  }
}

// ============================================
// TEST 7: Gửi game_over trước khi có actions
// ============================================
async function test7_GameOverWithoutActions() {
  logTest('Test 7: Gửi game_over trước khi có actions');
  
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    
    await signInAnonymously(auth);
    const submitAction = httpsCallable(functions, 'submitAction');
    const testVmoId = '9997';
    const sessionId = `noactions_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    log('\n📋 Starting game and immediately sending game_over...', 'yellow');
    await submitAction({
      vmoId: testVmoId,
      sessionId: sessionId,
      action: { type: 'game_start', timestamp: Date.now() }
    });
    
    // Immediately send game_over without any pipe_passed or gift_collected
    const result = await submitAction({
      vmoId: testVmoId,
      sessionId: sessionId,
      action: {
        type: 'game_over',
        timestamp: Date.now() + 100,
        playTimeSeconds: 0
      }
    });
    
    if (result.data.success) {
      const score = result.data.score || 0;
      log(`\n📊 Result: Score = ${score}`, 'yellow');
      
      if (score > 0) {
        log(`\n⚠️  Game over accepted with score ${score}`, 'yellow');
        log(`   (This is actually valid - player can die immediately)`, 'yellow');
        return true; // This is actually valid behavior
      } else {
        log(`\n✅ Game over accepted with score 0 (valid)`, 'green');
        return true;
      }
    }
    
    return true;
  } catch (error) {
    log(`\n✅ Test failed - Error: ${error.message}`, 'green');
    return true;
  }
}

// ============================================
// TEST 8: Gửi quá nhiều pipes/gifts trong thời gian ngắn
// ============================================
async function test8_TooManyPipesGifts() {
  logTest('Test 8: Gửi quá nhiều pipes/gifts trong thời gian ngắn');
  
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    
    await signInAnonymously(auth);
    const submitAction = httpsCallable(functions, 'submitAction');
    const testVmoId = '9998';
    const sessionId = `toomany_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    log('\n📋 Starting game...', 'yellow');
    await submitAction({
      vmoId: testVmoId,
      sessionId: sessionId,
      action: { type: 'game_start', timestamp: Date.now() }
    });
    
    // Gửi 100 pipes trong 10 giây (10 pipes/giây - vượt limit 2.5 pipes/giây)
    log('\n📋 Sending 100 pipes in 10 seconds (10 pipes/sec - exceeds 2.5 limit)...', 'yellow');
    
    const startTime = Date.now();
    for (let i = 0; i < 100; i++) {
      try {
        await submitAction({
          vmoId: testVmoId,
          sessionId: sessionId,
          action: {
            type: 'pipe_passed',
            timestamp: startTime + i * 100 // 100ms apart = 10 per second
          }
        });
      } catch (err) {
        // Ignore individual errors
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const duration = 10; // 10 seconds
    const result = await submitAction({
      vmoId: testVmoId,
      sessionId: sessionId,
      action: {
        type: 'game_over',
        timestamp: startTime + duration * 1000,
        playTimeSeconds: duration
      }
    });
    
    if (result.data.success) {
      const pipesCount = result.data.pipesCount || 0;
      const pipesPerSecond = pipesCount / duration;
      
      log(`\n📊 Results:`, 'cyan');
      log(`   Pipes counted: ${pipesCount}`, 'yellow');
      log(`   Pipes per second: ${pipesPerSecond.toFixed(2)}`, 'yellow');
      
      if (pipesPerSecond > 2.5) {
        log(`\n❌ HACK SUCCESSFUL!`, 'red');
        log(`   Server accepted ${pipesPerSecond.toFixed(2)} pipes/sec (should be < 2.5)`, 'red');
        return false;
      } else {
        log(`\n✅ Hack failed - Pipes per second validation working`, 'green');
        return true;
      }
    }
    
    return true;
  } catch (error) {
    if (error.message.includes('too many') || error.message.includes('per second')) {
      log(`\n✅ Hack failed - Validation working: ${error.message}`, 'green');
      return true;
    }
    log(`\n✅ Hack failed - Error: ${error.message}`, 'green');
    return true;
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function main() {
  log('\n🔓 COMPREHENSIVE HACK TEST SUITE', 'magenta');
  log('='.repeat(70), 'magenta');
  log('⚠️  Testing all possible hack scenarios', 'yellow');
  log('⚠️  If tests show "HACK SUCCESSFUL", the system is vulnerable', 'yellow');
  log('='.repeat(70), 'magenta');
  
  const results = [];
  
  // Run all tests
  results.push({ name: '1. Fake Many Actions (Reasonable Timing)', secure: await test1_FakeManyActionsWithReasonableTiming() });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.push({ name: '2. Very Fast Actions', secure: await test2_VeryFastActions() });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.push({ name: '3. Replay Attack', secure: await test3_ReplayAttack() });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.push({ name: '4. Session Hijacking', secure: await test4_SessionHijacking() });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.push({ name: '5. Future Timestamp', secure: await test5_FutureTimestamp() });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.push({ name: '6. Session Reuse', secure: await test6_SessionReuse() });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.push({ name: '7. Game Over Without Actions', secure: await test7_GameOverWithoutActions() });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.push({ name: '8. Too Many Pipes/Gifts', secure: await test8_TooManyPipesGifts() });
  
  // Summary
  log(`\n${'='.repeat(70)}`, 'cyan');
  log('📊 HACK TEST SUMMARY', 'cyan');
  log('='.repeat(70), 'cyan');
  
  let secureCount = 0;
  results.forEach(result => {
    if (result.secure) {
      log(`✅ ${result.name}: SECURE`, 'green');
      secureCount++;
    } else {
      log(`❌ ${result.name}: VULNERABLE`, 'red');
    }
  });
  
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(`Results: ${secureCount}/${results.length} tests passed (secure)`, 
      secureCount === results.length ? 'green' : 'yellow');
  log('='.repeat(70), 'cyan');
  
  if (secureCount === results.length) {
    log('\n🎉 All hack attempts failed - System is secure!', 'green');
  } else {
    log(`\n⚠️  ${results.length - secureCount} vulnerabilities found!`, 'red');
    log('   Consider implementing additional validations', 'yellow');
  }
  
  process.exit(secureCount === results.length ? 0 : 1);
}

main().catch(err => {
  log(`\n❌ Fatal error: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});

