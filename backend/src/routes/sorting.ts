import express, { Response, NextFunction } from "express"
import { authenticate, AuthRequest } from "../middleware/auth.js"
import { accountStorageService } from "../services/accountStorageService.js"
import { PrismaClient } from "@prisma/client"
import { AppError } from "../middleware/errorHandler.js"

const router = express.Router()
const prisma = new PrismaClient()

// 所有路由都需要认证
router.use(authenticate)

/**
 * GET /api/accounts/sorting
 * 获取账号排序列表
 */
router.get(
  "/",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const accounts = await accountStorageService.getAllAccounts(req.userId!)
      
      // 按置顶和排序优先级排序
      const sortedAccounts = accounts.sort((a, b) => {
        // 置顶的在前
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        
        // 然后按排序优先级
        const orderA = a.sortOrder || 0
        const orderB = b.sortOrder || 0
        if (orderA !== orderB) return orderB - orderA
        
        // 最后按创建时间
        return b.createdAt.getTime() - a.createdAt.getTime()
      })

      res.json({
        success: true,
        data: sortedAccounts.map(acc => ({
          id: acc.id.toString(), // 确保 ID 是字符串
          isPinned: acc.isPinned,
          sortOrder: acc.sortOrder
        }))
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/accounts/:id/pin
 * 置顶账号
 */
router.post(
  "/:id/pin",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      
      await prisma.account.update({
        where: { id },
        data: { isPinned: true }
      })

      res.json({
        success: true
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/accounts/:id/unpin
 * 取消置顶
 */
router.post(
  "/:id/unpin",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      
      await prisma.account.update({
        where: { id },
        data: { isPinned: false }
      })

      res.json({
        success: true
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * PUT /api/accounts/sorting
 * 更新排序顺序
 */
router.put(
  "/",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { accountIds } = req.body // 账号ID数组，按顺序排列

      if (!Array.isArray(accountIds)) {
        throw new AppError(400, "accountIds 必须是数组")
      }

      // 批量更新排序顺序
      await Promise.all(
        accountIds.map((accountId: string, index: number) =>
          prisma.account.update({
            where: {
              id: accountId,
              userId: req.userId! // 确保只能更新自己的账号
            },
            data: {
              sortOrder: accountIds.length - index // 倒序，第一个优先级最高
            }
          })
        )
      )

      res.json({
        success: true
      })
    } catch (error) {
      next(error)
    }
  }
)

export { router as sortingRouter }

