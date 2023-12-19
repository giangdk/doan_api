import { Router } from 'express';
import { nanoid } from 'nanoid';
import async from 'async';
import CartItem from '../../models/cart.model.js';
import Account from '../../models/account.model.js';
import Response from '../../utils/response.js';
import Shipment from '../../models/shipment.model.js';
import Vendor from '../../models/vendor.model.js';
import Product from '../../models/product.model.js';
import Order from '../../models/order.model.js';
import ShipmentMethod from '../../models/shipmentMethod.model.js';
import ShipmentDetail from '../../models/shipmentDetail.model.js';
import orderStatusEnum from '../../enums/orderStatus.enum.js';
import paymentMethodStatusEnum from '../../enums/paymentStatus.enum.js';
import paymentMethodEnum from '../../enums/paymentMethod.enum.js';
import paymentStatusEnum from '../../enums/paymentStatus.enum.js';
import Address from '../../models/address.model.js';
import mongoose from 'mongoose';
import shipmentStatusEnum from '../../enums/shipmentStatus.enum.js';
import productStatusEnum from '../../enums/productStatus.enum.js';
import accountTypeEnum from '../../enums/accountType.enum.js';
import Transaction from '../../models/transaction.model.js';
import Voucher from '../../models/voucher.model.js';
import discountTypeEnum from '../../enums/discountType.enum.js';
import OrderActivity from '../../models/orderActivity.model.js';
import activityState from '../../enums/activityState.enum.js';
import vars from '../../../config/vars.js';
import PaymentMethod from '../../models/paymentMethod.model.js';

import _ from 'lodash';
import voucherStatusEnum from '../../enums/voucherStatus.enum.js';
import voucherTypeEnum from '../../enums/voucherType.enum.js';
import transactionTypeEnum from '../../enums/transactionType.enum.js';

import { validate } from '../../middlewares/validate.js';

import {
  createCheckoutRules,
  getCheckoutRules,
  postCheckoutRules,
  preVoucherCheckoutRules,
  updateStatusOrderRules
} from '../../validations/checkout.validator.js';
import orderListTypeEnum from '../../enums/orderListType.enum.js';

let crypto;
try {
  crypto = await import('crypto');
} catch (err) {
  console.log('crypto is not support');
}
const router = Router();

