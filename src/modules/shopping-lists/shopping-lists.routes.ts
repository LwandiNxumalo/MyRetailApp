import { Router } from 'express';
import {
  getShoppingLists,
  createShoppingList,
  addItemToList,
  removeItemFromList,
  compareBasketTotals,
} from './shopping-lists.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';

const router = Router();

// Protect all shopping list routes with JWT authentication
router.use(authenticateJWT);

router.get('/', getShoppingLists);
router.post('/', createShoppingList);
router.post('/:listId/items', addItemToList);
router.delete('/:listId/items/:productId', removeItemFromList);
router.get('/:listId/compare', compareBasketTotals);

export default router;