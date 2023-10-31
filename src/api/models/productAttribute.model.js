import mongoose from 'mongoose';
import { StockStatus } from '../enums/product.enum.js';

const { Schema } = mongoose;

const productAttributeSchema = new Schema(
  {
    name: String,
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },
    sku: { type: String },
    price: { type: Number, default: 0 },
    discountedPrice: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    stock: {
      quantity: { type: Number, default: 0 },
      status: {
        type: String,
        default: StockStatus.AVAILABLE,
        enum: Object.values(StockStatus)
      }
    }
  },
  {
    timestamps: false,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.id;
      }
    }
  }
);

productAttributeSchema.pre('save', function handlePrice(next) {
  if (this.price && this.discount > 0.0) {
    this.discountedPrice = this.price * (1 - this.discount);
  }

  return next();
});

export { productAttributeSchema };

export default mongoose.model('productAttribute', productAttributeSchema);
