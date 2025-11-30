import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
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

// Compound unique index to prevent duplicate favorites
favoriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Indexes for efficient queries
favoriteSchema.index({ userId: 1 });
favoriteSchema.index({ productId: 1 });

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;

