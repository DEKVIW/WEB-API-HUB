/**
 * 日期工具函数
 */

/**
 * 将 Date 转换为 BigInt timestamp（毫秒）
 */
export function dateToBigInt(date: Date): bigint {
  return BigInt(date.getTime())
}

/**
 * 将 BigInt timestamp 转换为 Date
 */
export function bigIntToDate(timestamp: bigint): Date {
  return new Date(Number(timestamp))
}

/**
 * 获取当前时间的 BigInt timestamp
 */
export function nowAsBigInt(): bigint {
  return BigInt(Date.now())
}

