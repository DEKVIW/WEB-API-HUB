import express from "express"
import { PrismaClient } from "@prisma/client"
import { authenticate, AuthRequest } from "../middleware/auth.js"
import { autoRefreshService } from "../services/autoRefreshService.js"
import { autoCheckinService } from "../services/autoCheckinService.js"

const router = express.Router()
const prisma = new PrismaClient()

// 所有路由都需要认证
router.use(authenticate)

/**
 * GET /api/preferences
 * 获取用户偏好设置
 */
router.get("/", async (req: AuthRequest, res, next) => {
  try {
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.userId! }
    })

    // 如果不存在，创建默认设置
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId: req.userId!
        }
      })
    }

    res.json({
      success: true,
      data: preferences
    })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/preferences
 * 更新用户偏好设置
 */
router.put("/", async (req: AuthRequest, res, next) => {
  try {
    const {
      language,
      autoRefreshEnabled,
      autoRefreshInterval,
      autoCheckinEnabled,
      autoCheckinWindowStart,
      autoCheckinWindowEnd,
      newApiUrl,
      newApiToken,
      newApiUserId,
      newApiModelSyncEnabled,
      newApiModelSyncInterval,
      webdavUrl,
      webdavUsername,
      webdavPassword,
      webdavAutoSyncEnabled,
      webdavAutoSyncInterval,
      webdavSyncStrategy
    } = req.body

    // 更新偏好设置
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: req.userId! },
      update: {
        language,
        autoRefreshEnabled,
        autoRefreshInterval,
        autoCheckinEnabled,
        autoCheckinWindowStart,
        autoCheckinWindowEnd,
        newApiUrl,
        newApiToken,
        newApiUserId,
        newApiModelSyncEnabled,
        newApiModelSyncInterval,
        webdavUrl,
        webdavUsername,
        webdavPassword,
        webdavAutoSyncEnabled,
        webdavAutoSyncInterval,
        webdavSyncStrategy
      },
      create: {
        userId: req.userId!,
        language: language || "zh_CN",
        autoRefreshEnabled: autoRefreshEnabled || false,
        autoRefreshInterval: autoRefreshInterval || 6,
        autoCheckinEnabled: autoCheckinEnabled || false,
        autoCheckinWindowStart: autoCheckinWindowStart,
        autoCheckinWindowEnd: autoCheckinWindowEnd,
        newApiUrl: newApiUrl,
        newApiToken: newApiToken,
        newApiUserId: newApiUserId,
        newApiModelSyncEnabled: newApiModelSyncEnabled || false,
        newApiModelSyncInterval: newApiModelSyncInterval,
        webdavUrl: webdavUrl,
        webdavUsername: webdavUsername,
        webdavPassword: webdavPassword,
        webdavAutoSyncEnabled: webdavAutoSyncEnabled || false,
        webdavAutoSyncInterval: webdavAutoSyncInterval,
        webdavSyncStrategy: webdavSyncStrategy || "merge"
      }
    })

    // 如果启用了自动刷新，启动服务（只刷新启用自动刷新的账号）
    if (autoRefreshEnabled && autoRefreshInterval) {
      await autoRefreshService.startAutoRefresh(
        req.userId!,
        autoRefreshInterval
      )
    } else {
      autoRefreshService.stopAutoRefresh(req.userId!)
    }

    res.json({
      success: true,
      data: preferences
    })
  } catch (error) {
    next(error)
  }
})

export { router as preferencesRouter }

