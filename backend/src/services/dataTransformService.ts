/**
 * 数据转换服务
 * 将数据库模型转换为展示格式（DisplaySiteData）
 */

import type { Account, ApiToken } from "@prisma/client"

const CONVERSION_FACTOR = 500_000

export interface CurrencyAmount {
  USD: number
  CNY: number
}

export interface DisplayToken extends Omit<ApiToken, 'expiredTime' | 'createdTime' | 'accessedTime'> {
  expiredTime: number | null
  createdTime: number | null
  accessedTime: number | null
}

export interface DisplaySiteData {
  id: string
  name: string
  username: string | null
  balance: CurrencyAmount
  todayConsumption: CurrencyAmount
  todayIncome: CurrencyAmount
  todayTokens: {
    upload: number
    download: number
  }
  health: {
    status: "healthy" | "warning" | "error" | "unknown"
    reason?: string
  }
  last_sync_time: number
  site_url: string
  site_type: string | null
  exchange_rate: number | null
  notes: string | null
  checkIn: {
    enableDetection: boolean
    autoCheckInEnabled?: boolean
    isCheckedInToday?: boolean
    customCheckInUrl?: string
    customRedeemUrl?: string
    lastCheckInDate?: string
    openRedeemWithCheckIn?: boolean
  }
  autoRefreshEnabled?: boolean
  autoRefreshInterval?: number | null
  tokens?: DisplayToken[]
}

/**
 * 转换单个账号为展示格式
 */
export function convertAccountToDisplayData(
  account: Account & { tokens?: ApiToken[] }
): DisplaySiteData {
  const exchangeRate = account.exchangeRate || 7.0
  const quota = account.quota || 0
  const totalConsumption = account.usedQuota || account.todayQuotaConsumption || 0
  const todayIncome = account.todayIncome || 0

  let checkInConfig: DisplaySiteData["checkIn"] = {
    enableDetection: false
  }
  if (account.checkInConfig) {
    try {
      const parsed = typeof account.checkInConfig === "string" 
        ? JSON.parse(account.checkInConfig) 
        : account.checkInConfig
      checkInConfig = {
        enableDetection: parsed.enableDetection || false,
        autoCheckInEnabled: parsed.autoCheckInEnabled,
        isCheckedInToday: parsed.isCheckedInToday,
        customCheckInUrl: parsed.customCheckInUrl,
        customRedeemUrl: parsed.customRedeemUrl,
        lastCheckInDate: parsed.lastCheckInDate,
        openRedeemWithCheckIn: parsed.openRedeemWithCheckIn
      }
    } catch (error) {
      console.warn("Failed to parse checkInConfig:", error)
    }
  }

  return {
    id: account.id,
    name: account.siteName || account.baseUrl,
    username: account.username,
    balance: {
      USD: parseFloat((quota / CONVERSION_FACTOR).toFixed(2)),
      CNY: parseFloat(((quota / CONVERSION_FACTOR) * exchangeRate).toFixed(2))
    },
    todayConsumption: {
      USD: parseFloat((totalConsumption / CONVERSION_FACTOR).toFixed(2)),
      CNY: parseFloat(
        ((totalConsumption / CONVERSION_FACTOR) * exchangeRate).toFixed(2)
      )
    },
    todayIncome: {
      USD: parseFloat((todayIncome / CONVERSION_FACTOR).toFixed(2)),
      CNY: parseFloat(
        ((todayIncome / CONVERSION_FACTOR) * exchangeRate).toFixed(2)
      )
    },
    todayTokens: {
      upload: account.todayPromptTokens || 0,
      download: account.todayCompletionTokens || 0
    },
    health: {
      status: (account.healthStatus as any) || "unknown",
      reason: account.healthReason || undefined
    },
    last_sync_time: account.lastSyncTime
      ? Number(account.lastSyncTime)
      : Date.now(),
    site_url: account.baseUrl,
    site_type: account.siteType,
    exchange_rate: exchangeRate,
    notes: account.notes || null,
    checkIn: checkInConfig,
    autoRefreshEnabled: account.autoRefreshEnabled || false,
    autoRefreshInterval: account.autoRefreshInterval || null,
    tokens: (account.tokens || []).map((token: ApiToken) => ({
      ...token,
      expiredTime: token.expiredTime ? Number(token.expiredTime) : null,
      createdTime: token.createdTime ? Number(token.createdTime) : null,
      accessedTime: token.accessedTime ? Number(token.accessedTime) : null
    })) as DisplayToken[]
  }
}

/**
 * 转换多个账号为展示格式
 */
export function convertAccountsToDisplayData(
  accounts: (Account & { tokens?: ApiToken[] })[]
): DisplaySiteData[] {
  return accounts.map(convertAccountToDisplayData)
}

/**
 * 格式化余额显示
 */
export function formatBalance(amount: number, currency: "USD" | "CNY"): string {
  const symbol = currency === "USD" ? "$" : "¥"
  return `${symbol}${amount.toFixed(2)}`
}

/**
 * 格式化 Token 数量
 */
export function formatTokenCount(count: number): string {
  if (count < 1000) {
    return count.toString()
  } else if (count < 1_000_000) {
    return `${(count / 1000).toFixed(1)}K`
  } else {
    return `${(count / 1_000_000).toFixed(1)}M`
  }
}

/**
 * 计算总消耗（USD 和 CNY）
 */
export function calculateTotalConsumption(
  totalConsumption: number,
  accounts: DisplaySiteData[]
): CurrencyAmount {
  const usdAmount = parseFloat((totalConsumption / CONVERSION_FACTOR).toFixed(2))
  
  const cnyAmount = parseFloat(
    accounts
      .reduce(
        (sum, acc) =>
          sum +
          (acc.todayConsumption.USD * (acc.exchange_rate || 7.0)),
        0
      )
      .toFixed(2)
  )

  return {
    USD: usdAmount,
    CNY: cnyAmount
  }
}

/**
 * 计算总余额（USD 和 CNY）
 */
export function calculateTotalBalance(
  accounts: DisplaySiteData[]
): CurrencyAmount {
  const usdTotal = accounts.reduce((sum, acc) => sum + acc.balance.USD, 0)
  const cnyTotal = accounts.reduce((sum, acc) => sum + acc.balance.CNY, 0)

  return {
    USD: parseFloat(usdTotal.toFixed(2)),
    CNY: parseFloat(cnyTotal.toFixed(2))
  }
}

