import mongoose from 'mongoose';

const lendingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    status: {
      type: String,
      enum: ['requested', 'approved', 'borrowed', 'returned', 'cancelled'],
      default: 'requested',
    },
    dueDate: { type: Date, required: true },
    reminderSent: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    returnedAt: { type: Date },
  },
  { timestamps: true }
);

const Lending = mongoose.model('Lending', lendingSchema);

export default Lending;
