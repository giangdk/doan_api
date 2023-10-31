import { Router } from 'express';

import review from '../controllers/review.controller.js';
import { authorize } from '../middlewares/auth.js';

const router = Router();

router.route('/').post(review.createReview);

router.route('/s3-url/').post(authorize(), review.getResignedUrl);

export default router;
