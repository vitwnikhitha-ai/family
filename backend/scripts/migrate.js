import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import Member from '../models/Member.js';
import User from '../models/User.js';
import Document from '../models/Document.js';

const DB_FILE = path.join(__dirname, '../data/db.json');

async function migrate() {
  console.log('🚀 Starting MongoDB Data Migration...');
  
  if (!fs.existsSync(DB_FILE)) {
    console.error(`❌ db.json file not found at: ${DB_FILE}`);
    process.exit(1);
  }

  const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set in backend/.env!');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB at: ${mongoUri}`);
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB.');

  // Clear MongoDB collections to avoid duplicates/conflicts
  console.log('🧹 Clearing existing collections in MongoDB...');
  await Member.deleteMany({});
  await User.deleteMany({});
  await Document.deleteMany({});

  // 1. Migrate members
  console.log(`📦 Migrating ${dbData.members?.length || 0} family members...`);
  if (dbData.members && dbData.members.length > 0) {
    for (const mem of dbData.members) {
      const memberDoc = {
        ...mem,
        _id: new mongoose.Types.ObjectId(mem._id),
        dateOfBirth: mem.dateOfBirth ? new Date(mem.dateOfBirth) : null,
        father: mem.father ? new mongoose.Types.ObjectId(mem.father) : null,
        mother: mem.mother ? new mongoose.Types.ObjectId(mem.mother) : null,
        spouse: mem.spouse ? new mongoose.Types.ObjectId(mem.spouse) : null,
        children: (mem.children || []).map(c => new mongoose.Types.ObjectId(c)),
        createdBy: mem.createdBy ? new mongoose.Types.ObjectId(mem.createdBy) : null,
        createdAt: mem.createdAt ? new Date(mem.createdAt) : new Date(),
        updatedAt: mem.updatedAt ? new Date(mem.updatedAt) : new Date(),
      };
      
      // Remove any flat privacySettings_* properties which were added temporarily by form updates
      Object.keys(memberDoc).forEach(key => {
        if (key.startsWith('privacySettings_')) {
          delete memberDoc[key];
        }
      });

      await Member.create(memberDoc);
      console.log(`  └─ Member migrated: ${mem.fullName}`);
    }
  }

  // 2. Migrate users
  console.log(`📦 Migrating ${dbData.users?.length || 0} user accounts...`);
  if (dbData.users && dbData.users.length > 0) {
    for (const usr of dbData.users) {
      const userDoc = {
        ...usr,
        _id: new mongoose.Types.ObjectId(usr._id),
        memberProfile: usr.memberProfile ? new mongoose.Types.ObjectId(usr.memberProfile) : null,
        createdAt: usr.createdAt ? new Date(usr.createdAt) : new Date(),
      };
      await User.create(userDoc);
      console.log(`  └─ User migrated: ${usr.username}`);
    }
  }

  // 3. Migrate documents
  console.log(`📦 Migrating ${dbData.documents?.length || 0} documents...`);
  if (dbData.documents && dbData.documents.length > 0) {
    for (const doc of dbData.documents) {
      const docDoc = {
        ...doc,
        _id: new mongoose.Types.ObjectId(doc._id),
        memberId: doc.memberId ? new mongoose.Types.ObjectId(doc.memberId) : null,
        uploadedBy: doc.uploadedBy ? new mongoose.Types.ObjectId(doc.uploadedBy) : null,
        uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date(),
      };
      await Document.create(docDoc);
      console.log(`  └─ Document migrated: ${doc.name}`);
    }
  }

  // Delete db.json file
  console.log(`🗑️ Deleting db.json file...`);
  fs.unlinkSync(DB_FILE);
  console.log(`✅ db.json deleted.`);

  console.log('🎉 DATA MIGRATION COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed with error:', err);
  process.exit(1);
});
