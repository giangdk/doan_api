import { nanoid } from 'nanoid';
import async from 'async';
import Order from '../models/order.model.js';
import Vendor from '../models/vendor.model.js';
import Review from '../models/review.model.js';
import Media from '../models/media.model.js';
import Response from '../utils/response.js';
import mediaTypeEnum from '../enums/mediaType.enum.js';
import orderStatus from '../enums/orderStatus.enum.js';
import s3 from '../../config/aws.js';
import vars from '../../config/vars.js';

export default {
  createReview: async (req, res, next) => {
    try {
      const { content, vendor, rating, gallery } = req.body;
      const insertGallery = [];
      if (gallery && gallery.length > 0) {
        gallery.forEach((x) => {
          const media = new Media({
            path: x,
            type: mediaTypeEnum.IMAGE
          });

          insertGallery.push(media);
        });
      }

      const review = new Review({
        content,
        vendor,
        reviewer: req.user._id,
        rating,
        gallery: insertGallery
      });
      await review.save();

      return res.json(Response.success(review));
    } catch (err) {
      console.error(err);
      return next(err);
    }
  },

  getResignedUrl: (req, res, next) => {
    try {
      const { fileType } = req.body;
      if (fileType !== 'jpg' && fileType !== 'png' && fileType !== 'jpeg') {
        return res.json(Response.badRequest(req.t('review.invalid.image')));
      }

      const fullFileName = `data/images/reviews/${nanoid()}.${fileType}`;
      const s3Params = {
        Bucket: vars.s3Bucket,
        Key: fullFileName,
        Expires: 300,
        ContentType: `image/${fileType}`,
        ACL: 'public-read'
      };

      const presignedUrl = s3.getSignedUrl('putObject', s3Params);

      const returnData = {
        uploadUrl: presignedUrl,
        downloadUrl: `${vars.s3Url}/${fullFileName}`
      };
      return res.json(Response.success(returnData));
    } catch (err) {
      console.error(err);
      return next(err);
    }
  },
  createReviewForOrder: async (req, res) => {
    try {
      const { content, rating, gallery } = req.body;
      const { id } = req.params;
      const tempRating = rating > 0 ? rating : 5;

      const isReviewExist = await Review.exists({ order: id, reviewer: req.user._id });
      if (isReviewExist) return res.json(Response.badRequest(req.t('review.is.already')));

      const isValidOrder = await Order.findOne({ _id: id, customer: req.user._id }).select(
        'status vendor'
      );
      if (!isValidOrder) return res.json(Response.badRequest(req.t('review.invalid.order')));

      return async
        .parallel({
          updateVendorReview: (cb) => {
            const updateKey = `ratings.${tempRating}`;
            Vendor.updateOne({ _id: isValidOrder.vendor }, { $inc: { [updateKey]: 1 } }).then(
              (resp) => cb(null, resp)
            );
          },
          insertGallery: (cb) => {
            const insertGallery = [];
            if (gallery && gallery.length > 0) {
              gallery.forEach((x) => {
                const media = new Media({
                  path: x,
                  type: mediaTypeEnum.IMAGE
                });

                insertGallery.push(media);
              });
            }
            cb(null, insertGallery);
          }
        })
        .then(async (result) => {
          const { insertGallery } = result;
          if (isValidOrder.status !== orderStatus.COMPLETED)
            return res.json(Response.badRequest(req.t('review.order.not.complete')));

          const review = new Review({
            content,
            vendor: isValidOrder.vendor,
            reviewer: req.user._id,
            rating: tempRating,
            order: id,
            gallery: insertGallery
          });

          await review.save();

          return res.json(Response.success(review));
        });
    } catch (err) {
      console.error(err);
      return null;
    }
  }
};
