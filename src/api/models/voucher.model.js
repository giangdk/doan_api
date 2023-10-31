import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

import voucherTypeEnum from '../enums/voucherType.enum.js';
import voucherStatusEnum from '../enums/voucherStatus.enum.js';
import discountTypeEnum from '../enums/discountType.enum.js';
import currencyEnum from '../enums/currency.enum.js';

const { Schema } = mongoose;

const voucherSchema = new Schema(
  {
    title: {
      type: String
    },
    discount: {
      amount: { type: Number },
      type: {
        type: String,
        enum: Object.values(discountTypeEnum),
        default: discountTypeEnum.PRICE
      }
    },
    minBasketPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    usageLimitQuantity: {
      type: Number,
      min: 0,
      default: 0
    },
    totalUsed: {
      type: Number,
      min: 0,
      default: 0
    },
    maxVoucherAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    active: {
      type: Boolean,
      default: true
    },
    code: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: Object.values(voucherTypeEnum),
      default: voucherTypeEnum.VENDOR
    },
    currencySymbol: {
      type: String,
      enum: Object.values(currencyEnum),
      default: currencyEnum.VND
    },
    status: {
      type: String,
      enum: Object.values(voucherStatusEnum),
      default: voucherStatusEnum.AVAILABLE
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

voucherSchema.plugin(mongoosePaginate);

export default mongoose.model('Voucher', voucherSchema);
