import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  cooperativeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cooperative',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: null,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  unit: {
    type: String,
    required: true,
    trim: true,
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Single image URL (deprecated, use imageUrls array instead)
  imageUrl: {
    type: String,
    default: null,
  },
  // Multiple image URLs (like Amazon - supports multiple product images)
  imageUrls: {
    type: [String],
    default: [],
  },
  deletedAt: {
    type: Date,
    default: null,
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
productSchema.index({ cooperativeId: 1, deletedAt: 1 });
productSchema.index({ cooperativeId: 1, name: 1 });
productSchema.index({ deletedAt: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;

