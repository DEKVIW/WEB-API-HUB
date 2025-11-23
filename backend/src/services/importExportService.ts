/**
 * 导入导出服务
 * 支持 JSON 格式的数据导入导出
 */

import { accountStorageService } from "./accountStorageService.js"
import { PrismaClient } from "@prisma/client"
import type { Account, ApiToken } from "@prisma/client"

const prisma = new PrismaClient()

export interface ExportData {
  version: string
  timestamp: number
  accounts: {
    accounts: ExportAccount[]
    last_updated: number
  }
  preferences?: any
}

export interface ExportAccount {
  id: string
  site_name: string
  site_url: string
  health: {
    status: string
    reason?: string
  }
  site_type: string | null
  exchange_rate: number | null
  account_info: {
    id: number | null
    access_token: string | null
  }
  cookie?: string | null
  last_sync_time: number
  updated_at: number
  created_at: number
  notes?: string
  checkIn: any
  configVersion?: number
  authType: string
  autoRefreshEnabled?: boolean
  autoRefreshInterval?: number | null
  tokens?: ExportToken[]
}

export interface ExportToken {
  id: number
  user_id: number
  key: string
  status: number
  name: string
  created_time: number
  accessed_time: number
  expired_time: number
  remain_quota: number
  unlimited_quota: boolean
  model_limits_enabled?: boolean
  model_limits?: string
  allow_ips?: string
  used_quota: number
  group?: string
  models?: string
}

/**
 * 导出所有账号数据
 */
export async function exportAccounts(userId: string): Promise<ExportData> {
  const accounts = await accountStorageService.getAllAccounts(userId)

  const exportAccounts: ExportAccount[] = accounts.map((account) => {
    const exportAccount: ExportAccount = {
      id: account.id,
      site_name: account.siteName || account.baseUrl,
      site_url: account.baseUrl,
      health: {
        status: account.healthStatus || "unknown",
        reason: account.healthReason || undefined
      },
      site_type: account.siteType,
      exchange_rate: account.exchangeRate,
      account_info: {
        id: account.userIdValue || null,
        access_token: account.accessToken || null
      },
      cookie: account.cookie || null,
      last_sync_time: account.lastSyncTime ? Number(account.lastSyncTime) : Date.now(),
      updated_at: account.updatedAt.getTime(),
      created_at: account.createdAt.getTime(),
      notes: account.notes || undefined,
      checkIn: account.checkInConfig 
        ? (typeof account.checkInConfig === "string" 
            ? JSON.parse(account.checkInConfig) 
            : account.checkInConfig)
        : { enableDetection: false },
      configVersion: account.configVersion || 1,
      authType: account.authType,
      autoRefreshEnabled: account.autoRefreshEnabled || false,
      autoRefreshInterval: account.autoRefreshInterval || null
    }

    // 添加 tokens
    if (account.tokens && account.tokens.length > 0) {
      exportAccount.tokens = account.tokens.map((token) => ({
        id: token.tokenId || 0,
        user_id: token.userId || 0,
        key: token.key,
        status: token.status,
        name: token.name,
        created_time: token.createdTime ? Number(token.createdTime) : Date.now(),
        accessed_time: token.accessedTime ? Number(token.accessedTime) : Date.now(),
        expired_time: token.expiredTime ? Number(token.expiredTime) : 0,
        remain_quota: token.remainQuota || 0,
        unlimited_quota: token.unlimited,
        model_limits_enabled: token.modelLimitsEnabled || false,
        model_limits: token.modelLimits || undefined,
        allow_ips: token.allowIps || undefined,
        used_quota: token.usedQuota || 0,
        group: token.group || undefined,
        models: token.models || undefined
      }))
    }

    return exportAccount
  })

  return {
    version: "1.0",
    timestamp: Date.now(),
    accounts: {
      accounts: exportAccounts,
      last_updated: Date.now()
    }
  }
}

/**
 * 导入账号数据
 */
