const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DB_FILE = path.join(__dirname, 'data/db.json');
const atlasUri = 'mongodb://Vercel-Admin-atlas-rose-compass:Qf0MJNbrkHQAzDhS@ac-oksa0mv-shard-00-00.zx2xz9h.mongodb.net:27017,ac-oksa0mv-shard-00-01.zx2xz9h.mongodb.net:27017,ac-oksa0mv-shard-00-02.zx2xz9h.mongodb.net:27017/test?ssl=true&replicaSet=atlas-8z2lv1-shard-0&authSource=admin&retryWrites=true&w=majority';

// Define schemas to use mongoose models
const memberSchema = new mongoose.Schema({
  fullName: String,
  relation: String,
  gender: String,
  dateOfBirth: Date,
  phoneNumber: String,
  aadhaarNumber: String,
  address: String,
  occupation: String,
  maritalStatus: String,
  profilePhoto: String,
  spouse: mongoose.Schema.Types.ObjectId,
  children: [mongoose.Schema.Types.ObjectId],
  father: mongoose.Schema.Types.ObjectId,
  mother: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
  updatedAt: Date
}, { strict: false });

const userSchema = new mongoose.Schema({
  username: String,
  role: String,
  memberProfile: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
  updatedAt: Date
}, { strict: false });

const documentSchema = new mongoose.Schema({}, { strict: false });

async function restore() {
  console.log('🚀 Starting Data Restoration from backup...');
  
  if (!fs.existsSync(DB_FILE)) {
    console.error(`❌ db.json file not found at: ${DB_FILE}`);
    process.exit(1);
  }

  const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  
  console.log(`Connecting to MongoDB Atlas...`);
  await mongoose.connect(atlasUri);
  console.log('✅ Connected to MongoDB Atlas.');

  const Member = mongoose.model('Member', memberSchema);
  const User = mongoose.model('User', userSchema);
  const DocumentModel = mongoose.model('Document', documentSchema);

  // 1. Restore members
  console.log(`\n📦 Restoring ${dbData.members?.length || 0} family members...`);
  if (dbData.members && dbData.members.length > 0) {
    for (const mem of dbData.members) {
      const memberDoc = { ...mem };
      
      if (mem.dateOfBirth) memberDoc.dateOfBirth = new Date(mem.dateOfBirth);
      if (mem.createdAt) memberDoc.createdAt = new Date(mem.createdAt);
      if (mem.updatedAt) memberDoc.updatedAt = new Date(mem.updatedAt);
      
      Object.keys(memberDoc).forEach(key => {
        if (key.startsWith('privacySettings_')) {
          delete memberDoc[key];
        }
      });

      await Member.updateOne(
        { _id: new mongoose.Types.ObjectId(mem._id) },
        { $set: memberDoc },
        { upsert: true }
      );
      console.log(`  └─ Restored member: ${mem.fullName}`);
    }
  }

  // 2. Restore users
  console.log(`\n📦 Restoring ${dbData.users?.length || 0} user accounts...`);
  if (dbData.users && dbData.users.length > 0) {
    for (const usr of dbData.users) {
      const userDoc = { ...usr };
      if (usr.createdAt) userDoc.createdAt = new Date(usr.createdAt);
      if (usr.updatedAt) userDoc.updatedAt = new Date(usr.updatedAt);

      await User.updateOne(
        { _id: new mongoose.Types.ObjectId(usr._id) },
        { $set: userDoc },
        { upsert: true }
      );
      console.log(`  └─ Restored user: ${usr.username}`);
    }
  }

  // 3. Restore documents
  console.log(`\n📦 Restoring ${dbData.documents?.length || 0} documents...`);
  if (dbData.documents && dbData.documents.length > 0) {
    for (const doc of dbData.documents) {
      const docDoc = { ...doc };
      if (doc.uploadedAt) docDoc.uploadedAt = new Date(doc.uploadedAt);

      await DocumentModel.updateOne(
        { _id: new mongoose.Types.ObjectId(doc._id) },
        { $set: docDoc },
        { upsert: true }
      );
      console.log(`  └─ Restored document: ${doc.name}`);
    }
  }

  console.log('\n🎉 DATA RESTORATION COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

restore().catch(err => {
  console.error('❌ Restoration failed with error:', err);
  process.exit(1);
});
