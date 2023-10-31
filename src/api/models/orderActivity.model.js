import mongoose from 'mongoose';
import activityState from '../enums/activityState.enum.js';

const { Schema } = mongoose;

const orderActivitySchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    },
    reason: {
      type: String
    },
    state: {
      type: String,
      enum: Object.values(activityState),
      required: true
    },
    issuer: {
      type: Schema.Types.ObjectId,
      ref: 'Account'
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

export default mongoose.model('OrderActivity', orderActivitySchema);
export { orderActivitySchema };
