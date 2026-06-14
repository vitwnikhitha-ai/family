const mongoose = require('mongoose');

const uri = 'mongodb+srv://Vercel-Admin-atlas-rose-compass:Qf0MJNbrkHQAzDhS@atlas-rose-compass.zx2xz9h.mongodb.net/?retryWrites=true&w=majority';

async function check() {
  await mongoose.connect(uri);
  console.log('Connected');
  const db = mongoose.connection.db;
  const members = await db.collection('members').find().toArray();
  const users = await db.collection('users').find().toArray();
  console.log('Members:', members.map(m => m.fullName));
  console.log('Users:', users.map(u => u.username));
  process.exit(0);
}

check().catch(console.error);
