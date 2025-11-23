import express from "express"
import { PrismaClient } from "@prisma/client"
import { authenticate, AuthRequest } from "../middleware/auth.js"
import { autoCheckinService } from "../services/autoCheckinService.js"

const router = express.Router()
const prisma = new PrismaClient()

// 所有路由都需要认证
router.use(authenticate)

/**
 * GET /api/checkin/status
 * 获取自动签到状态
 */
router.get("/status", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!

    // 获取最近的签到历史
    const recentHistory = await prisma.checkinHistory.findMany({
      where: { userId },
      orderBy: { executedAt: "desc" },
      take: 100
    })

    // 获取用户偏好设置
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    })

    // 按执行时间分组，获取最后一次执行的结果
    const lastExecution = recentHistory.length > 0 ? recentHistory[0] : null
    const lastExecutionTime = lastExecution?.executedAt

    // 计算统计信息
    const todayHistory = recentHistory.filter((h) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return h.executedAt >= today
    })

    const perAccount: Record<string, any> = {}
    todayHistory.forEach((h) => {
      if (!perAccount[h.accountId]) {
        perAccount[h.accountId] = {
          accountId: h.accountId,
          accountName: h.accountName,
          status: h.status,
          message: h.message,
          timestamp: h.executedAt.getTime()
        }
      } else {
        // 保留最新的记录
        if (h.executedAt > new Date(perAccount[h.accountId].timestamp)) {
          perAccount[h.accountId] = {
            accountId: h.accountId,
            accountName: h.accountName,
            status: h.status,
            message: h.message,
            timestamp: h.executedAt.getTime()
          }
        }
      }
    })

    // 计算结果
    const accountResults = Object.values(perAccount)
    const successCount = accountResults.filter(
      (r: any) => r.status === "success" || r.status === "alreadyChecked"
    ).length
    const failedCount = accountResults.filter((r: any) => r.status === "failed").length

    let lastRunResult: "success" | "partial" | "failed" | undefined
    if (accountResults.length > 0) {
      if (failedCount === 0) {
        lastRunResult = "success"
      } else if (successCount === 0) {
        lastRunResult = "failed"
      } else {
        lastRunResult = "partial"
      }
    }

    // 计算下次计划时间（如果启用了自动签到）
    let nextScheduledAt: string | undefined
    if (preferences?.autoCheckinEnabled && preferences.autoCheckinWindowStart) {
      const now = new Date()
      const [hours, minutes] = preferences.autoCheckinWindowStart.split(":")
      const nextRun = new Date()
      nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      // 如果今天的时间窗口已过，设置为明天
      if (nextRun < now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      
      nextScheduledAt = nextRun.toISOString()
    }

    res.json({
      success: true,
      data: {
        lastRunAt: lastExecutionTime?.toISOString(),
        nextScheduledAt,
        lastRunResult,
        perAccount
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/checkin/history
 * 获取签到历史记录
 */
router.get("/history", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!
    const { page = "1", pageSize = "50", accountId, status } = req.query

    const pageNum = parseInt(page as string)
    const pageSizeNum = parseInt(pageSize as string)
    const skip = (pageNum - 1) * pageSizeNum

    const where: any = { userId }
    if (accountId) {
      where.accountId = accountId as string
    }
    if (status) {
      where.status = status as string
    }

    const [history, total] = await Promise.all([
      prisma.checkinHistory.findMany({
        where,
        orderBy: { executedAt: "desc" },
        skip,
        take: pageSizeNum
      }),
      prisma.checkinHistory.count({ where })
    ])

    res.json({
      success: true,
      data: {
        items: history.map((h) => ({
          accountId: h.accountId,
          accountName: h.accountName,
          status: h.status,
          message: h.message,
          timestamp: h.executedAt.getTime()
        })),
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum)
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/checkin/run
 * 手动触发签到
 */
router.post("/run", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!

    // 执行签到
    const results = await autoCheckinService.checkinUserAccounts(userId)

    res.json({
      success: true,
      data: {
        results: results.map((r: any) => ({
          accountId: r.accountId,
          accountName: r.accountName || "未知账号",
          status: r.success ? "success" : "failed",
          message: r.message || (r.success ? "签到成功" : "签到失败"),
          timestamp: Date.now()
        }))
      }
    })
  } catch (error) {
    next(error)
  }
})

export { router as checkinRouter }

