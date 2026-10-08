import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    tableNumber: {
      type: String,
      required: [true, 'Table number or label is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Table seating capacity is required'],
      min: [1, 'Capacity must be at least 1 seat'],
    },
    status: {
      type: String,
      enum: {
        values: [
          'AVAILABLE',
          'OCCUPIED',
          'RESERVED',
          'BILLING',
          'OUT_OF_SERVICE',
          'CLEANING',
          'UNAVAILABLE',
        ],
        message: '{VALUE} is not a valid table status',
      },
      default: 'AVAILABLE',
    },
    section: {
      type: String,
      trim: true,
      default: 'Main Dining',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    currentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique table number per restaurant tenant
tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });
// Compound index for fast status filtering by tenant
tableSchema.index({ restaurantId: 1, status: 1 });
tableSchema.index({ restaurantId: 1, isActive: 1 });

const Table = mongoose.model('Table', tableSchema);

export default Table;
