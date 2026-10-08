import mongoose from 'mongoose';

const queueEntrySchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone number is required'],
      trim: true,
    },
    guestCount: {
      type: Number,
      required: [true, 'Guest count is required'],
      min: [1, 'Guest count must be at least 1'],
    },
    arrivalTime: {
      type: Date,
      default: Date.now,
    },
    position: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: {
        values: ['WAITING', 'NOTIFIED', 'SEATED', 'CANCELLED'],
        message: '{VALUE} is not a valid queue status',
      },
      default: 'WAITING',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for FIFO waiting queue retrieval and status filtering
queueEntrySchema.index({ restaurantId: 1, status: 1 });
queueEntrySchema.index({ restaurantId: 1, arrivalTime: 1 });

const QueueEntry = mongoose.model('QueueEntry', queueEntrySchema);

export default QueueEntry;
