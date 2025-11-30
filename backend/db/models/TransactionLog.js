import mongoose from 'mongoose';

const transactionLogSchema = new mongoose.Schema({
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: null,
  },
  apiResponse: {
    type: mongoose.Schema.Types.Mixed,
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
transactionLogSchema.index({ transactionId: 1 });
transactionLogSchema.index({ status: 1 });
transactionLogSchema.index({ createdAt: -1 });

const TransactionLog = mongoose.model('TransactionLog', transactionLogSchema);

export default TransactionLog;

