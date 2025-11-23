import { PrismaClient } from "@prisma/client"
import { proxyService } from "./proxyService.js"
import { accountStorageService } from "./accountStorageService.js"

const prisma = new PrismaClient()

/**
 * 自动签到服务
 * 定时执行账号签到
 */
export class AutoCheckinService {
  private checkinIntervals: Map<string, NodeJS.Timeout> = new Map()

  /**
   * 为指定用户启动自动签到
   */
  async startAutoCheckin(userId: string) {
    this.stopAutoCheckin(userId)
    await this.checkinUserAccounts(userId)

    const interval = setInterval(() => {
      this.checkinUserAccounts(userId).catch((error) => {
        console.error(`[AutoCheckin] Error checking in accounts for user ${userId}:`, error)
      })
    }, 24 * 60 * 60 * 1000) // 24 小时

    this.checkinIntervals.set(userId, interval)

    console.log(`[AutoCheckin] Started auto checkin for user ${userId}`)
  }

  /**
   * 停止指定用户的自动签到
   */
  stopAutoCheckin(userId: string) {
    const interval = this.checkinIntervals.get(userId)
    if (interval) {
      clearInterval(interval)
      this.checkinIntervals.delete(userId)
      console.log(`[AutoCheckin] Stopped auto checkin for user ${userId}`)
    }
  }

  /**
   * 执行用户所有账号的签到
   */
  async checkinUserAccounts(userId: string) {
    try {
      const accounts = await accountStorageService.getAllAccounts(userId)

      console.log(`[AutoCheckin] Checking in ${accounts.length} accounts for user ${userId}`)

      const checkinPromises = accounts.map((account) =>
        this.checkinAccount(account.id, userId, account).catch((error) => {
          console.error(`[AutoCheckin] Failed to checkin account ${account.id}:`, error)
          return {
            success: false,
            accountId: account.id,
            accountName: account.siteName || account.baseUrl,
            error: error.message || "签到失败"
          }
        })
      )

      const results = await Promise.all(checkinPromises)
      await this.saveCheckinHistory(userId, results.filter((r) => r !== null))

      console.log(`[AutoCheckin] Completed checkin for user ${userId}`)
      return results.filter((r) => r !== null)
    } catch (error) {
      console.error(`[AutoCheckin] Error checking in user accounts:`, error)
      throw error
    }
  }

  /**
   * 执行单个账号的签到
   */
  private async checkinAccount(
    accountId: string,
    userId: string,
    account: any
  ) {
    try {
      const baseUrl = account.baseUrl
      const accountName = account.siteName || account.baseUrl
      
      let checkInConfig: any = {}
      if (account.checkInConfig) {
        try {
          checkInConfig = typeof account.checkInConfig === "string"
            ? JSON.parse(account.checkInConfig)
            : account.checkInConfig
        } catch (error) {
          console.warn("Failed to parse checkInConfig:", error)
        }
      }

      if (!checkInConfig.enableDetection && !checkInConfig.autoCheckInEnabled) {
        return {
          success: false,
          accountId,
          accountName,
          status: "skipped",
          message: "未启用签到检测"
        }
      }

      const endpoints = checkInConfig.customCheckInUrl
        ? [checkInConfig.customCheckInUrl]
        : [
            "/api/user/checkin",
            "/api/user/check_in",
            "/api/checkin"
          ]

      for (const endpoint of endpoints) {
        try {
          const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`
          const result = await proxyService.proxyRequest(
            url,
            {
              method: "POST"
            },
            account.userIdValue,
            account.accessToken
          )

          if (result.status === 200) {
            const responseData = result.data || {}
            // 检查响应中是否表示已签到
            if (responseData.message?.includes("已签到") || responseData.message?.includes("already checked")) {
              return {
                success: true,
                accountId,
                accountName,
                status: "alreadyChecked",
                message: responseData.message || "今日已签到"
              }
            }
            return {
              success: true,
              accountId,
              accountName,
              status: "success",
              message: responseData.message || "签到成功"
            }
          }
        } catch (error: any) {
          // 尝试下一个端点
          continue
        }
      }

      // 所有端点都失败
      console.warn(`[AutoCheckin] Failed to checkin account ${accountId}, all endpoints failed`)
      return {
        success: false,
        accountId,
        accountName,
        status: "failed",
        error: "所有签到端点都失败",
        message: "签到失败，请检查账号配置"
      }
    } catch (error: any) {
      return {
        success: false,
        accountId: account.id,
        accountName: account.siteName || account.baseUrl,
        status: "failed",
        error: error.message || "签到失败",
        message: error.message || "签到失败"
      }
    }
  }

  /**
   * 保存签到历史记录
   */
  private async saveCheckinHistory(userId: string, results: any[]) {
    try {
      const historyRecords = results.map((result) => ({
        userId,
        accountId: result.accountId,
        accountName: result.accountName || "未知账号",
        status: result.status || (result.success ? "success" : "failed"),
        message: result.message || result.error || null
      }))

      await prisma.checkinHistory.createMany({
        data: historyRecords
      })
    } catch (error) {
      console.error("[AutoCheckin] Failed to save checkin history:", error)
    }
  }

  /**
   * 初始化所有用户的自动签到
   */
  async initializeAllUsers() {
    try {
      const users = await prisma.user.findMany({
        include: {
          preferences: true
        }
      })

      for (const user of users) {
        // 如果用户启用了自动签到（需要在 preferences 中添加字段）
        // await this.startAutoCheckin(user.id)
      }

      console.log(`[AutoCheckin] Initialized auto checkin for ${users.length} users`)
    } catch (error) {
      console.error("[AutoCheckin] Error initializing auto checkin:", error)
    }
  }
}

export const autoCheckinService = new AutoCheckinService()