router.post('/checkout', postCheckoutRules(), validate, async (req, res, next) => {
  try {
    const { cartItemIds } = req.body;
    //TODO: check
    const q = cartItemIds.join();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-ctr', vars.querySecretKey, iv);

    const encrypted = Buffer.concat([cipher.update(q), cipher.final()]);

    return res.json(
      Response.success({
        s: encrypted.toString('hex'),
        f: iv.toString('hex')
      })
    );
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.get('/checkout', getCheckoutRules(), validate, async (req, res, next) => {
  try {
    const { s, f } = req.query;

    const decipher = crypto.createDecipheriv(
      'aes-256-ctr',
      vars.querySecretKey,
      Buffer.from(f, 'hex')
    );
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(s, 'hex')),
      decipher.final()
    ]).toString();

    //TODO: check
    let cartItemIds = decrypted.split(',').map((x) => {
      if (!mongoose.isValidObjectId(x)) return null;
      return mongoose.Types.ObjectId(x);
    });

    cartItemIds = _.uniqBy(cartItemIds).filter((x) => x !== null);
    if (cartItemIds.length < 1) return res.json(Response.badRequest(req.t('cartItem.notFound')));

    return async
      .parallel({
        cartItems: (cb) => {
          CartItem.find({ _id: { $in: cartItemIds }, owner: req.user._id })
            .populate({
              path: 'product',
              select:
                'name slug variants variantLabel attributeLabel stock price status currencySymbol discount media.featuredImage'
            })
            .populate({
              path: 'vendor',
              select: 'brandName cliendIdPaypal secretPaypal',
              populate: {
                path: 'owner',
                select: 'username profile.avatar'
              }
            })
            .exec(cb);
        },
        defaultAddress: (cb) => {
          Address.findOne({ owner: req.user._id, isDefault: true }).select('-owner').exec(cb);
        },
        paymentMethods: (cb) => {
          PaymentMethod.find({}).exec(cb);
        }
      })
      .then((result) => {
        const { cartItems, defaultAddress, paymentMethods } = result;
        const grouped = _.groupBy(cartItems, (p) => p.vendor._id);
        let currencySymbol;

        let totalOrdersPrice = 0;

        const results = Object.entries(grouped).map(([, value]) => {
          const products = value;
          let totalPrice = 0;
          currencySymbol = products[0].currencySymbol;
          products.forEach((p) => {
            totalPrice += p.discountedPrice * p.amount;
          });

          totalOrdersPrice += totalPrice;
          console.log("giang vendor : " + products[0].vendor);
          return {
            vendor: products[0].vendor,
            products: products,
            totalPrice: totalPrice,
            currencySymbol
          };
        });

        return res.json(
          Response.success({
            grouped: results,
            totalOrdersPrice,
            defaultAddress,
            currencySymbol,
            paymentMethods
          })
        );
      });
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.route('/').post(createCheckoutRules(), validate, async (req, res, next) => {
  try {
    const id = req.user._id;

    const {
      method,
      deliveryNote,
      address,
      voucherIds,
      cardNumber,
      cardName,
      expirationDate,
      cardCode
    } = req.body;

    const { s, f } = req.query;
    console.log(1)
    const decipher = crypto.createDecipheriv(
      'aes-256-ctr',
      vars.querySecretKey,
      Buffer.from(f, 'hex')
    );
    console.log(2)
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(s, 'hex')),
      decipher.final()
    ]).toString();

    let cartItemIds = decrypted.split(',').map((x) => {
      if (!mongoose.isValidObjectId(x)) return null;
      return mongoose.Types.ObjectId(x);
    });
    console.log(3)
    const shipmentMethod = await ShipmentMethod.findOne({ name: 'TMP Express' });
    if (!shipmentMethod) return res.json(Response.notFound());

    cartItemIds = _.uniqBy(cartItemIds).filter((x) => x !== null);
    if (cartItemIds.length < 1) return res.json(Response.badRequest(req.t('cartItem.notFound')));
    console.log(4)
    const checkAddress = await Address.findById(address);
    if (!checkAddress) return res.json(Response.notFound(req.t('address.notFound')));
    // Get Product By Vendor
    console.log(5)
    const cartItems = await CartItem.find({
      _id: { $in: cartItemIds }
    })
      .populate({
        path: 'product',
        select:
          '-media.data -description -shortDescription -isDeleted -slug -createdAt -updatedAt -reviews -link',
        match: {
          isDeleted: false
        },
        populate: [
          {
            path: 'vendor',
            select: 'brandName',
            populate: {
              path: 'owner',
              select: 'username profile.avatar'
            }
          },
          {
            path: 'category',
            select: 'name'
          },
          {
            path: 'brand',
            select: 'name'
          }
        ]
      })
      .populate({
        path: 'vendor',
        select: 'brandName',
        populate: {
          path: 'owner',
          select: '_id username profile.avatar'
        }
      })
      .lean();
    console.log(6)
    if (cartItems.length < 1) return res.json(Response.notFound(req.t('cartItem.notFound')));

    cartItems?.forEach((x) => {
      if (!x.product) {
        return res.json(Response.badRequest(req.t('invalid.cart')));
      }

      if (x.selectedVariant) {
        const variantInsert = x.product.variants.find(
          (j) => j._id.toString() === x.selectedVariant._id.toString()
        );
        if (variantInsert) {
          if (
            variantInsert.price != x.selectedVariant.price ||
            variantInsert.discount != x.selectedVariant.discount
          ) {
            return res.json(Response.badRequest(req.t('invalid.cart')));
          }

          if (x.selectedAttribute) {
            const attributeInsert = variantInsert.attributes.find(
              (j) => j._id.toString() === x.selectedAttribute._id.toString()
            );
            if (attributeInsert) {
              if (
                attributeInsert.price != x.selectedAttribute.price ||
                attributeInsert.discount != x.selectedAttribute.discount
              ) {
                return res.json(Response.badRequest(req.t('invalid.cart')));
              }
            } else {
              return res.json(Response.badRequest(req.t('invalid.cart')));
            }
          }
        } else {
          return res.json(Response.badRequest(req.t('invalid.cart')));
        }
      }
    });
    console.log(7)
    return async
      .parallel({
        addressInsert: (cb) => {
          Address.findById(address)
            .lean()
            .then((result) => cb(null, result));
        },
        transaction: (cb) => {
          let paymentStatus = paymentStatusEnum.SUCCESS;
          let transaction = {
            type: transactionTypeEnum.VISA,
            transactionId: nanoid(),
            owner: id,
            cardCode: cardCode,
            cardNumber: cardNumber,
            cardName: cardName,
            expirationDate: expirationDate
          };
          if (paymentStatus && paymentStatus == paymentStatusEnum.SUCCESS) {
            Transaction.create(transaction).then((result) => cb(null, result));
          } else {
            cb(null, null);
          }
        },
        usedVouchers: (cb) => {
          Voucher.find({ _id: { $in: voucherIds } }).then((result) => cb(null, result));
        },
        paymentMethod: (cb) => {
          PaymentMethod.findOne({ type: paymentMethodEnum.COD }).then((result) => cb(null, result));
        }
      })
      .then(async (result) => {
        const { addressInsert, transaction, usedVouchers, paymentMethod } = result;
        // return res.json(Response.success(usedVoucher, req.t("order.success")));

        const grouped = _.groupBy(cartItems, (p) => p.vendor._id);

        const orders = await Promise.all(
          Object.entries(grouped).map(async ([, value]) => {
            const products = value;
            const vendor = products[0].vendor;

            let totalPrice = 0;
            let totalProducts = 0;
            const _products = [];
            products.forEach((p) => {
              let compareObj = p.product;
              if (p.selectedVariant != null) {
                compareObj = p.selectedVariant;
                if (p.selectedAttribute != null) {
                  compareObj = p.selectedAttribute;
                }
              }

              const _total = compareObj.discountedPrice * p.amount;
              totalPrice += _total;

              totalProducts += p.amount;

              _products.push({
                ...p,
                product: p.product,
                vendor: vendor,
                price: compareObj.price,
                discount: compareObj.discount,
                lastPrice: _total,
                totalProducts
              });
            });

            const currencySymbol = products[0].currencySymbol;
            // use voucher per order
            let voucherDiscountAmount = 0;
            let totalVendorDiscount = 0;
            let totalSystemDiscount = 0;
            let systemVoucher = false;
            let vendorVoucher = false;
            let _usedVouchers = [];
            usedVouchers.forEach((x) => {
              if (
                x.type === voucherTypeEnum.VENDOR &&
                (x.vendor.toString() !== vendor._id.toString() || vendorVoucher)
              ) {
                return;
              }
              if (x.type === voucherTypeEnum.SYSTEM && systemVoucher) {
                return;
              }

              if (x.type === voucherTypeEnum.VENDOR && !vendorVoucher) vendorVoucher = true;
              if (x.type === voucherTypeEnum.SYSTEM && !systemVoucher) systemVoucher = true;

              let discountAmount = 0;
              if (x.minBasketPrice > 0 && totalPrice > x.minBasketPrice) {
                if (x.discount.type === discountTypeEnum.PRICE) {
                  discountAmount = x.discount.amount;
                } else if (x.discount.type === discountTypeEnum.PERCENTAGE) {
                  discountAmount = totalPrice * (x.discount.amount / 100);
                  if (x.maxVoucherAmount > 0 && discountAmount > x.maxVoucherAmount) {
                    discountAmount = x.maxVoucherAmount;
                  }
                }
              }
              voucherDiscountAmount += discountAmount;
              if (x.type === voucherTypeEnum.SYSTEM) {
                totalSystemDiscount += discountAmount;
              } else if (x.type === voucherTypeEnum.VENDOR) {
                totalVendorDiscount += discountAmount;
              }
              _usedVouchers.push(x);
            });

            const totalPriceBefore = totalPrice;
            const _finalPrice = totalPrice - voucherDiscountAmount;

            _usedVouchers =
              _usedVouchers.length > 0
                ? _usedVouchers.map((v) => {
                  return {
                    voucher: v._id,
                    title: v.title,
                    amount: v.amount || 0,
                    type: v.type,
                    minBasketPrice: v.minBasketPrice || 0,
                    maxVoucherAmount: v.maxVoucherAmount || 0
                  };
                })
                : [];

            return {
              _id: new mongoose.Types.ObjectId(),
              vendor: vendor,
              products: _products,
              customer: id,
              payment: {
                method: paymentMethodEnum.COD,
                status: paymentStatusEnum.PENDING
              },
              deliveryAddress: addressInsert,
              shipmentMethod,
              status: orderStatusEnum.PICKUP_AVAILABLE,
              transaction: transaction?._id || null,
              currencySymbol,
              totalPrice: _finalPrice,
              totalPriceBefore,
              voucherDiscountAmount,
              totalProducts,
              usedVouchers: _usedVouchers,
              totalSystemDiscount,
              totalVendorDiscount,
              proccessingInfo: {
                paymentAt: Date.now()
              },
              listType: orderListTypeEnum.TOSHIP_PROCESS,
              paymentMethod: paymentMethod
            };
          })
        );

        const order = await Order.insertMany(orders);

        orders.forEach((order) => {
          OrderActivity.insertMany({ order: order._id, state: activityState.ORDER_CREATED });
        });
        await CartItem.deleteMany({
          owner: id,
          _id: { $in: cartItemIds }
        });

        return res.json(Response.success(order, req.t('order.success')));
      });
  } catch (e) {
    console.log('Error', e);
    return next(e);
  }
});

