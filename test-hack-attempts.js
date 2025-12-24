/**
 * Script để test các cách hack có thể
 * 
 * Chạy: node test-hack-attempts.js
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
  log(`🔓 HACK TEST: ${testName}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

async function testHack1_FakeManyActions() {
  logTest('Test 1: Fake nhiều pipe_passed actions');
  
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    
    // Sign in anonymously
    log('🔐 Signing in anonymously...', 'yellow');
    const userCredential = await signInAnonymously(auth);
    log(`✅ Signed in as: ${userCredential.user.uid}`, 'green');
    
    const submitAction = httpsCallable(functions, 'submitAction');
    const testVmoId = '9999';
    const fakeSessionId = `hack_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Start game
    log('\n📋 Step 1: Starting fake game session...', 'yellow');
    await submitAction({
      vmoId: testVmoId,
      sessionId: fakeSessionId,
      action: {
        type: 'game_start',
        timestamp: Date.now()
      }
    });
    log('✅ Game session started', 'green');
    
    // Send many fake pipe_passed actions
    const fakeCount = 100;
    log(`\n📋 Step 2: Sending ${fakeCount} fake pipe_passed actions...`, 'yellow');
    log('⚠️  This simulates a hacker trying to fake score', 'yellow');
    
    const startTime = Date.now();
    for (let i = 0; i < fakeCount; i++) {
      await submitAction({
        vmoId: testVmoId,
        sessionId: fakeSessionId,
        action: {
          type: 'pipe_passed',
          timestamp: Date.now() + i * 10 // Stagger timestamps
        }
      });
      
      if ((i + 1) % 20 === 0) {
        log(`   Sent ${i + 1}/${fakeCount} actions...`, 'yellow');
      }
      
      // Small delay to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log(`✅ Sent ${fakeCount} fake actions in ${duration}s`, 'green');
    
    // Game over
    log('\n📋 Step 3: Sending game_over...', 'yellow');
    const gameOverResult = await submitAction({
      vmoId: testVmoId,
      sessionId: fakeSessionId,
      action: {
        type: 'game_over',
        timestamp: Date.now(),
        playTimeSeconds: Math.floor(duration)
      }
    });
    
    if (gameOverResult.data.success) {
      log(`\n🎯 RESULT:`, 'cyan');
      log(`   Score: ${gameOverResult.data.score}`, gameOverResult.data.score >= fakeCount ? 'red' : 'green');
      log(`   Pipes counted: ${gameOverResult.data.pipesCount}`, 'yellow');
      log(`   Gifts counted: ${gameOverResult.data.giftsCount}`, 'yellow');
      
      if (gameOverResult.data.pipesCount === fakeCount) {
        log(`\n❌ HACK SUCCESSFUL!`, 'red');
        log(`   Server accepted all ${fakeCount} fake actions`, 'red');
        log(`   Score = ${gameOverResult.data.score} (fake)`, 'red');
        return false; // Hack successful
      } else {
        log(`\n✅ Hack failed - Server rejected some actions`, 'green');
        return true; // Hack failed
      }
    } else {
      log(`\n✅ Hack failed - Server rejected game_over`, 'green');
      return true;
    }
    
  } catch (error) {
    log(`\n✅ Hack failed - Error: ${error.message}`, 'green');
    return true;
  }
}

async function testHack2_ReplayAttack() {
  logTest('Test 2: Replay Attack (replay actions từ game tốt)');
  
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    
    // Sign in anonymously
    log('🔐 Signing in anonymously...', 'yellow');
    const userCredential = await signInAnonymously(auth);
    log(`✅ Signed in as: ${userCredential.user.uid}`, 'green');
    
    const submitAction = httpsCallable(functions, 'submitAction');
    const testVmoId = '9998';
    const replaySessionId = `replay_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate replaying a good game
    log('\n📋 Step 1: Replaying actions from a "good game"...', 'yellow');
    log('⚠️  This simulates a hacker replaying recorded actions', 'yellow');
    
    const baseTime = Date.now();
    const recordedActions = [
      { type: 'game_start', timestamp: baseTime },
      { type: 'pipe_passed', timestamp: baseTime + 1000 },
      { type: 'pipe_passed', timestamp: baseTime + 2000 },
      { type: 'pipe_passed', timestamp: baseTime + 3000 },
      { type: 'gift_collected', timestamp: baseTime + 4000 },
      { type: 'pipe_passed', timestamp: baseTime + 5000 },
      { type: 'gift_collected', timestamp: baseTime + 6000 },
      { type: 'pipe_passed', timestamp: baseTime + 7000 },
      { type: 'pipe_passed', timestamp: baseTime + 8000 },
      { type: 'pipe_passed', timestamp: baseTime + 9000 },
      { type: 'game_over', timestamp: baseTime + 10000, playTimeSeconds: 10 }
    ];
    
    for (const action of recordedActions) {
      await submitAction({
        vmoId: testVmoId,
        sessionId: replaySessionId,
        action: action
      });
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    log('✅ Replayed all actions', 'green');
    
    // Check result
    const lastResult = await submitAction({
      vmoId: testVmoId,
      sessionId: replaySessionId,
      action: {
        type: 'game_over',
        timestamp: Date.now(),
        playTimeSeconds: 10
      }
    });
    
    if (lastResult.data.success) {
      log(`\n🎯 RESULT:`, 'cyan');
      log(`   Score: ${lastResult.data.score}`, 'yellow');
      log(`   Pipes counted: ${lastResult.data.pipesCount}`, 'yellow');
      log(`   Gifts counted: ${lastResult.data.giftsCount}`, 'yellow');
      
      const expectedPipes = 6; // 6 pipe_passed actions
      const expectedGifts = 2; // 2 gift_collected actions
      
      if (lastResult.data.pipesCount === expectedPipes && lastResult.data.giftsCount === expectedGifts) {
        log(`\n❌ REPLAY ATTACK SUCCESSFUL!`, 'red');
        log(`   Server accepted replayed actions`, 'red');
        log(`   Can replay good games multiple times`, 'red');
        return false; // Hack successful
      } else {
        log(`\n✅ Replay attack failed - Server detected something`, 'green');
        return true;
      }
    } else {
      log(`\n✅ Replay attack failed - Server rejected`, 'green');
      return true;
    }
    
  } catch (error) {
    log(`\n✅ Replay attack failed - Error: ${error.message}`, 'green');
    return true;
  }
}

async function testHack3_SessionHijacking() {
  logTest('Test 3: Session Hijacking (dùng session của người khác)');
  
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    
    // Sign in anonymously
    log('🔐 Signing in anonymously...', 'yellow');
    const userCredential = await signInAnonymously(auth);
    log(`✅ Signed in as: ${userCredential.user.uid}`, 'green');
    
    const submitAction = httpsCallable(functions, 'submitAction');
    const testVmoId = '9997';
    
    // Try to use a session ID that might belong to someone else
    // In real attack, hacker would try to guess or steal session IDs
    const stolenSessionId = `session_1234567890_stolen`;
    
    log('\n📋 Step 1: Trying to use a "stolen" session ID...', 'yellow');
    log('⚠️  This simulates a hacker trying to use someone else\'s session', 'yellow');
    
    // Try to add actions to this session
    try {
      await submitAction({
        vmoId: testVmoId,
        sessionId: stolenSessionId,
        action: {
          type: 'pipe_passed',
          timestamp: Date.now()
        }
      });
      
      log('✅ Action accepted!', 'red');
      log(`\n❌ SESSION HIJACKING SUCCESSFUL!`, 'red');
      log(`   Server accepted action for session that might not belong to user`, 'red');
      return false; // Hack successful
      
    } catch (error) {
      log(`✅ Session hijacking failed - Server rejected`, 'green');
      log(`   Error: ${error.message}`, 'yellow');
      return true; // Hack failed
    }
    
  } catch (error) {
    log(`\n✅ Session hijacking failed - Error: ${error.message}`, 'green');
    return true;
  }
}

async function testHack4_VeryFastActions() {
  logTest('Test 4: Very Fast Actions (gửi actions quá nhanh)');
  
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    
    // Sign in anonymously
    log('🔐 Signing in anonymously...', 'yellow');
    const userCredential = await signInAnonymously(auth);
    log(`✅ Signed in as: ${userCredential.user.uid}`, 'green');
    
    const submitAction = httpsCallable(functions, 'submitAction');
    const testVmoId = '9996';
    const fastSessionId = `fast_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Start game
    await submitAction({
      vmoId: testVmoId,
      sessionId: fastSessionId,
      action: {
        type: 'game_start',
        timestamp: Date.now()
      }
    });
    
    log('\n📋 Sending actions very fast (10ms apart)...', 'yellow');
    log('⚠️  This simulates a hacker sending actions faster than humanly possible', 'yellow');
    
    const fastActions = 50;
    const startTime = Date.now();
    
    for (let i = 0; i < fastActions; i++) {
      await submitAction({
        vmoId: testVmoId,
        sessionId: fastSessionId,
        action: {
          type: 'pipe_passed',
          timestamp: Date.now() + i * 10 // Very close timestamps
        }
      });
      // No delay - send as fast as possible
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const actionsPerSecond = (fastActions / (duration / 1000)).toFixed(2);
    
    log(`✅ Sent ${fastActions} actions in ${duration}ms (${actionsPerSecond} actions/sec)`, 'green');
    
    // Game over
    const gameOverResult = await submitAction({
      vmoId: testVmoId,
      sessionId: fastSessionId,
      action: {
        type: 'game_over',
        timestamp: Date.now(),
        playTimeSeconds: Math.floor(duration / 1000)
      }
    });
    
    if (gameOverResult.data.success) {
      log(`\n🎯 RESULT:`, 'cyan');
      log(`   Score: ${gameOverResult.data.score}`, 'yellow');
      log(`   Actions per second: ${actionsPerSecond}`, 'yellow');
      
      if (parseFloat(actionsPerSecond) > 10) {
        log(`\n❌ VERY FAST ACTIONS ACCEPTED!`, 'red');
        log(`   Server accepted ${actionsPerSecond} actions/sec (unrealistic)`, 'red');
        return false; // Hack successful
      } else {
        log(`\n✅ Very fast actions rejected or limited`, 'green');
        return true;
      }
    } else {
      log(`\n✅ Very fast actions rejected`, 'green');
      return true;
    }
    
  } catch (error) {
    log(`\n✅ Very fast actions failed - Error: ${error.message}`, 'green');
    return true;
  }
}

async function main() {
  log('\n🔓 STARTING HACK ATTEMPT TESTS', 'blue');
  log('='.repeat(60), 'blue');
  log('⚠️  These tests simulate hacker attempts', 'yellow');
  log('⚠️  If tests show "HACK SUCCESSFUL", the system is vulnerable', 'yellow');
  log('='.repeat(60), 'blue');
  
  const results = [];
  
  // Test 1: Fake many actions
  const result1 = await testHack1_FakeManyActions();
  results.push({ name: 'Fake Many Actions', secure: result1 });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Replay attack
  const result2 = await testHack2_ReplayAttack();
  results.push({ name: 'Replay Attack', secure: result2 });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Session hijacking
  const result3 = await testHack3_SessionHijacking();
  results.push({ name: 'Session Hijacking', secure: result3 });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 4: Very fast actions
  const result4 = await testHack4_VeryFastActions();
  results.push({ name: 'Very Fast Actions', secure: result4 });
  
  // Summary
  log(`\n${'='.repeat(60)}`, 'cyan');
  log('📊 HACK TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  
  let secureCount = 0;
  results.forEach(result => {
    if (result.secure) {
      log(`✅ ${result.name}: SECURE`, 'green');
      secureCount++;
    } else {
      log(`❌ ${result.name}: VULNERABLE`, 'red');
    }
  });
  
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Results: ${secureCount}/${results.length} tests passed (secure)`, 
      secureCount === results.length ? 'green' : 'yellow');
  log('='.repeat(60), 'cyan');
  
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

