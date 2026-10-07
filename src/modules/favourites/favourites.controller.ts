import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import prisma from '../../utils/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// GET /api/favourites - List user's saved favourite products
export const getFavourites = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const favourites = await prisma.favourite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true } },
            prices: {
              include: {
                retailer: { select: { id: true, name: true, logoUrl: true } },
              },
              orderBy: { price: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 200, 'Favourite products retrieved successfully.', favourites);
  } catch (error) {
    return sendError(res, 500, 'Error retrieving favourites.');
  }
};

// POST /api/favourites - Bookmark a product
export const addFavourite = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const productId = typeof req.body.productId === 'string' ? req.body.productId : '';

  if (!productId) {
    return sendError(res, 400, 'Valid Product ID is required.');
  }

  try {
    const favourite = await prisma.favourite.upsert({
      where: {
        userId_productId: { userId: userId!, productId },
      },
      update: {},
      create: {
        userId: userId!,
        productId,
      },
    });

    return sendSuccess(res, 201, 'Product added to favourites.', favourite);
  } catch (error) {
    return sendError(res, 500, 'Error adding product to favourites.');
  }
};

// DELETE /api/favourites/:productId - Remove a bookmarked product
export const removeFavourite = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const paramProductId = req.params.productId;
  const productId = Array.isArray(paramProductId) ? paramProductId[0] : paramProductId;

  if (!productId) {
    return sendError(res, 400, 'Valid Product ID is required.');
  }

  try {
    await prisma.favourite.delete({
      where: {
        userId_productId: { userId: userId!, productId },
      },
    });

    return sendSuccess(res, 200, 'Product removed from favourites.');
  } catch (error) {
    return sendError(res, 500, 'Error removing product from favourites.');
  }
};