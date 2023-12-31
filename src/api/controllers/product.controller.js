import async from 'async';
import { nanoid } from 'nanoid';
import mongoose from 'mongoose';
import vars from '../../config/vars.js';
import Response from '../utils/response.js';
import Product from '../models/product.model.js';
import Vendor from '../models/vendor.model.js';
import Media from '../models/media.model.js';
import mediaTypeEnum from '../enums/mediaType.enum.js';
import Brand from '../models/brand.model.js';
import Category from '../models/category.model.js';
import ProductVariant from '../models/productVariant.model.js';
import s3 from '../../config/s3.js';
import productStatusEnum from '../enums/productStatus.enum.js';
import sortOrderTypeEnum from '../enums/sortOrderType.enum.js';
import productSortEnum from '../enums/productSort.enum.js';
import Account from '../models/account.model.js';
import Conversation from '../models/conversations.model.js';
export default {
  getProductDetail: async (req, res, next) => {
    try {
      const { slug } = req.params;
      const product = await Product.findOne({ slug }).select('category');
      if (!product) return res.json(Response.notFound());

      const category = await Category.findById(product.category);
      if (!category) return res.json(Response.notFound());

      return async
        .parallel({
          detailProduct: (cb) => {
            Product.aggregate([
              { $match: { slug } },
              {
                $lookup: {
                  from: 'vendors',
                  localField: 'vendor',
                  foreignField: '_id',
                  as: 'vendor'
                }
              },
              {
                $lookup: {
                  from: 'brands',
                  localField: 'brand',
                  foreignField: '_id',
                  as: 'brand'
                }
              },
              {
                $lookup: {
                  from: 'categories',
                  localField: 'category',
                  foreignField: '_id',
                  as: 'category'
                }
              },
              {
                $unwind: '$vendor'
              },
              {
                $addFields: {
                  discountPercent: { $multiply: ['$discount', 100] },
                  currentPrice: {
                    $multiply: ['$price', { $subtract: [1, '$discount'] }]
                  }
                }
              }
            ]).then((resp) => cb(null, resp));
          },
          relatedProducts: (cb) => {
            Product.find({ category: category._id }).limit(20).exec(cb);
          },
          newProducts: (cb) => {
            Product.find({}).sort({ createdAt: -1 }).limit(10).exec(cb);
          }
        })
        .then((result) => {
          const { detailProduct, relatedProducts, newProducts } = result;

          return res.json(
            Response.success({
              detailProduct: detailProduct[0],
              relatedProducts,
              newProducts
            })
          );
        });
    } catch (error) {
      console.error(error);
      return next(error);
    }
  },
  getConversation: async (req, res, next) => {
    try {
      var user = req.user;
      var conversation = await Conversation.find({
        ownerId: user._id,
      });
      var listConversation = []
      console.log("giang getConversation1 : ", conversation.length)


      for (const element of conversation) {
        var owner = await Account.findById(element.ownerId)
        var guest = await Account.findById(element.guestId)
        console.log("giang getConversation: ", guest)
        listConversation.push({
          "id": element.numberId,
          "name": guest.profile.fullName,
          "type": element.type,
          "myLastSeen": element.myLastSeen,
          "lastMessage": {
            "id": 1,
            "conversationId": 1,
            "timestamp": 1,
            "refId": 1,
            "content": {
              "type": "TEXT",
              "text": element.textLastMessage ?? "hello"
            }
          },
          "members": [
            {
              "username": owner.profile.fullName,
              "globalId": owner.numberId,
              "fullname": owner.profile.fullName,
              "avatar": owner.profile.avatar
            }, {
              "username": guest.profile.fullName,
              "globalId": guest.numberId,
              "fullname": guest.profile.fullName,
              "avatar": guest.profile.avatar
            }
          ]
        })
      }

      conversation = await Conversation.find({
        guestId: user._id,
      });
      console.log("giang getConversation2 : ", conversation)
      for (const element of conversation) {
        var owner = await Account.findById(element.guestId)
        var guest = await Account.findById(element.ownerId)

        console.log("giang getConversation guestId2: ", guest)
        listConversation.push({
          "id": element.numberId,
          "name": guest.profile.fullName,
          "type": element.type,
          "myLastSeen": element.myLastSeen,
          "lastMessage": {
            "id": 1,
            "conversationId": 1,
            "timestamp": 1,
            "refId": 1,
            "content": {
              "type": "TEXT",
              "text": element.textLastMessage ?? "hello"
            }
          },
          "members": [
            {
              "username": owner.profile.fullName,
              "globalId": owner.numberId,
              "fullname": owner.profile.fullName,
              "avatar": owner.profile.avatar
            }, {
              "username": guest.profile.fullName,
              "globalId": guest.numberId,
              "fullname": guest.profile.fullName,
              "avatar": guest.profile.avatar
            }
          ]
        })
      }
      return res.json(
        Response.success({
          listConversation,
        })
      );


    } catch (err) {
      console.error(err);
      return next(err);
    }
  },
  createConversation: async (req, res, next) => {
    try {
      const {
        ownerId,
        guestId,
      } = req.body;
      console.log("giang createConversation: " + ownerId + " " + guestId + (ownerId === guestId))
      if (ownerId === guestId) return res.json(
        Response.error("Cuộc hội thoại lỗi")
      );
      console.log("giang createConversation: " + ownerId + " " + guestId)

      const owner = await Account.findOne({ _id: ownerId });

      var ownerNumberId;
      if (owner.numberId == null) {
        ownerNumberId = getRandomInt(1, 9999999);
        await Account.updateOne({ _id: owner._id }, { $set: { numberId: ownerNumberId } });
      } else {
        ownerNumberId = owner.numberId;
      }
      const guest = await Account.findOne({ _id: guestId });

      var guestNumberId;
      if (guest.numberId == null) {
        guestNumberId = getRandomInt(1, 9999999);
        await Account.updateOne({ _id: guest._id }, { $set: { numberId: guestNumberId } });
      } else {
        guestNumberId = guest.numberId;
      }
      const numberId = getRandomInt(1, 9999999);


      var conversation = await Conversation.findOne({
        ownerId: owner._id, guestId: guest._id,
        // $or: [
        //   { ownerId: owner._id },
        //   { guestId: guest._id, },
        // ],
      });
      console.log("giang createConversation:" + conversation)
      if (conversation == null) {
        conversation = await Conversation.findOne({
          ownerId: guest._id, guestId: owner._id
          // $or: [
          //   { ownerId: guest._id },
          //   { guestId: owner._id },
          // ],
        });
      }
      console.log("giang createConversation:" + conversation)
      if (conversation == null) {
        await Conversation.create({
          numberId: numberId,
          name: guest.name,
          myLastSeen: 0,
          ownerId: owner._id,
          guestId: guest._id,
          textLastMessage: "hello",

        });
        return res.json(
          Response.success(
            "Tạo cuộc hội thoại thành công"
          )
        );
      }
      return res.json(
        Response.error("Cuộc hội thoại đã tồn tại")
      );

    } catch (err) {
      console.error(err);
      return next(err);
    }
  },
  updateLastMessageConversation: async (req, res, next) => {
    try {
      const {
        conversationId,
        message,
      } = req.body;
      console.log("updateLastMessageConversation :" + conversationId + " " + message)
      const conversation = await Conversation.findOne({ numberId: conversationId });

      if (conversation == null) return res.json(Response.error("không tìm thấy cuộc trò chuyện"));


      await Conversation.updateOne(
        { numberId: conversationId },
        {
          $set: {
            textLastMessage: message,
          }
        }
      );
      return res.json(Response.success(null, req.t('product.updated')));


    } catch (err) {
      console.error(err);
      return next(err);
    }
  },
  createProduct: async (req, res, next) => {
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
        categoryId,
        brand,
        images
      } = req.body;
      console.log("giang createProduct ${categoryId}" + categoryId);
      // const chooseCategory = threeLevelCat || secondLevelCat || firstLevelCat;
      // if (!chooseCategory) return res.redirect('/');

      const category = await Category.findById(categoryId);
      if (!category) return res.json(Response.notFound('Invalid category'));
      var user = req.user;
      const vendor = await Vendor
        .findOne({ owner: user._id })
      if (!vendor) return res.json(Response.notFound('Invalid category'));
      console.log("giang" + user._id + " " + category._id + "\n " + vendor._id);
      // return res.json(Response.notFound('Invalid vendor'));
      // if (!vendor) return res.json(Response.notFound('Invalid vendor'));

      return async
        .parallel({
          // eslint-disable-next-line consistent-return
          // productVariants: (cb) => {
          //   const insertVariants = [];
          //   if (variants && variants.length > 0) {
          //     variants.forEach((x) => {
          //       const variant = new ProductVariant({
          //         name: x.name,
          //         sizes: x.sizes,
          //         image: x.image
          //       });
          //       insertVariants.push(variant);
          //     });
          //     console.log("productVariants"+cb)
          //     return cb(null, insertVariants);
          //   }
          // },
          insertBrand: (cb) => {
            if (!mongoose.isValidObjectId(brand)) {
              Brand.create({
                name: brand
              }).then((result) => {
                console.log("insertBrand" + cb)
                return cb(null, result)
              });
            } else {
              console.log("insertBrand" + cb)
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
            } console.log("insertObj" + cb)
            cb(null, insertGallery);
          }
        })
        .then(async (result) => {
          console.log("1" + result)
          const { insertObj, insertBrand, productVariants, insertGallery } = result;
          if (insertGallery && insertGallery.length > 0) {
            insertGallery.forEach((item) => {
              const image = insertObj.find((e) => e.path === item.image);
              item.imageId = image._id;
            });
          } console.log("2", result)
          await Product.create({
            name,
            sku,
            price,
            vendor: vendor._id,
            currencySymbol: currencyUnit,
            description,
            category: category._id,
            // parentCategories: {
            //   firstLevel: category.parents?.firstLevel,
            //   secondLevel: category.parents?.secondLevel
            // },
            brand: mongoose.isValidObjectId(brand) ? brand : insertBrand._id,
            stock: {
              quantity,
              status: stockStatus,
              country: stockCountry
            },
            discount: discount / 100,
            media: {
              featuredImage: insertObj[0].path || "null.com",
              data: insertObj
            },
            variants: productVariants
          });
          return res.json(Response.success(null, req.t('product.created')));
        });
    } catch (err) {
      console.error(err);
      return next(err);
    }
  },

  updateProduct: async (req, res, next) => {
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
        categoryId,
        productBrand,
        images
      } = req.body;
      console.log("giang 1")
      const { id } = req.params;

      const category = await Category.findById(categoryId);
      if (!category) return res.json(Response.notFound('Invalid category'));
      console.log("giang 3")
      const vendor = await Vendor.findById(req.user.vendorId);
      if (!vendor) return res.json(Response.notFound('Invalid vendor'));
      console.log("giang 4")

      return async
        .parallel({
          insertBrand: (cb) => {
            if (!mongoose.isValidObjectId(productBrand)) {
              Brand.create({
                name: productBrand
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
          const { insertObj, insertBrand } = result;

          await Product.updateOne(
            { _id: id },
            {
              $set: {
                name,
                sku,
                price,
                vendor: req.user.vendorId,
                currencySymbol: currencyUnit,
                description,
                category: category._id,

                brand: mongoose.isValidObjectId(productBrand) ? productBrand : insertBrand._id,
                stock: {
                  quantity,
                  status: stockStatus,
                  country: stockCountry
                },
                discount: discount / 100,
                media: {
                  featuredImage: images[0].path,
                  data: insertObj
                }
              }
            }
          );
          return res.json(Response.success(null, req.t('product.updated')));
        });
    } catch (err) {
      console.error(err);
      return next(err);
    }
  },

  deleteProduct: async (req, res, next) => {
    try {
      const { id } = req.params;
      const checkDelete = await Product.findOne({ _id: id }, { isDeleted: false });
      if (!checkDelete) return res.json(Response.badRequest(req.t('invalid.product')));
      await Product.findByIdAndUpdate(id, { $set: { isDeleted: true } }, { new: true });
      return res.json(Response.success(null, req.t('product.deleted')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  },
  restoreProduct: async (req, res, next) => {
    try {
      const { id } = req.params;
      const checkDelete = await Product.findOne({ _id: id }, { isDeleted: true });
      if (!checkDelete) return res.json(Response.badRequest(req.t('invalid.product')));
      await Product.findByIdAndUpdate(id, { $set: { isDeleted: false } }, { new: true });
      return res.json(Response.success(req.t('product.restore')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  },

  getSearchFiltersByText: async (req, res, next) => {
    try {
      const { t } = req.query;
      let filterQuery = {
        'stock.quantity': { $gt: 0 },
        isDeleted: false,
        status: productStatusEnum.PUBLISH
      };
      if (t && t.length > 0) {
        filterQuery = {
          name: new RegExp(t, 'gi')
        };
      }

      return async
        .parallel({
          stockCountries: (cb) => {
            Product.aggregate([
              {
                $match: filterQuery
              },
              {
                $group: {
                  _id: '$stock.country',
                  country: { $first: '$stock.country' }
                }
              },
              {
                $sort: { country: 1 }
              },
              {
                $unset: ['_id']
              }
            ]).then((resp) => cb(null, resp));
          },
          brands: (cb) => {
            Product.aggregate([
              {
                $match: filterQuery
              },
              {
                $group: {
                  _id: '$brand',
                  brand: { $first: '$brand' }
                }
              },
              {
                $lookup: {
                  from: 'brands',
                  localField: 'brand',
                  foreignField: '_id',
                  as: 'brand',
                  pipeline: [
                    {
                      $project: {
                        _id: 1,
                        name: 1
                      }
                    }
                  ]
                }
              },
              {
                $unwind: '$brand'
              },
              {
                $sort: { brand: 1 }
              },
              {
                $unset: ['_id']
              }
            ]).then((resp) => cb(null, resp));
          },
          categories: (cb) => {
            Product.aggregate([
              {
                $match: filterQuery
              },
              {
                $group: {
                  _id: '$category',
                  category: { $first: '$category' }
                }
              },
              {
                $lookup: {
                  from: 'categories',
                  localField: 'category',
                  foreignField: '_id',
                  as: 'category',
                  pipeline: [
                    {
                      $project: {
                        _id: 1,
                        name: 1
                      }
                    }
                  ]
                }
              },
              {
                $unwind: '$category'
              },
              {
                $sort: { category: 1 }
              },
              {
                $unset: ['_id']
              }
            ]).then((resp) => cb(null, resp));
          }
        })
        .then((result) => res.json(Response.success(result)));
    } catch (err) {
      console.error(err);
      return next(err);
    }
  },

  searchProductsByFilter: async (req, res, next) => {
    try {
      const { cat, rating, minPrice, maxPrice, location, brands, t, limit, page, order, sortBy } =
        req.query;

      let sort = { createdAt: -1 };
      const _order = order && order === sortOrderTypeEnum.DESC ? -1 : 1;
      if (sortBy === productSortEnum.TIME) {
        sort = { createdAt: _order };
      } else if (sortBy === productSortEnum.PRICE) {
        sort = { discountedPrice: _order };
      }

      const options = {
        limit: parseInt(limit) || 10,
        page: parseInt(page) || 1,
        sort,
        select:
          'priceRange media.featuredImage avgRating discount price currencySymbol name slug createdAt updatedAt stock.country discountedPrice'
      };

      let filterQuery = {
        'stock.quantity': { $gt: 0 },
        isDeleted: false,
        status: productStatusEnum.PUBLISH
      };

      if (t && t.length > 0) {
        filterQuery = {
          ...filterQuery,
          name: new RegExp(t, 'gi')
        };
      }
      if (cat) {
        filterQuery = {
          ...filterQuery,
          $or: [
            { category: mongoose.Types.ObjectId(cat) },
            { 'parentCategories.firstLevel': mongoose.Types.ObjectId(cat) },
            { 'parentCategories.secondLevel': mongoose.Types.ObjectId(cat) }
          ]
        };
      }

      if (rating) {
        filterQuery = {
          ...filterQuery,
          avgRating: { $gte: parseInt(rating) }
        };
      }

      if (brands) {
        const brandIds = brands.split(',').map((x) => mongoose.Types.ObjectId(x));
        filterQuery = {
          ...filterQuery,
          brand: { $in: brandIds }
        };
      }

      if (location) {
        const _locations = location.split(',');
        filterQuery = {
          ...filterQuery,
          'stock.country': { $in: _locations }
        };
      }

      if (minPrice && maxPrice) {
        filterQuery = {
          ...filterQuery,
          discountedPrice: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) }
        };
      }

      const results = await Product.paginate(filterQuery, options);

      return res.json(Response.success(results));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  },

  getProductDetailApp: async (req, res, next) => {
    try {
      const { id } = req.params;
      const product = await Product.findById({ id }).populate('vendor brand category');
      if (!product) return res.json(Response.notFound('Invalid product'));

      const category = await Category.findById(product.category);
      if (!category) return res.json(Response.notFound());

      return async
        .parallel({
          relatedProducts: (cb) => {
            Product.find({ category: category._id }).limit(20).exec(cb);
          },
          newProducts: (cb) => {
            Product.find({}).sort({ createdAt: -1 }).limit(10).exec(cb);
          }
        })
        .then((result) => {
          const { relatedProducts, newProducts } = result;

          return res.json(
            Response.success({
              detailProduct: product,
              relatedProducts,
              newProducts
            })
          );
        });
    } catch (error) {
      console.error(error);
      return next(error);
    }
  },
  getResignedUrl: (req, res, next) => {
    try {
      const { fileType } = req.body;
      if (fileType !== 'jpg' && fileType !== 'png' && fileType !== 'jpeg') {
        return res.json(Response.badRequest(req.t('profile.image.format.invalid')));
      }

      const fullFileName = `data/images/${nanoid()}.${fileType}`;
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
  }
};
// Function to generate a random integer within a specified range
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Example: Generate a random integer between 1 and 10
