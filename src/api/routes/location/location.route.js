import { Router } from 'express';
import async from 'async';
import subVn from 'sub-vn';
import location from '../../controllers/location.controller.js';
import Response from '../../utils/response.js';

const router = Router();

router.route('/provinces').get(location.getProvinces);

router.route('/provinces/:id/districts').get(location.getDistrictsByProvince);

router.route('/districts/:id/wards').get(location.getWardsByDistrict);
router.route('/address').get(async (req, res, next) => {
  const { p, d } = req.query;
  const rs = await async.parallel({
    provinces: (cb) => {
      const p = subVn.getProvinces();
      cb(null, p);
    },
    districts: (cb) => {
      const d = subVn.getDistrictsByProvinceCode(p);
      cb(null, d);
    },
    wards: (cb) => {
      const w = subVn.getWardsByDistrictCode(d);
      cb(null, w);
    }
  });
  return res.json(Response.success(rs));
});

router.route('/:location').get(location.getProductsbyLocation);

router.route('/:location/filters').get(location.getFilterOptionsByLocation);

export default router;
