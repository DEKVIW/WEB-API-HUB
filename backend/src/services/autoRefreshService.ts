import { PrismaClient } from "@prisma/client"
import { proxyService } from "./proxyService.js"
import { accountStorageService } from "./accountStorageService.js"

const prisma = new PrismaClient()

/**
 * 自动刷新服务
 * 定时刷新账号余额等信息
 */
export class AutoRefreshService {
  private refreshIntervals: Map<string, NodeJS.Timeout> = new Map()

  /**
   * 为指定用户启动自动刷新（支持指定账号列表）
   */
  async startAutoRefresh(
    userId: string,
    intervalMinutes: number = 6,
    accountIds?: string[]
  ) {
    // 停止现有的刷新任务
    this.stopAutoRefresh(userId)

    // 设置定时刷新（不立即执行，等待第一个间隔）
    const interval = setInterval(() => {
      this.refreshUserAccounts(userId, accountIds).catch((error) => {
        console.error(`[AutoRefresh] Error refreshing accounts for user ${userId}:`, error)
      })
    }, intervalMinutes * 60 * 1000)

    this.refreshIntervals.set(userId, interval)

    console.log(
      `[AutoRefresh] Started auto refresh for user ${userId}, interval: ${intervalMinutes} minutes, accounts: ${accountIds?.length || "all"}`
    )
  }

  /**
   * 停止指定用户的自动刷新
   */
  stopAutoRefresh(userId: string) {
    const interval = this.refreshIntervals.get(userId)
    if (interval) {
      clearInterval(interval)
      this.refreshIntervals.delete(userId)
      console.log(`[AutoRefresh] Stopped auto refresh for user ${userId}`)
    }
  }

  /**
   * 刷新用户的所有账号（或指定的账号列表）
   */
  async refreshUserAccounts(userId: string, accountIds?: string[]) {
    try {
      let accounts
      if (accountIds && accountIds.length > 0) {
        // 只刷新指定的账号
        accounts = await accountStorageService.getAllAccounts(userId)
        accounts = accounts.filter((account) => accountIds.includes(account.id))
      } else {
        // 刷新所有启用自动刷新的账号
        accounts = await accountStorageService.getAllAccounts(userId)
        // 从数据库获取启用自动刷新的账号
        const enabledAccounts = await prisma.account.findMany({
          where: {
            userId,
            autoRefreshEnabled: true
          },
          select: { id: true }
        })
        const enabledAccountIds = new Set(enabledAccounts.map((a) => a.id))
        accounts = accounts.filter((account) => enabledAccountIds.has(account.id))
      }

      console.log(`[AutoRefresh] Refreshing ${accounts.length} accounts for user ${userId}`)

      // 并行刷新所有账号（限制并发数）
      const refreshPromises = accounts.map((account) =>
        this.refreshAccount(account.id, userId, account).catch((error) => {
          console.error(`[AutoRefresh] Failed to refresh account ${account.id}:`, error)
          return null
        })
      )

      await Promise.all(refreshPromises)

      console.log(`[AutoRefresh] Completed refreshing accounts for user ${userId}`)
    } catch (error) {
      console.error(`[AutoRefresh] Error refreshing user accounts:`, error)
      throw error
    }
  }

  /**
   * 刷新单个账号
   */
  private async refreshAccount(
    accountId: string,
    userId: string,
    account: any
  ) {
    try {
      if (!account.userIdValue) {
        throw new Error("Account missing userId")
      }
      if (account.authType === "AccessToken" && !account.accessToken) {
        throw new Error("Account missing accessToken")
      }
      if (account.authType === "Cookie" && !account.cookie) {
        throw new Error("Account missing cookie")
      }

      // 导入 API 服务
      const { fetchAccountData } = await import("./apiService.js")
      const { nowAsBigInt } = await import("../utils/dateUtils.js")

      // 解析 checkInConfig（SQLite 中存储为 JSON 字符串）
      let checkInConfig: any = { enableDetection: false }
      if (account.checkInConfig) {
        try {
          checkInConfig =
            typeof account.checkInConfig === "string"
              ? JSON.parse(account.checkInConfig)
              : account.checkInConfig
        } catch (error) {
          console.warn("Failed to parse checkInConfig:", error)
        }
      }

      // 获取完整的账号数据
      const accountData = await fetchAccountData(
        account.baseUrl,
        account.userIdValue,
        account.accessToken || "", // Cookie认证时可能为空，但函数需要这个参数
        checkInConfig,
        account.exchangeRate || 7.0,
        account.authType,
        account.cookie || undefined
      )

      // 更新账号信息
      await accountStorageService.updateAccountBalance(accountId, userId, {
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
      })

      return { success: true, accountId }
    } catch (error: any) {
      // 更新健康状态为错误
      const { nowAsBigInt } = await import("../utils/dateUtils.js")
      await accountStorageService.updateAccountBalance(accountId, userId, {
        healthStatus: "error",
        lastSyncTime: nowAsBigInt()
      })

      throw error
    }
  }

  /**
   * 初始化所有用户的自动刷新
   */
  async initializeAllUsers() {
    try {
      const users = await prisma.user.findMany({
        include: {
          preferences: true
        }
      })

      for (const user of users) {
        if (user.preferences?.autoRefreshEnabled && user.preferences.autoRefreshInterval) {
          // 获取该用户启用自动刷新的账号列表
          const enabledAccounts = await prisma.account.findMany({
            where: {
              userId: user.id,
              autoRefreshEnabled: true
            },
            select: { id: true }
          })
          const accountIds = enabledAccounts.map((a) => a.id)

          if (accountIds.length > 0) {
            await this.startAutoRefresh(
              user.id,
              user.preferences.autoRefreshInterval,
              accountIds
            )
          }
        }
      }

      console.log(`[AutoRefresh] Initialized auto refresh for ${users.length} users`)
    } catch (error) {
      console.error("[AutoRefresh] Error initializing auto refresh:", error)
    }
  }
}

export const autoRefreshService = new AutoRefreshService()
