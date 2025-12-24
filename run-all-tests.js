/**
 * Script để chạy tất cả các test anti-cheat
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

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

async function runTest(testFile, description) {
  return new Promise((resolve) => {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`🧪 ${description}`, 'cyan');
    log(`📁 File: ${testFile}`, 'cyan');
    log('='.repeat(60), 'cyan');
    
    const proc = spawn('node', [testFile], {
      stdio: 'inherit',
      shell: true
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        log(`\n✅ ${description} - PASSED`, 'green');
      } else {
        log(`\n❌ ${description} - FAILED (exit code: ${code})`, 'red');
      }
      resolve(code === 0);
    });
    
    proc.on('error', (err) => {
      log(`\n❌ Error running ${testFile}: ${err.message}`, 'red');
      resolve(false);
    });
  });
}

async function main() {
  log('\n🚀 RUNNING ALL ANTI-CHEAT TESTS', 'blue');
  log('='.repeat(60), 'blue');
  
  const tests = [
    {
      file: 'test-vmo-id-validation.js',
      description: 'Test VMO ID Validation'
    },
    {
      file: 'test-realtime-tracking.js',
      description: 'Test Real-time Action Tracking'
    },
    {
      file: 'test-fake-pipes-gifts.js',
      description: 'Test Fake Pipes/Gifts Protection'
    },
    {
      file: 'test-anti-cheat.js',
      description: 'Comprehensive Anti-Cheat Tests'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const passed = await runTest(test.file, test.description);
      results.push({ name: test.description, passed });
      // Delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      log(`\n❌ Error: ${error.message}`, 'red');
      results.push({ name: test.description, passed: false });
    }
  }
  
  // Summary
  log(`\n${'='.repeat(60)}`, 'cyan');
  log('📊 TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  
  let passedCount = 0;
  results.forEach(result => {
    if (result.passed) {
      log(`✅ ${result.name}`, 'green');
      passedCount++;
    } else {
      log(`❌ ${result.name}`, 'red');
    }
  });
  
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Results: ${passedCount}/${results.length} tests passed`, 
      passedCount === results.length ? 'green' : 'yellow');
  log('='.repeat(60), 'cyan');
  
  process.exit(passedCount === results.length ? 0 : 1);
}

main().catch(err => {
  log(`\n❌ Fatal error: ${err.message}`, 'red');
  process.exit(1);
});

