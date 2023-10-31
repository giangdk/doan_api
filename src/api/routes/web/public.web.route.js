import async from 'async';

import { Router } from 'express';
import Response from '../../utils/response.js';
import Product from '../../models/product.model.js';
import Category from '../../models/category.model.js';
import Account from '../../models/account.model.js';
import Vendor from '../../models/vendor.model.js';
import categoryController from '../../controllers/category.controller.js';
import Brand from '../../models/brand.model.js';
import productController from '../../controllers/product.controller.js';

import { Colors } from '../../enums/colorHex.enum.js';
import productStatusEnum from '../../enums/productStatus.enum.js';
import currencyEnum from '../../enums/currency.enum.js';
import { StockStatus, StockCountry } from '../../enums/product.enum.js';

const router = Router();

router.get('/', (req, res, next) => {
  try {
    return async
      .parallel({
        dealsOfTheDay: (cb) => {
          Product.find({
            discount: { $gt: 0.1 },
            isDeleted: false,
            status: productStatusEnum.PUBLISH
          })
            .sort({ createdAt: -1 })
            .select('name price media.featuredImage slug discount currencySymbol totalReviews')
            .limit(20)
            .exec(cb);
        },
        top5Products: (cb) => {
          Product.find({
            discount: { $gt: 0.3 },
            isDeleted: false,
            status: productStatusEnum.PUBLISH
          })
            .sort({ createdAt: -1 })
            .select('name price media.featuredImage slug discount currencySymbol totalReviews')
            .limit(5)
            .exec(cb);
        },
        firstNewProducts: (cb) => {
          Product.find({ isDeleted: false, status: productStatusEnum.PUBLISH })
            .sort({ createdAt: -1 })
            .select('name price media.featuredImage slug discount currencySymbol totalReviews')
            .limit(6)
            .exec(cb);
        },
        dontMissTheseProducts: (cb) => {
          Product.find({
            discount: 0,
            isDeleted: false,
            status: productStatusEnum.PUBLISH
          })
            .sort({ createdAt: -1 })
            .select('name price media.featuredImage slug discount currencySymbol totalReviews')
            .limit(18)
            .exec(cb);
        },
        leftNewProducts: (cb) => {
          Product.find({
            isDeleted: false,
            discount: 0,
            status: productStatusEnum.PUBLISH
          })
            .select('name price media.featuredImage slug discount currencySymbol totalReviews')
            .limit(9)
            .exec(cb);
        },
        rightFeatureProducts: (cb) => {
          Product.find({
            isDeleted: false,
            discount: 0,
            status: productStatusEnum.PUBLISH
          })
            .select('name price media.featuredImage slug discount currencySymbol totalReviews')
            .limit(9)
            .exec(cb);
        }
      })
      .then((result) => res.json(Response.success(result)));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.route('/products/prepare').get(async (req, res, next) => {
  try {
    return async
      .parallel({
        currencyUnits: (cb) => {
          const currencies = Object.entries(currencyEnum).map(([key, value]) => ({
            id: key,
            name: value
          }));
          cb(null, currencies);
        },
        stockStatus: (cb) => {
          const status = Object.entries(StockStatus).map(([key, value]) => ({
            id: key,
            name: value
          }));
          cb(null, status);
        },
        stockCountries: (cb) => {
          const countries = Object.entries(StockCountry).map(([key, value]) => ({
            id: key,
            name: value
          }));
          cb(null, countries);
        },
        brands: (cb) => {
          Brand.find().sort({ name: 1 }).select('name').exec(cb);
        },
        firstCategories: (cb) => {
          Category.find({ parents: { $exists: false }, isDeleted: false })
            .populate('childs')
            .select('name')
            .exec(cb);
        }
      })
      .then((result) => {
        const { currencyUnits, stockStatus, stockCountries, brands, firstCategories } = result;

        return res.json(
          Response.success({
            currencyUnits,
            stockStatus,
            stockCountries,
            brands,
            firstCategories
          })
        );
      });
  } catch (err) {
    return next(err);
  }
});

router.get('/products/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({
      slug,
      status: productStatusEnum.PUBLISH
    })
      .populate({
        path: 'reviews',
        select: '-vendor -product',
        populate: {
          path: 'reviewer',
          select: 'profile.fullName profile.avatar profile.email username phone'
        }
      })
      .populate('category brand')
      .populate({
        path: 'vendor',
        select: 'owner brandName followers responseRate ratingOverall avatar',
        populate: { path: 'ownerRef', select: 'username' }
      });
    if (!product) return res.json(Response.notFound());

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
});

