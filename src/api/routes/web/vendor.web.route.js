import async from 'async';
import { Router } from 'express';

import mongoose from 'mongoose';
import { validate } from '../../middlewares/validate.js';
import {
  updateProductValidationRules,
  filterProductValidationRules,
  productValidationRules
} from '../../validations/product.validator.js';

import Response from '../../utils/response.js';
import Product from '../../models/product.model.js';
import Address from '../../models/address.model.js';
import Shipment from '../../models/shipment.model.js';
import Account from '../../models/account.model.js';
import Vendor from '../../models/vendor.model.js';
import Media from '../../models/media.model.js';
import mediaTypeEnum from '../../enums/mediaType.enum.js';
import Brand from '../../models/brand.model.js';
import Category from '../../models/category.model.js';
import Order from '../../models/order.model.js';

import { updateStatusOrderVendorRules } from '../../validations/checkout.validator.js';
// import { vendorUpdateOrderRules } from '../../validations/vendor.validator.js';
import OrderActivity from '../../models/orderActivity.model.js';
import activityStateEnum from '../../enums/activityState.enum.js';

import orderStatusEnum from '../../enums/orderStatus.enum.js';

// import ProductVariant from '../../models/productVariant.model.js';
// import { getColorNameByHex } from '../../enums/colorHex.enum.js';
import productStatusEnum from '../../enums/productStatus.enum.js';
import orderListTypeEnum from '../../enums/orderListType.enum.js';
import shipmentStatusEnum from '../../enums/shipmentStatus.enum.js';
import ShipmentDetail from '../../models/shipmentDetail.model.js';

const router = Router();

