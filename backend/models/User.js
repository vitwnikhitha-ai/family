import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['Admin', 'Family Member'], default: 'Family Member' },
  memberProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model('User', userSchema);
export { userSchema };
