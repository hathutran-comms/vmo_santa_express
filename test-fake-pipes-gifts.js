/**
 * Test script để kiểm tra khả năng fake pipesPassed và giftsReceived
 * 
 * Chạy: node test-fake-pipes-gifts.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { readFileSync } from 'fs';

// Load .env file manually (since we can't use dotenv package)
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
  console.log('\n📝 Set environment variables:');
  console.log('   export FIREBASE_API_KEY="your-key"');
  console.log('   export FIREBASE_AUTH_DOMAIN="your-domain"');
  console.log('   export FIREBASE_PROJECT_ID="vmo-flappy-bird"');
  console.log('\nHoặc tạo file .env với các biến trên');
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

async function testFakePipesAndGifts() {
  logTest('Test Fake PipesPassed và GiftsReceived');
  
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
    const testVmoId = '9999'; // Test VMO ID
    
    // Test cases
    const testCases = [
      {
        name: 'Normal values (should work)',
        pipesPassed: 10,
        giftsReceived: 5,
        expectedScore: 15,
        shouldWork: true
      },
      {
        name: 'Fake: Very high pipesPassed',
        pipesPassed: 999999,
        giftsReceived: 0,
        expectedScore: 10000, // Server caps at 10000
        shouldWork: true // Server sẽ cap, nhưng vẫn chấp nhận
      },
      {
        name: 'Fake: Very high giftsReceived',
        pipesPassed: 0,
        giftsReceived: 999999,
        expectedScore: 10000, // Server caps at 10000
        shouldWork: true // Server sẽ cap, nhưng vẫn chấp nhận
      },
      {
        name: 'Fake: Extremely high both',
        pipesPassed: 999999999,
        giftsReceived: 999999999,
        expectedScore: 10000, // Server caps at 10000
        shouldWork: true // Server sẽ cap, nhưng vẫn chấp nhận
      },
      {
        name: 'Fake: Negative pipesPassed',
        pipesPassed: -100,
        giftsReceived: 5,
        expectedScore: 5, // Server sẽ sanitize thành 0
        shouldWork: true // Server sẽ sanitize
      },
      {
        name: 'Fake: Negative giftsReceived',
        pipesPassed: 10,
        giftsReceived: -100,
        expectedScore: 10, // Server sẽ sanitize thành 0
        shouldWork: true // Server sẽ sanitize
      },
      {
        name: 'Fake: Float numbers',
        pipesPassed: 10.7,
        giftsReceived: 5.3,
        expectedScore: 15, // Server sẽ floor
        shouldWork: true
      }
    ];
    
    let passedTests = 0;
    let failedTests = 0;
    let vulnerabilityFound = false;
    
    for (const testCase of testCases) {
      log(`\n📋 Testing: ${testCase.name}`, 'yellow');
      log(`   pipesPassed: ${testCase.pipesPassed}`, 'yellow');
      log(`   giftsReceived: ${testCase.giftsReceived}`, 'yellow');
      
      try {
        const result = await submitAction({
          vmoId: testVmoId,
          action: {
            type: 'game_over',
            timestamp: Date.now(),
            pipesPassed: testCase.pipesPassed,
            giftsReceived: testCase.giftsReceived,
            playTimeSeconds: 120
          }
        });
        
        if (result.data.success) {
          const serverScore = result.data.score;
          log(`   ✅ Server accepted! Score: ${serverScore}`, 'green');
          
          // Kiểm tra xem có bị hack không
          if (testCase.pipesPassed > 1000 || testCase.giftsReceived > 1000) {
            if (serverScore >= 1000 && serverScore <= 10000) {
              log(`   ⚠️  VULNERABILITY: Server accepted fake high values!`, 'red');
              log(`      Server capped at ${serverScore}, but should reject values > 1000`, 'red');
              vulnerabilityFound = true;
            }
          }
          
          // Kiểm tra sanitization
          if (testCase.pipesPassed < 0 || testCase.giftsReceived < 0) {
            if (serverScore >= 0) {
              log(`   ✅ Server sanitized negative values correctly`, 'green');
            } else {
              log(`   ❌ Server did not sanitize negative values`, 'red');
              failedTests++;
              continue;
            }
          }
          
          if (testCase.shouldWork) {
            passedTests++;
          }
        } else {
          log(`   ❌ Server rejected: ${result.data.error}`, 'red');
          if (testCase.shouldWork) {
            failedTests++;
          } else {
            log(`   ✅ Correctly rejected invalid input`, 'green');
            passedTests++;
          }
        }
      } catch (error) {
        log(`   ❌ Error: ${error.message}`, 'red');
        if (testCase.shouldWork) {
          failedTests++;
        } else {
          log(`   ✅ Correctly rejected invalid input`, 'green');
          passedTests++;
        }
      }
      
      // Delay giữa các requests để tránh rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Summary
    log(`\n${'='.repeat(60)}`, 'cyan');
    log('📊 TEST RESULTS', 'cyan');
    log('='.repeat(60), 'cyan');
    log(`✅ Passed: ${passedTests}/${testCases.length}`, passedTests === testCases.length ? 'green' : 'yellow');
    log(`❌ Failed: ${failedTests}`, failedTests === 0 ? 'green' : 'red');
    
    if (vulnerabilityFound) {
      log(`\n🚨 VULNERABILITY FOUND!`, 'red');
      log(`   Server accepts fake high values for pipesPassed/giftsReceived`, 'red');
      log(`   Recommendation: Implement real-time action tracking instead of batch submission`, 'yellow');
    } else {
      log(`\n✅ No major vulnerabilities found`, 'green');
      log(`   Server properly sanitizes and caps values`, 'green');
    }
    
    log(`\n💡 RECOMMENDATION:`, 'cyan');
    log(`   Current system: Client sends total pipesPassed + giftsReceived at game_over`, 'yellow');
    log(`   Problem: Client can fake these totals`, 'yellow');
    log(`   Solution: Send each action real-time (pipe_passed, gift_collected)`, 'green');
    log(`   - Server counts actions instead of trusting client totals`, 'green');
    log(`   - Much harder to fake individual actions`, 'green');
    
  } catch (error) {
    log(`\n❌ Test failed with error: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run test
testFakePipesAndGifts()
  .then(() => {
    log('\n✅ Test completed', 'green');
    process.exit(0);
  })
  .catch((error) => {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });

