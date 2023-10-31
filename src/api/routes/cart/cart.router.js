import _ from 'lodash';
import mongoose from 'mongoose';

import { Router } from 'express';
import async from 'async';

import vars from '../../../config/vars.js';

import CartItem from '../../models/cart.model.js';
import Account from '../../models/account.model.js';
import Response from '../../utils/response.js';
import Product from '../../models/product.model.js';
import productStatusEnum from '../../enums/productStatus.enum.js';
import {
  postAddtoCartRules,
  updateCartRules,
  deleteCartRules,
  deleteManyRules,
  rebuyRules
} from '../../validations/cart.validator.js';
import { validate } from '../../middlewares/validate.js';

let crypto;
try {
  crypto = await import('crypto');
} catch (err) {
  console.log('crypto is not support');
}

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const id = req.user._id;
    const isUser = await Account.exists({ _id: id });
    if (!isUser) return res.json(Response.notFound());
    return async
      .parallel({
        cartItems: (cb) => {
          const { limit, page } = req.query;
          const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            populate: [
              {
                path: 'product',
                select:
                  'name slug variants variantLabel attributeLabel stock price status currencySymbol discount media.featuredImage'
              },
              {
                path: 'vendor',
                select: 'brandName',
                populate: {
                  path: 'owner',
                  select: 'username profile.avatar'
                }
              }
            ],
            sort: { vendor: 1, updatedAt: -1 }
          };
          CartItem.paginate({ owner: req.user._id }, options).then((rs) => cb(null, rs));
        },
        relatedProducts: (cb) => {
          Product.find({
            discount: { $gt: 0.1 },
            isDeleted: false,
            status: productStatusEnum.PUBLISH
          })
            .sort({ createdAt: -1 })
            .select('name price media.featuredImage slug discount currencySymbol')
            .limit(20)
            .exec(cb);
        }
      })
      .then((result) => {
        const { cartItems, relatedProducts } = result;
        let cart = null;
        if (cartItems.totalDocs > 0) {
          const grouped = _.groupBy(cartItems.docs, (p) => p.vendor._id);
          const results = Object.entries(grouped).map(([, value]) => {
            const products = value;

            return {
              vendor: products[0].vendor,
              products
            };
          });

          delete cartItems.docs;
          cart = {
            ...cartItems,
            grouped: results
          };
        }

        return res.json(Response.success({ relatedProducts, cartItems: cart }));
      });
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.route('/paginate').get(async (req, res, next) => {
  const { limit, page } = req.query;
  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    populate: [
      {
        path: 'product',
        select:
          'name slug variants variantLabel attributeLabel stock price status currencySymbol discount media.featuredImage'
      },
      {
        path: 'vendor',
        select: 'brandName',
        populate: {
          path: 'owner',
          select: 'username profile.avatar'
        }
      }
    ],
    sort: { vendor: 1, updatedAt: -1 }
  };
  const cartItems = await CartItem.paginate({ owner: req.user._id }, options);
  if (cartItems.totalDocs < 1) {
    return res.json(Response.notFound());
  }
  const grouped = _.groupBy(cartItems.docs, (p) => p.vendor._id);

  const results = Object.entries(grouped).map(([, value]) => {
    const products = value;

    return {
      vendor: products[0].vendor,
      products
    };
  });

  const cart = {
    ...cartItems,
    grouped: results
  };

  return res.json(Response.success(cart));
});

