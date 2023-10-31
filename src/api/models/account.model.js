import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoosePaginate from 'mongoose-paginate-v2';
import { customAlphabet } from 'nanoid';
import accountTypeEnum from '../enums/accountType.enum.js';
import Media from './media.model.js';
import mediaTypeEnum from '../enums/mediaType.enum.js';
import genderEnum from '../enums/gender.enum.js';

const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

const { Schema } = mongoose;

const accountSchema = new Schema(
  {
    profile: {
      fullName: {
        type: String
      },
      dateOfBirth: {
        type: Date
      },
      avatar: {
        type: String,
        default: 'https://via.placeholder.com/300x300.jpg?text=mubaha.com'
      },
      email: {
        type: String
      },
      biography: {
        type: String
      },
      gender: {
        type: String,
        enum: Object.values(genderEnum),
        default: genderEnum.MALE
      }
    },
    username: {
      type: String,
      required: true,
      default: () => nanoid()
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      trim: true,
      select: false
    },
    type: {
      type: String,
      enum: Object.values(accountTypeEnum),
      default: accountTypeEnum.CUSTOMER
    },
    authentication: {
      lock: { type: Boolean, default: false },
      isChanged: {
        type: Boolean,
        default: false
      },
      status: { type: Boolean, default: false },
      isCreatedPassword: { type: Boolean, default: false },
      ip: { type: String },
      recentSMSOTP: { type: Date },
      location: { type: Object },
      isPhoneVerified: { type: Boolean, default: false, required: true }
    },
    unreadNotifications: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.id;
        delete ret.password;
      }
    }
  }
);

accountSchema.plugin(mongoosePaginate);
accountSchema.plugin(aggregatePaginate);


accountSchema.virtual('vendor', {
  ref: 'Vendor',
  localField: '_id',
  foreignField: 'owner',
  justOne: true,
});

accountSchema.pre('save', function defaultAvatar(next) {
  if (this.isNew && !this.profile.avatar) {
    this.profile.avatar = 'https://laka-storage-vn.hn.ss.bfcplatform.vn/assets/images/avatars/a1@200.png'
  }
  return next();
});

class Account {
  async passwordMatches(password) {
    return bcrypt.compare(password, this.password);
  }
}

accountSchema.loadClass(Account);

export default mongoose.model('Account', accountSchema);