router.route('/:id/transit').put(updateStatusOrderRules(), validate, async (req, res, next) => {
  try {
    const isUser = await Account.exists({ _id: req.user._id });

    console.log("/:id/transit " + isUser)
    if (!isUser) return res.json(Response.notFound());

    const { id } = req.params;

    const { reason } = req.body;
    console.log("/:id/transit 1")
    const order = await Order.findOne({
      _id: id,
      // status: { $in: [orderStatusEnum.PICKUP_AVAILABLE, orderStatusEnum.AWAITING_CONFIRMATION] }
    });
    console.log("/:id/transit " + order)
    if (!order) return res.json(Response.badRequest(req.t('order.cannot.cancel')));

    async
      .parallel({
        activity: (cb) => {
          OrderActivity.create({
            order: order._id,
            issuer: req.user._id,
            state: activityState.ORDER_INTRANSIT,
            reason: reason
          }).then((resp) => cb(null, resp));
        },
        orderUpdate: (cb) => {
          Order.findByIdAndUpdate(id, {
            $set: {
              // listType: orderListTypeEnum.CANCELLED_TORESPONSE,
              status: orderStatusEnum.INTRANSIT
            }
          }).then((resp) => cb(null, resp));
        }
      })
      .then((result) => {
        const { orderUpdate } = result;
        return res.json(Response.success({ _id: id }, null));
      });
  } catch (e) {
    console.log(e);
    return next(e);
  }
});
router.route('/:id/success').put(updateStatusOrderRules(), validate, async (req, res, next) => {
  try {
    const isUser = await Account.exists({ _id: req.user._id });

    console.log("/:id/success " + isUser)
    if (!isUser) return res.json(Response.notFound());

    const { id } = req.params;

    const { reason } = req.body;
    console.log("/:id/success 1")
    const order = await Order.findOne({
      _id: id,
      // status: { $in: [orderStatusEnum.PICKUP_AVAILABLE, orderStatusEnum.AWAITING_CONFIRMATION] }
    });
    console.log("/:id/success " + order)
    if (!order) return res.json(Response.badRequest(req.t('order.cannot.cancel')));

    async
      .parallel({
        activity: (cb) => {
          OrderActivity.create({
            order: order._id,
            issuer: req.user._id,
            state: activityState.ORDER_DELIVERED,
            reason: reason
          }).then((resp) => cb(null, resp));
        },
        orderUpdate: (cb) => {
          Order.findByIdAndUpdate(id, {
            $set: {
              // listType: orderListTypeEnum.CANCELLED_TORESPONSE,
              status: orderStatusEnum.DELIVERED
            }
          }).then((resp) => cb(null, resp));
        }
      })
      .then((result) => {
        const { orderUpdate } = result;
        return res.json(Response.success({ _id: id }, null));
      });
  } catch (e) {
    console.log(e);
    return next(e);
  }
});
router.route('/:id/cancel').put(updateStatusOrderRules(), validate, async (req, res, next) => {
  try {
    const isUser = await Account.exists({ _id: req.user._id });

    console.log("/:id/cancel " + isUser)
    if (!isUser) return res.json(Response.notFound());

    const { id } = req.params;

    const { reason } = req.body;
    console.log("/:id/cancel 1")
    const order = await Order.findOne({
      _id: id,
      status: { $in: [orderStatusEnum.PICKUP_AVAILABLE, orderStatusEnum.AWAITING_CONFIRMATION] }
    });
    console.log("/:id/cancel " + order)
    if (!order) return res.json(Response.badRequest(req.t('order.cannot.cancel')));

    async
      .parallel({
        activity: (cb) => {
          OrderActivity.create({
            order: order._id,
            issuer: req.user._id,
            state: activityState.ORDER_CANCELED,
            reason: reason
          }).then((resp) => cb(null, resp));
        },
        orderUpdate: (cb) => {
          Order.findByIdAndUpdate(id, {
            $set: {
              listType: orderListTypeEnum.CANCELLED_TORESPONSE,
              status: orderStatusEnum.CANCELLED
            }
          }).then((resp) => cb(null, resp));
        }
      })
      .then((result) => {
        const { orderUpdate } = result;
        return res.json(Response.success({ _id: id }, null));
      });
  } catch (e) {
    console.log(e);
    return next(e);
  }
});

