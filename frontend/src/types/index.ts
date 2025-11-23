/**
 * 前端类型定义
 * 与后端 DisplaySiteData 格式对齐
 */

export interface CurrencyAmount {
  USD: number
  CNY: number
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
  tokens?: ApiToken[]
}

export interface ApiToken {
  id: string
  accountId: string
  tokenId?: number
  userId?: number
  name: string
  key: string
  status: number
  usedQuota?: number
  remainQuota?: number
  unlimited: boolean
  expiredTime?: bigint | number
  createdTime?: bigint | number
  accessedTime?: bigint | number
  modelLimitsEnabled?: boolean
  modelLimits?: string
  allowIps?: string
  group?: string
  models?: string
  createdAt: string
  updatedAt: string
}

