import mongoose from 'mongoose';

const { Schema } = mongoose;

const brandSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    media: {
      featuredImage: {
        type: String,
        required: true,
        default: 'https://via.placeholder.com/300x300.jpg?text=mubaha.com'
      },
      data: [{ type: Schema.Types.ObjectId, ref: 'Media' }]
    },
    description: {
      type: String
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
brandSchema.index({ name: 'text' });

export default mongoose.model('Brand', brandSchema);
