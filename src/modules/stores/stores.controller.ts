import { Request, Response } from 'express';
import prisma from '../../utils/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// Parse query param safely
const parseQueryString = (param: unknown): string | undefined => {
  if (typeof param === 'string') return param;
  if (Array.isArray(param) && typeof param[0] === 'string') return param[0];
  return undefined;
};

// GET /api/stores - List stores with location search and filtering
export const getStores = async (req: Request, res: Response) => {
  try {
    const retailerId = parseQueryString(req.query.retailerId);
    const city = parseQueryString(req.query.city);
    const search = parseQueryString(req.query.search) || '';

    const where: any = {};

    if (retailerId) {
      where.retailerId = retailerId;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { storeName: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const stores = await prisma.store.findMany({
      where,
      include: {
        retailer: {
          select: { id: true, name: true, logoUrl: true, website: true },
        },
      },
      orderBy: { storeName: 'asc' },
    });

    return sendSuccess(res, 200, 'Stores retrieved successfully.', stores);
  } catch (error) {
    return sendError(res, 500, 'Error retrieving stores.');
  }
};

// GET /api/stores/:id - Single store details and opening hours
export const getStoreById = async (req: Request, res: Response) => {
  const paramId = req.params.id;
  const id = Array.isArray(paramId) ? paramId[0] : paramId;

  if (!id) {
    return sendError(res, 400, 'Valid store ID is required.');
  }

  try {
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        retailer: true,
      },
    });

    if (!store) {
      return sendError(res, 404, 'Store not found.');
    }

    return sendSuccess(res, 200, 'Store details retrieved successfully.', store);
  } catch (error) {
    return sendError(res, 500, 'Error retrieving store details.');
  }
};

// GET /api/retailers - List all retailers
export const getRetailers = async (_req: Request, res: Response) => {
  try {
    const retailers = await prisma.retailer.findMany({
      include: {
        _count: { select: { stores: true, prices: true } },
      },
      orderBy: { name: 'asc' },
    });

    return sendSuccess(res, 200, 'Retailers retrieved successfully.', retailers);
  } catch (error) {
    return sendError(res, 500, 'Error retrieving retailers.');
  }
};