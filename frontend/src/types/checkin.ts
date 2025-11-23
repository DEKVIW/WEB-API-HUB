/**
 * 自动签到相关类型定义
 */

export interface AutoCheckinStatus {
  lastRunAt?: string
  nextScheduledAt?: string
  lastRunResult?: "success" | "partial" | "failed"
  perAccount?: Record<string, CheckinAccountResult>
}

export interface CheckinAccountResult {
  accountId: string
  accountName: string
  status: "success" | "failed" | "alreadyChecked" | "skipped"
  message?: string
  timestamp: number
}

export interface CheckinHistoryItem {
  accountId: string
  accountName: string
  status: string
  message?: string
  timestamp: number
}

export interface CheckinHistoryResponse {
  items: CheckinHistoryItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

