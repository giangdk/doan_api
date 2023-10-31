import { Router } from 'express';
import CustomPage from '../../models/customPage.model.js';
import Response from '../../utils/response.js';

const router = Router();
router
  .route('/')
  .get(async (req, res, next) => {
    try {
      const findCustomPage = await CustomPage.find({}).sort({ createdAt: -1 });
      if (!findCustomPage) return res.json(Response.notFound(req.t('page.notFound')));
      return res.json(Response.success(findCustomPage));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  })
  .post(async (req, res, next) => {
    try {
      const { name, title, description, shortDescription, status, slug } = req.body;

      await CustomPage.create({
        name,
        title,
        description,
        shortDescription,
        status,
        slug
      });
      return res.json(Response.success(null, 'Tạo trang thành công'));
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
      const { name, title, description, shortDescription, status, slug } = req.body;

      let query = {};
      if (name) {
        query = {
          ...query,
          name
        };
      }

      if (slug) {
        const link = `/${slug}`;
        query = {
          ...query,
          link,
          slug
        };
      }

      if (title) {
        query = {
          ...query,
          title
        };
      }

      if (description) {
        query = {
          ...query,
          title
        };
      }

      if (shortDescription) {
        query = {
          ...query,
          shortDescription
        };
      }

      if (status) {
        query = {
          ...query,
          status
        };
      }

      const update = await CustomPage.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            query
          }
        },
        {
          new: true
        }
      );
      return res.json(Response.success(update));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  })
  .delete(async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleteCustom = await CustomPage.updateOne({ _id: id }, { $set: { isDeleted: true } });
      if (!deleteCustom) return res.json(Response.badRequest());
      return res.json(Response.success(req.t('page.delete.success')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  });

router.route('/:slug').get(async (req, res, next) => {
  try {
    const { slug } = req.params;
    const customPage = await CustomPage.findOne({ slug });
    if (!customPage) return res.json(Response.notFound(req.t('page.notFound')));
    return res.json(Response.success(customPage));
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

export default router;
