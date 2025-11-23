import { proxyService } from "./proxyService.js"
import type { AuthTypeEnum } from "../types/index.js"

/**
 * Token 服务
 * 管理 API Token 的 CRUD 操作
 */

/**
 * 规范化 baseUrl：移除尾部斜杠
 */
function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '')
}

/**
 * 检查响应是否为 HTML（说明可能被重定向到前端页面）
 */
function checkResponseIsJson(data: any, url: string): void {
  if (typeof data === 'string' && data.trim().startsWith('<!doctype html>')) {
    console.error("❌ API returned HTML page instead of JSON!")
    console.error("  Requested URL:", url)
    console.error("  This usually means:")
    console.error("  1. The API endpoint doesn't exist or is incorrect")
    console.error("  2. Authentication failed and was redirected to login page")
    console.error("  3. The baseUrl might need to be adjusted")
    throw new Error("API returned HTML instead of JSON. Check URL and authentication.")
  }
}

export interface ApiToken {
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

export interface PaginatedTokenResponse {
  items: ApiToken[]
  total: number
  page: number
  page_size: number
}

export interface CreateTokenRequest {
  name: string
  remain_quota: number
  expired_time: number
  unlimited_quota: boolean
  model_limits_enabled: boolean
  model_limits: string
  allow_ips: string
  group: string
}

/**
 * 获取账号的 Token 列表（支持分页）
 */
export async function fetchAccountTokens(
  baseUrl: string,
  userId: number,
  accessToken: string,
  page: number = 0,
  size: number = 100,
  authType?: AuthTypeEnum,
  cookie?: string
): Promise<ApiToken[]> {
  // 规范化 baseUrl：移除尾部斜杠
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  
  const params = new URLSearchParams({
    p: page.toString(),
    size: size.toString()
  })

  const result = await proxyService.proxyRequest(
    `${normalizedBaseUrl}/api/token/?${params.toString()}`,
    {
      method: "GET"
    },
    userId.toString(),
    accessToken,
    cookie,
    authType // 传递 authType 参数
  )

  if (result.status !== 200 || !result.data) {
    throw new Error("Failed to fetch tokens")
  }

  // 检查响应是否为 HTML
  checkResponseIsJson(result.data, `${normalizedBaseUrl}/api/token/`)

  const tokensData = result.data

  if (Array.isArray(tokensData)) {
    return tokensData
  } else if (tokensData && typeof tokensData === "object") {
    if ("items" in tokensData) {
      return tokensData.items || []
    }
    if ("data" in tokensData) {
      if (Array.isArray(tokensData.data)) {
        return tokensData.data
      } else if (tokensData.data && typeof tokensData.data === "object" && "items" in tokensData.data) {
        return tokensData.data.items || []
      }
    }
    if ("success" in tokensData && tokensData.success && "data" in tokensData) {
      const data = tokensData.data
      if (Array.isArray(data)) {
        return data
      } else if (data && typeof data === "object" && "items" in data) {
        return data.items || []
      }
    }
  }

  console.warn("⚠️ Unexpected token response format:", tokensData)
  return []
}

/**
 * 获取所有 Token（自动分页）
 */
export async function fetchAllAccountTokens(
  baseUrl: string,
  userId: number,
  accessToken: string,
  authType?: AuthTypeEnum,
  cookie?: string
): Promise<ApiToken[]> {
  let allTokens: ApiToken[] = []
  let currentPage = 0
  const pageSize = 100
  const maxPages = 10

  while (currentPage < maxPages) {
    const tokens = await fetchAccountTokens(
      baseUrl,
      userId,
      accessToken,
      currentPage,
      pageSize,
      authType,
      cookie
    )

    if (tokens.length === 0) {
      break
    }

    allTokens = allTokens.concat(tokens)

    // 如果返回的 token 数量少于 pageSize，说明已经是最后一页
    if (tokens.length < pageSize) {
      break
    }

    currentPage++
  }

  return allTokens
}

/**
 * 根据 ID 获取单个 Token
 */
export async function fetchTokenById(
  baseUrl: string,
  userId: number,
  accessToken: string,
  tokenId: number,
  authType?: AuthTypeEnum,
  cookie?: string
): Promise<ApiToken | null> {
  // 规范化 baseUrl：移除尾部斜杠
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  
  const result = await proxyService.proxyRequest(
    `${normalizedBaseUrl}/api/token/${tokenId}`,
    {
      method: "GET"
    },
    userId.toString(),
    accessToken,
    cookie,
    authType // 传递 authType 参数
  )

  if (result.status !== 200 || !result.data) {
    return null
  }

  // 检查响应是否为 HTML
  checkResponseIsJson(result.data, `${normalizedBaseUrl}/api/token/${tokenId}`)

  return result.data
}

/**
 * 创建新的 API Token
 */
export async function createApiToken(
  baseUrl: string,
  userId: number,
  accessToken: string,
  tokenData: CreateTokenRequest,
  authType?: AuthTypeEnum,
  cookie?: string
): Promise<ApiToken> {
  // 规范化 baseUrl：移除尾部斜杠
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  
  const result = await proxyService.proxyRequest(
    `${normalizedBaseUrl}/api/token`,
    {
      method: "POST",
      body: tokenData
    },
    userId.toString(),
    accessToken,
    cookie,
    authType // 传递 authType 参数
  )

  if (result.status !== 200 && result.status !== 201) {
    throw new Error(result.data?.message || "Failed to create token")
  }

  // 检查响应是否为 HTML
  checkResponseIsJson(result.data, `${normalizedBaseUrl}/api/token`)

  return result.data
}

/**
 * 更新 API Token
 */
export async function updateApiToken(
  baseUrl: string,
  userId: number,
  accessToken: string,
  tokenId: number,
  tokenData: Partial<CreateTokenRequest>,
  authType?: AuthTypeEnum,
  cookie?: string
): Promise<ApiToken> {
  // 规范化 baseUrl：移除尾部斜杠
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  
  const result = await proxyService.proxyRequest(
    `${normalizedBaseUrl}/api/token/${tokenId}`,
    {
      method: "PUT",
      body: tokenData
    },
    userId.toString(),
    accessToken,
    cookie,
    authType // 传递 authType 参数
  )

  if (result.status !== 200) {
    throw new Error(result.data?.message || "Failed to update token")
  }

  // 检查响应是否为 HTML
  checkResponseIsJson(result.data, `${normalizedBaseUrl}/api/token/${tokenId}`)

  return result.data
}

/**
 * 删除 API Token
 */
export async function deleteApiToken(
  baseUrl: string,
  userId: number,
  accessToken: string,
  tokenId: number,
  authType?: AuthTypeEnum,
  cookie?: string
): Promise<boolean> {
  // 规范化 baseUrl：移除尾部斜杠
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  
  const result = await proxyService.proxyRequest(
    `${normalizedBaseUrl}/api/token/${tokenId}`,
    {
      method: "DELETE"
    },
    userId.toString(),
    accessToken,
    cookie,
    authType // 传递 authType 参数
  )

  return result.status === 200 || result.status === 204
}

