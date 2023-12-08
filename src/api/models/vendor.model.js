import mongoose from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoosePaginate from 'mongoose-paginate-v2';
import productStatusEnum from '../enums/productStatus.enum.js';
import { addressSchema } from './address.model.js';
import { mediaSchema } from './media.model.js';

const { Schema } = mongoose;

const vendorSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'Account'
    },
    details: {
      type: String,
      default: ''
    },
    cover: {
      type: String,
      default: 'https://via.placeholder.com/1920x350.jpg?text=mubaha.com'
    },
    gallery: [mediaSchema],
    active: { type: Boolean, default: true },
    socialLinks: {
      facebook: String,
      youtube: String,
      tiktok: String,
      instagram: String
    },

    avatar: {
      type: String,
      default: 'https://via.placeholder.com/1920x350.jpg?text=mubaha.com'
    },

    address: addressSchema,

    description: {
      type: String
    },
    brandName: {
      type: String
    },
    cliendIdPaypal: {
      type: String
    },
    secretPaypal: {
      type: String
    },
    followers: {
      type: Number,
      default: 0
    },
    responseRate: {
      type: Number,
      default: 0
    },
    ratingOverall: {
      type: Number,
      default: 0
    }
  },
  {
    strict: false,
    timestamps: false,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.id;
        // ret.categoryImage = Category.getCategoryImage(ret.category);
      }
    }
  }
);

vendorSchema.index({ '$**': 'text' });

vendorSchema.virtual('ownerRef', {
  ref: 'Account',
  localField: 'owner',
  foreignField: '_id',
  justOne: true
});

vendorSchema.virtual('totalProducts', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'vendor',
  match: { isDeleted: false, status: productStatusEnum.PUBLISH },
  count: true,
})

vendorSchema.plugin(mongoosePaginate);
vendorSchema.plugin(aggregatePaginate);

export default mongoose.model('Vendor', vendorSchema);
