import assert from 'assert';
import http from 'http';
import dotenv from 'dotenv';
import app from '../server.js';
import { encrypt, decrypt } from '../utils/encryption.js';

dotenv.config();

const PORT = 5055;
let server;

// Helper function to make JSON requests
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = responseBody ? JSON.parse(responseBody) : {};
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: responseBody });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(dataString);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Family Management System Integration Tests...');
  
  // Wait for DB to connect and server to bootstrap
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // 1. Test Encryption / Decryption Utilities
    console.log('➡️ Testing Encryption (Plain-text pass-through)...');
    const originalText = '123456789012';
    const encrypted = encrypt(originalText);
    assert.strictEqual(encrypted, originalText, 'Encrypted Aadhaar should match plain-text');
    const decrypted = decrypt(encrypted);
    assert.strictEqual(decrypted, originalText, 'Decrypted text must match original');
    console.log('✅ Encryption verified.');

    // 2. Test User Login
    console.log('➡️ Testing Authentication API...');
    const loginRes = await request('POST', '/api/auth/login', {
      username: 'nikhil',
      password: 'nikhil123'
    });
    
    assert.strictEqual(loginRes.statusCode, 200, 'Login response should be 200 OK');
    assert.ok(loginRes.body.token, 'Response should contain a JWT token');
    const token = loginRes.body.token;
    console.log('✅ Authentication verified.');

    // 3. Test Member stats API
    console.log('➡️ Testing Stats API...');
    const statsRes = await request('GET', '/api/members/stats', null, token);
    assert.strictEqual(statsRes.statusCode, 200);
    assert.ok(typeof statsRes.body.total === 'number');
    console.log('✅ Stats verified.');

    // 4. Test Create Family Member API
    console.log('➡️ Testing Member CRUD & Relationships...');
    const memberData = {
      fullName: 'John Doe',
      relation: 'Self',
      gender: 'Male',
      dateOfBirth: '1995-05-15',
      phoneNumber: '9988776655',
      aadhaarNumber: '999988887777',
      address: '789 Pine Lane, Tech Ville',
      occupation: 'Developer',
      maritalStatus: 'Single',
      privacySettings_aadhaarNumber: 'Public'
    };

    const createRes = await request('POST', '/api/members', memberData, token);
    assert.strictEqual(createRes.statusCode, 201, 'Member creation should return 201');
    const johnId = createRes.body._id;
    assert.ok(johnId, 'Created John Doe should have an ID');
    
    // 5. Test retrieve and decryption of Public Aadhaar
    const getRes = await request('GET', `/api/members/${johnId}`, null, token);
    assert.strictEqual(getRes.statusCode, 200);
    assert.strictEqual(getRes.body.aadhaarNumber, '999988887777', 'Public Aadhaar number should be decrypted for details view');

    // 5b. Test Private Aadhaar masking for non-owners
    const privateMemberData = {
      fullName: 'Jane Doe',
      relation: 'Sister',
      gender: 'Female',
      dateOfBirth: '1997-08-20',
      phoneNumber: '9988776611',
      aadhaarNumber: '111122223333',
      address: '789 Pine Lane, Tech Ville',
      occupation: 'Designer',
      maritalStatus: 'Single',
      privacySettings_aadhaarNumber: 'Private'
    };
    const createPrivateRes = await request('POST', '/api/members', privateMemberData, token);
    assert.strictEqual(createPrivateRes.statusCode, 201);
    const janeId = createPrivateRes.body._id;

    const getPrivateRes = await request('GET', `/api/members/${janeId}`, null, token);
    assert.strictEqual(getPrivateRes.statusCode, 200);
    assert.strictEqual(getPrivateRes.body.aadhaarNumber, 'Hidden (Private)', 'Private Aadhaar should be masked for non-owner');
    
    // 6. Test delete cleanup
    console.log('➡️ Testing Cleanup & Deletions...');
    await request('DELETE', `/api/members/${johnId}`, null, token);
    await request('DELETE', `/api/members/${janeId}`, null, token);
    console.log('✅ Member CRUD verified.');

    console.log('\n🎉 ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (testError) {
    console.error('❌ TEST FAILURE:', testError.message);
    process.exit(1);
  }
}

// Start custom test port listener
server = app.listen(PORT, () => {
  runTests();
});