router.get('/vendors/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const getUser = await Account.findOne({ username });
    if (!getUser) return res.json(Response.notFound('UserNotFound'));

    const getVendorDetail = await Vendor.findOne({
      owner: getUser._id,
      active: true
    })
      .populate('totalProducts')
      .exec();

    if (!getVendorDetail) return res.json(Response.notFound('VendorNotFound'));

    const { page, limit, orderBy, minPrice, maxPrice, variant } = req.query;

    let filterQuery = { isDeleted: false, vendor: getVendorDetail._id };
    let sortQuery = {};
    const paginateOptions = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12
    };

    if (orderBy && orderBy === 'descPrice') {
      sortQuery = {
        ...sortQuery,
        $sort: { currentPrice: -1 }
      };
    }

    if (orderBy && orderBy === 'ascPrice') {
      sortQuery = {
        ...sortQuery,
        $sort: { currentPrice: 1 }
      };
    }

    if (minPrice !== null && maxPrice != null) {
      filterQuery = {
        ...filterQuery,
        currentPrice: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) }
      };
    }

    if (variant) {
      filterQuery = {
        ...filterQuery,
        'variants.name': { $eq: variant }
      };
    }

    const searhAggregation = [
      {
        $addFields: {
          currentPrice: {
            $multiply: ['$price', { $subtract: [1, '$discount'] }]
          }
        }
      },
      {
        $match: filterQuery
      }
    ];

    if (Object.keys(sortQuery).length > 0) {
      searhAggregation.push(sortQuery);
    }

    const myAggreate = Product.aggregate(searhAggregation);

    const products = await Product.aggregatePaginate(myAggreate, paginateOptions);

    const newProducts = await Product.find({
      isDeleted: false,
      vendor: getVendorDetail._id
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    return res.json(
      Response.success({
        vendorProfile: getVendorDetail,
        products,
        newProducts
      })
    );
  } catch (err) {
    console.error(err);
  }
});

router.get('/categories', async (req, res, next) => {
  try {
    const megaCategory = await Category.aggregate([
      {
        $match: {
          parents: { $exists: false },
          isDeleted: false
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'parents.firstLevel',
          as: 'childrens',
          pipeline: [
            {
              $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: 'parents.firstLevel',
                as: 'childs',
                pipeline: [
                  {
                    $unset: [
                      'media',
                      'createdAt',
                      'updatedAt',
                      'featuredImage',
                      'parents',
                      'isDeleted'
                    ]
                  }
                ]
              }
            },
            {
              $unset: ['media', 'createdAt', 'updatedAt', 'featuredImage', 'parents', 'isDeleted']
            }
          ]
        }
      },
      {
        $unset: ['media', 'createdAt', 'parent', 'updatedAt', 'featuredImage', 'isDeleted']
      },
      {
        $sort: { name: 1 }
      }
    ]);

    res.json(Response.success(megaCategory));
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

router.get('/categories/featured', async (req, res, next) => {
  try {
    const categories = await Category.find({
      parents: { $exists: false },
      isDeleted: false,
      featuredImage: {
        $ne: 'https://via.placeholder.com/300x300.jpg?text=mubaha.com'
      }
    })
      .sort({ name: 1 })
      .select('-media -createdAt -parent -updatedAt -isDeleted');

    return res.json(Response.success(categories));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.get('/colors', async (req, res, next) => {
  try {
    const colors = Object.values(Colors);

    return res.json(Response.success(colors));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.get('/categories/first', categoryController.getCategories);

router.get('/categories/:id', categoryController.getCategoriesbyID);

router.get('/brands', async (req, res, next) => {
  try {
    console.log("giang /brand");
    const brands = await Brand.find().sort({ name: 1 }).select('name');

    if (!brands) return res.json(Response.notFound());

    return res.json(Response.success(brands));
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post('/create-brand', async (req, res, next) => {
  try {
    const { name } = req.body;

    console.log(req.body);

    console.log(name);

    const createBrand = await Brand.create({
      name
    });

    if (!createBrand) return res.json(Response.badRequest());

    const brands = await Brand.find().sort({ name: 1 }).select('name');

    res.json(Response.success(brands));
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post('/product/s3-url', productController.getResignedUrl);

router.get('/categories/:slug/products', categoryController.getProductsbyCate);
router.get('/categories/:slug/filters', categoryController.getFilterOptionsByCategory);

export default router;
