import { Router } from 'express';
import { getCatalogues, getCatalogueById } from './catalogues.controller.js';

const router = Router();

router.get('/', getCatalogues);
router.get('/:id', getCatalogueById);

export default router;