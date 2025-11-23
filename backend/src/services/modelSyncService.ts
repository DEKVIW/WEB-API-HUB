import { PrismaClient } from "@prisma/client"
import axios from "axios"
import { accountStorageService } from "./accountStorageService.js"
import { proxyService } from "./proxyService.js"
import { fetchAccountAvailableModels } from "./apiService.js"

const prisma = new PrismaClient()

/**
 * 模型同步服务
 * 将账号的模型列表同步到 New API
 */
export class ModelSyncService {
  /**
   * 获取 New API 渠道列表
   */
  async listChannels(
    newApiUrl: string,
    newApiToken: string,
    newApiUserId?: string
  ): Promise<any[]> {
    try {
      const url = `${newApiUrl.replace(/\/$/, "")}/api/channel/`
      const params: any = {
        p: "1",
        page_size: "100"
      }

      const headers: any = {
        Authorization: `Bearer ${newApiToken}`,
        "Content-Type": "application/json"
      }

      if (newApiUserId) {
        headers["X-User-Id"] = newApiUserId
      }

      const response = await axios.get(url, {
        params,
        headers,
        validateStatus: () => true
      })

      if (response.status === 200 && response.data) {
        return response.data.items || []
      }

      throw new Error(`获取渠道列表失败: ${response.status}`)
    } catch (error: any) {
      console.error("[ModelSync] Failed to list channels:", error)
      throw error
    }
  }

  /**
   * 从账号 API 获取模型列表
   */
  async fetchAccountModels(
    accountId: string,
    userId: string
  ): Promise<string[]> {
    try {
      const account = await accountStorageService.getAccountById(accountId, userId)
      if (!account) {
        throw new Error("账号不存在")
      }

      if (!account.userIdValue || !account.accessToken) {
        throw new Error("账号缺少必要信息")
      }

      // 通过代理服务调用账号的模型列表 API
      const models = await fetchAccountAvailableModels(
        account.baseUrl,
        account.userIdValue,
        account.accessToken,
        account.authType as any
      )

      // 提取模型名称
      return models.map((model: any) => model.model_name || model.name || model.id).filter(Boolean)
    } catch (error: any) {
      console.error(`[ModelSync] Failed to fetch models for account ${accountId}:`, error)
      throw error
    }
  }

