import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const sendSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  data: any = null,
  pagination?: PaginationMeta
) => {
  const responsePayload: any = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(pagination && { pagination }),
  };

  return res.status(statusCode).json(responsePayload);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors: any[] = []
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};