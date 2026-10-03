const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/family')
  .then(async () => {
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;
    
    await db.collection('members').updateMany({ fullName: 'Nikhil' }, { $set: { profilePhoto: '/nikhil.webp' } });
    await db.collection('members').updateMany({ fullName: 'Nikhitha' }, { $set: { profilePhoto: '/nikhiltha.webp' } });
    await db.collection('members').updateMany({ fullName: 'Praveen' }, { $set: { profilePhoto: '/praveen.webp' } });
    await db.collection('members').updateMany({ fullName: 'Swarna Kumari' }, { $set: { profilePhoto: '/swarna kumari.webp' } });
    await db.collection('members').updateMany({ fullName: 'Nageswararao' }, { $set: { profilePhoto: '/nageswarao.webp' } });
    
    console.log('Successfully updated profile photos in MongoDB.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
