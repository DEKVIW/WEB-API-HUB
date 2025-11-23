import express, { Response, NextFunction } from "express"
import { accountStorageService } from "../services/accountStorageService.js"
import { authenticate, AuthRequest } from "../middleware/auth.js"

const router = express.Router()

// 所有路由都需要认证
router.use(authenticate)

/**
 * GET /api/stats
 * 获取账号统计信息
 */
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await accountStorageService.getAccountStats(req.userId!)
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    next(error)
  }
})

export { router as statsRouter }

