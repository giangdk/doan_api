import mongoose from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoosePaginate from 'mongoose-paginate-v2';
import cartStatusEnum from '../enums/cartStatus.enum.js';
import currencyEnum from '../enums/currency.enum.js';

const { Schema } = mongoose;

const cartItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },
    amount: {
      type: Number,
      default: 1,
      min: 1
    },
    selectedVariant: { type: Object },
    selectedAttribute: { type: Object },
    currencySymbol: {
      type: String,
      enum: Object.values(currencyEnum),
      default: currencyEnum.VND
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'Account'
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    status: {
      type: String,
      enum: Object.values(cartStatusEnum),
      default: cartStatusEnum.ACTIVE
    },
    price: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    discountedPrice: {
      type: Number,
      default: 0
    },
    lastPrice: {
      type: Number,
      default: 0
    },
    isChanged: {
      type: Boolean,
      default: false
    },
    isSelected: {
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

cartItemSchema.pre('save', function handlePrice(next) {
  this.discountedPrice = this.price * (1 - this.discount);
  this.lastPrice = this.discountedPrice * this.amount;

  return next();
});

cartItemSchema.index({ vendor: 1, updatedAt: -1 });

cartItemSchema.plugin(mongoosePaginate);
cartItemSchema.plugin(aggregatePaginate);

export default mongoose.model('CartItem', cartItemSchema);
