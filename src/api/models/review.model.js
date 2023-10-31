import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { mediaSchema } from './media.model.js';

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    content: {
      type: String,
      required: true
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'Account'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    gallery: [mediaSchema]
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

reviewSchema.plugin(mongoosePaginate);
reviewSchema.plugin(mongooseAggregatePaginate);

export default mongoose.model('Review', reviewSchema);