  /**
   * 同步单个账号的模型到 New API 渠道
   */
  async syncAccountToChannel(
    accountId: string,
    userId: string,
    channelId: number,
    newApiUrl: string,
    newApiToken: string,
    newApiUserId?: string
  ): Promise<{
    success: boolean
    accountId: string
    accountName: string
    channelId: number
    channelName?: string
    message: string
    oldModels?: string[]
    newModels?: string[]
    attempts: number
  }> {
    let attempts = 0
    const maxRetries = 2

    try {
      const account = await accountStorageService.getAccountById(accountId, userId)
      if (!account) {
        throw new Error("账号不存在")
      }

      // 获取渠道信息
      const channels = await this.listChannels(newApiUrl, newApiToken, newApiUserId)
      const channel = channels.find((c: any) => c.id === channelId)
      if (!channel) {
        throw new Error("渠道不存在")
      }

      const oldModels = channel.models
        ? channel.models.split(",").map((m: string) => m.trim()).filter(Boolean)
        : []

      // 获取账号的模型列表
      let newModels: string[] = []
      while (attempts <= maxRetries) {
        attempts++
        try {
          newModels = await this.fetchAccountModels(accountId, userId)
          break
        } catch (error: any) {
          if (attempts > maxRetries) {
            throw error
          }
          // 指数退避
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts - 1) * 1000))
        }
      }

      // 更新渠道的模型列表
      const updateUrl = `${newApiUrl.replace(/\/$/, "")}/api/channel/`
      const headers: any = {
        Authorization: `Bearer ${newApiToken}`,
        "Content-Type": "application/json"
      }

      if (newApiUserId) {
        headers["X-User-Id"] = newApiUserId
      }

      const updateResponse = await axios.put(
        updateUrl,
        {
          id: channelId,
          models: newModels.join(",")
        },
        {
          headers,
          validateStatus: () => true
        }
      )

      if (updateResponse.status !== 200) {
        throw new Error(`更新渠道失败: ${updateResponse.status}`)
      }

      // 保存同步历史
      await this.saveSyncHistory(userId, {
        accountId,
        accountName: account.siteName || account.baseUrl,
        channelId,
        channelName: channel.name,
        status: "success",
        message: "同步成功",
        oldModels,
        newModels,
        attempts
      })

      return {
        success: true,
        accountId,
        accountName: account.siteName || account.baseUrl,
        channelId,
        channelName: channel.name,
        message: "同步成功",
        oldModels,
        newModels,
        attempts
      }
    } catch (error: any) {
      const account = await accountStorageService.getAccountById(accountId, userId).catch(() => null)
      
      // 保存失败历史
      await this.saveSyncHistory(userId, {
        accountId,
        accountName: account?.siteName || account?.baseUrl || "未知账号",
        channelId,
        status: "failed",
        message: error.message || "同步失败",
        attempts
      }).catch(() => {})

      return {
        success: false,
        accountId,
        accountName: account?.siteName || account?.baseUrl || "未知账号",
        channelId,
        message: error.message || "同步失败",
        attempts
      }
    }
  }

  /**
   * 批量同步账号模型
   */
  async syncAccounts(
    userId: string,
    accountIds: string[],
    newApiUrl: string,
    newApiToken: string,
    newApiUserId?: string
  ): Promise<any[]> {
    try {
      // 获取所有渠道
      const channels = await this.listChannels(newApiUrl, newApiToken, newApiUserId)
      
      // 获取所有账号
      const accounts = await accountStorageService.getAllAccounts(userId)
      const targetAccounts = accountIds.length > 0
        ? accounts.filter((acc) => accountIds.includes(acc.id))
        : accounts

      const results: any[] = []

      // 为每个账号找到匹配的渠道并同步
      for (const account of targetAccounts) {
        // 根据 baseUrl 匹配渠道
        const matchingChannel = channels.find((ch: any) => 
          ch.base_url === account.baseUrl || ch.base_url === account.baseUrl.replace(/\/$/, "")
        )

        if (matchingChannel) {
          const result = await this.syncAccountToChannel(
            account.id,
            userId,
            matchingChannel.id,
            newApiUrl,
            newApiToken,
            newApiUserId
          )
          results.push(result)
        } else {
          results.push({
            success: false,
            accountId: account.id,
            accountName: account.siteName || account.baseUrl,
            message: "未找到匹配的渠道"
          })
        }
      }

      return results
    } catch (error: any) {
      console.error("[ModelSync] Failed to sync accounts:", error)
      throw error
    }
  }

  /**
   * 保存同步历史
   */
  private async saveSyncHistory(
    userId: string,
    data: {
      accountId: string
      accountName: string
      channelId?: number
      channelName?: string
      status: string
      message: string
      oldModels?: string[]
      newModels?: string[]
      attempts: number
    }
  ) {
    try {
      await prisma.modelSyncHistory.create({
        data: {
          userId,
          accountId: data.accountId,
          accountName: data.accountName,
          channelId: data.channelId,
          channelName: data.channelName,
          status: data.status,
          message: data.message,
          oldModels: data.oldModels ? JSON.stringify(data.oldModels) : null,
          newModels: data.newModels ? JSON.stringify(data.newModels) : null,
          attempts: data.attempts
        }
      })
    } catch (error) {
      console.error("[ModelSync] Failed to save sync history:", error)
    }
  }

  /**
   * 获取同步历史
   */
  async getSyncHistory(
    userId: string,
    options?: {
      page?: number
      pageSize?: number
      accountId?: string
      status?: string
    }
  ) {
    try {
      const page = options?.page || 1
      const pageSize = options?.pageSize || 50
      const skip = (page - 1) * pageSize

      const where: any = { userId }
      if (options?.accountId) {
        where.accountId = options.accountId
      }
      if (options?.status) {
        where.status = options.status
      }

      const [history, total] = await Promise.all([
        prisma.modelSyncHistory.findMany({
          where,
          orderBy: { executedAt: "desc" },
          skip,
          take: pageSize
        }),
        prisma.modelSyncHistory.count({ where })
      ])

      return {
        items: history.map((h) => ({
          accountId: h.accountId,
          accountName: h.accountName,
          channelId: h.channelId,
          channelName: h.channelName,
          status: h.status,
          message: h.message,
          oldModels: h.oldModels ? JSON.parse(h.oldModels) : [],
          newModels: h.newModels ? JSON.parse(h.newModels) : [],
          attempts: h.attempts || 1,
          timestamp: h.executedAt.getTime()
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    } catch (error) {
      console.error("[ModelSync] Failed to get sync history:", error)
      throw error
    }
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(userId: string) {
    try {
      // 获取最近的同步历史
      const recentHistory = await prisma.modelSyncHistory.findMany({
        where: { userId },
        orderBy: { executedAt: "desc" },
        take: 100
      })

      const lastExecution = recentHistory.length > 0 ? recentHistory[0] : null

      // 计算统计信息
      const todayHistory = recentHistory.filter((h) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return h.executedAt >= today
      })

      const successCount = todayHistory.filter((h) => h.status === "success").length
      const failedCount = todayHistory.filter((h) => h.status === "failed").length

      let lastRunResult: "success" | "partial" | "failed" | undefined
      if (todayHistory.length > 0) {
        if (failedCount === 0) {
          lastRunResult = "success"
        } else if (successCount === 0) {
          lastRunResult = "failed"
        } else {
          lastRunResult = "partial"
        }
      }

      return {
        lastRunAt: lastExecution?.executedAt.toISOString(),
        lastRunResult,
        successCount,
        failedCount,
        totalCount: todayHistory.length
      }
    } catch (error) {
      console.error("[ModelSync] Failed to get sync status:", error)
      throw error
    }
  }
}

export const modelSyncService = new ModelSyncService()

