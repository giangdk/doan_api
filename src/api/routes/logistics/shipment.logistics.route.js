import { Router } from 'express';
import orderListTypeEnum from '../../enums/orderListType.enum.js';
import shipmentStatusEnum from '../../enums/shipmentStatus.enum.js';

import Shipment from '../../models/shipment.model.js';
import Order from '../../models/order.model.js';
import ShipmentDetail from '../../models/shipmentDetail.model.js';
import Response from '../../utils/response.js';
import orderStatusEnum from '../../enums/orderStatus.enum.js';
import Account from '../../models/account.model.js';
import OrderActivity from '../../models/orderActivity.model.js';
import activityStateEnum from '../../enums/activityState.enum.js';

const router = Router();

router.route('/shipments').get(async (req, res, next) => {
  try {
    const { limit, page, status, t, searchBy } = req.query;
    const paginateOptions = {
      limit: parseInt(limit) || 10,
      page: parseInt(page) || 1,
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'order',
          select:
            'payment totalPrice totalPrice totalPriceBefore status deliveryAddress owner vendor currencySymbol',
          populate: {
            path: 'vendor',
            select: 'brandName',
            populate: {
              path: 'owner',
              select: 'username profile.avatar'
            }
          }
        }
      ]
    };
    let queryFilter = {};
    if (status != null && status.length > 0) {
      queryFilter = {
        ...queryFilter,
        status
      };
    }

    if (t != null && t.length > 0) {
      let searchQuery = {};
      if (searchBy === 'customerName') {
        const customers = await Account.find({ username: new RegExp(t, 'gi') });

        const customerIds = customers.map((x) => x._id);

        const orders = await Order.find({ customer: customerIds });

        const orderIds = orders.map((order) => order._id);
        searchQuery = {
          order: { $in: orderIds }
        };
      } else if (searchBy === 'shipmentId') {
        searchQuery = {
          shipmentId: new RegExp(t, 'gi')
        };
      } else if (searchBy === 'orderId') {
        const orders = await Order.find({ orderId: t });
        const orderIds = orders.map((order) => order._id);

        searchQuery = {
          order: { $in: orderIds }
        };
      }

      queryFilter = {
        ...queryFilter,
        ...searchQuery
      };
    }

    const shipments = await Shipment.paginate(queryFilter, paginateOptions);

    return res.json(Response.success(shipments));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router
  .route('/shipments/:shipmentId')
  .get(async (req, res, next) => {
    try {
      // const { title, note, proccessedAt } = req.body;
      const { shipmentId } = req.params;
      const shipment = await Shipment.findOne({ shipmentId }).populate([
        {
          path: 'order',
          select:
            '-transaction -products.isChanged -products.isSelected -products.product.ratings -products.product.avgRating -products.product.category -products.product.stock -products.owner',
          populate: [
            {
              path: 'vendor',
              select: 'brandName',
              populate: {
                path: 'owner',
                select: 'profile.avatar profile.fullName profile.email phone'
              }
            },
            {
              path: 'customer',
              select: 'profile.avatar profile.fullName profile.email phone'
            }
          ]
        },
        {
          path: 'details',
          options: {
            // select: 'title note processedAt createdAt',
            sort: { createdAt: -1 }
          }
        }
      ]);
      if (!shipment) return res.json(Response.notFound(req.t('invalid.shipment')));

      return res.json(Response.success(shipment));
    } catch (err) {
      console.error(err);
      return next(err);
    }
  })
  .post(async (req, res, next) => {
    try {
      const { title, note, processedAt } = req.body;
      const { shipmentId } = req.params;
      const shipment = await Shipment.findOne({ shipmentId });
      // .populate({
      //   path: 'order',
      //   select:
      //     '-transaction -products.isChanged -products.isSelected -products.product.ratings -products.product.avgRating -products.product.category -products.product.stock -products.owner'
      // });
      if (!shipment) return res.json(Response.notFound());

      const activity = new ShipmentDetail({
        shipment: shipment._id,
        title,
        note,
        processedAt
      });

      activity.save();
      return res.json(Response.success(activity));
    } catch (err) {
      console.error(err);
      return next(err);
    }
  });

router.route('/shipments/:shipmentId/pickup_processed').post(async (req, res, next) => {
  try {
    const { note, processedAt } = req.body;
    const { shipmentId } = req.params;

    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) return res.json(Response.notFound());
    const activity = new ShipmentDetail({
      shipment: shipment._id,
      title: 'Lấy hàng thành công',
      note,
      processedAt
    });

    await ShipmentDetail.create(activity);
    await OrderActivity.create({
      order: shipment.order,
      state: activityStateEnum.ORDER_INTRANSIT,
      issuer: req.user._id
    });

    shipment.status = shipmentStatusEnum.PROCCESSING;
    await shipment.save();

    await Order.findOneAndUpdate(
      { _id: shipment.order },
      {
        $set: {
          listType: orderListTypeEnum.SHIPPING,
          status: orderStatusEnum.INTRANSIT,
          'proccessingInfo.pickupAt': Date.now(),
          'proccessingInfo.intransitAt': Date.now()
        }
      }
    );

    return res.json(Response.success(activity));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.route('/shipments/:shipmentId/intransit').post(async (req, res, next) => {
  try {
    const { note, processedAt } = req.body;
    const { shipmentId } = req.params;

    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) return res.json(Response.notFound());

    const activity = new ShipmentDetail({
      shipment: shipment._id,
      title: 'Đang giao hàng',
      note,
      processedAt
    });

    shipment.status = shipmentStatusEnum.INTRANSIT;
    await shipment.save();

    await Order.findOneAndUpdate(
      { _id: shipment.order },
      {
        $set: {
          listType: orderListTypeEnum.SHIPPING
        }
      }
    );

    await ShipmentDetail.create(activity);
    return res.json(Response.success(activity));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.route('/shipments/:shipmentId/completed').post(async (req, res, next) => {
  try {
    const { note, processedAt } = req.body;
    const { shipmentId } = req.params;

    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) return res.json(Response.notFound());

    const activity = new ShipmentDetail({
      shipment: shipment._id,
      title: 'Giao hàng thành công',
      note,
      processedAt
    });

    shipment.status = shipmentStatusEnum.COMPLETED;
    await shipment.save();

    await Order.findOneAndUpdate(
      { _id: shipment.order },
      {
        $set: {
          listType: orderListTypeEnum.COMPLETED,
          'proccessingInfo.deliveredAt': Date.now(),
          status: orderStatusEnum.DELIVERED
        }
      }
    );

    await ShipmentDetail.create(activity);
    return res.json(Response.success(activity));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.route('/shipments/:shipmentId/returned').post(async (req, res, next) => {
  try {
    const { note, processedAt } = req.body;
    const { shipmentId } = req.params;

    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) return res.json(Response.notFound());

    const activity = new ShipmentDetail({
      shipment: shipment._id,
      title: 'Đơn đã được khách hàng trả lại',
      note,
      processedAt
    });
    shipment.status = shipmentStatusEnum.RETURNED;

    await shipment.save();

    await Order.findOneAndUpdate(
      { _id: shipment.order },
      {
        $set: {
          listType: orderListTypeEnum.REFUND_UNPROCESSED,
          'proccessingInfo.returnAt': Date.now(),
          status: orderStatusEnum.RETURNED
        }
      }
    );

    await ShipmentDetail.create(activity);
    return res.json(Response.success(activity));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

export default router;
