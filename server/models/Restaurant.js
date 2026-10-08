import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: [150, 'Restaurant name cannot exceed 150 characters'],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    cuisine: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    website: {
      type: String,
      default: '',
      trim: true,
    },
    postalCode: {
      type: String,
      default: '',
      trim: true,
    },
    isOpenNow: {
      type: Boolean,
      default: true,
    },
    openingHours: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          required: true,
        },
        openTime: { type: String, default: '10:00' },
        closeTime: { type: String, default: '23:00' },
        isClosed: { type: Boolean, default: false },
      },
    ],
    settings: {
      currency: { type: String, default: 'INR' },
      taxRatePercent: { type: Number, default: 5, min: 0, max: 100 },
      serviceChargePercent: { type: Number, default: 0, min: 0, max: 50 },
      autoAcceptReservations: { type: Boolean, default: false },
      allowSpecialRequests: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE'],
        message: '{VALUE} is not a valid restaurant status',
      },
      default: 'PENDING',
      index: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ['FREE', 'BASIC', 'PREMIUM'],
      default: 'BASIC',
    },
  },
  {
    timestamps: true,
  }
);

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;
