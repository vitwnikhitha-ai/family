const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8']);
const uri = 'mongodb://Vercel-Admin-atlas-rose-compass:Qf0MJNbrkHQAzDhS@ac-oksa0mv-shard-00-00.zx2xz9h.mongodb.net:27017,ac-oksa0mv-shard-00-01.zx2xz9h.mongodb.net:27017,ac-oksa0mv-shard-00-02.zx2xz9h.mongodb.net:27017/test?ssl=true&replicaSet=atlas-8z2lv1-shard-0&authSource=admin&retryWrites=true&w=majority';
async function linkUser() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  await db.collection('users').updateOne(
    { username: 'nikhil' },
    { $set: { memberProfile: new mongoose.Types.ObjectId('fbdf316c3881c49a50b515fc') } }
  );
  console.log('User linked to profile successfully.');
  process.exit(0);
}
linkUser().catch(console.error);
