import libphone from 'google-libphonenumber';
import { Router } from 'express';
import Address from '../models/address.model.js';
import Response from '../utils/response.js';
import { postAddressRules } from '../validations/address.validator.js';
import { validate } from '../middlewares/validate.js';

const router = Router();
const { PhoneNumberFormat, PhoneNumberUtil } = libphone;
const phoneUtil = PhoneNumberUtil.getInstance();
router
  .route('/')
  .get(async (req, res, next) => {
    try {
      const findAddres = await Address.find({
        owner: req.user._id,
        isDeleted: false
      }).sort({ isDefault: -1, createdAt: -1 });

      if (!findAddres) return res.json(Response.notFound(req.t('not.found.address')));
      return res.json(Response.success(findAddres));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  })
  .post(postAddressRules(), validate, async (req, res, next) => {
    try {
      const {
        fullName,
        phone,
        provinceCode,
        districtCode,
        wardCode,
        detailAddress,
        fullAddress,
        isDefault
      } = req.body;

      const number = phoneUtil.parse(phone, 'VN');
      if (!phoneUtil.isValidNumber(number))
        return res.json(Response.badRequest(req.t('invalid.phone.number')));
      const phoneNumber = phoneUtil.format(number, PhoneNumberFormat.E164);

      const add = await Address.create({
        owner: req.user._id,
        phone: phoneNumber,
        fullName,
        fullAddress,
        codes: {
          province: provinceCode,
          district: districtCode,
          ward: wardCode
        },
        details: detailAddress,
        isDefault
      });
      if (isDefault) {
        await Address.updateOne(
          { _id: { $ne: add._id }, isDefault: true, owner: req.user._id },
          { $set: { isDefault: false } }
        );
      }

      return res.json(Response.success(add));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  });
router
  .route('/:id')
  .put(async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        fullName,
        phone,
        provinceCode,
        districtCode,
        wardCode,
        detailAddress,
        fullAddress,
        isDefault
      } = req.body;

      let updateQuery = {};
      if (fullName != null) {
        updateQuery = {
          ...updateQuery,
          fullName
        };
      }

      if (phone != null) {
        const number = phoneUtil.parse(phone, 'VN');
        if (!phoneUtil.isValidNumber(number))
          return res.json(Response.badRequest(req.t('invalid.phone.number')));

        const phoneNumber = phoneUtil.format(number, PhoneNumberFormat.E164);

        updateQuery = {
          ...updateQuery,
          phone: phoneNumber
        };
      }
      if (provinceCode != null) {
        updateQuery = {
          ...updateQuery,
          'codes.province': provinceCode
        };
      }
      if (districtCode != null) {
        updateQuery = {
          ...updateQuery,
          'codes.district': districtCode
        };
      }
      if (wardCode != null) {
        updateQuery = {
          ...updateQuery,
          'codes.ward': wardCode
        };
      }
      if (detailAddress != null) {
        updateQuery = {
          ...updateQuery,
          detailAddress
        };
      }
      if (fullAddress != null) {
        updateQuery = {
          ...updateQuery,
          fullAddress
        };
      }
      if (isDefault != null) {
        updateQuery = {
          ...updateQuery,
          isDefault
        };
      }

      const updated = await Address.findOneAndUpdate(
        { _id: id },
        {
          $set: updateQuery
        },
        {
          new: true
        }
      );
      if (!updated) return res.json(Response.notFound());
      console.log('updated', updated);

      if (updated.isDefault) {
        await Address.updateMany(
          {
            _id: { $ne: updated._id },
            owner: req.user._id,
            isDefault: true
          },
          { $set: { isDefault: false } }
        );
      }

      return res.json(Response.success(updated));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  })
  .delete(async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleteAddress = await Address.updateOne({ _id: id }, { $set: { isDeleted: true } });
      if (!deleteAddress) return res.json(Response.badRequest());
      return res.json(Response.success(req.t('add.delete.success')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  });
router.route('/default/:id').put(async (req, res, next) => {
  const { id } = req.params;
  const isDefaultExist = await Address.findOne({
    isDefault: true,
    owner: req.user._id
  });
  if (isDefaultExist) {
    isDefaultExist.isDefault = false;
    await isDefaultExist.save();
  }
  const updateDefault = await Address.findByIdAndUpdate(
    id,
    {
      $set: {
        isDefault: true
      }
    },
    { new: true }
  );
  return res.json(Response.success(updateDefault));
});

export default router;
