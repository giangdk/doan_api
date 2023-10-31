import mongoose from 'mongoose';
import subVn from 'sub-vn';
import async from 'async';
import Response from '../utils/response.js';
import Vendor from '../models/vendor.model.js';
import productSortEnum from '../enums/productSort.enum.js';
import productStatusEnum from '../enums/productStatus.enum.js';
import sortOrderTypeEnum from '../enums/sortOrderType.enum.js';
import Product from '../models/product.model.js';

export default {
  getProvinces: (req, res, next) => {
    const result = subVn.getProvinces();
    return res.json(Response.success(result));
  },

  getDistrictsByProvince: (req, res, next) => {
    const { id } = req.params;
    const result = subVn.getDistrictsByProvinceCode(id);
    return res.json(Response.success(result));
  },

  getWardsByDistrict: (req, res, next) => {
    const { id } = req.params;
    const result = subVn.getWardsByDistrictCode(id);
    return res.json(Response.success(result));
  },

  getProvincesbyVendor: async (req, res, next) => {
    try {
      let provinces = await Vendor.find({ 'address.codes.province': { $exists: true } }).select(
        'address.codes.province'
      );
      const result = subVn.getProvinces();
      provinces = result.filter((address) =>
        provinces.some((e) => e.address.codes.province === address.code)
      );
      return res.json(Response.success(provinces));
    } catch (err) {
      console.error(err);
      return next(err);
    }
  },
  getProductsbyLocation: async (req, res, next) => {
    try {
      const { location } = req.params;

      const { limit, page, rating, minPrice, maxPrice, brands, order, sortBy, cat } = req.query;

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

      const _locations = location.split(',');
      let filterQuery = {
        'stock.quantity': { $gt: 0 },
        isDeleted: false,
        status: productStatusEnum.PUBLISH,
        'stock.country': { $in: _locations }
      };

      if (rating) {
        filterQuery = {
          ...filterQuery,
          avgRating: { $gte: parseInt(rating) }
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

      if (brands) {
        const brandIds = brands.split(',').map((x) => mongoose.Types.ObjectId(x));
        filterQuery = {
          ...filterQuery,
          brand: { $in: brandIds }
        };
      }

      if (minPrice && maxPrice) {
        filterQuery = {
          ...filterQuery,
          discountedPrice: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) }
        };
      }

      const products = await Product.paginate(filterQuery, options);
      return res.json(Response.success(products));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  },
  getFilterOptionsByLocation: async (req, res, next) => {
    try {
      const { location } = req.params;
      const _locations = location.split(',');

      const filterQuery = {
        'stock.quantity': { $gt: 0 },
        isDeleted: false,
        status: productStatusEnum.PUBLISH,
        'stock.country': { $in: _locations }
      };

      return async
        .parallel({
          stockCountries: (cb) => {
            Product.aggregate([
              {
                $match: filterQuery
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
  }
};
