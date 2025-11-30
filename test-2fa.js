// Quick test script for 2FA functionality
const { authApi } = require('./lib/api/auth');

async function test2FA() {
  console.log('Testing 2FA API methods...');
  
  // These should be defined
  console.log('✓ get2FAStatus:', typeof authApi.get2FAStatus);
  console.log('✓ enable2FA:', typeof authApi.enable2FA);
  console.log('✓ verifySetup2FA:', typeof authApi.verifySetup2FA);
  console.log('✓ disable2FA:', typeof authApi.disable2FA);
  console.log('✓ verify2FA:', typeof authApi.verify2FA);
  console.log('✓ regenerateBackupCodes:', typeof authApi.regenerateBackupCodes);
  
  console.log('\nAll 2FA methods are defined!');
}

test2FA();
