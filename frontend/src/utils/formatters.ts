/**
 * 格式化工具函数
 */

/**
 * 格式化余额显示
 */
export function formatBalance(amount: number, currency: "USD" | "CNY"): string {
  const symbol = currency === "USD" ? "$" : "¥"
  // 不添加千分位分隔符，保持原始数字格式
  const formatted = amount.toFixed(2)
  return `${symbol}${formatted}`
}

/**
 * 格式化 Token 数量
 */
export function formatTokenCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(2)}M`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(2)}K`
  }
  return count.toString()
}

/**
 * 格式化额度（转换为美元格式）
 * @param quota 额度值（内部单位）
 * @param unlimited 是否无限制
 * @returns 格式化后的额度字符串，如 "$10.50" 或 "无限制"
 */
export function formatQuota(quota: number, unlimited: boolean): string {
  // 转换因子：500000 内部单位 = 1 美元
  const CONVERSION_FACTOR = 500000
  
  if (unlimited || quota < 0) {
    return "无限制"
  }
  return `$${(quota / CONVERSION_FACTOR).toFixed(2)}`
}

/**
 * 格式化日期时间
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}天前`
  }
  if (hours > 0) {
    return `${hours}小时前`
  }
  if (minutes > 0) {
    return `${minutes}分钟前`
  }
  return "刚刚"
}

