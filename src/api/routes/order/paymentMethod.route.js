import { Router } from 'express';
import PaymentMethod from '../../models/paymentMethod.model.js';
import Response from '../../utils/response.js';
import { validate } from '../../middlewares/validate.js';
import {
  createPaymentMethodRules,
  updatePaymentMethodRules,
  putPaymentMethodRules
} from '../../validations/paymentMethod.validator.js';

const router = Router();
router
  .route('/')
  .get(async (req, res, next) => {
    try {
      const paymentMethod = await PaymentMethod.find({
        owner: req.user._id,
        isDeleted: false
      })
        .sort({ createdAt: -1 })
        .select('-owner');
      if (!paymentMethod) return res.json(Response.notFound(req.t('paymentMethod.notFound')));
      return res.json(Response.success(paymentMethod));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  })
  .post(createPaymentMethodRules(), validate, async (req, res, next) => {
    try {
      const { cardNumber, cardName, expirationDate, cardCode, type, isDefault } = req.body;

      const add = await PaymentMethod.create({
        owner: req.user._id,
        cardNumber,
        cardName,
        expirationDate,
        cardCode,
        type,
        isDefault
      });
      if (isDefault) {
        await PaymentMethod.updateOne(
          { _id: { $ne: add._id }, isDefault: true, owner: req.user._id },
          { $set: { isDefault: false } }
        );
      }

      return res.json(Response.success(add, req.t('paymentMethod.create.success')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  });
router
  .route('/:id')
  .get(putPaymentMethodRules(), validate, async (req, res, next) => {
    try {
      const { id } = req.params;
      const paymentMethod = await PaymentMethod.findOne({
        owner: req.user._id,
        _id: id,
        isDeleted: false
      }).select('-owner');

      if (!paymentMethod) return res.json(Response.notFound(req.t('paymentMethod.notFound')));
      return res.json(Response.success(paymentMethod));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  })
  .put(updatePaymentMethodRules(), validate, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { cardNumber, cardName, expirationDate, cardCode, type, isDefault } = req.body;

      let updateQuery = {};
      if (cardNumber != null) {
        updateQuery = {
          ...updateQuery,
          cardNumber
        };
      }

      if (cardName != null) {
        updateQuery = {
          ...updateQuery,
          cardName
        };
      }
      if (expirationDate != null) {
        updateQuery = {
          ...updateQuery,
          expirationDate
        };
      }
      if (cardCode != null) {
        updateQuery = {
          ...updateQuery,
          cardCode
        };
      }
      if (type != null) {
        updateQuery = {
          ...updateQuery,
          type
        };
      }
      if (isDefault != null) {
        updateQuery = {
          ...updateQuery,
          isDefault
        };
      }

      const updated = await PaymentMethod.findOneAndUpdate(
        { _id: id },
        {
          $set: updateQuery
        },
        {
          new: true
        }
      );
      if (!updated) return res.json(Response.notFound());

      if (updated.isDefault) {
        await PaymentMethod.updateMany(
          {
            _id: { $ne: updated._id },
            owner: req.user._id,
            isDefault: true
          },
          { $set: { isDefault: false } }
        );
      }

      return res.json(Response.success(updated, req.t('paymentMethod.update.success')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  })
  .delete(putPaymentMethodRules(), validate, async (req, res, next) => {
    try {
      const { id } = req.params;

      const checkDeleted = await PaymentMethod.findOne({
        _id: id,
        owner: req.user._id,
        isDeleted: false
      });
      if (!checkDeleted) return res.json(Response.badRequest(req.t('paymentMethod.notFound')));

      const paymentDelete = await PaymentMethod.updateOne(
        { _id: id },
        { $set: { isDeleted: true } }
      );
      if (!paymentDelete) return res.json(Response.badRequest());
      return res.json(Response.success(null, req.t('paymentMethod.delete.success')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  });
router.route('/default/:id').put(putPaymentMethodRules(), validate, async (req, res, next) => {
  const { id } = req.params;
  const isDefaultExist = await PaymentMethod.findOne({
    isDefault: true,
    owner: req.user._id
  });
  if (isDefaultExist) {
    isDefaultExist.isDefault = false;
    await isDefaultExist.save();
  }
  const updateDefault = await PaymentMethod.findByIdAndUpdate(
    id,
    {
      $set: {
        isDefault: true
      }
    },
    { new: true }
  );
  return res.json(Response.success(updateDefault, req.t('paymentMethod.setDefault.success')));
});

export default router;
