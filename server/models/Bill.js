import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
      index: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: [true, 'Table ID is required'],
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD'],
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['UNPAID', 'PAID', 'VOID'],
        message: '{VALUE} is not a valid bill status',
      },
      default: 'UNPAID',
    },
  },
  {
    timestamps: true,
  }
);

billSchema.index({ restaurantId: 1, orderId: 1 });
billSchema.index({ restaurantId: 1, status: 1 });

const Bill = mongoose.model('Bill', billSchema);

export default Bill;
