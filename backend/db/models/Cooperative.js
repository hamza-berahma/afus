import mongoose from 'mongoose';

const cooperativeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  registrationNumber: {
    type: String,
    trim: true,
  },
  region: {
    type: String,
    trim: true,
  },
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },
  address: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes
// Ensure one cooperative per user (unique index)
cooperativeSchema.index({ userId: 1 }, { unique: true });
cooperativeSchema.index({ registrationNumber: 1 });
// Geospatial index for location-based queries
cooperativeSchema.index({ latitude: 1, longitude: 1 });
// Text index for search
cooperativeSchema.index({ name: 'text', region: 'text', address: 'text' });

const Cooperative = mongoose.model('Cooperative', cooperativeSchema);

export default Cooperative;

