import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

// Ensure local uploads directory exists
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure Cloudinary if credentials are present
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('✅ Cloudinary initialized successfully.');
} else {
  console.log('⚠️  Cloudinary credentials not detected. Falling back to local file storage.');
}

// Multer disk storage configuration (used for fallback or temporary staging)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (accept images and PDFs)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Handle file upload and return the accessible URL
 * @param {Object} file Multer file object
 * @returns {Promise<string>} Uploaded file URL
 */
export async function uploadToCloud(file) {
  if (!file) return null;

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'family_management_system',
        resource_type: 'auto'
      });
      // Delete temporary file from local storage after successful Cloudinary upload
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting local temp file:', err);
      });
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload failed, using local fallback:', error.message);
      // Fallback to local URL if Cloudinary fails
      return `/uploads/${path.basename(file.path)}`;
    }
  } else {
    // Return local URL
    return `/uploads/${path.basename(file.path)}`;
  }
}

export default upload;
