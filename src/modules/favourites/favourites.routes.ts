import { Router } from 'express';
import {
  getFavourites,
  addFavourite,
  removeFavourite,
} from './favourites.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';

const router = Router();

// Protect all favourite endpoints with JWT authentication
router.use(authenticateJWT);

router.get('/', getFavourites);
router.post('/', addFavourite);
router.delete('/:productId', removeFavourite);

export default router;