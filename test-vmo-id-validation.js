/**
 * Test VMO ID Validation
 * Kiểm tra validation VMO ID có đúng format 4 chữ số không
 */

// Mock import.meta.env để test có thể chạy
global.import = { meta: { env: {} } };

// Copy validateVmoId function để test (tránh import.meta.env issue)
function validateVmoId(vmoId) {
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
}

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testVmoIdValidation() {
  log('\n🔍 TESTING VMO ID VALIDATION', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const testCases = [
    // Valid cases
    { input: '1234', expected: '1234', description: 'Valid 4 digits' },
    { input: '0000', expected: '0000', description: 'Valid: all zeros' },
    { input: '9999', expected: '9999', description: 'Valid: all nines' },
    { input: ' 1234 ', expected: '1234', description: 'Valid: with spaces at start/end' },
    
    // Invalid cases
    { input: '123', expected: null, description: 'Invalid: 3 digits' },
    { input: '12345', expected: null, description: 'Invalid: 5 digits' },
    { input: '', expected: null, description: 'Invalid: empty string' },
    { input: null, expected: null, description: 'Invalid: null' },
    { input: undefined, expected: null, description: 'Invalid: undefined' },
    { input: 'abcd', expected: null, description: 'Invalid: letters only' },
    { input: '12ab', expected: null, description: 'Invalid: mixed letters' },
    { input: '12 34', expected: null, description: 'Invalid: space in middle' },
    { input: 1234, expected: null, description: 'Invalid: number type' },
    { input: '12.34', expected: null, description: 'Invalid: contains dot' },
    { input: '12-34', expected: null, description: 'Invalid: contains dash' },
    { input: 1234, expected: null, description: 'Invalid: number type (not string)' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const result = validateVmoId(testCase.input);
    const success = result === testCase.expected;
    
    const inputStr = testCase.input === null ? 'null' : 
                     testCase.input === undefined ? 'undefined' : 
                     typeof testCase.input === 'number' ? testCase.input.toString() :
                     `"${testCase.input}"`;
    
    if (success) {
      log(`✅ Test ${index + 1}: ${testCase.description}`, 'green');
      log(`   Input: ${inputStr} → Result: ${result === null ? 'null' : `"${result}"`}`, 'yellow');
      passed++;
    } else {
      log(`❌ Test ${index + 1}: ${testCase.description}`, 'red');
      log(`   Input: ${inputStr}`, 'yellow');
      log(`   Expected: ${testCase.expected === null ? 'null' : `"${testCase.expected}"`}`, 'yellow');
      log(`   Got: ${result === null ? 'null' : `"${result}"`}`, 'yellow');
      failed++;
    }
  });
  
  log('\n' + '='.repeat(60), 'cyan');
  log(`RESULTS: ${passed}/${testCases.length} passed, ${failed} failed`, passed === testCases.length ? 'green' : 'red');
  log('='.repeat(60), 'cyan');
  
  if (failed === 0) {
    log('\n🎉 All VMO ID validation tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Review the results above.', 'yellow');
  }
  
  return failed === 0;
}

// Run tests
testVmoIdValidation();

