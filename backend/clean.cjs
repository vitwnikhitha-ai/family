const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8']);
const uri = 'mongodb://Vercel-Admin-atlas-rose-compass:Qf0MJNbrkHQAzDhS@ac-oksa0mv-shard-00-00.zx2xz9h.mongodb.net:27017,ac-oksa0mv-shard-00-01.zx2xz9h.mongodb.net:27017,ac-oksa0mv-shard-00-02.zx2xz9h.mongodb.net:27017/test?ssl=true&replicaSet=atlas-8z2lv1-shard-0&authSource=admin&retryWrites=true&w=majority';
async function clean() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const idsToDelete = [
    new mongoose.Types.ObjectId('d005426cecd89ff0f3e95a09'),
    new mongoose.Types.ObjectId('452d966f8d6e334b6ffd7abf'),
    new mongoose.Types.ObjectId('dbd2df8ab692e4be27ee04fd'),
    new mongoose.Types.ObjectId('cc85458397ea1d280aa8e819')
  ];
  await db.collection('members').deleteMany({ _id: { $in: idsToDelete } });
  console.log('Duplicates deleted');
  
  // also fix Nikhil's parent links so he links to the active parents!
  await db.collection('members').updateOne(
    { _id: new mongoose.Types.ObjectId('fbdf316c3881c49a50b515fc') },
    { $set: { 
        father: new mongoose.Types.ObjectId('6a2dbad847e2b8784298614c'), 
        mother: new mongoose.Types.ObjectId('6a2dbad847e2b8784298614e') 
      }
    }
  );
  process.exit(0);
}
clean().catch(console.error);
