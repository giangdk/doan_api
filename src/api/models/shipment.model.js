import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

import { customAlphabet } from 'nanoid';

import shipmentStatusEnum from '../enums/shipmentStatus.enum.js';
import { addressSchema } from './address.model.js';

const { Schema } = mongoose;

const shipmentSchema = new Schema(
  {
    shipmentId: {
      type: String,
      default() {
        const nanoid = customAlphabet('1234567890', 10);
        return `MU${nanoid()}`;
      }
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    deliveryNote: {
      type: String
    },
    status: {
      type: String,
      enum: Object.values(shipmentStatusEnum),
      default: shipmentStatusEnum.PENDING
    },
    pickupAddress: addressSchema,
    method: {
      type: Schema.Types.ObjectId,
      ref: 'ShipmentMethod'
    },
    pickupAt: {
      type: Date
    },
    note: {
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

shipmentSchema.index({ shipmentId: 'text' });
shipmentSchema.virtual('details', {
  ref: 'ShipmentDetail',
  localField: '_id',
  foreignField: 'shipment'
});

shipmentSchema.plugin(mongoosePaginate);

export { shipmentSchema };
export default mongoose.model('Shipment', shipmentSchema);
