import mongoose from 'mongoose';
import Response from '../utils/response.js';
import Voucher from '../models/voucher.model.js';
import Order from '../models/order.model.js';
import voucherTypeEnum from '../enums/voucherType.enum.js';

export default {
  useVoucherForOrder: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { orderId } = req.query;

      const voucher = await Voucher.findOne({ _id: id });
      if (!voucher) return res.json(Response.notFound('invalid.voucher'));

      const order = await Order.findById(orderId);
      if (!order) return res.json(Response.notFound('invalid.order'));
      if (order.vendor !== voucher.vendor) return res.json(Response.badRequest('invalid.order'));

      if (voucher.usageLimitQuantity > 0 && voucher.totalUsed >= voucher.usageLimitQuantity) {
        return res.json(Response.badRequest(req.t('invalid.voucher')));
      }
      if (voucher.minBasketPrice > 0 && order.totalPrice < voucher.minBasketPrice) {
        return res.json(Response.badRequest(req.t('invalid.voucher')));
      }

      if (voucher.usageLimitQuantity > 0) {
        voucher.totalUsed += 1;
        await voucher.save();
      }

      // TODO: receipt discount
      //    order.receipt.voucherDiscount.voucherCode = voucher.code;
      //    order.receipt.voucherDiscount.voucherId = voucher._id;
      //    await order.save();

      return res.json(Response.success(order));
    } catch (err) {
      console.error(err);
      return next(err);
    }
  },

  getListVouchers: async (req, res, next) => {
    try {
      const { type, vendorId, limit, page } = req.query;

      let filterQuery = { active: true };

      if (type === voucherTypeEnum.ALL && vendorId != null && mongoose.isValidObjectId(vendorId)) {
        filterQuery = {
          ...filterQuery,
          $or: [{ vendor: vendorId }, { type: voucherTypeEnum.SYSTEM }]
        };
      } else if (
        type === voucherTypeEnum.VENDOR &&
        vendorId != null &&
        mongoose.isValidObjectId(vendorId)
      ) {
        filterQuery = {
          ...filterQuery,
          vendor: vendorId
        };
      } else if (type === voucherTypeEnum.SYSTEM) {
        filterQuery = {
          ...filterQuery,
          type: voucherTypeEnum.SYSTEM
        };
      }

      const paginateOptions = {
        limit: parseInt(limit) || 10,
        page: parseInt(page) || 1,
        sort: { createdAt: -1 }
      };

      const vouchers = await Voucher.paginate(filterQuery, paginateOptions);
      return res.json(Response.success(vouchers));
    } catch (err) {
      console.error(err);
      return next(err);
    }
  }
};
