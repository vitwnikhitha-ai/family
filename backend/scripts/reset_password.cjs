const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8']);
} catch (e) {}

const NEW_PASSWORD = process.argv[2] || 'nikhil123';

async function resetPassword() {
  console.log(`Resetting password for user 'nikhil' to: ${NEW_PASSWORD}`);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);

  // 1. Update backend/data/db.json (Mock DB)
  const dbJsonPath = path.join(__dirname, '..', 'data', 'db.json');
  if (fs.existsSync(dbJsonPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
      if (data.users && Array.isArray(data.users)) {
        const userIndex = data.users.findIndex(u => u.username === 'nikhil');
        if (userIndex !== -1) {
          data.users[userIndex].password = hashedPassword;
          data.users[userIndex].updatedAt = new Date().toISOString();
          fs.writeFileSync(dbJsonPath, JSON.stringify(data, null, 2));
          console.log('✅ Updated password in backend/data/db.json');
        } else {
          console.log('⚠️ User nikhil not found in backend/data/db.json');
        }
      }
    } catch (err) {
      console.error('Error updating db.json:', err.message);
    }
  }

  // 2. Try MongoDB Atlas update
  const uri = process.env.MONGODB_URI || 'mongodb://Vercel-Admin-atlas-rose-compass:Qf0MJNbrkHQAzDhS@ac-oksa0mv-shard-00-00.zx2xz9h.mongodb.net:27017,ac-oksa0mv-shard-00-01.zx2xz9h.mongodb.net:27017,ac-oksa0mv-shard-00-02.zx2xz9h.mongodb.net:27017/test?ssl=true&replicaSet=atlas-8z2lv1-shard-0&authSource=admin&retryWrites=true&w=majority';
  
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.db;
    const result = await db.collection('users').updateOne(
      { username: 'nikhil' },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );
    if (result.matchedCount > 0) {
      console.log('✅ Updated password in MongoDB Atlas');
    } else {
      console.log('⚠️ User nikhil not found in MongoDB Atlas');
    }
  } catch (err) {
    console.log('ℹ️ MongoDB update skipped / connection error:', err.message);
  } finally {
    try {
      await mongoose.disconnect();
    } catch (e) {}
  }

  console.log('🎉 Done!');
}

resetPassword();
