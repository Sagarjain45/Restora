import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
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
      required: [true, 'Customer phone is required'],
      trim: true,
    },
    customerEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      default: null,
    },
    guestCount: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: [1, 'Guest count must be at least 1'],
    },
    date: {
      type: String, // Stored as ISO YYYY-MM-DD or Date
      required: [true, 'Reservation date is required'],
    },
    startTime: {
      type: String, // Format "HH:mm" (e.g., "19:30")
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String, // Format "HH:mm" (e.g., "21:00")
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'CONFIRMED', 'ARRIVED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
        message: '{VALUE} is not a valid reservation status',
      },
      default: 'PENDING',
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

// Compound indexes for conflict detection and schedule lookups
reservationSchema.index({ restaurantId: 1, date: 1 });
reservationSchema.index({ restaurantId: 1, tableId: 1 });
reservationSchema.index({ restaurantId: 1, status: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;
