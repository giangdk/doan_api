import mongoose from 'mongoose';
import async from 'async';
import productSortEnum from '../enums/productSort.enum.js';
import productStatusEnum from '../enums/productStatus.enum.js';
import sortOrderTypeEnum from '../enums/sortOrderType.enum.js';
import Category from '../models/category.model.js';
import Product from '../models/product.model.js';
import Response from '../utils/response.js';

export default {
  getFeaturedCategories: async (req, res, next) => {
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
  },

  getCategories: async (req, res, next) => {
    try {
      const listCate = await Category.find({
        parents: { $exists: false },
        isDeleted: false
      })
        .populate('childs')
        .select('name');
      return res.json(Response.success(listCate));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  },
  getCategoriesbyID: async (req, res, next) => {
    try {
      const cateID = req.params.id;
      if (!cateID || cateID === 'null') return res.json(Response.notFound());

      const listCate = await Category.find({
        'parents.firstLevel': cateID,
        isDeleted: false
      })
        .populate('childs')
        .select('name');
      return res.json(Response.success(listCate));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  },

  getMegaCategoty: async (req, res, next) => {
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

      return res.json(Response.success(megaCategory));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  },

  getProductsbyCate: async (req, res, next) => {
    try {
      const { id, slug } = req.params;

      if (id && !mongoose.isValidObjectId(id)) {
        return res.json(Response.notFound(req.t('invalid.category')));
      }

      const category = await Category.findOne({
        $or: [{ _id: id }, { slug }]
      })
        .populate('childCategories')
        .populate('parents.firstLevel')
        .populate('parents.secondLevel');
      if (!category) return res.json(Response.notFound(req.t('invalid.category')));

      const { limit, page, rating, minPrice, maxPrice, location, brands, order, sortBy } =
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
        status: productStatusEnum.PUBLISH,
        $or: [
          { category: category._id },
          { 'parentCategories.firstLevel': category._id },
          { 'parentCategories.secondLevel': category._id }
        ]
      };

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

      const products = await Product.paginate(filterQuery, options);
      return res.json(Response.success({ category, products }));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  },

  getFilterOptionsByCategory: async (req, res, next) => {
    try {
      const { id, slug } = req.params;
      if (id && !mongoose.isValidObjectId(id)) {
        return res.json(Response.notFound(req.t('invalid.category')));
      }

      const category = await Category.findOne({
        $or: [{ _id: id }, { slug }]
      });
      if (!category) return res.json(Response.notFound(req.t('invalid.category')));

      const filterQuery = {
        'stock.quantity': { $gt: 0 },
        isDeleted: false,
        status: productStatusEnum.PUBLISH,
        $or: [
          { category: category._id },
          { 'parentCategories.firstLevel': category._id },
          { 'parentCategories.secondLevel': category._id }
        ]
      };

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

  createCatgory: async (req, res, next) => {
    try {
      const { name, firstLevel, secondLevel, featuredImage, description } = req.body;

      // const chosenCatgory = secondLevel || firstLevel;

      let createQuery = {
        name,
        description
      };
      if (featuredImage != null) {
        createQuery = {
          ...createQuery,
          featuredImage
        };
      }
      console.log(createQuery)
      const create = await Category.create(createQuery);
      return res.json(Response.success(create, req.t('category.created')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  },
  updateCategory: async (req, res, next) => {
    try {
      const { name, firstLevel, secondLevel, featuredImage, description } = req.body;
      const { id } = req.params;
      const isExistCategory = await Category.exists({ _id: id });
      if (!isExistCategory) return res.json(Response.badRequest(req.t('invalid.category')));

      const chosenCatgory = secondLevel || firstLevel;

      let updateQuery = {
        name,
        description
      };

      if (chosenCatgory != null) {
        const category = await Category.findById(chosenCatgory);
        updateQuery = {
          ...updateQuery,
          parents: {
            firstLevel: category._id,
            secondLevel: category.parents?.firstLevel
          }
        };
      }

      if (featuredImage != null) {
        updateQuery = {
          ...updateQuery,
          featuredImage
        };
      }

      await Category.findByIdAndUpdate({ _id: id }, { $set: updateQuery }, { new: true });
      return res.json(Response.success(req.t('category.updated')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  },
  // eslint-disable-next-line consistent-return
  deleteCategory: async (req, res, next) => {
    try {
      const { id } = req.params;

      const isExistCategory = await Category.exists({
        _id: id,
        isDeleted: false
      });
      if (!isExistCategory) return res.json(Response.badRequest(req.t('invalid.category')));

      const results = await async.parallel({
        deleteCategory: (cb) => {
          Category.findByIdAndUpdate(id, { $set: { isDeleted: true } }, { new: true }).exec(cb);
        },
        products: (cb) => {
          Product.find({
            $or: [
              { category: id },
              { 'parentCategories.firstLevel': id },
              { 'parentCategories.secondLevel': id }
            ]
          })
            .select('_id')
            .exec(cb);
        }
      });
      const productList = results.products.map((product) => product._id);

      const updateProduct = await Product.updateMany(
        { _id: { $in: productList } },
        { $set: { isDeleted: true } },
        { new: true }
      );

      if (updateProduct) return res.json(Response.success(req.t('category.deleted')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  }
};
