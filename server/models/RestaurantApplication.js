import mongoose from 'mongoose';

const restaurantApplicationSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: [150, 'Restaurant name cannot exceed 150 characters'],
    },
    applicantName: {
      type: String,
      required: [true, 'Applicant name is required'],
      trim: true,
    },
    applicantEmail: {
      type: String,
      required: [true, 'Applicant email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    applicantPhone: {
      type: String,
      required: [true, 'Applicant phone is required'],
      trim: true,
    },
    fssaiNumber: {
      type: String,
      required: [true, 'FSSAI license number is required'],
      trim: true,
      maxlength: [30, 'FSSAI license number cannot exceed 30 characters'],
      index: true,
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
    postalCode: {
      type: String,
      default: '',
      trim: true,
    },
    cuisine: {
      type: [String],
      default: [],
    },
    businessType: {
      type: String,
      default: 'Dine-In Restaurant',
      trim: true,
    },
    seatingCapacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstNumber: {
      type: String,
      default: '',
      trim: true,
    },
    website: {
      type: String,
      default: '',
      trim: true,
    },
    ownerPasswordHash: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'],
        message: '{VALUE} is not a valid application status',
      },
      default: 'PENDING',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const RestaurantApplication = mongoose.model('RestaurantApplication', restaurantApplicationSchema);

export default RestaurantApplication;
