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
              featuredImage: "https://cdn.alongwalk.info/wp-content/uploads/2022/04/05000455/image-nhung-dieu-thu-vi-ve-ngon-ngu-tai-vuong-quoc-anh-164906669525225.jpg" || images[0].path || null,
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
        firstLevelCat,
        secondLevelCat,
        threeLevelCat,
        productBrand,
        images
      } = req.body;

      const { id } = req.params;
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
                  name: x.name,
                  sizes: x.sizes
                };
                insertVariants.push(variant);
              });
              ProductVariant.insertMany(insertVariants).then((resp) => cb(null, resp));
            }
          },
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
                parentCategories: {
                  firstLevel: category.parents?.firstLevel,
                  secondLevel: category.parents?.secondLevel
                },
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
      return res.json(Response.badRequest(req.t('product.restore')));
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
