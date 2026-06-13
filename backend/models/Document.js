import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, required: true }, // e.g. 'image/png', 'application/pdf'
  category: { type: String, required: true }, // e.g. ID Card, Birth Certificate, Academic, Other
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Document || mongoose.model('Document', documentSchema);
export { documentSchema };
