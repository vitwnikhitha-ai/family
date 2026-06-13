const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/family')
  .then(async () => {
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;
    
    await db.collection('members').updateMany({ fullName: 'Nikhil' }, { $set: { dateOfBirth: '2003-01-24' } });
    await db.collection('members').updateMany({ fullName: 'Nikhitha' }, { $set: { dateOfBirth: '2005-03-28' } });
    await db.collection('members').updateMany({ fullName: 'Praveen' }, { $set: { dateOfBirth: '2008-07-18' } });
    await db.collection('members').updateMany({ fullName: 'Nageswararao' }, { $set: { dateOfBirth: '1978-10-24' } });
    await db.collection('members').updateMany({ fullName: 'Swarna Kumari' }, { $set: { dateOfBirth: '1982-08-22' } });
    
    console.log('Successfully updated DOBs in MongoDB.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
