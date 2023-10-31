import mongoose from 'mongoose';

const { Schema } = mongoose;

const shipmentDetailSchema = new Schema(
  {
    shipment: { type: Schema.Types.ObjectId, ref: 'Shipment' },
    title: {
      type: String
    },
    note: {
      type: String
    },
    processedAt: {
      type: Date,
      default: new Date()
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

export default mongoose.model('ShipmentDetail', shipmentDetailSchema);
export { shipmentDetailSchema };
