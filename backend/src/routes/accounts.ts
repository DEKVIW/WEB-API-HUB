import express from "express"
import { accountStorageService } from "../services/accountStorageService.js"
import { authenticate, AuthRequest } from "../middleware/auth.js"
import { AppError } from "../middleware/errorHandler.js"
import { nowAsBigInt } from "../utils/dateUtils.js"
import {
  convertAccountToDisplayData,
  convertAccountsToDisplayData
} from "../services/dataTransformService.js"

const router = express.Router()

// 所有路由都需要认证
router.use(authenticate)

/**
 * GET /api/accounts
 * 获取当前用户的所有账号
 */
router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const { display = "false" } = req.query
    // 当请求展示格式时，使用排序
    const accounts = await accountStorageService.getAllAccounts(req.userId!, display === "true")

    // 如果请求展示格式，转换为 DisplaySiteData
    if (display === "true") {
      const displayData = convertAccountsToDisplayData(accounts)
      res.json({
        success: true,
        data: displayData
      })
    } else {
      res.json({
        success: true,
        data: accounts
      })
    }
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/accounts/auto-refresh
 * 批量更新账号的自动刷新设置
 * 必须在 /:id 路由之前注册，避免路由冲突
 */
router.put("/auto-refresh", async (req: AuthRequest, res, next) => {
  try {
    const { accountIds, autoRefreshEnabled, autoRefreshInterval } = req.body

    if (!Array.isArray(accountIds)) {
      return res.status(400).json({
        success: false,
        error: "accountIds must be an array"
      })
    }

    // 批量更新账号的自动刷新设置
    const { PrismaClient } = await import("@prisma/client")
    const prisma = new PrismaClient()

    // 构建更新数据对象，只包含需要更新的字段
    const updateData: {
      autoRefreshEnabled?: boolean
      autoRefreshInterval?: number | null
    } = {}
    
    if (autoRefreshEnabled !== undefined) {
      updateData.autoRefreshEnabled = autoRefreshEnabled
    }
    
    if (autoRefreshEnabled && autoRefreshInterval) {
      updateData.autoRefreshInterval = autoRefreshInterval
    } else if (autoRefreshEnabled === false) {
      updateData.autoRefreshInterval = null
    }

    await prisma.account.updateMany({
      where: {
        id: { in: accountIds },
        userId: req.userId! // 确保只能更新自己的账号
      },
      data: updateData
    })

    // 如果启用了自动刷新，更新用户偏好设置并启动服务
    if (autoRefreshEnabled && autoRefreshInterval) {
      const preferences = await prisma.userPreferences.upsert({
        where: { userId: req.userId! },
        update: {
          autoRefreshEnabled: true,
          autoRefreshInterval
        },
        create: {
          userId: req.userId!,
          autoRefreshEnabled: true,
          autoRefreshInterval
        }
      })

      // 启动自动刷新服务（只刷新启用自动刷新的账号）
      const { autoRefreshService } = await import("../services/autoRefreshService.js")
      await autoRefreshService.startAutoRefresh(
        req.userId!,
        autoRefreshInterval,
        accountIds
      )
    } else if (!autoRefreshEnabled) {
      // 如果禁用，检查是否还有启用自动刷新的账号
      const enabledCount = await prisma.account.count({
        where: {
          userId: req.userId!,
          autoRefreshEnabled: true
        }
      })

      if (enabledCount === 0) {
        // 没有启用自动刷新的账号了，停止服务
        const { autoRefreshService } = await import("../services/autoRefreshService.js")
        autoRefreshService.stopAutoRefresh(req.userId!)
      }
    }

    res.json({
      success: true,
      message: "自动刷新设置已更新"
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/accounts/:id
 * 获取单个账号详情
 */
router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const { display = "false" } = req.query
    const account = await accountStorageService.getAccountById(
      req.params.id,
      req.userId!
    )

    if (!account) {
      return res.status(404).json({
        success: false,
        error: "Account not found"
      })
    }

    // 如果请求展示格式，转换为 DisplaySiteData
    if (display === "true") {
      const displayData = convertAccountToDisplayData(account)
      res.json({
        success: true,
        data: displayData
      })
    } else {
      res.json({
        success: true,
        data: account
      })
    }
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/accounts
 * 创建新账号
 */
router.post("/", async (req: AuthRequest, res, next) => {
  try {
        const {
          baseUrl,
          siteName,
          userIdValue,
          username,
          accessToken,
          cookie,
          authType,
          exchangeRate,
          notes
        } = req.body

    if (!baseUrl || !userIdValue || (authType === "AccessToken" && !accessToken) || (authType === "Cookie" && !cookie)) {
      throw new AppError(400, "缺少必要的账号信息")
    }

    const { fetchAccountData } = await import("../services/apiService.js")
    const { nowAsBigInt } = await import("../utils/dateUtils.js")
    
    let accountData
    try {
      accountData = await fetchAccountData(
        baseUrl,
        userIdValue,
        accessToken,
        { enableDetection: false }, // 默认不启用签到检测
        exchangeRate || 7.0,
        authType,
        cookie
      )
    } catch (error: any) {
      console.error("Failed to fetch account data during creation:", error)
      accountData = {
        quota: 0,
        usedQuota: 0,
        today_prompt_tokens: 0,
        today_completion_tokens: 0,
        today_quota_consumption: 0,
        today_requests_count: 0,
        today_income: 0,
        checkIn: undefined
      }
    }

    const account = await accountStorageService.createAccount(req.userId!, {
          baseUrl,
          siteName,
          userIdValue,
          username,
          accessToken,
          cookie,
          authType,
          exchangeRate,
          notes,
      quota: accountData.quota,
      usedQuota: accountData.usedQuota,
      todayPromptTokens: accountData.today_prompt_tokens,
      todayCompletionTokens: accountData.today_completion_tokens,
      todayQuotaConsumption: accountData.today_quota_consumption,
      todayRequestsCount: accountData.today_requests_count,
      todayIncome: accountData.today_income,
      healthStatus: "healthy",
      lastSyncTime: nowAsBigInt(),
      checkInConfig: accountData.checkIn ? JSON.stringify(accountData.checkIn) : undefined
    })

    if (!account) {
      throw new AppError(500, "创建账号失败")
    }

    // 如果请求展示格式，转换为 DisplaySiteData
    const { display = "false" } = req.query
    if (display === "true") {
      const displayData = convertAccountToDisplayData(account)
      res.status(201).json({
        success: true,
        data: displayData
      })
    } else {
      res.status(201).json({
        success: true,
        data: account
      })
    }
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/accounts/:id
 * 更新账号
 */
router.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const account = await accountStorageService.updateAccount(
      req.params.id,
      req.userId!,
      req.body
    )

    res.json({
      success: true,
      data: account
    })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/accounts/:id
 * 删除账号
 */
router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    await accountStorageService.deleteAccount(req.params.id, req.userId!)
    res.json({
      success: true
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/accounts/:id/refresh
 * 刷新账号数据（完整的账号信息，包括余额、今日使用、今日收入等）
 */
router.post("/:id/refresh", async (req: AuthRequest, res, next) => {
  try {
    const account = await accountStorageService.getAccountById(
      req.params.id,
      req.userId!
    )

    if (!account) {
      return res.status(404).json({
        success: false,
        error: "Account not found"
      })
    }

    // 根据认证方式检查必要的字段
    if (!account.userIdValue) {
      return res.status(400).json({
        success: false,
        error: "Account missing userId"
      })
    }
    if (account.authType === "AccessToken" && !account.accessToken) {
      return res.status(400).json({
        success: false,
        error: "Account missing accessToken"
      })
    }
    if (account.authType === "Cookie" && !account.cookie) {
      return res.status(400).json({
        success: false,
        error: "Account missing cookie"
      })
    }

    // 导入 API 服务
    const { fetchAccountData } = await import("../services/apiService.js")
    const { AuthTypeEnum } = await import("../types/index.js")
    const { nowAsBigInt } = await import("../utils/dateUtils.js")

    let checkInConfig: any = { enableDetection: false }
    if (account.checkInConfig) {
      try {
        checkInConfig = typeof account.checkInConfig === "string"
          ? JSON.parse(account.checkInConfig)
          : account.checkInConfig
      } catch (error) {
        console.warn("Failed to parse checkInConfig:", error)
      }
    }

    const accountData = await fetchAccountData(
          account.baseUrl,
          account.userIdValue,
          account.accessToken || "", // Cookie认证时可能为空，但函数需要这个参数
          checkInConfig,
          account.exchangeRate || 7.0,
          account.authType as any,
          account.cookie || undefined
        )

    const updated = await accountStorageService.updateAccount(
      req.params.id,
      req.userId!,
      {
        quota: accountData.quota,
        usedQuota: accountData.usedQuota,
        todayPromptTokens: accountData.today_prompt_tokens,
        todayCompletionTokens: accountData.today_completion_tokens,
        todayQuotaConsumption: accountData.today_quota_consumption,
        todayRequestsCount: accountData.today_requests_count,
        todayIncome: accountData.today_income,
        healthStatus: "healthy",
        lastSyncTime: nowAsBigInt(),
        checkInConfig: accountData.checkIn 
          ? JSON.stringify(accountData.checkIn)
          : account.checkInConfig
      }
    )

    // 转换 BigInt 字段为字符串
    const responseData = {
      ...updated,
      lastSyncTime: updated.lastSyncTime?.toString() || null
    }
    
    res.json({
      success: true,
      data: responseData
    })
  } catch (error: any) {
    try {
      await accountStorageService.updateAccount(
        req.params.id,
        req.userId!,
        {
          healthStatus: "error",
          lastSyncTime: nowAsBigInt()
        }
      )
    } catch (updateError) {
      // Ignore update error
    }

    next(error)
  }
})

/**
 * DELETE /api/accounts/all
 * 清空所有账号（危险操作）
 */
router.delete("/all", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!

    // 删除所有账号（级联删除 Token 和分组）
    await accountStorageService.deleteAllAccounts(userId)

    res.json({
      success: true,
      message: "所有账号已清空"
    })
  } catch (error) {
    next(error)
  }
})

export { router as accountsRouter }

