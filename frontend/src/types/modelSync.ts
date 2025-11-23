/**
 * 模型同步相关类型定义
 */

export interface ModelSyncStatus {
  lastRunAt?: string
  lastRunResult?: "success" | "partial" | "failed"
  successCount: number
  failedCount: number
  totalCount: number
}

export interface ModelSyncHistoryItem {
  accountId: string
  accountName: string
  channelId?: number
  channelName?: string
  status: "success" | "failed" | "partial"
  message?: string
  oldModels?: string[]
  newModels?: string[]
  attempts: number
  timestamp: number
}

export interface ModelSyncHistoryResponse {
  items: ModelSyncHistoryItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface NewApiChannel {
  id: number
  name: string
  base_url: string
  models: string
  status: number
  type: string
}

export interface ModelSyncExecutionResult {
  success: boolean
  accountId: string
  accountName: string
  channelId?: number
  channelName?: string
  message: string
  oldModels?: string[]
  newModels?: string[]
  attempts: number
}

