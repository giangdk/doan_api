import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { customAlphabet } from 'nanoid';
import { addressSchema } from './address.model.js';
import paymentMethodEnum from '../enums/paymentMethod.enum.js';
import orderStatusEnum from '../enums/orderStatus.enum.js';
import paymentStatusEnum from '../enums/paymentStatus.enum.js';
import shipmentStatusEnum from '../enums/shipmentStatus.enum.js';
import discountTypeEnum from '../enums/discountType.enum.js';
import voucherTypeEnum from '../enums/voucherType.enum.js';
import currencyEnum from '../enums/currency.enum.js';
import { shipmentDetailSchema } from './shipmentDetail.model.js';
import { shipmentMethodSchema } from './shipmentMethod.model.js';

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    orderId: {
      type: String,
      default() {
        const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);
        return `${nanoid()}`;
      }
    },
    products: [
      {
        type: Object,
        required: true
      }
    ],
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Account'
    },
    voucherDiscountAmount: {
      type: Number,
      default: 0
    },
    buyerPaidAmount: {
      type: Number,
      default: 0
    },
    totalPriceBefore: {
      type: Number,
      default: 0
    },
    totalPrice: {
      type: Number,
      default: 0
    },
    totalProducts: {
      type: Number,
      default: 0
    },
    currencySymbol: {
      type: String,
      enum: Object.values(currencyEnum),
      default: currencyEnum.VND
    },
    shipment: { type: Schema.Types.ObjectId, ref: 'Shipment' },
    deliveryAddress: addressSchema,
    shipmentMethod: shipmentMethodSchema,
    payment: {
      method: {
        type: String,
        enum: Object.values(paymentMethodEnum),
        default: paymentMethodEnum.VISA
      },
      status: {
        type: String,
        enum: Object.values(paymentStatusEnum)
      }
    },
    paymentMethod: { type: Object },
    status: {
      type: String,
      enum: Object.values(orderStatusEnum),
      default: orderStatusEnum.COMPLETED
    },
    usedVouchers: [
      {
        voucher: { type: Schema.Types.ObjectId, ref: 'Voucher' },
        title: String,
        amount: {
          type: Number
        },
        type: {
          type: String,
          enum: Object.values(voucherTypeEnum)
        },
        minBasketPrice: Number,
        maxVoucherAmount: Number
      }
    ],
    totalSystemDiscount: {
      type: Number,
      default: 0
    },
    totalVendorDiscount: {
      type: Number,
      default: 0
    },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    proccessingInfo: {
      cancelAt: {
        type: Date
      },
      paymentAt: {
        type: Date
      },
      deliveredAt: {
        type: Date
      },
      pickupAt: {
        type: Date
      },
      reviewAt: {
        type: Date
      },
      intransitAt: {
        type: Date
      },
      orderAt: {
        type: Date,
        default: Date.now()
      },
      returnAt: {
        type: Date
      }
    },
    listType: {
      type: Number,
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 20000
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

orderSchema.virtual('_customer', {
  ref: 'Account',
  localField: 'customer',
  foreignField: '_id',
  justOne: true
});

orderSchema.index({ '$**': 'text' });
orderSchema.plugin(mongoosePaginate);
export default mongoose.model('Order', orderSchema);
