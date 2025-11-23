/**
 * JSON 工具函数
 * 用于处理 SQLite 中存储的 JSON 字符串
 */

/**
 * 安全地解析 JSON 字符串
 */
export function parseJson<T = any>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) {
    return defaultValue
  }

  if (typeof jsonString === "object") {
    return jsonString as T
  }

  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    console.warn("Failed to parse JSON:", error)
    return defaultValue
  }
}

/**
 * 递归转换 BigInt 为字符串
 */
function convertBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  if (typeof obj === 'bigint') {
    return obj.toString()
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigInt)
  }
  if (typeof obj === 'object') {
    const converted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigInt(value)
    }
    return converted
  }
  return obj
}

/**
 * 安全地将对象转换为 JSON 字符串（支持 BigInt）
 */
export function stringifyJson(obj: any): string | null {
  if (!obj) {
    return null
  }

  if (typeof obj === "string") {
    return obj
  }

  try {
    // 先转换 BigInt，再序列化
    const converted = convertBigInt(obj)
    return JSON.stringify(converted)
  } catch (error) {
    console.warn("Failed to stringify JSON:", error)
    return null
  }
}

