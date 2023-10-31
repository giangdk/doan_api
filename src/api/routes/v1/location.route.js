import { Router } from 'express';

import location from '../../controllers/location.controller.js';

const router = Router();

router.route('/provinces').get(location.getProvinces);

router.route('/provinces/:id/districts').get(location.getDistrictsByProvince);

router.route('/districts/:id/wards').get(location.getWardsByDistrict);

router.route('/provinces-vendor').get(location.getProvincesbyVendor);

export default router;
