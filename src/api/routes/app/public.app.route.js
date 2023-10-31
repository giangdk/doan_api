import async from 'async';

import { Router } from 'express';
import Response from '../../utils/response.js';
import Product from '../../models/product.model.js';
import Category from '../../models/category.model.js';
import Vendor from '../../models/vendor.model.js';
import Brand from '../../models/brand.model.js';

import categoryTypeEnum from '../../enums/categoryType.enum.js';
import productStatusEnum from '../../enums/productStatus.enum.js';
import categoryController from '../../controllers/category.controller.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {

    var products = await Product.find({}).sort({ createdAt: -1 });
    console.log("giang /app" + products);
    return async
      .parallel({
        brands: (cb) => {
          Brand.find({}).select('name media.featuredImage').exec(cb);
        },
        dealsOfTheDay: (cb) => {
          Product.find({}).sort({ createdAt: -1 }).limit(10).exec(cb);
          // Product.find({
          //   discount: { $gt: 0.1 },
          //   isDeleted: false,
          //   status: productStatusEnum.PUBLISH
          // })
          //   .sort({ createdAt: -1 })
          //   .select('name price media.featuredImage slug discount currencySymbol totalReviews')
          //   .limit(5)
          //   .exec(cb);n
        },
        flashSales: (cb) => {
          Product.find({}).sort({ createdAt: -1 }).limit(10).exec(cb);
          // Product.find({
          //   discount: { $gt: 0.4 },
          //   isDeleted: false,
          //   status: productStatusEnum.PUBLISH
          // })
          //   .sort({ createdAt: -1 })
          //   .select('name price media.featuredImage slug discount currencySymbol totalReviews')
          //   .limit(6)
          //   .exec(cb);
        },
        stylesOfMe: (cb) => {
          Product.find({}).sort({ createdAt: -1 }).limit(10).exec(cb);
          // Product.find({ isDeleted: false, status: productStatusEnum.PUBLISH })
          //   .select('name price media.featuredImage slug discount currencySymbol totalReviews')
          //   .skip(12)
          //   .limit(6)
          //   .exec(cb);
        },
        productsByCat: (cb) => {
          Product.find({}).sort({ createdAt: -1 }).limit(10).exec(cb);
          // Product.find({ isDeleted: false, status: productStatusEnum.PUBLISH })
          //   .select('name price media.featuredImage slug discount currencySymbol totalReviews')
          //   .skip(18)
          //   .limit(18)
          //   .exec(cb);
        },
        categories: (cb) => {
          Category.find({
            parents: { $exists: false },
            isDeleted: false,

            // TODO
            featuredImage: {
              $ne: 'https://via.placeholder.com/300x300.jpg?text=mubaha.com'
            }
          })
            .sort({ name: 1 })
            .select('-media -createdAt -parent -updatedAt -isDeleted')
            .exec(cb);
        }
      })
      .then(async (result) => {
        const { brands, categories, productsByCat, stylesOfMe, flashSales, dealsOfTheDay } = result;
        const product = await Product.findOne({
          discount: { $gt: 0.1 },
          isDeleted: false,
          status: productStatusEnum.PUBLISH,
          variants: []
        }).select('name price media.featuredImage slug discount currencySymbol totalReviews');

        // dealsOfTheDay.splice(2, 0, product);

        res.json(
          Response.success({
            brands,
            flashSales,
            productsByCat,
            dealsOfTheDay,
            stylesOfMe,
            categories
          })
        );
      });
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({
      _id: id,
      status: productStatusEnum.PUBLISH,
      isDeleted: false
    })
      .populate('category vendor brand')
      .populate({
        path: 'reviews',
        select: '-vendor -product',
        populate: {
          path: 'reviewer',
          select: 'profile.fullName profile.avatar profile.email username phone'
        }
      });
    console.log("product+" + product)
    if (!product) return res.json(Response.notFound());

    const category = await Category.findById(product.category);
    console.log("category +" + category)
    if (!category) return res.json(Response.notFound());
    const relatedProducts = await Product.find({
      category: category._id
    }).limit(20);
    console.log("relatedProducts +" + relatedProducts)
    return res.json(
      Response.success({
        detailProduct: product,
        relatedProducts
      })
    );
  } catch (error) {
    console.log("error + " + error)
    console.error(error);
    return next(error);
  }
});

router.get('/products/:id/variants/:variantId', async (req, res, next) => {
  try {
    const { id, variantId } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.json(Response.notFound());
    const opt = product.variants.id(variantId);
    if (!opt) return res.json(Response.notFound());

    return res.json(Response.success(opt));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.get('/categories', async (req, res, next) => {
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
    console.log("/categories giang");
    return res.json(Response.success(categories));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.get('/vendors/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findOne({ _id: id, active: true });
    if (!vendor) return res.json(Response.notFound());

    return async
      .parallel({
        dealsOfTheDay: (cb) => {
          Product.find({ isDeleted: false, vendor: vendor._id })
            .exec(cb);
          // Product.find({ discount: { $gt: 0.1 }, isDeleted: false })
          //   .sort({ createdAt: -1 })
          //   .select('name price media.featuredImage slug discount currencySymbol totalReviews')
          //   .limit(6)
          //   .exec(cb);
        },
        flashSales: (cb) => {
          Product.find({ discount: { $gt: 0.4 }, isDeleted: false })
            .sort({ createdAt: -1 })
            .select('name price media.featuredImage slug discount currencySymbol totalReviews')
            .limit(6)
            .exec(cb);
        },
        suggestedForYou: (cb) => {
          Product.find({ isDeleted: false })
            .select('name price media.featuredImage slug discount currencySymbol totalReviews')
            .skip(12)
            .limit(8)
            .exec(cb);
        }
      })
      .then((result) => {
        const { dealsOfTheDay, flashSales, suggestedForYou } = result;
        return res.json(
          Response.success({
            vendor,
            dealsOfTheDay,
            flashSales,
            suggestedForYou
          })
        );
      });
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.get('/vendors/:id/products', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, limit, page } = req.query;
    console.log('check');

    const vendor = await Vendor.findOne({ _id: id, active: true });
    if (!vendor) return res.json(Response.notFound());

    const paginateOptions = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sort: { createdAt: -1 }
    };

    let filterQuery = { vendor: vendor._id, isDeleted: false };
    // TODO: logic for vendor's products list
    if (type === categoryTypeEnum.FEATURED_PRODUCTS) {
      filterQuery = {
        ...filterQuery,
        discount: { $gt: 0.1 }
      };
    } else if (type === categoryTypeEnum.FLASH_SALE) {
      // TODO: logic for vendor's products list
      filterQuery = {
        ...filterQuery,
        discount: { $gt: 0.4 }
      };
    } else {
      // TODO: logic for vendor's products list
      filterQuery = {
        ...filterQuery,
        discount: { $gt: 0.1 }
      };
    }

    const products = await Product.paginate(filterQuery, paginateOptions);
    return res.json(Response.success(products));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.get('/categories/:id/products', categoryController.getProductsbyCate);
router.get('/categories/:id/filters', categoryController.getFilterOptionsByCategory);

export default router;
