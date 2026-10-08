import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null, // null for PLATFORM_ADMIN
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: {
        values: ['PLATFORM_ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_STAFF'],
        message: '{VALUE} is not a valid user role',
      },
      required: [true, 'User role is required'],
      default: 'RESTAURANT_STAFF',
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for queries scoped to restaurant and role
userSchema.index({ restaurantId: 1, role: 1 });

const User = mongoose.model('User', userSchema);

export default User;
