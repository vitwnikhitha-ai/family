import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import db from './utils/db.js';
import authRoutes from './routes/auth.js';
import memberRoutes from './routes/members.js';
import documentRoutes from './routes/documents.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins for local development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static upload directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Route handlers
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/documents', documentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    database: db.isMock ? 'Mock JSON Database' : 'MongoDB'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Connect to database and seed before exporting app
await db.connect();

// Seed default Admin if no users exist
try {
  const userCount = await db.User.countDocuments({});
  if (userCount === 0) {
    console.log('🔄 No users found in database. Bootstrapping default user account for Nikhil...');
    
    // 1. Seed Father
    const father = await db.Member.create({
      fullName: 'Nageswararao',
      relation: 'Father',
      gender: 'Male',
      dateOfBirth: '1978-10-24',
      phoneNumber: '9848022338',
      aadhaarNumber: '555566667777',
      address: 'Nageswararao House, Hyderabad',
      occupation: 'Business Owner',
      maritalStatus: 'Married',
      profilePhoto: null
    });

    // 2. Seed Mother (Swarna Kumari)
    const mother = await db.Member.create({
      fullName: 'Swarna Kumari',
      relation: 'Mother',
      gender: 'Female',
      dateOfBirth: '1982-08-22',
      phoneNumber: '9848022339',
      aadhaarNumber: '555566668888',
      address: 'Nageswararao House, Hyderabad',
      occupation: 'Homemaker',
      maritalStatus: 'Married',
      profilePhoto: null,
      spouse: father._id
    });

    // Link father spouse back
    father.spouse = mother._id;
    await father.save();

    // 3. Seed Sister (Nikhitha)
    const sister = await db.Member.create({
      fullName: 'Nikhitha',
      relation: 'Sister',
      gender: 'Female',
      dateOfBirth: '2005-03-28',
      phoneNumber: '9966554433',
      aadhaarNumber: '555566669999',
      address: 'Nageswararao House, Hyderabad',
      occupation: 'Software Engineer',
      maritalStatus: 'Single',
      father: father._id,
      mother: mother._id,
      profilePhoto: null
    });

    // 4. Seed Brother (Praveen)
    const brother = await db.Member.create({
      fullName: 'Praveen',
      relation: 'Brother',
      gender: 'Male',
      dateOfBirth: '2008-07-18',
      phoneNumber: '8877665544',
      aadhaarNumber: '555566661111',
      address: 'Nageswararao House, Hyderabad',
      occupation: 'Student',
      maritalStatus: 'Single',
      father: father._id,
      mother: mother._id,
      profilePhoto: null
    });

    // 5. Seed Nikhil (Self)
    const nikhilMember = await db.Member.create({
      fullName: 'Nikhil',
      relation: 'Self',
      gender: 'Male',
      dateOfBirth: '2003-01-24',
      phoneNumber: '9000111222',
      aadhaarNumber: '555566660000',
      address: 'Nageswararao House, Hyderabad',
      occupation: 'Software Developer',
      maritalStatus: 'Single',
      father: father._id,
      mother: mother._id,
      profilePhoto: null
    });

    // Encrypt Aadhaar numbers (using plain pass-through) and link relationships sequentially
    const { encrypt } = await import('./utils/encryption.js');

    father.aadhaarNumber = encrypt('555566667777');
    father.children = [sister._id, brother._id, nikhilMember._id];
    await father.save();

    mother.aadhaarNumber = encrypt('555566668888');
    mother.children = [sister._id, brother._id, nikhilMember._id];
    await mother.save();

    sister.aadhaarNumber = encrypt('555566669999');
    await sister.save();

    brother.aadhaarNumber = encrypt('555566661111');
    await brother.save();

    nikhilMember.aadhaarNumber = encrypt('555566660000');
    await nikhilMember.save();

    // Hash passwords before seeding
    const salt = await bcrypt.genSalt(10);
    const nikhilPassword = await bcrypt.hash('nikhil123', salt);
    const nageswararaoPassword = await bcrypt.hash('nageswararao123', salt);
    const swarnakumariPassword = await bcrypt.hash('swarnakumari123', salt);
    const nikhithaPassword = await bcrypt.hash('nikhitha123', salt);
    const praveenPassword = await bcrypt.hash('praveen123', salt);

    // Seed User Account: nikhil
    await db.User.create({
      username: 'nikhil',
      password: nikhilPassword,
      role: 'Admin',
      memberProfile: nikhilMember._id
    });

    // Seed User Account: nageswararao
    await db.User.create({
      username: 'nageswararao',
      password: nageswararaoPassword,
      role: 'Admin',
      memberProfile: father._id
    });

    // Seed User Account: swarnakumari
    await db.User.create({
      username: 'swarnakumari',
      password: swarnakumariPassword,
      role: 'Admin',
      memberProfile: mother._id
    });

    // Seed User Account: nikhitha
    await db.User.create({
      username: 'nikhitha',
      password: nikhithaPassword,
      role: 'Admin',
      memberProfile: sister._id
    });

    // Seed User Account: praveen
    await db.User.create({
      username: 'praveen',
      password: praveenPassword,
      role: 'Admin',
      memberProfile: brother._id
    });
    
    console.log('📌 Family login accounts seeded successfully.');
  }
} catch (seedError) {
  console.error('Error seeding default user:', seedError.message);
}

// Ensure live database is patched with the frontend public photos
try {
  await db.Member.updateMany({ fullName: 'Nikhil' }, { $set: { profilePhoto: '/nikhil.jpeg' } });
  await db.Member.updateMany({ fullName: 'Nikhitha' }, { $set: { profilePhoto: '/nikhiltha.jpeg' } });
  await db.Member.updateMany({ fullName: 'Praveen' }, { $set: { profilePhoto: '/praveen.jpeg' } });
  await db.Member.updateMany({ fullName: 'Swarna Kumari' }, { $set: { profilePhoto: '/swarna kumari.jpeg' } });
} catch (photoError) {
  console.error('Error patching photos:', photoError.message);
}

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
