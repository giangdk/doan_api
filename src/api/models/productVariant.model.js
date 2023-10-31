import mongoose from 'mongoose';
import { productAttributeSchema } from './productAttribute.model.js';
import { StockStatus } from '../enums/product.enum.js';
import { getColorNameByHex } from '../enums/colorHex.enum.js';

const { Schema } = mongoose;

const productVariantSchema = new Schema(
  {
    name: String,
    attributes: [productAttributeSchema],
    image: {
      type: String
    },
    sku: { type: String },
    price: { type: Number, default: 0 },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    discountedPrice: {
      type: Number,
      default: 0
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
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.id;
        if (ret.name) {
          ret.colorName = getColorNameByHex(ret.name);
        }
      }
    }
  }
);

productVariantSchema.pre('save', function handlePrice(next) {
  if (this.price && this.discount > 0.0) {
    this.discountedPrice = this.price * (1 - this.discount);
  }

  return next();
});

export { productVariantSchema };

export default mongoose.model('ProductVariant', productVariantSchema);
