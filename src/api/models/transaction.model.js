import mongoose from 'mongoose';
import transactionTypeEnum from '../enums/transactionType.enum.js';
import transactionStatusEnum from '../enums/transactionStatus.enum.js';

const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    // orderId: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'Order'
    // },
    cardNumber: {
      type: String
    },
    cardName: {
      type: String
    },
    expirationDate: {
      type: Date
    },
    cardCode: {
      type: String
    },
    type: {
      type: String,
      enum: Object.values(transactionTypeEnum),
      default: transactionTypeEnum.VISA
    },
    transactionId: {
      type: String
    },
    status: {
      type: String,
      enum: Object.values(transactionTypeEnum),
      default: transactionTypeEnum.PENDING
    },
    price: {
      type: Number,
      default: 0
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'Account'
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

export default mongoose.model('Transaction', transactionSchema);
