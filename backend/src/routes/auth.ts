import express from "express"
import bcrypt from "bcryptjs"
import jwt, { SignOptions } from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { authenticate, AuthRequest } from "../middleware/auth.js"
import { AppError } from "../middleware/errorHandler.js"

const router = express.Router()
const prisma = new PrismaClient()


/**
 * POST /api/auth/login
 * 用户登录
 */
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      throw new AppError(400, "用户名和密码是必需的")
    }

    // 查找用户（支持用户名或邮箱登录）
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        password: true
      }
    })

    if (!user) {
      throw new AppError(401, "用户名或密码错误")
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      throw new AppError(401, "用户名或密码错误")
    }
    
    const token = generateToken(user.id)

    const isSecure = process.env.NODE_ENV === "production" && 
                     (process.env.FRONTEND_URL?.startsWith("https://") || 
                      process.env.CORS_ORIGIN?.startsWith("https://"))
    
    res.cookie("token", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 天
    })
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        },
        token
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post("/logout", authenticate, async (req: AuthRequest, res) => {
  res.clearCookie("token")
  res.json({
    success: true,
    message: "Logged out successfully"
  })
})

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get("/me", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        preferences: true
      }
    })

    if (!user) {
      throw new AppError(404, "User not found")
    }

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 生成 JWT token
 */
function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET not configured")
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || "7d"

  // 使用类型断言解决 jsonwebtoken 类型定义问题
  // @ts-ignore - jsonwebtoken 类型定义问题，expiresIn 可以是 string
  return jwt.sign({ userId }, secret, { expiresIn })
}

export { router as authRouter }