router.route('/pre-voucher').post(preVoucherCheckoutRules(), validate, async (req, res, next) => {
  try {
    const { s, f } = req.query;
    const { voucherIds } = req.body;

    const decipher = crypto.createDecipheriv(
      'aes-256-ctr',
      vars.querySecretKey,
      Buffer.from(f, 'hex')
    );
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(s, 'hex')),
      decipher.final()
    ]).toString();

    //TODO: check
    let cartItemIds = decrypted.split(',').map((x) => {
      if (!mongoose.isValidObjectId(x)) return null;
      return mongoose.Types.ObjectId(x);
    });

    cartItemIds = _.uniqBy(cartItemIds).filter((x) => x !== null);
    if (cartItemIds.length < 1) return res.json(Response.badRequest(req.t('cartItem.notFound')));

    const cartItems = await CartItem.find({
      _id: { $in: cartItemIds }
    })
      .populate({
        path: 'product',
        select:
          '-media.data -description -shortDescription -isDeleted -slug -createdAt -updatedAt -reviews -link',
        match: {
          isDeleted: false
        },
        populate: [
          {
            path: 'vendor',
            select: 'brandName',
            populate: {
              path: 'owner',
              select: 'username profile.avatar'
            }
          },
          {
            path: 'category',
            select: 'name'
          },
          {
            path: 'brand',
            select: 'name'
          }
        ]
      })
      .populate({
        path: 'vendor',
        select: 'brandName',
        populate: {
          path: 'owner',
          select: 'username profile.avatar'
        }
      })
      .lean();

    if (cartItems.length < 1) return res.json(Response.notFound(req.t('cartItem.notFound')));

    const _voucherIds = _.uniqBy(voucherIds);

    const vouchers = await Voucher.find({ _id: { $in: _voucherIds } });
    const grouped = _.groupBy(cartItems, (p) => p.vendor._id);

    let totalVoucherDiscount = 0;
    let finalPrice = 0;
    let totalOrdersPriceBeforeDiscount = 0;
    let totalSystemDiscount = 0;
    let currencySymbol;
    const result = Object.entries(grouped).map(([, value]) => {
      const products = value;
      const vendor = products[0].vendor;
      let totalPrice = 0;
      let totalProducts = 0;
      products.forEach((p) => {
        let compareObj = p.product;
        if (p.selectedVariant != null) {
          compareObj = p.selectedVariant;
          if (p.selectedAttribute != null) {
            compareObj = p.selectedAttribute;
          }
        }

        const _total = compareObj.discountedPrice * p.amount;

        totalPrice += _total;
        totalProducts += p.amount;
      });

      currencySymbol = products[0].currencySymbol;
      // use voucher per order
      let voucherDiscountAmount = 0;
      let systemVoucher = false;
      let vendorVoucher = false;
      vouchers.forEach((x) => {
        if (
          x.type === voucherTypeEnum.VENDOR &&
          (x.vendor.toString() !== vendor._id.toString() || vendorVoucher)
        ) {
          return;
        }
        if (x.type === voucherTypeEnum.SYSTEM && systemVoucher) {
          return;
        }

        if (x.type === voucherTypeEnum.VENDOR && !vendorVoucher) vendorVoucher = true;
        if (x.type === voucherTypeEnum.SYSTEM && !systemVoucher) systemVoucher = true;

        let discountAmount = 0;
        if (x.minBasketPrice > 0 && totalPrice > x.minBasketPrice) {
          if (x.discount.type === discountTypeEnum.PRICE) {
            discountAmount = x.discount.amount;
          } else if (x.discount.type === discountTypeEnum.PERCENTAGE) {
            discountAmount = totalPrice * (x.discount.amount / 100);
            if (x.maxVoucherAmount > 0 && discountAmount > x.maxVoucherAmount) {
              discountAmount = x.maxVoucherAmount;
            }
          }
        }
        if (x.type === voucherTypeEnum.VENDOR) {
          voucherDiscountAmount += discountAmount;
        } else if (x.type === voucherTypeEnum.SYSTEM) {
          totalSystemDiscount += discountAmount;
        }
        totalVoucherDiscount += discountAmount;
      });

      const totalPriceBefore = totalPrice;
      const _finalPrice = totalPrice - totalVoucherDiscount;
      const _totalPricePerVendor = totalPrice - voucherDiscountAmount;
      finalPrice += _finalPrice;
      totalOrdersPriceBeforeDiscount += totalPriceBefore;

      return {
        vendor: products[0].vendor,
        products,
        voucherDiscountAmount,
        totalPrice: _totalPricePerVendor,
        currencySymbol,
        totalProducts,
        totalPriceBefore
      };
    });

    return res.json(
      Response.success({
        grouped: result,
        totalVoucherDiscount,
        totalOrdersPrice: finalPrice,
        totalOrdersPriceBeforeDiscount,
        totalSystemDiscount,
        currencySymbol
      })
    );
  } catch (e) {
    console.log(e);
  }
});
router.route('/shop-manager-order').get(async (req, res, next) => {
  try {
    const { limit, page, status, t } = req.query;
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 100,
      populate: [
        {
          path: 'vendor',
          select: 'brandName',
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
              options: {
                // select: 'title note processedAt createdAt',
                sort: { createdAt: -1 },
                limit: 1
              }
            }
          ]
        }
      ],
      sort: { createdAt: -1 }
    };
    const idUser = req.user._id;
    console.log("/shop-manager-order" + idUser)
    const getProfile = await Vendor.findOne({ owner: idUser });
    console.log("/shop-manager-order profile:" + getProfile)
    if (getProfile == null) {
      return res.json(Response.error("không tìm thấy vendor"));
    }
    let queryFilter = {
      vendor: getProfile._id
    };

    if (status != null && status.length > 0) {
      queryFilter = {
        ...queryFilter,
        status
      };
    }

    if (t != null && t.length > 0) {
      queryFilter = {
        ...queryFilter,
        $text: { $search: text }
      };
    }

    const orders = await Order.paginate(queryFilter, options);

    return res.json(Response.success(orders, null));
  } catch (e) {
    console.log(e);
  }
});
router.route('/listing').get(async (req, res, next) => {
  try {
    const { limit, page, status, t } = req.query;
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 100,
      populate: [
        {
          path: 'vendor',
          select: 'brandName',
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
              options: {
                // select: 'title note processedAt createdAt',
                sort: { createdAt: -1 },
                limit: 1
              }
            }
          ]
        }
      ],
      sort: { createdAt: -1 }
    };

    let queryFilter = {
      customer: req.user._id
    };

    if (status != null && status.length > 0) {
      queryFilter = {
        ...queryFilter,
        status
      };
    }

    if (t != null && t.length > 0) {
      queryFilter = {
        ...queryFilter,
        $text: { $search: text }
      };
    }

    const orders = await Order.paginate(queryFilter, options);

    return res.json(Response.success(orders, null));
  } catch (e) {
    console.log(e);
  }
});

