import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: [true, 'Menu item ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
    },
    price: {
      type: Number,
      required: [true, 'Item price is required'],
      min: 0,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    orderNumber: {
      type: String,
      trim: true,
      index: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: [true, 'Table ID is required'],
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 5,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: {
        values: ['NEW', 'PLACED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'NEW',
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['PENDING', 'PAID', 'CANCELLED'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for active orders, reporting, and table lookups
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, tableId: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