router.route('/products').post(productValidationRules(), validate, async (req, res, next) => {
  try {
    const {
      variants,
      name,
      currencyUnit,
      price,
      discount,
      quantity,
      sku,
      stockCountry,
      stockStatus,
      description,
      firstLevelCat,
      secondLevelCat,
      threeLevelCat,
      brand,
      images,
      variantLabel,
      attributeLabel,
      status,
      shortDescription
    } = req.body;

    const chooseCategory = threeLevelCat || secondLevelCat || firstLevelCat;
    if (!chooseCategory) return res.redirect('/');

    const category = await Category.findById(chooseCategory);
    if (!category) return res.json(Response.notFound('Invalid category'));

    const vendor = await Vendor.findById(req.user.vendorId);
    if (!vendor) return res.json(Response.notFound('Invalid vendor'));

    return async
      .parallel({
        productVariants: (cb) => {
          const insertVariants = [];
          if (variants && variants.length > 0) {
            variants.forEach((x) => {
              const variant = {
                _id: new mongoose.Types.ObjectId(),
                name: x.name,
                attributes: x.attributes,
                image: x.image,
                price: x.price || price,
                sku: x.sku || sku,
                discount: x.discount || discount,
                stock: x.stock || 100
              };
              insertVariants.push(variant);
            });
          }
          cb(null, insertVariants);
        },
        insertBrand: (cb) => {
          if (!mongoose.isValidObjectId(brand)) {
            Brand.create({
              name: brand
            }).then((result) => cb(null, result));
          } else {
            cb(null, null);
          }
        },
        insertObj: (cb) => {
          const insertGallery = [];
          if (images && images.length > 0) {
            images.forEach((x) => {
              const image = new Media({
                _id: new mongoose.Types.ObjectId(),
                path: x,
                type: mediaTypeEnum.IMAGE
              });
              insertGallery.push(image);
            });
          }
          cb(null, insertGallery);
        }
      })
      .then(async (result) => {
        const { insertObj, insertBrand, productVariants } = result;

        await Product.create({
          name,
          sku,
          price,
          shortDescription,
          variantLabel,
          attributeLabel,
          vendor: vendor._id,
          currencySymbol: currencyUnit,
          description,
          category: category._id,
          parentCategories: {
            firstLevel: category.parents?.firstLevel,
            secondLevel: category.parents?.secondLevel
          },
          brand: mongoose.isValidObjectId(brand) ? brand : insertBrand._id,
          stock: {
            quantity,
            status: stockStatus,
            country: stockCountry
          },
          discount,
          media: {
            featuredImage: images[0] || null,
            data: insertObj
          },
          variants: productVariants,
          status
        });
        return res.json(Response.success(null, req.t('product.created')));
      });
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.route('/products/:slug').put(
  /* updateProductValidationRules(), validate, */ async (req, res, next) => {
    try {
      const {
        variants,
        name,
        currencyUnit,
        price,
        discount,
        quantity,
        sku,
        stockCountry,
        stockStatus,
        description,
        firstLevelCat,
        secondLevelCat,
        threeLevelCat,
        brand,
        images,
        variantLabel,
        attributeLabel,
        status,
        shortDescription
      } = req.body;

      const { slug } = req.params;

      const chooseCategory = threeLevelCat || secondLevelCat || firstLevelCat;
      if (!chooseCategory) return res.redirect('/');

      const category = await Category.findById(chooseCategory);
      if (!category) return res.json(Response.notFound('Invalid category'));

      const vendor = await Vendor.findById(req.user.vendorId);
      if (!vendor) return res.json(Response.notFound('Invalid vendor'));

      return async
        .parallel({
          productVariants: (cb) => {
            const insertVariants = [];
            if (variants && variants.length > 0) {
              variants.forEach((x) => {
                const variant = {
                  _id: new mongoose.Types.ObjectId(),
                  name: x.name,
                  attributes: x.attributes,
                  image: x.image,
                  price: x.price || price,
                  sku: x.sku || sku,
                  discount: x.discount || discount,
                  stock: x.stock || stock,
                  image: x.image || null
                };
                insertVariants.push(variant);
              });
            }
            cb(null, insertVariants);
          },
          insertBrand: (cb) => {
            if (!mongoose.isValidObjectId(brand)) {
              Brand.create({
                name: brand
              }).then((result) => cb(null, result));
            } else {
              cb(null, null);
            }
          },
          insertObj: (cb) => {
            const insertGallery = [];
            if (images && images.length > 0) {
              images.forEach((x) => {
                const image = new Media({
                  _id: new mongoose.Types.ObjectId(),
                  path: x,
                  type: mediaTypeEnum.IMAGE
                });
                insertGallery.push(image);
              });
            }
            cb(null, insertGallery);
          }
        })
        .then(async (result) => {
          const { insertObj, insertBrand, productVariants } = result;
          if (insertObj && insertObj.length > 0) {
            insertObj.forEach((item) => {
              const image = productVariants.find((e) => e.image === item.path);
              if (image) {
                image.imageId = item._id;
              }
            });
          }

          await Product.updateOne(
            { slug },
            {
              $set: {
                name,
                sku,
                price,
                shortDescription,
                variantLabel,
                attributeLabel,
                vendor: vendor._id,
                currencySymbol: currencyUnit,
                description,
                category: category._id,
                parentCategories: {
                  firstLevel: category.parents?.firstLevel,
                  secondLevel: category.parents?.secondLevel
                },
                brand: mongoose.isValidObjectId(brand) ? brand : insertBrand._id,
                stock: {
                  quantity,
                  status: stockStatus,
                  country: stockCountry
                },
                discount,
                media: {
                  featuredImage: images[0] || null,
                  data: insertObj
                },
                variants: productVariants,
                status
              }
            }
          );
          return res.json(Response.success(null, req.t('product.updated')));
        });
    } catch (err) {
      console.error(err);
      return next(err);
    }
  }
);

router.route('/products/:id').delete(async (req, res, next) => {
  try {
    const { id } = req.params;
    const checkDelete = await Product.findOne({ _id: id }, { isDeleted: false });
    if (!checkDelete) return res.json(Response.badRequest(req.t('invalid.product')));
    await Product.findByIdAndUpdate(id, {
      $set: { isDeleted: true, status: productStatusEnum.DISABLE }
    });
    return res.json(Response.success(null, req.t('product.deleted')));
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.route('/products/:id/restore').put(async (req, res, next) => {
  try {
    const { id } = req.params;
    const checkDelete = await Product.findOne({ _id: id }, { isDeleted: true });
    if (!checkDelete) return res.json(Response.badRequest(req.t('invalid.product')));
    await Product.findByIdAndUpdate(
      id,
      { $set: { isDeleted: false, status: productStatusEnum.PUBLISH } },
      { new: true }
    );
    return res.json(Response.badRequest(req.t('product.restore')));
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

// eslint-disable-next-line consistent-return
router.route('/products').get(async (req, res, next) => {
  try {
    const { page, limit, type } = req.query;

    const filterQuery = {
      vendor: req.user.vendorId,
      isDeleted: type === 'deleted'
    };
    const paginateOptions = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12,
      sort: { createdAt: -1 }
    };

    const products = await Product.paginate(filterQuery, paginateOptions);

    return res.json(Response.success(products));
  } catch (e) {
    console.log(e);
  }
});

router.route('/products/listing/deleted').get(async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const vendor = await Vendor.findOne({ active: true });
    if (!vendor) return res.json(Response.notFound('Invalid vendor'));

    const filterQuery = {
      vendor: vendor._id,
      isDeleted: true
    };
    const paginateOptions = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12,
      sort: { createdAt: -1 }
    };

    const products = await Product.paginate(filterQuery, paginateOptions);

    return res.json(Response.success(products, null));
  } catch (e) {
    console.log(e);
  }
});

router.route('/orders').get(async (req, res, next) => {
  try {
    const { page, limit, status, t, startDate, endDate, searchBy, listType, source } = req.query;
    const vendor = await Vendor.findOne({ owner: req.user._id, active: true });
    if (!vendor) return res.json(Response.notFound('Invalid vendor'));
    let queryFilter = {
      vendor: vendor._id
    };

    if (status != null && status.length > 0) {
      queryFilter = {
        ...queryFilter,
        status
      };
    }

    if (listType != null && listType.length > 0) {
      if (listType === 'unpaid') {
        queryFilter = {
          ...queryFilter,
          listType: orderListTypeEnum.UNPAID
        };
      } else if (listType === 'shipping') {
        queryFilter = {
          ...queryFilter,
          listType: orderListTypeEnum.SHIPPING
        };
      } else if (listType === 'completed') {
        queryFilter = {
          ...queryFilter,
          listType: orderListTypeEnum.COMPLETED
        };
      } else if (listType === 'toship') {
        if (source != null && source.length > 0 && source === 'to_process') {
          queryFilter = {
            ...queryFilter,
            listType: orderListTypeEnum.TOSHIP_PROCESS
          };
        } else if (source != null && source.length > 0 && source === 'processed') {
          queryFilter = {
            ...queryFilter,
            listType: orderListTypeEnum.TOSHIP_PROCESSED
          };
        } else {
          queryFilter = {
            ...queryFilter,
            listType: {
              $in: [orderListTypeEnum.TOSHIP_PROCESS, orderListTypeEnum.TOSHIP_PROCESSED]
            }
          };
        }
      } else if (listType === 'cancelled') {
        if (source != null && source.length > 0 && source === 'cancelled_to_respond') {
          queryFilter = {
            ...queryFilter,
            listType: orderListTypeEnum.CANCELLED_TORESPONSE
          };
        } else if (source != null && source.length > 0 && source === 'cancelled_complete') {
          queryFilter = {
            ...queryFilter,
            listType: orderListTypeEnum.CANCELLED_COMPLETE
          };
        } else {
          queryFilter = {
            ...queryFilter,
            listType: {
              $in: [orderListTypeEnum.CANCELLED_TORESPONSE, orderListTypeEnum.CANCELLED_COMPLETE]
            }
          };
        }
      } else if (listType === 'refund_status') {
        if (source != null && source.length > 0 && source === 'refund_unprocessed') {
          queryFilter = {
            ...queryFilter,
            listType: orderListTypeEnum.REFUND_UNPROCESSED
          };
        } else if (source != null && source.length > 0 && source === 'refund_processed') {
          queryFilter = {
            ...queryFilter,
            listType: orderListTypeEnum.REFUND_PROCESSED
          };
        } else {
          queryFilter = {
            ...queryFilter,
            listType: {
              $in: [orderListTypeEnum.REFUND_UNPROCESSED, orderListTypeEnum.REFUND_PROCESSED]
            }
          };
        }
      }
    }

    if (startDate && startDate.length > 0) {
      queryFilter = {
        ...queryFilter,
        createdAt: { $gte: startDate }
      };
    }

    if (endDate && endDate.length > 0) {
      queryFilter = {
        ...queryFilter,
        createdAt: { $lt: endDate }
      };
    }

    if (t != null && t.length > 0) {
      let searchQuery = {};
      if (searchBy === 'customerName') {
        const customers = await Account.find({ username: new RegExp(t, 'gi') });

        const customerIds = customers.map((x) => x._id);

        searchQuery = {
          customer: { $in: customerIds }
        };
      } else if (searchBy === 'orderId') {
        searchQuery = {
          orderId: new RegExp(t, 'gi')
        };
      } else if (searchBy === 'productName') {
        searchQuery = {
          'products.product.name': new RegExp(t, 'gi')
        };
      }

      queryFilter = {
        ...queryFilter,
        ...searchQuery
      };
    }

    const paginateOptions = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12,
      sort: { createdAt: -1 },
      select:
        '-transaction -products.isChanged -products.isSelected -products.product.ratings -products.product.avgRating -products.product.category -products.product.stock -products.owner',
      populate: [
        {
          path: 'customer',
          select: 'username profile.avatar'
        },
        {
          path: 'shipment'
        }
      ]
    };

    const orders = await Order.paginate(queryFilter, paginateOptions);

    return res.json(Response.success(orders, null));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router
  .route('/:id/orders')
  .put(updateStatusOrderVendorRules(), validate, async (req, res, next) => {
    try {
      const vendor = await Vendor.findOne({ owner: req.user._id, active: true });
      if (!vendor) return res.json(Response.notFound('Invalid vendor'));

      const { id } = req.params;

      const { status, reason } = req.body;
      const order = await Order.findOne({
        _id: id
      });
      if (!order) return res.json(Response.badRequest(req.t('order.cannot.cancel')));
      async.parallel({
        activity: (cb) => {
          let activityState;

          switch (status) {
            case orderStatusEnum.CANCELLED:
              activityState = activityStateEnum.ORDER_CANCELED;
              break;
            case orderStatusEnum.PROCESSING:
              activityState = activityStateEnum.ORDER_PROCESSING;
              break;
            case orderStatusEnum.INTRANSIT:
              activityState = activityStateEnum.ORDER_INTRANSIT;
              break;
            case orderStatusEnum.PICKUP_AVAILABLE:
              activityState = activityStateEnum.ODER_PICKUP_AVAILABLE;
              break;
            case orderStatusEnum.DELIVERED:
              activityState = activityStateEnum.ORDER_DELIVERED;
              break;
            case orderStatusEnum.PROBLEM:
              activityState = activityStateEnum.ORDER_PROBLEM;
              break;
            case orderStatusEnum.AWAITING_CONFIRMATION:
              activityState = activityStateEnum.ORDER_AWAITING_CONFIRMATION;
              break;
            case orderStatusEnum.COMPLETED:
              activityState = activityStateEnum.ORDER_COMPLETED;
              break;
            default:
              break;
          }
          OrderActivity.create({
            order: order._id,
            issuer: req.user._id,
            state: activityState,
            reason
          }).then((resp) => cb(null, resp));
        },
        orderUpdate: (cb) => {
          Order.findByIdAndUpdate(id, {
            $set: {
              status
            }
          }).then((resp) => cb(null, resp));
        }
      });
      // .then((result) => {
      //   const { orderUpdate } = result;

      return res.json(Response.success({ _id: id }, req.t('order.updated.success')));
      // });
    } catch (e) {
      console.log(e);
      return next(e);
    }
  });

// eslint-disable-next-line consistent-return
router.route('/:orderId/orders').get(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId, vendor: req.user.vendorId })
      .select(
        // 'orderId totalPrice proccessingInfo deliveryAddress shipmentMethod totalPriceBefore totalVendorDiscount buyerPaidAmount totalSystemDiscount voucherDiscountAmount currencySymbol address.fullName address.phone address.fullAddress payment products.amount products.selectedVariant products.selectedAttribute products.product.name products.product._id products.product.slug products.price products.discount products.discountedPrice products.lastPrice products.currencySymbol products.product.media.featuredImage paymentAt deliverdAt pickupAt createdAt shipment status'
        '-transaction -products.isChanged -products.isSelected -products.product.ratings -products.product.avgRating -products.product.category -products.product.stock -products.owner'
      )
      .populate([
        {
          path: 'shipment',
          populate: [
            {
              path: 'details',
              options: {
                sort: { createdAt: -1 }
              }
            }
          ]
        },
        {
          path: 'customer',
          select: 'profile.avatar profile.fullName profile.email phone'
        }
      ]);
    if (!order) return res.json(Response.notFound(req.t('invalid.order')));
    const orderActivity = await OrderActivity.find({ order: order._id });

    return res.json(Response.success({ order, orderActivity }, null));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.route('/orders/:orderId/process_toship').post(async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const { note, addressId, pickupAt } = req.body;
    const pickupAddress = await Address.findOne({ _id: addressId });
    if (!pickupAddress) return res.json(Response.notFound(req.t('address.noFound')));
    const order = await Order.findOne({ orderId }).lean();
    if (!order) return res.json(Response.notFound(req.t('invalid.order')));
    const status = shipmentStatusEnum.PICKUP_PENDING;

    const shipment = new Shipment({
      order: order._id,
      status,
      pickupAt,
      pickupAddress,
      note
    });
    await shipment.save();

    await ShipmentDetail.create({
      shipment: shipment._id,
      title: 'Người gửi đang chuẩn bị hàng'
    });

    await Order.findOneAndUpdate(
      { orderId },
      {
        $set: {
          listType: orderListTypeEnum.TOSHIP_PROCESSED,
          shipment: shipment._id,
          status: orderStatusEnum.PROCESSING
        }
      }
    );
    return res.json(Response.success(shipment));
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

router.route('/addresses/:orderId').get(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId }).select('shipmentMethod').lean();
    if (!order) return res.json(Response.notFound('invalid.order'));

    const address = await Address.findOne({ owner: req.user._id, isPickup: true }).lean();
    if (!address) return res.json(Response.notFound(req.t('address.noFound')));

    return res.json(Response.success({ address, shipmentMethod: order.shipmentMethod }, null));
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

router.route('/addresses').get(async (req, res, next) => {
  try {
    const addresses = await Address.find({ owner: req.user._id });
    return res.json(Response.success(addresses, null));
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

// .get(filterProductValidationRules(), validate, product.searchProductsByFilter);

// router.route('/:slug')
//   .get(product.getProductDetail);

// router.route('/:id')
//   .put(authorize(), updateProductValidationRules(), validate, product.updateProduct)
//   .delete(authorize(), product.deleteProduct);

// router.route('/:id/restore')
//   .put(authorize(), product.restoreProduct);

export default router;
