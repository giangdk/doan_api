import async from 'async';
import Response from '../utils/response.js';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';

const homepageController = {
  homepage: async (req, res, next) => {
    try {
      console.log("giang");
      return async
        .parallel({
          dealsOfTheDay: (cb) => {
            Product.find({}).sort({ createdAt: -1 }).limit(10).exec(cb);
            // Product.find({ /*discount: { $gt: 0.1 }, */isDeleted: false })
            //   .sort({ createdAt: -1 })
            //   .select('name price media.featuredImage slug discount currencySymbol totalReviews')
            //   .limit(20)
            //   .exec(cb);

          },
          top5Products: (cb) => {
            Product.find({ discount: { $gt: 0.3 }, isDeleted: false })
              .sort({ createdAt: -1 })
              .select('name price media.featuredImage slug discount currencySymbol totalReviews')
              .limit(5)
              .exec(cb);
          },
          firstNewProducts: (cb) => {
            Product.find({ isDeleted: false })
              .sort({ createdAt: -1 })
              .select('name price media.featuredImage slug discount currencySymbol totalReviews')
              .limit(6)
              .exec(cb);
          },
          dontMissTheseProducts: (cb) => {
            Product.find({ discount: 0, isDeleted: false })
              .sort({ createdAt: -1 })
              .select('name price media.featuredImage slug discount currencySymbol totalReviews')
              .limit(18)
              .exec(cb);
          },
          leftNewProducts: (cb) => {
            Product.find({ isDeleted: false, discount: 0 })
              .select('name price media.featuredImage slug discount currencySymbol totalReviews')
              .limit(9)
              .exec(cb);
          },
          rightFeatureProducts: (cb) => {
            Product.find({ isDeleted: false, discount: 0 })
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
  },

  appIndex: async (req, res, next) => {
    try {
      console.log("giang");
      return async
        .parallel({
          dealsOfTheDay: (cb) => {
            // Product.
            //   Product.find({ /*discount: { $gt: 0.1 },*/ isDeleted: false })
            //   .sort({ createdAt: -1 })
            //   .select('name price media.featuredImage slug discount currencySymbol totalReviews')
            //   .limit(6)
            //   .exec(cb);
            Product.find({}).sort({ createdAt: -1 }).limit(10).exec(cb);
            console.log("giang", Product.find({}).sort({ createdAt: -1 }).limit(10).exec(cb));
          },
          flashSales: (cb) => {
            Product.find({ discount: { $gt: 0.4 }, isDeleted: false })
              .sort({ createdAt: -1 })
              .select('name price media.featuredImage slug discount currencySymbol totalReviews')
              .limit(6)
              .exec(cb);
          },
          stylesOfMe: (cb) => {
            Product.find({ isDeleted: false })./*skip(12).*/limit(6).exec(cb);
          },
          productsByCat: (cb) => {
            Product.find({ isDeleted: false })./*skip(18).*/limit(18).exec(cb);
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
        .then((result) => res.json(Response.success(result)));
    } catch (err) {
      console.error(err);
      return next(err);
    }
  }
};

export { homepageController };
