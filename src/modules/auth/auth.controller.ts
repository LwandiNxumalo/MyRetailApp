import { Request, Response } from "express";
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import prisma from "../../utils/prisma.js";
import {
  hashPassword,
  comparePassword,
  generateToken,
} from "../../utils/auth.js";
import { sendSuccess, sendError } from "../../utils/response.js";

export const register = async (req: Request, res: Response) => {
  const { fullName, username, email, password } = req.body;

  if (!fullName || !username || !email || !password) {
    return sendError(res, 400, "Invalid input. All fields are required.");
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return sendError(res, 400, "Email or username already in use.");
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { fullName, username, email, passwordHash },
    });

    const token = generateToken({ userId: user.id, role: user.role });

    return sendSuccess(res, 201, "User registered successfully.", {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return sendError(
      res,
      500,
      "Something went wrong during registration. Please try again.",
    );
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 400, "Incorrect email or password.");
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return sendError(res, 401, "Incorrect email or password.");
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      return sendError(res, 401, "Incorrect email or password.");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = generateToken({ userId: user.id, role: user.role });

    return sendSuccess(res, 200, "Login successful.", {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return sendError(
      res,
      500,
      "Something went wrong during login. Please try again.",
    );
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        role: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendError(res, 404, "User profile not found.");
    }

    return sendSuccess(res, 200, "User profile retrieved successfully.", user);
  } catch (error) {
    return sendError(res, 500, "Error retrieving user profile.");
  }
};
