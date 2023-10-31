import mongoose from 'mongoose';
import paymentMethod from '../enums/paymentMethod.enum.js';

const { Schema } = mongoose;

const paymentMethodSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: Object.values(paymentMethod),
      required: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.id;
      }
    }
  }
);

export default mongoose.model('PaymentMethod', paymentMethodSchema);
