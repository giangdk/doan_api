import mongoose from 'mongoose';

const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    numberId: {
      type: Number,
      required: true,
      default: 1,
    },
    name: {
      type: String,
      required: true,
      default: "Giang"
    },
    type: {
      type: String,
      required: true,
      default: "ROOM"
    },
    myLastSeen: {
      type: Number,
      required: true,
      default: 1,
    },
    ownerId: {
      type: String,
      required: true,

    },
    guestId: {
      type: String,
      required: true,

    },
    textLastMessage: {
      type: String,
      required: true,
      default: "Giang"
    },


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

export default mongoose.model('conversation', conversationSchema);
export { conversationSchema };
