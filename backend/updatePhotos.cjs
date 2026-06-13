const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/family')
  .then(async () => {
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;
    
    await db.collection('members').updateMany({ fullName: 'Nikhil' }, { $set: { profilePhoto: '/nikhil.jpeg' } });
    await db.collection('members').updateMany({ fullName: 'Nikhitha' }, { $set: { profilePhoto: '/nikhiltha.jpeg' } });
    await db.collection('members').updateMany({ fullName: 'Praveen' }, { $set: { profilePhoto: '/praveen.jpeg' } });
    await db.collection('members').updateMany({ fullName: 'Swarna Kumari' }, { $set: { profilePhoto: '/swarna kumari.jpeg' } });
    
    console.log('Successfully updated profile photos in MongoDB.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
