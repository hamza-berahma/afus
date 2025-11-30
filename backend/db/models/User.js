import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['BUYER', 'PRODUCER', 'ADMIN'],
    default: 'BUYER',
    required: true,
  },
  walletId: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
      return ret;
    },
  },
});

// Indexes (unique: true already creates indexes for email and phone)
userSchema.index({ role: 1 });
userSchema.index({ walletId: 1 });

const User = mongoose.model('User', userSchema);

export default User;

