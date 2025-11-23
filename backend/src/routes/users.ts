import express from "express"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import { authenticate, AuthRequest } from "../middleware/auth.js"
import { AppError } from "../middleware/errorHandler.js"

const router = express.Router()
const prisma = new PrismaClient()

/**
 * PUT /api/users/profile
 * 更新用户信息（用户名、邮箱）
 */
router.put("/profile", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { username, email } = req.body

    if (!username && !email) {
      throw new AppError(400, "至少需要提供一个字段进行更新")
    }

    // 检查用户名是否已被其他用户使用
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: req.userId! }
        }
      })
      if (existingUser) {
        throw new AppError(400, "用户名已被使用")
      }
    }

    // 检查邮箱是否已被其他用户使用
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: req.userId! }
        }
      })
      if (existingUser) {
        throw new AppError(400, "邮箱已被使用")
      }
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        ...(username && { username }),
        ...(email && { email })
      },
      select: {
        id: true,
        email: true,
        username: true
      }
    })

    res.json({
      success: true,
      data: updatedUser
    })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/users/password
 * 修改密码
 */
router.put("/password", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      throw new AppError(400, "当前密码和新密码都是必需的")
    }

    if (newPassword.length < 6) {
      throw new AppError(400, "新密码长度至少6位")
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { password: true }
    })

    if (!user) {
      throw new AppError(404, "用户不存在")
    }

    // 验证当前密码
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      throw new AppError(401, "当前密码错误")
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 更新密码
    await prisma.user.update({
      where: { id: req.userId! },
      data: { password: hashedPassword }
    })

    res.json({
      success: true,
      message: "密码已更新"
    })
  } catch (error) {
    next(error)
  }
})

export { router as usersRouter }

