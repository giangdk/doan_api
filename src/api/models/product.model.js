import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import slugify from 'slugify';

import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoosePaginate from 'mongoose-paginate-v2';
import { getColorNameByHex } from '../enums/colorHex.enum.js';
import { productVariantSchema } from './productVariant.model.js';
import currencyEnum from '../enums/currency.enum.js';
import { StockStatus, StockCountry } from '../enums/product.enum.js';
import { mediaSchema } from './media.model.js';
import accountTypeEnum from '../enums/accountType.enum.js';
import productStatusEnum from '../enums/productStatus.enum.js';

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    variantLabel: {
      type: String
    },
    attributeLabel: {
      type: String
    },
    variants: [productVariantSchema],
    priceRange: {
      min: {
        type: Number,
        default: 0
      },
      max: {
        type: Number,
        default: 0
      }
    },
    discountedPrice: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: Object.values(productStatusEnum),
      default: productStatusEnum.PUBLISH
    },
    currencySymbol: {
      type: String,
      required: true,
      enum: Object.values(currencyEnum),
      default: currencyEnum.VND
    },
    stock: {
      quantity: { type: Number, default: 1, required: true },
      status: {
        type: String,
        required: true,
        default: StockStatus.AVAILABLE,
        enum: Object.values(StockStatus)
      },
      country: {
        type: String,
        required: true,
        default: StockCountry.VIETNAM,
        enum: Object.values(StockCountry)
      }
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1
    },
    media: {
      featuredImage: {
        type: String,
        required: true,
        default: 'https://via.placeholder.com/300x300.jpg?text=mubaha.com'
      },
      data: [mediaSchema]
    },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    parentCategories: {
      firstLevel: { type: Schema.Types.ObjectId, ref: 'Category' },
      secondLevel: { type: Schema.Types.ObjectId, ref: 'Category' }
    },
    description: {
      type: String,
      required: true
    },
    shortDescription: {
      type: String,
      default: ''
    },
    slug: {
      type: String,
      default() {
        if (this.name) {
          return `${slugify(this.name)}-${nanoid(6)}`;
        }
      }
    },
    link: {
      type: String,
      default() {
        if (this.slug) {
          return `/products/${this.slug}`;
        }
      }
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    ratings: {
      1: {
        type: Number,
        default: 0
      },
      2: {
        type: Number,
        default: 0
      },
      3: {
        type: Number,
        default: 0
      },
      4: {
        type: Number,
        default: 0
      },
      5: {
        type: Number,
        default: 0
      }
    },
    avgRating: {
      type: Number,
      default: 3
    },
    totalReviews: {
      type: Number,
      default: 0,
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

productSchema.pre('save', function handlePriceRange(next) {
  let minPrice = 9999999999;
  let maxPrice = 0;
  if (this.variants && this.variants.length > 0) {
    const _minPrice = Math.min(...this.variants.map((v) => v.price));
    if (_minPrice > 0 && _minPrice < minPrice) {
      minPrice = _minPrice;
    }

    const _maxPrice = Math.max(...this.variants.map((v) => v.price));
    if (maxPrice < _maxPrice) maxPrice = _maxPrice;

    this.variants.forEach((x) => {
      if (x.attributes && x.attributes.length > 0) {
        const _minAttributePrice = Math.min(...x.attributes.map((a) => a.price));
        if (_minAttributePrice > 0 && _minAttributePrice < minPrice) minPrice = _minAttributePrice;

        const _maxAttributePrice = Math.max(...x.attributes.map((a) => a.price));
        if (maxPrice < _maxAttributePrice) maxPrice = _maxAttributePrice;
      }
    });
    this.price = minPrice;
  }

  this.discountedPrice = this.price * (1 - this.discount);

  if (this.variants.length > 0) {
    this.priceRange = {
      min: minPrice,
      max: maxPrice
    };
  } else {
    this.priceRange = {
      min: this.discountedPrice,
      max: this.discountedPrice
    };
  }
  return next();
});

// productSchema.index({ name: "text",description:"text"}),
productSchema.index({ '$**': 'text' });
productSchema.plugin(mongoosePaginate);
productSchema.plugin(aggregatePaginate);

productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product'
});

export default mongoose.model('Product', productSchema);