router.route('/:orderId').get(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId: orderId })
      .select(
        // 'vendor shipmentMethod orderId proccessingInfo
        // deliveryAddress shipmentMethod totalPrice totalPriceBefore
        // voucherDiscountAmount totalSystemDiscount totalVendorDiscount currencySymbol
        // address.fullName address.phone address.fullAddress payment
        // products.amount products.selectedVariant products.selectedAttribute
        // products.product.name products.product._id products.product.slug products.price
        // products.discount products.discountPrice products.currencySymbol
        // products.product.media.featuredImage paymentAt deliverdAt pickupAt createdAt
        // shipment status'
        '-transaction -products.isChanged -products.isSelected -products.product.ratings -products.product.avgRating -products.product.category -products.product.stock -products.owner'
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
              options: {
                // select: 'title note processedAt createdAt',
                sort: { createdAt: -1 }
              }
            }
          ]
        }
      ]);
    // .populate();

    if (!order) return res.json(Response.badRequest(req.t('invalid.order')));
    return res.json(Response.success(order, null));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.route('/app/:orderId').get(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId: orderId })
      .select(
        '-transaction -products.isChanged -products.isSelected -products.product.ratings -products.product.avgRating -products.product.category -products.product.stock -products.owner'
        // 'vendor orderId totalPrice totalPriceBefore voucherDiscountAmount totalSystemDiscount buyerPaidAmount totalVendorDiscount currencySymbol address.fullName address.phone address.fullAddress payment products.amount products.selectedVariant products.selectedAttribute products.product.name products.product._id products.product.slug products.price products.discount products.discountPrice products.currencySymbol products.product.media.featuredImage paymentAt deliverdAt pickupAt createdAt products.discountedPrice products.lastPrice status'
      )
      .populate({
        path: 'shipment',
        populate: [
          {
            path: 'details'
          }
        ]
      });

    if (!order) return res.json(Response.badRequest(req.t('invalid.order')));
    return res.json(Response.success(order, null));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

export default router;
