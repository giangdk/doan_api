import mongoose from 'mongoose';
import slugify from 'slugify';
import customPageStatusEnum from '../enums/customPageStatus.enum.js';

const { Schema } = mongoose;

const customPageSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },

    title: {
      type: String,
      required: true
    },

    content: {
      type: String,
      required: true
    },

    subtitle: {
      type: String,
      default: ''
    },
    slug: {
      type: String,
      default() {
        if (this.name) {
          return `${slugify(this.name)}`;
        }
      }
    },
    link: {
      type: String,
      default() {
        if (this.slug) {
          return `/${this.slug}`;
        }
      }
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: Object.values(customPageStatusEnum),
      default: customPageStatusEnum.PUBLISH
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

export default mongoose.model('customPage', customPageSchema);
