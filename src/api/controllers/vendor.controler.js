import async from 'async';
import libphone from 'google-libphonenumber';
import Response from '../utils/response.js';
import Vendor from '../models/vendor.model.js';
import Account from '../models/account.model.js';
import Address from '../models/address.model.js';
import accountTypeEnum from '../enums/accountType.enum.js';
import Media from '../models/media.model.js';
import mediaTypeEnum from '../enums/mediaType.enum.js';
import Product from '../models/product.model.js';
import LiveStream from '../models/livestream.model.js';
import Brand from '../models/brand.model.js';
const { PhoneNumberFormat, PhoneNumberUtil } = libphone;

const phoneUtil = PhoneNumberUtil.getInstance();
export default {
  applyVendor: async (req, res, next) => {
    try {
      const {
        brandName,
        phone,
        fullName,
        fullAddress,
        provinceCode,
        districtCode,
        wardCode,
        detailAddress
      } = req.body;

      const number = phoneUtil.parse(phone, 'VN');
      if (!phoneUtil.isValidNumber(number))
        return res.json(Response.badRequest(req.t('invalid.phone.number')));

      const phoneNumber = phoneUtil.format(number, PhoneNumberFormat.E164);

      const createAdd = new Address({
        fullAddress,
        phone: phoneNumber,
        fullName,
        codes: {
          province: provinceCode,
          district: districtCode,
          ward: wardCode
        },
        details: detailAddress
      });

      if (!createAdd) return res.json(Response.badRequest(req.t('create.vendor.error')));

      const { createVendor, updateAccount } = await async.parallel({
        createVendor: (cb) => {
          Vendor.create({
            owner: req.user._id,
            address: createAdd,
            brandName
          }).then((rs) => cb(null, rs));
        },
        updateAccount: (cb) => {
          Account.findOneAndUpdate(
            { _id: req.user._id },
            { $set: { type: accountTypeEnum.VENDOR } }
          ).exec(cb);
        }
      });

      if (!createVendor && !updateAccount)
        return res.json(Response.badRequest(req.t('create.vendor.error')));

      return res.json(Response.success(req.t('create.vendor.success')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  },

  getProfile: async (req, res, next) => {
    const id = req.user._id;
    const getProfile = await Vendor.findOne({ owner: id }).populate('owner');

    return res.json(Response.success(getProfile));
  },
  getListLiveStream: async (req, res, next) => {
    try {
      // const {
      //   key
      // } = req.body;
      // return res.json(Response.success(null, req.t('livestream.created')));

      var listVendor = []
      console.log("giang2")
      var livestreams = await LiveStream.find({ isExpired: false })
        .populate('vendor');
      console.log("giang3")
      console.log("giang liveStream" + livestreams)
      for (var i in livestreams) {
        // var vendor = await Vendor.find({ _id: i.vendor.id });
        console.log("giang " + i)
        // listVendor = [...listVendor, vendor]
      }
      console.log("giang4")

      return res.json(
        Response.success({
          livestreams: livestreams,
        })
      );
      // });
    } catch (err) {
      console.error(err);
      return next(err);
    }
  },
  createLiveStream: async (req, res, next) => {
    try {
      const {
        key,

      } = req.body;
      const id = req.user._id;
      console.log("giang user" + id)
      const getProfile = await Vendor.findOne({ owner: id });
      console.log("giang createLiveStream" + getProfile)
      if (getProfile == null) {
        return res.json(Response.error("không tìm thấy vendor"));
      }
      await LiveStream.create({
        imageUrl: getProfile.avatar || getProfile.gallery[0].path || "giang.com",
        key: key,
        vendor: getProfile._id,
        isExpired: false
      });
      return res.json(Response.success(null, req.t('livestream.created')));

    } catch (err) {
      console.error(err);
      return next(err);
    }
  },
  getBrand: async (req, res, next) => {
    try {
      console.log("giang /brand");
      const brands = await Brand.find().sort({ name: 1 }).select('name');
      console.log("giang " + brands);
      if (!brands) return res.json(Response.notFound());

      return res.json(Response.success({ brands: brands }));

    } catch (error) {
      console.error(error);
      return next(error);
    }
  },
  updateLiveStream: async (req, res, next) => {
    try {
      const {
        key,
        isExpired
      } = req.body;
      let updateQuery = {};
      if (key) {
        updateQuery = {
          ...updateQuery,
          key
        };
      }
      if (isExpired) {
        updateQuery = {
          ...updateQuery,
          isExpired: isExpired
        };
      }
      const update = await LiveStream.findOneAndUpdate(
        { key: key },
        {
          $set: {
            isExpired: isExpired
          }
        },
        { new: true }
      );
      console.log("giang2 " + update + "\n" + key + " " + isExpired)
      if (!update) return res.json(Response.badRequest(req.t('livestream.error')));

      return res.json(Response.success(req.t('livestream.update.successfully')));

    } catch (err) {
      console.error(err);
      return next(err);
    }
  },
  endLiveStream: async (req, res, next) => {
    try {
      const {

      } = req.body;
      const id = req.user._id;
      console.log("giang user" + id)
      const getProfile = await Vendor.findOne({ owner: id });
      console.log("giang Vendor Model" + getProfile)
      if (getProfile == null) {
        return res.json(Response.error("không tìm thấy vendor"));
      }
      while (1) {
        var update = await LiveStream.findOneAndUpdate(
          { vendor: getProfile._id, isExpired: false },
          {
            $set: {
              isExpired: true
            }
          },
          { new: true }
        );
        if (!update) break;
      }




      return res.json(Response.success(req.t('livestream.end.successfully')));

    } catch (err) {
      console.error(err);
      return next(err);
    }
  },
  updateProfile: async (req, res, next) => {
    const { brandName, description, images } = req.body;
    let updateQuery = {};
    if (brandName) {
      updateQuery = {
        ...updateQuery,
        brandName
      };
    }
    if (description) {
      updateQuery = {
        ...updateQuery,
        description
      };
    }
    if (images && images.length > 0) {
      const insertGallery = [];
      images.forEach((image) => {
        const img = new Media({
          path: image.path,
          type: mediaTypeEnum.IMAGE
        });
        insertGallery.push(img);
      });
      updateQuery = {
        ...updateQuery,
        gallery: insertGallery
      };
    }

    const update = await Vendor.findOneAndUpdate(
      { owner: req.user._id },
      { $set: updateQuery },
      { new: true }
    );

    if (!update) return res.json(Response.badRequest(req.t('update.error')));

    return res.json(Response.success(req.t('update.successfully')));
  },

  getProductListVendor: async (req, res, next) => {
    try {
      const { username } = req.params;
      const getUser = await Account.findOne({ username }).exec();

      const getVendorDetail = await Vendor.findOne({
        owner: getUser._id,
        active: true
      }).populate('totalProducts').exec();
      const { page, limit, orderBy, minPrice, maxPrice, variant, sizes } = req.query;

      const qMinPrice = parseInt(minPrice) || 0;
      const qMaxPrice = parseInt(maxPrice) || 1000000000;

      let filterQuery = { isDeleted: false, vendor: getVendorDetail._id };
      const paginateOptions = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 12
      };
      // if(sizes){
      //   let sizeList = sizes.split(',');
      //   // console.log(sizeList)
      //   sizeList = sizeList.map((x) => x);

      //   filterQuery = ({
      //     ...filterQuery,
      //     'variants.sizes.name': { $in: sizeList },
      //   });
      // }

      if (orderBy && orderBy === 'descPrice') {
        filterQuery = {
          ...filterQuery,
          sort: {
            price: -1
          }
        };
      }

      if (orderBy && orderBy == 'ascPrice') {
        filterQuery = {
          ...filterQuery,
          sort: {
            price: 1
          }
        };
      }

      if (orderBy && orderBy == 'ascPrice') {
        filterQuery = {
          ...filterQuery,
          sort: {
            price: 1
          }
        };
      }

      if (orderBy && orderBy == 0) {
        filterQuery = {
          ...filterQuery,
          sort: {
            createdAt: -1
          }
        };
      }

      if (qMinPrice !== null && qMaxPrice != null) {
        filterQuery = {
          ...filterQuery,
          price: { $gte: qMinPrice, $lte: qMaxPrice }
        };
      }

      // if (variant) {
      //   filterQuery = {
      //     ...filterQuery,
      //     variants: {$elemMatch: {name: variant}},
      //   };
      // }

      // if (sizes) {
      //   filterQuery = {
      //     ...filterQuery,
      //     "variants.sizes.name": sizes,
      //   };
      // }

      const products = await Product.paginate(filterQuery, paginateOptions);
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
  },

  searchByText: async (req, res, next) => {
    try {
      const { t, limit, page } = req.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sort: { brandName: 1 },
        populate: [
          {
            path: 'owner',
            select: 'username profile.avatar'
          }
        ]
      };

      let filterQuery = {};
      if (t && t.length > 0) {
        filterQuery = {
          ...filterQuery,
          $text: { $search: t }
        };
      }

      const vendors = await Vendor.paginate(filterQuery, options);
      return res.json(Response.success(vendors));
    } catch (err) {
      console.error(err);
      return next(err);
    }
  }
};
