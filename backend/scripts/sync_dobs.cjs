const mongoose = require('mongoose');
const dns = require('dns');
try { dns.setServers(['8.8.8.8']); } catch (e) {}

const uri = process.env.MONGODB_URI || 'mongodb://Vercel-Admin-atlas-rose-compass:Qf0MJNbrkHQAzDhS@ac-oksa0mv-shard-00-00.zx2xz9h.mongodb.net:27017,ac-oksa0mv-shard-00-01.zx2xz9h.mongodb.net:27017,ac-oksa0mv-shard-00-02.zx2xz9h.mongodb.net:27017/test?ssl=true&replicaSet=atlas-8z2lv1-shard-0&authSource=admin&retryWrites=true&w=majority';

async function listMembers() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const members = await db.collection('members').find().toArray();
  console.log(JSON.stringify(members.map(m => ({ id: m._id, fullName: m.fullName, dateOfBirth: m.dateOfBirth })), null, 2));
  
  // Let's update all members with regex match or name match:
  await db.collection('members').updateMany({ fullName: { $regex: /nikhil/i } }, { $set: { dateOfBirth: '2003-01-24' } });
  await db.collection('members').updateMany({ fullName: { $regex: /nikhitha/i } }, { $set: { dateOfBirth: '2005-03-28' } });
  await db.collection('members').updateMany({ fullName: { $regex: /praveen/i } }, { $set: { dateOfBirth: '2008-07-18' } });
  await db.collection('members').updateMany({ fullName: { $regex: /nageswara/i } }, { $set: { dateOfBirth: '1978-10-24' } });
  await db.collection('members').updateMany({ fullName: { $regex: /swarna/i } }, { $set: { dateOfBirth: '1982-08-22' } });

  const updated = await db.collection('members').find().toArray();
  console.log('UPDATED:', JSON.stringify(updated.map(m => ({ id: m._id, fullName: m.fullName, dateOfBirth: m.dateOfBirth })), null, 2));
  process.exit(0);
}

listMembers().catch(console.error);
