import express from "express"
import { PrismaClient } from "@prisma/client"
import { authenticate, AuthRequest } from "../middleware/auth.js"
import { modelSyncService } from "../services/modelSyncService.js"

const router = express.Router()
const prisma = new PrismaClient()

// 所有路由都需要认证
router.use(authenticate)

/**
 * GET /api/model-sync/status
 * 获取模型同步状态
 */
router.get("/status", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!
    const status = await modelSyncService.getSyncStatus(userId)

    res.json({
      success: true,
      data: status
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/model-sync/history
 * 获取模型同步历史
 */
router.get("/history", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!
    const { page, pageSize, accountId, status } = req.query

    const history = await modelSyncService.getSyncHistory(userId, {
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      accountId: accountId as string,
      status: status as string
    })

    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/model-sync/channels
 * 获取 New API 渠道列表
 */
router.get("/channels", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!

    // 获取用户偏好设置
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    })

    if (!preferences?.newApiUrl || !preferences.newApiToken) {
      // 返回空数组而不是 400 错误，前端可以正常处理
      return res.json({
        success: true,
        data: []
      })
    }

    const channels = await modelSyncService.listChannels(
      preferences.newApiUrl,
      preferences.newApiToken,
      preferences.newApiUserId || undefined
    )

    res.json({
      success: true,
      data: {
        items: channels
      }
    })
  } catch (error: any) {
    next(error)
  }
})

/**
 * POST /api/model-sync/run
 * 手动触发模型同步（同步所有账号）
 */
router.post("/run", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!

    // 获取用户偏好设置
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    })

    if (!preferences?.newApiUrl || !preferences.newApiToken) {
      return res.status(400).json({
        success: false,
        error: "请先在设置中配置 New API 信息"
      })
    }

    const results = await modelSyncService.syncAccounts(
      userId,
      [], // 空数组表示同步所有账号
      preferences.newApiUrl,
      preferences.newApiToken,
      preferences.newApiUserId || undefined
    )

    res.json({
      success: true,
      data: {
        results
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/model-sync/run-selected
 * 同步选中的账号
 */
router.post("/run-selected", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!
    const { accountIds } = req.body

    if (!Array.isArray(accountIds)) {
      return res.status(400).json({
        success: false,
        error: "accountIds 必须是数组"
      })
    }

    // 获取用户偏好设置
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    })

    if (!preferences?.newApiUrl || !preferences.newApiToken) {
      return res.status(400).json({
        success: false,
        error: "请先在设置中配置 New API 信息"
      })
    }

    const results = await modelSyncService.syncAccounts(
      userId,
      accountIds,
      preferences.newApiUrl,
      preferences.newApiToken,
      preferences.newApiUserId || undefined
    )

    res.json({
      success: true,
      data: {
        results
      }
    })
  } catch (error) {
    next(error)
  }
})

export { router as modelSyncRouter }