router.route('/re-buy').post(rebuyRules(), validate, async (req, res, next) => {
  try {
    const { items } = req.body;
    const _pIds = items.map((i) => i.productId.toString());
    const products = await Product.find({ _id: { $in: _pIds } });
    if (products.length < 1) return res.json(Response.badRequest(req.t('invalid.cart')));
    const _productIds = products.map((p) => p._id.toString());
    const filteredCarts = items.filter((x) => _productIds.includes(x.productId.toString()));

    const insertCarts = [];
    filteredCarts.forEach((x) => {
      let filterCart = {
        product: x.productId,
        owner: req.user._id
      };

      const product = products.find((p) => p._id.toString() === x.productId.toString());

      let variant = null;
      let attribute = null;
      let compareObj = product;
      if (x.selectedVariant != null) {
        variant = product.variants.id(selectedVariant);
        if (variant) {
          filterCart = {
            ...filterCart,
            'selectedVariant._id': variant._id
          };
          compareObj = variant;

          if (selectedAttribute != null) {
            attribute = variant.attributes.id(selectedAttribute);
            if (attribute) {
              filterCart = {
                ...filterCart,
                'selectedVariant._id': variant._id,
                'selectedAttribute._id': attribute._id
              };
              compareObj = attribute;
            }
          }
        }
      }

      insertCarts.push({
        _id: new mongoose.Types.ObjectId(),
        product: x.productId,
        selectedVariant: variant,
        selectedAttribute: attribute,
        amount: x.amount,
        owner: req.user._id,
        currencySymbol: product.currencySymbol,
        vendor: product.vendor,
        price: compareObj.price,
        discount: compareObj.discount
      });
    });
    await CartItem.insertMany(insertCarts);
    const _qIds = insertCarts.map((x) => x._id.toString());
    const q = _qIds.join();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-ctr', vars.querySecretKey, iv);

    const encrypted = Buffer.concat([cipher.update(q), cipher.final()]);

    return res.json(
      Response.success({
        s: encrypted.toString('hex'),
        f: iv.toString('hex'),
        cartIds: _qIds
      })
    );
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.route('/buy-now').post(postAddtoCartRules(), validate, async (req, res, next) => {
  try {
    const { amount, productId, selectedVariant, selectedAttribute } = req.body;
    console.log("1")
    const product = await Product.findById(productId);
    console.log("2")
    if (!product) return res.json(Response.notFound('Invalid product'));
    console.log("3")
    let filterCart = {
      product: productId,
      owner: req.user._id
    };
    console.log("4")
    let variant = null;
    let attribute = null;
    let compareObj = product;
    console.log("5")
    if (selectedVariant != null) {
      variant = product.variants.id(selectedVariant);
      if (variant) {
        filterCart = {
          ...filterCart,
          'selectedVariant._id': variant._id
        };
        compareObj = variant;

        if (selectedAttribute != null) {
          attribute = variant.attributes.id(selectedAttribute);
          if (attribute) {
            filterCart = {
              ...filterCart,
              'selectedVariant._id': variant._id,
              'selectedAttribute._id': attribute._id
            };
            compareObj = attribute;
          }
        }
      }
    }
    console.log("6")
    const createCart = await CartItem.create({
      product: productId,
      selectedVariant: variant,
      selectedAttribute: attribute,
      amount: amount,
      owner: req.user._id,
      currencySymbol: product.currencySymbol,
      vendor: product.vendor,
      price: compareObj.price,
      discount: compareObj.discount
    });
    console.log("7")
    if (!createCart) return res.json(Response.badRequest(req.t('cart.add.error')));

    console.log("8")
    const q = createCart._id.toString();
    console.log("9")
    const iv = crypto.randomBytes(16);
    console.log("10")
    const cipher = crypto.createCipheriv('aes-256-ctr', Buffer.from(vars.querySecretKey), iv,);
    console.log("11")
    const encrypted = Buffer.concat([cipher.update(q), cipher.final()]);

    return res.json(
      Response.success({
        s: encrypted.toString('hex'),
        f: iv.toString('hex')
      })
    );
  } catch (e) {
    console.log(e);
    return next(e);
  }
});

router.route('/').post(postAddtoCartRules(), validate, async (req, res, next) => {
  try {
    const { amount, productId, selectedVariant, selectedAttribute, selectValue } = req.body;

    const product = await Product.findById(productId);

    if (!product) return res.json(Response.notFound('Invalid product'));

    let filterCart = {
      product: productId,
      owner: req.user._id
    };

    let variant = null;
    let attribute = null;
    let compareObj = product;
    if (selectedVariant != null) {
      variant = product.variants.id(selectedVariant);
      if (variant) {
        filterCart = {
          ...filterCart,
          'selectedVariant._id': variant._id
        };
        compareObj = variant;

        if (selectedAttribute != null) {
          attribute = variant.attributes.id(selectedAttribute);
          if (attribute) {
            filterCart = {
              ...filterCart,
              'selectedVariant._id': variant._id,
              'selectedAttribute._id': attribute._id
            };
            compareObj = attribute;
          }
        }
      }
    }
    const isCartExists = await CartItem.findOne(filterCart);
    if (isCartExists) {
      if (isCartExists.amount + amount > compareObj.stock.quantity)
        return res.json(Response.badRequest(req.t('invalid.quantity')));
      isCartExists.amount += amount;
      isCartExists.price = compareObj.price;
      isCartExists.discount = compareObj.discount;
      const saveCart = await isCartExists.save();
      if (!saveCart) return res.json(Response.badRequest(req.t('add.cart.error')));

      return res.json(Response.success(saveCart));
    }
    const createCart = await CartItem.create({
      product: productId,
      selectedVariant: variant,
      selectedAttribute: attribute,
      amount: amount,
      owner: req.user._id,
      currencySymbol: product.currencySymbol,
      vendor: product.vendor,
      selected: selectValue || false,
      price: compareObj.price,
      discount: compareObj.discount
    });
    if (!createCart) return res.json(Response.badRequest(req.t('cart.add.error')));

    return res.json(Response.success(createCart));
  } catch (e) {
    console.log(e);
    return next(e);
  }
});

router.route('/:cartId').put(updateCartRules(), validate, async (req, res, next) => {
  try {
    const { cartId } = req.params;
    let { amount, selectedVariant, selectedAttribute } = req.body;
    const cart = await CartItem.findById(cartId).populate('product');
    if (!cart) return res.json(Response.badRequest(req.t('invalid.cart')));
    if (!cart.product) return res.json(Response.notFound(req.t('invalid.product')));

    const { product } = cart;
    let updateQuery = {};

    if (amount != null) {
      amount = parseInt(amount);

      let stockQuantity = product.stock.quantity;

      if (selectedVariant != null && selectedAttribute == null) {
        const variant = product.variants.id(selectedVariant);
        if (variant) {
          stockQuantity = variant.stock.quantity;
          const attribute = variant.attributes.id(selectedAttribute);
          if (attribute) {
            stockQuantity = attribute.stock.quantity;
          }
        }
      }

      const isValidAmount = amount <= stockQuantity;
      if (!isValidAmount) return res.json(Response.badRequest(req.t('invalid.quantity')));

      updateQuery = {
        ...updateQuery,
        amount
      };
    }

    if (selectedVariant != null) {
      const variant = product.variants.id(selectedVariant);
      if (variant) {
        updateQuery = {
          ...updateQuery,
          selectedVariant: variant,
          price: variant.price,
          discount: variant.discount
        };
        if (selectedAttribute != null) {
          const attr = variant.attributes.id(selectedAttribute);
          if (attr) {
            updateQuery = {
              ...updateQuery,
              selectedAttribute: attr,
              price: attr.price,
              discount: attr.discount
            };
          }
        }
      }
    }
    const cartItem = await CartItem.findOneAndUpdate(
      {
        _id: cartId
      },
      {
        $set: updateQuery
      },

      { new: true }
    )
      .populate({
        path: 'product',
        select:
          'name slug variants variantLabel attributeLabel stock price status currencySymbol discount media.featuredImage'
      })
      .populate({
        path: 'vendor',
        select: 'brandName',
        populate: {
          path: 'owner',
          select: 'username profile.avatar'
        }
      });

    return res.json(Response.success(cartItem));
  } catch (e) {
    console.log(e);
    return next(e);
  }
});

router.route('/:id').delete(deleteCartRules(), validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const checkDelete = await CartItem.findOne({ _id: id });
    if (!checkDelete) {
      return res.json(Response.badRequest(req.t('invalid.cart')));
    }
    const cartDelete = await CartItem.findByIdAndDelete(id)
      .populate({
        path: 'product',
        select:
          'name slug variants variantLabel attributeLabel stock price status currencySymbol discount media.featuredImage'
      })
      .populate({
        path: 'vendor',
        select: 'brandName',
        populate: {
          path: 'owner',
          select: 'username profile.avatar'
        }
      });
    return res.json(Response.success(cartDelete, req.t('delete.cart.success')));
  } catch (e) {
    console.log(e);
    return next(e);
  }
});

router.route('/deleteMany').post(deleteManyRules(), validate, async (req, res, next) => {
  try {
    const { cartItems } = req.body;
    const deleteMany = await CartItem.deleteMany({ _id: { $in: cartItems } });
    if (!deleteMany) {
      return res.json(Response.badRequest(req.t('error.delete.cart')));
    }
    return res.json(Response.success(null, req.t('delete.cart.success')));
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

router.route('/header').get(async (req, res, next) => {
  try {
    return async
      .parallel({
        totalCartItems: (cb) => {
          CartItem.countDocuments({ owner: req.user._id }).exec(cb);
        },
        carts: (cb) => {
          CartItem.find({ owner: req.user._id })
            .populate('product', 'name media.featuredImage slug')
            .select('-owner -vendor')
            .sort({ updatedAt: -1 })
            .limit(6)
            .lean()
            .exec(cb);
        }
      })
      .then((result) => {
        const { carts, totalCartItems } = result;
        return res.json(
          Response.success({ carts, totalCartItems, totalViewMore: totalCartItems - carts.length })
        );
      });
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

router.route('/total').get(async (req, res, next) => {
  try {
    const total = await CartItem.countDocuments({ owner: req.user._id });
    return res.json(Response.success({ total }));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

export default router;
