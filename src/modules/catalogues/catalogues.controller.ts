import { Request, Response } from 'express';
import prisma from '../../utils/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// Parse query parameter safely
const parseQueryString = (param: unknown): string | undefined => {
  if (typeof param === 'string') return param;
  if (Array.isArray(param) && typeof param[0] === 'string') return param[0];
  return undefined;
};

// GET /api/catalogues - List active retailer promotional catalogues
export const getCatalogues = async (req: Request, res: Response) => {
  try {
    const retailerId = parseQueryString(req.query.retailerId);

    const where: any = {
      validUntil: { gte: new Date() }, // Only retrieve active/valid catalogues
    };

    if (retailerId) {
      where.retailerId = retailerId;
    }

    const catalogues = await prisma.catalogue.findMany({
      where,
      include: {
        retailer: {
          select: { id: true, name: true, logoUrl: true, website: true },
        },
      },
      orderBy: { validFrom: 'desc' },
    });

    return sendSuccess(res, 200, 'Retailer catalogues retrieved successfully.', catalogues);
  } catch (error) {
    return sendError(res, 500, 'Error retrieving catalogues.');
  }
};

// GET /api/catalogues/:id - Get detailed catalogue info
export const getCatalogueById = async (req: Request, res: Response) => {
  const paramId = req.params.id;
  const id = Array.isArray(paramId) ? paramId[0] : paramId;

  if (!id) {
    return sendError(res, 400, 'Valid Catalogue ID is required.');
  }

  try {
    const catalogue = await prisma.catalogue.findUnique({
      where: { id },
      include: {
        retailer: true,
      },
    });

    if (!catalogue) {
      return sendError(res, 404, 'Catalogue not found or expired.');
    }

    return sendSuccess(res, 200, 'Catalogue details retrieved successfully.', {
      ...catalogue,
      disclaimer: 'Promotional catalogues and special offer pricing shown for demonstration purposes.',
    });
  } catch (error) {
    return sendError(res, 500, 'Error retrieving catalogue details.');
  }
};