import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../utils/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// Define explicit Prisma select/include payload type for product listing with relations
const productWithRelationsQuery = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: {
    category: { select: { id: true, name: true } },
    prices: {
      include: {
        retailer: { select: { id: true, name: true, logoUrl: true } },
      },
      orderBy: { price: 'asc' },
    },
  },
});

type ProductWithRelations = Prisma.ProductGetPayload<typeof productWithRelationsQuery>;

// Helper function to safely extract string values from Express query params
const parseQueryString = (param: unknown): string | undefined => {
  if (typeof param === 'string') return param;
  if (Array.isArray(param) && typeof param[0] === 'string') return param[0];
  return undefined;
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const pageParam = parseQueryString(req.query.page);
    const limitParam = parseQueryString(req.query.limit);
    const searchParam = parseQueryString(req.query.search) || '';
    const categoryId = parseQueryString(req.query.categoryId);
    const brand = parseQueryString(req.query.brand);

    const page = parseInt(pageParam || '1', 10);
    const limit = parseInt(limitParam || '10', 10);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (searchParam) {
      where.OR = [
        { name: { contains: searchParam, mode: 'insensitive' } },
        { brand: { contains: searchParam, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          prices: {
            include: {
              retailer: { select: { id: true, name: true, logoUrl: true } },
            },
            orderBy: { price: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }) as Promise<ProductWithRelations[]>,
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(
      res,
      200,
      'Products retrieved successfully.',
      products,
      { page, limit, total, totalPages }
    );
  } catch (error) {
    return sendError(res, 500, 'Error retrieving products.');
  }
};

export const getProductById = async (req: Request, res: Response) => {
  const paramId = req.params.id;
  const id = Array.isArray(paramId) ? paramId[0] : paramId;

  if (!id) {
    return sendError(res, 400, 'Valid product ID is required.');
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        prices: {
          include: {
            retailer: {
              select: { id: true, name: true, logoUrl: true, website: true },
            },
          },
          orderBy: { price: 'asc' },
        },
        stock: {
          include: {
            store: {
              select: { id: true, storeName: true, city: true },
            },
          },
        },
      },
    });

    if (!product) {
      return sendError(res, 404, 'Product not found.');
    }

    const lowestPrice = product.prices.length > 0 ? product.prices[0].price : null;
    const highestPrice =
      product.prices.length > 0
        ? product.prices[product.prices.length - 1].price
        : null;

    return sendSuccess(res, 200, 'Product details retrieved successfully.', {
      ...product,
      priceSummary: {
        lowestPrice,
        highestPrice,
        retailerCount: product.prices.length,
      },
      disclaimer: 'Sample prices and stock data shown for demonstration purposes.',
    });
  } catch (error) {
    return sendError(res, 500, 'Error retrieving product details.');
  }
};