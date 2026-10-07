import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import prisma from '../../utils/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// Define explicit Prisma include type for basket comparison payload
const shoppingListWithPricesQuery = Prisma.validator<Prisma.ShoppingListDefaultArgs>()({
  include: {
    items: {
      include: {
        product: {
          include: {
            prices: {
              include: {
                retailer: { select: { id: true, name: true, logoUrl: true } },
              },
            },
          },
        },
      },
    },
  },
});

type ShoppingListWithPrices = Prisma.ShoppingListGetPayload<typeof shoppingListWithPricesQuery>;

// Get user's shopping lists
export const getShoppingLists = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const lists = await prisma.shoppingList.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, brand: true, unit: true, imageUrl: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return sendSuccess(res, 200, 'Shopping lists retrieved successfully.', lists);
  } catch (error) {
    return sendError(res, 500, 'Error retrieving shopping lists.');
  }
};

// Create a new shopping list
export const createShoppingList = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';

  if (!name) {
    return sendError(res, 400, 'Shopping list name is required.');
  }

  try {
    const newList = await prisma.shoppingList.create({
      data: {
        userId: userId!,
        name,
      },
    });

    return sendSuccess(res, 201, 'Shopping list created successfully.', newList);
  } catch (error) {
    return sendError(res, 500, 'Error creating shopping list.');
  }
};

// Add an item to a list
export const addItemToList = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const listId = Array.isArray(req.params.listId) ? req.params.listId[0] : req.params.listId;
  const productId = typeof req.body.productId === 'string' ? req.body.productId : '';
  const quantity = Number(req.body.quantity) || 1;

  if (!listId) {
    return sendError(res, 400, 'Valid List ID is required.');
  }

  if (!productId) {
    return sendError(res, 400, 'Valid Product ID is required.');
  }

  try {
    const list = await prisma.shoppingList.findFirst({
      where: { id: listId, userId },
    });

    if (!list) {
      return sendError(res, 404, 'Shopping list not found.');
    }

    const item = await prisma.shoppingListItem.upsert({
      where: {
        shoppingListId_productId: { shoppingListId: listId, productId },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        shoppingListId: listId,
        productId,
        quantity,
      },
    });

    return sendSuccess(res, 200, 'Item added to shopping list.', item);
  } catch (error) {
    return sendError(res, 500, 'Error adding item to list.');
  }
};

// Remove an item from a list
export const removeItemFromList = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const listId = Array.isArray(req.params.listId) ? req.params.listId[0] : req.params.listId;
  const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;

  if (!listId || !productId) {
    return sendError(res, 400, 'List ID and Product ID are required.');
  }

  try {
    const list = await prisma.shoppingList.findFirst({
      where: { id: listId, userId },
    });

    if (!list) {
      return sendError(res, 404, 'Shopping list not found.');
    }

    await prisma.shoppingListItem.delete({
      where: {
        shoppingListId_productId: { shoppingListId: listId, productId },
      },
    });

    return sendSuccess(res, 200, 'Item removed from list.');
  } catch (error) {
    return sendError(res, 500, 'Error removing item from list.');
  }
};

// Compare total costs across all retailers
export const compareBasketTotals = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const listId = Array.isArray(req.params.listId) ? req.params.listId[0] : req.params.listId;

  if (!listId) {
    return sendError(res, 400, 'Valid List ID is required.');
  }

  try {
    const list = (await prisma.shoppingList.findFirst({
      where: { id: listId, userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                prices: {
                  include: {
                    retailer: { select: { id: true, name: true, logoUrl: true } },
                  },
                },
              },
            },
          },
        },
      },
    })) as ShoppingListWithPrices | null;

    if (!list) {
      return sendError(res, 404, 'Shopping list not found.');
    }

    const retailers = await prisma.retailer.findMany({
      select: { id: true, name: true, logoUrl: true },
    });

    const comparisonResults = retailers.map((retailer) => {
      let totalCost = 0;
      let availableItemsCount = 0;
      const itemBreakdown: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number | null;
        subtotal: number | null;
        inStockAtRetailer: boolean;
      }> = [];

      list.items.forEach((item) => {
        const priceObj = item.product.prices.find(
          (p) => p.retailerId === retailer.id
        );

        if (priceObj) {
          const itemTotal = Number(priceObj.price) * item.quantity;
          totalCost += itemTotal;
          availableItemsCount += 1;

          itemBreakdown.push({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: Number(priceObj.price),
            subtotal: itemTotal,
            inStockAtRetailer: true,
          });
        } else {
          itemBreakdown.push({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: null,
            subtotal: null,
            inStockAtRetailer: false,
          });
        }
      });

      return {
        retailer: {
          id: retailer.id,
          name: retailer.name,
          logoUrl: retailer.logoUrl,
        },
        totalCost: Number(totalCost.toFixed(2)),
        totalItemsInList: list.items.length,
        itemsAvailableCount: availableItemsCount,
        isCompleteBasket: availableItemsCount === list.items.length,
        items: itemBreakdown,
      };
    });

    comparisonResults.sort((a, b) => a.totalCost - b.totalCost);

    return sendSuccess(res, 200, 'Basket totals compared successfully.', {
      listId: list.id,
      listName: list.name,
      comparisons: comparisonResults,
      disclaimer: 'Calculated using sample promotional and standard prices for demonstration purposes.',
    });
  } catch (error) {
    return sendError(res, 500, 'Error comparing basket totals.');
  }
};