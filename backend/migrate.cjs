const mongoose = require('mongoose');

const localUri = 'mongodb://127.0.0.1:27017/family';
const atlasUri = 'mongodb+srv://Vercel-Admin-atlas-rose-compass:Qf0MJNbrkHQAzDhS@atlas-rose-compass.zx2xz9h.mongodb.net/?retryWrites=true&w=majority';

async function migrate() {
  try {
    console.log('🔌 Connecting to local MongoDB...');
    const localDb = await mongoose.createConnection(localUri).asPromise();
    
    console.log('🔌 Connecting to Atlas MongoDB...');
    const atlasDb = await mongoose.createConnection(atlasUri).asPromise();

    console.log('📦 Fetching local data...');
    const users = await localDb.collection('users').find({}).toArray();
    const members = await localDb.collection('members').find({}).toArray();
    const documents = await localDb.collection('documents').find({}).toArray();

    console.log(`Found ${users.length} users, ${members.length} members, and ${documents.length} documents locally.`);

    if (users.length > 0) {
      console.log('🚀 Migrating users to Atlas...');
      await atlasDb.collection('users').deleteMany({});
      await atlasDb.collection('users').insertMany(users);
    }

    if (members.length > 0) {
      console.log('🚀 Migrating members to Atlas...');
      await atlasDb.collection('members').deleteMany({});
      await atlasDb.collection('members').insertMany(members);
    }

    if (documents.length > 0) {
      console.log('🚀 Migrating documents to Atlas...');
      await atlasDb.collection('documents').deleteMany({});
      await atlasDb.collection('documents').insertMany(documents);
    }

    console.log('✅ Migration to Atlas completed successfully!');
    
    await localDb.close();
    await atlasDb.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
