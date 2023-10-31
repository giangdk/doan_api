import mongoose from 'mongoose';
import addressTypeEnum from '../enums/addressType.enum.js';

const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'Account'
    },
    phone: {
      type: String,
      trim: true,
      required: true
    },
    fullName: {
      type: String,
      required: true
    },
    codes: {
      province: String,
      district: String,
      ward: String
    },
    details: {
      type: String
    },
    isDeleted: {
      type: Boolean,
      default: false,
      required: true
    },
    isDefault: {
      type: Boolean,
      default: false,
      required: true
    },
    isPickup: {
      type: Boolean,
      default: false
    },
    fullAddress: { type: String },
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number],
        default: [105.81875, 21.02509]
      }
    },
    dataGeocoder: { type: Object },
    type: {
      type: String,
      enum: Object.values(addressTypeEnum),
      default: addressTypeEnum.HOME
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

export default mongoose.model('Address', addressSchema);
export { addressSchema };