export async function importAccounts(
  userId: string,
  data: ExportData
): Promise<{ importedCount: number; migratedCount: number }> {
  const accountsToImport = data.accounts?.accounts || data.accounts || []

  let importedCount = 0
  let migratedCount = 0

  for (const accountData of accountsToImport) {
    try {
      // 检查是否已存在（根据 baseUrl 和 userIdValue）
      const existing = await prisma.account.findFirst({
        where: {
          userId,
          baseUrl: accountData.site_url,
          userIdValue: accountData.account_info?.id || null
        }
      })

      if (existing) {
        // 更新现有账号
        await accountStorageService.updateAccount(existing.id, userId, {
          siteName: accountData.site_name,
          siteType: accountData.site_type,
          exchangeRate: accountData.exchange_rate,
          accessToken: accountData.account_info?.access_token,
          cookie: accountData.cookie || undefined,
          healthStatus: accountData.health.status,
          healthReason: accountData.health.reason,
          notes: accountData.notes,
          checkInConfig: accountData.checkIn 
            ? JSON.stringify(accountData.checkIn)
            : null,
          configVersion: accountData.configVersion || 1,
          authType: accountData.authType || "AccessToken",
          autoRefreshEnabled: accountData.autoRefreshEnabled ?? false,
          autoRefreshInterval: accountData.autoRefreshInterval ?? null
        })
        importedCount++
        continue
      }

      // 创建新账号
      const account = await accountStorageService.createAccount(userId, {
        baseUrl: accountData.site_url,
        siteName: accountData.site_name,
        siteType: accountData.site_type,
        userIdValue: accountData.account_info?.id || null,
        accessToken: accountData.account_info?.access_token,
        cookie: accountData.cookie || undefined,
        authType: accountData.authType || "AccessToken",
        exchangeRate: accountData.exchange_rate,
        healthStatus: accountData.health.status,
        healthReason: accountData.health.reason,
        notes: accountData.notes,
        checkInConfig: accountData.checkIn 
          ? JSON.stringify(accountData.checkIn)
          : null,
        configVersion: accountData.configVersion || 1,
        autoRefreshEnabled: accountData.autoRefreshEnabled ?? false,
        autoRefreshInterval: accountData.autoRefreshInterval ?? null,
        tokens: accountData.tokens?.map((token) => ({
          tokenId: token.id,
          userId: token.user_id,
          name: token.name,
          key: token.key,
          status: token.status,
          remainQuota: token.remain_quota,
          unlimited: token.unlimited_quota,
          usedQuota: token.used_quota,
          expiredTime: BigInt(token.expired_time),
          createdTime: BigInt(token.created_time),
          accessedTime: BigInt(token.accessed_time),
          modelLimitsEnabled: token.model_limits_enabled,
          modelLimits: token.model_limits,
          allowIps: token.allow_ips,
          group: token.group,
          models: token.models
        }))
      })

      importedCount++
      if (accountData.configVersion && accountData.configVersion > 1) {
        migratedCount++
      }
    } catch (error) {
      console.error(`导入账号失败: ${accountData.id}`, error)
    }
  }

  // 导入完成后，根据导入后的状态重新配置自动刷新服务
  try {
    const { autoRefreshService } = await import("./autoRefreshService.js")
    
    // 先停止现有的自动刷新服务（如果存在）
    autoRefreshService.stopAutoRefresh(userId)
    
    // 查询导入后所有启用自动刷新的账号
    const enabledAccounts = await prisma.account.findMany({
      where: {
        userId,
        autoRefreshEnabled: true
      },
      select: {
        id: true,
        autoRefreshInterval: true
      }
    })

    // 只有当有启用自动刷新的账号时才启动服务
    if (enabledAccounts.length > 0) {
      // 获取所有有效的刷新间隔
      const intervals = enabledAccounts
        .map((a) => a.autoRefreshInterval)
        .filter((interval): interval is number => interval !== null && interval > 0)
      
      // 使用最常见的间隔，如果没有有效间隔则使用默认值6分钟
      const mostCommonInterval = intervals.length > 0
        ? intervals.reduce((a, b, _, arr) => 
            arr.filter((v) => v === a).length >= arr.filter((v) => v === b).length ? a : b
          )
        : 6

      const accountIds = enabledAccounts.map((a) => a.id)

      // 启动自动刷新服务（只刷新启用自动刷新的账号）
      await autoRefreshService.startAutoRefresh(
        userId,
        mostCommonInterval,
        accountIds
      )
    }
    // 如果没有启用自动刷新的账号，服务已经在上面的 stopAutoRefresh 中停止了
  } catch (error) {
    console.error("[ImportExport] Failed to configure auto refresh after import:", error)
    // 不抛出错误，因为导入本身已经成功
  }

  return { importedCount, migratedCount }
}

/**
 * 验证导入数据格式
 */
export function validateImportData(data: any): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data) {
    errors.push("数据为空")
    return { valid: false, errors }
  }

  if (!data.version) {
    errors.push("缺少版本号")
  }

  if (!data.accounts && !data.timestamp) {
    errors.push("数据格式不正确")
  }

  if (data.accounts) {
    if (!Array.isArray(data.accounts.accounts) && !Array.isArray(data.accounts)) {
      errors.push("账号数据格式不正确")
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 导入导出服务对象
 */
export const importExportService = {
  exportAllData: async (userId: string): Promise<ExportData> => {
    return await exportAccounts(userId)
  },
  importData: async (userId: string, data: ExportData): Promise<{ importedCount: number; migratedCount: number }> => {
    return await importAccounts(userId, data)
  },
  exportData: async (userId: string): Promise<ExportData> => {
    return await exportAccounts(userId)
  }
}

