import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { AppError } from "./errorHandler.js"

export interface AuthRequest extends Request {
  userId?: string
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies.token || req.headers.authorization?.replace("Bearer ", "")

    if (!token) {
      throw new AppError(401, "Authentication required")
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error("JWT_SECRET not configured")
    }

    const decoded = jwt.verify(token, secret) as { userId: string }
    req.userId = decoded.userId
    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
    } else {
      next(new AppError(401, "Invalid or expired token"))
    }
  }
}

