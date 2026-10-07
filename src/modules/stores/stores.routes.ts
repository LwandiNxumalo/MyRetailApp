import { Router } from 'express';
import { getStores, getStoreById, getRetailers } from './stores.controller.js';

const router = Router();

router.get('/retailers', getRetailers);
router.get('/', getStores);
router.get('/:id', getStoreById);

export default router;