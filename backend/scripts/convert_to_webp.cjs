const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const mongoose = require('mongoose');

const publicDir = path.resolve(__dirname, '../../frontend/public');
const assetsDir = path.resolve(__dirname, '../../frontend/src/assets');

async function convertDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      const inputPath = path.join(dir, file);
      const baseName = path.basename(file, ext);
      const outputPath = path.join(dir, `${baseName}.webp`);
      console.log(`Converting ${file} -> ${baseName}.webp ...`);
      await sharp(inputPath)
        .webp({ quality: 90 })
        .toFile(outputPath);
      console.log(`✅ Saved ${baseName}.webp`);
      // Remove old file
      fs.unlinkSync(inputPath);
      console.log(`🗑️ Removed ${file}`);
    }
  }
}

async function updateDatabases() {
  // 1. Update backend/data/db.json
  const dbJsonPath = path.resolve(__dirname, '../data/db.json');
  if (fs.existsSync(dbJsonPath)) {
    let content = fs.readFileSync(dbJsonPath, 'utf8');
    content = content
      .replace(/\/nikhil\.jpeg/g, '/nikhil.webp')
      .replace(/\/nikhiltha\.jpeg/g, '/nikhiltha.webp')
      .replace(/\/praveen\.jpeg/g, '/praveen.webp')
      .replace(/\/swarna kumari\.jpeg/g, '/swarna kumari.webp')
      .replace(/\/nageswarao\.jpg/g, '/nageswarao.webp');
    fs.writeFileSync(dbJsonPath, content, 'utf8');
    console.log('✅ Updated backend/data/db.json profilePhoto paths');
  }

  // 2. Update MongoDB Atlas
  const uri = process.env.MONGODB_URI || 'mongodb://Vercel-Admin-atlas-rose-compass:Qf0MJNbrkHQAzDhS@ac-oksa0mv-shard-00-00.zx2xz9h.mongodb.net:27017,ac-oksa0mv-shard-00-01.zx2xz9h.mongodb.net:27017,ac-oksa0mv-shard-00-02.zx2xz9h.mongodb.net:27017/test?ssl=true&replicaSet=atlas-8z2lv1-shard-0&authSource=admin&retryWrites=true&w=majority';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.db;
    await db.collection('members').updateMany({ fullName: { $regex: /nikhil/i, $not: /nikhitha|nikhiltha/i } }, { $set: { profilePhoto: '/nikhil.webp' } });
    await db.collection('members').updateMany({ fullName: { $regex: /nikhitha|nikhiltha/i } }, { $set: { profilePhoto: '/nikhiltha.webp' } });
    await db.collection('members').updateMany({ fullName: { $regex: /praveen/i } }, { $set: { profilePhoto: '/praveen.webp' } });
    await db.collection('members').updateMany({ fullName: { $regex: /swarna/i } }, { $set: { profilePhoto: '/swarna kumari.webp' } });
    await db.collection('members').updateMany({ fullName: { $regex: /nageswara/i } }, { $set: { profilePhoto: '/nageswarao.webp' } });
    console.log('✅ Updated MongoDB Atlas profilePhoto paths');
  } catch (err) {
    console.log('ℹ️ MongoDB update skipped:', err.message);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
  }
}

async function main() {
  console.log('--- Converting Public Images to WebP ---');
  await convertDir(publicDir);
  console.log('--- Converting Assets Images to WebP ---');
  await convertDir(assetsDir);
  console.log('--- Updating DB References ---');
  await updateDatabases();
  console.log('🎉 All images converted and updated successfully!');
}

main().catch(console.error);
