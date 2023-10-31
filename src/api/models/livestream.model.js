import mongoose from 'mongoose';

const { Schema } = mongoose;

const liveStreamSchema = new Schema(
  {

    imageUrl: {
      type: String,
      required: true,
      default: "https://firebasestorage.googleapis.com/v0/b/app-chat-c3e6c.appspot.com/o/livestream%2Flive-6366830_1280.png?alt=media&token=bf25a47f-a371-4964-98b7-613f0ecaf858&_gl=1*1mos7fl*_ga*MTYyMDA1NjUyLjE2OTYxNjQzMzc.*_ga_CW55HF8NVT*MTY5ODE2NzU2NC4yMi4xLjE2OTgxNjc1OTcuMjcuMC4w"
    },
    key: {
      type: String,
      required: true
    },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    isExpired: {
      type: Boolean,
      default: true,
      required: true
    },
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

export default mongoose.model('LiveStream', liveStreamSchema);
export { liveStreamSchema };
