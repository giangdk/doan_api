import mongoose from 'mongoose';
import shipmentMethodTypeEnum from '../enums/shipmentMethodType.enum.js';

const { Schema } = mongoose;

const shipmentMethodSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(shipmentMethodTypeEnum),
      required: true
    },
    name: {
      type: String,
      required: true
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

export default mongoose.model('ShipmentMethod', shipmentMethodSchema);
export { shipmentMethodSchema };
