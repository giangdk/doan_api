import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import slugify from 'slugify';
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { mediaSchema } from './media.model.js';

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    parents: {
      firstLevel: { type: Schema.Types.ObjectId, ref: 'Category' },
      secondLevel: { type: Schema.Types.ObjectId, ref: 'Category' }
    },

    featuredImage: {
      type: String,
      default: 'https://via.placeholder.com/300x300.jpg?text=mubaha.com'
    },
    description: {
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
    isDeleted: { type: Boolean, default: false }
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
categorySchema.index({ name: 'text' });
categorySchema.plugin(mongoosePaginate);
categorySchema.plugin(aggregatePaginate);

categorySchema.virtual('childs', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parents.firstLevel',
  count: true
});

categorySchema.virtual('childCategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parents.firstLevel'
});

export default mongoose.model('Category', categorySchema); // categories
