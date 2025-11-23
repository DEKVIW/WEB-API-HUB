import { Request, Response, NextFunction } from "express"

/**
 * 自定义应用错误类
 */
export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(statusCode: number, message: string, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

/**
 * 错误处理中间件
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 如果是自定义错误
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    })
  }

  // 如果是 Prisma 错误
  if (err.name === "PrismaClientKnownRequestError") {
    return res.status(400).json({
      success: false,
      error: "Database error"
    })
  }

  // 如果是验证错误
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: err.message
    })
  }

  // 默认错误
  console.error("Error:", err)
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message
  })
}

