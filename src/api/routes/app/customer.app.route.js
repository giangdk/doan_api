import { Router } from 'express';
import async from 'async';
import mongoose from 'mongoose';
import Response from '../../utils/response.js';
import Order from '../../models/order.model.js';

const router = Router();

router.route('/:orderId').get(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId })
      .select(
        'vendor proccessingInfo deliveryAddress shipmentMethod orderId totalPrice totalPriceBefore buyerPaidAmount voucherDiscountAmount totalVendorDiscount totalSystemDiscount currencySymbol address.fullName address.phone address.fullAddress payment products.amount products.selectedVariant products.selectedAttribute products.product.name products.product._id products.product.slug products.price products.discount products.discountPrice products.currencySymbol products.product.media.featuredImage paymentAt deliverdAt pickupAt createdAt products.discountedPrice products.lastPrice status'
      )
      .populate([
        {
          path: 'vendor',
          select: 'brandName avatar',
          populate: {
            path: 'owner',
            select: 'username profile.avatar'
          }
        },
        {
          path: 'shipment',
          populate: [
            {
              path: 'details',
              // select: 'title note processedAt createdAt',
              options: {
                sort: { createdAt: -1 },
                limit: 1
              }
            }
          ]
        }
      ]);

    if (!order) return res.json(Response.badRequest(req.t('invalid.order')));
    return res.json(Response.success(order, null));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.route('/:orderId/shipmentDetail').get(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId })
      .select('shipment shipmentMethod proccessingInfo')
      .populate({
        path: 'shipment',
        populate: [
          {
            path: 'details',
            // select: 'title note processedAt createdAt',
            options: {
              sort: { createdAt: -1 }
            }
          }
        ]
      });

    // const activities = await shipmentDetailModel.find({order:})

    if (!order) return res.json(Response.badRequest(req.t('invalid.order')));
    return res.json(Response.success(order, null));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

export default router;
