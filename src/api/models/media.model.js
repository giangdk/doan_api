import mongoose from 'mongoose';
import mediaType from '../enums/mediaType.enum.js';

const { Schema } = mongoose;

const mediaSchema = new Schema(
  {
    title: {
      type: String
    },
    path: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: Object.values(mediaType),
      default: mediaType.IMAGE
    },
    variantId: {
      type: Schema.Types.ObjectId
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

export { mediaSchema };

export default mongoose.model('Media', mediaSchema);
