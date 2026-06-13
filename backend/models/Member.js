import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  relation: { type: String, required: true }, // e.g. Self, Father, Mother, Spouse, Son, Daughter
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  dateOfBirth: { type: Date, required: true },
  phoneNumber: { type: String, required: true },
  aadhaarNumber: { type: String, required: true }, // Will be stored encrypted
  address: { type: String, required: true },
  occupation: { type: String, required: true },
  maritalStatus: { type: String, required: true, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
  profilePhoto: { type: String, default: null }, // URL or base64 or path
  privacySettings: {
    dateOfBirth: { type: String, enum: ['Public', 'Private'], default: 'Public' },
    phoneNumber: { type: String, enum: ['Public', 'Private'], default: 'Public' },
    aadhaarNumber: { type: String, enum: ['Public', 'Private'], default: 'Private' },
    address: { type: String, enum: ['Public', 'Private'], default: 'Public' },
    occupation: { type: String, enum: ['Public', 'Private'], default: 'Public' }
  },
  customFields: [{
    key: { type: String, required: true },
    value: { type: String, required: true },
    privacy: { type: String, enum: ['Public', 'Private'], default: 'Public' }
  }],
  father: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  mother: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  spouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

memberSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Member || mongoose.model('Member', memberSchema);
export { memberSchema };
