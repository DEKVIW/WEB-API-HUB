import { proxyService } from "./proxyService.js"
import type { AuthTypeEnum } from "../types/index.js"

/**
 * API 服务
 * 实现原插件中的 API 调用功能
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

export interface UserInfo {
  id: number
  username: string
  access_token: string | null
}

export interface TodayUsageData {
  today_quota_consumption: number
  today_prompt_tokens: number
  today_completion_tokens: number
  today_requests_count: number
}

export interface TodayIncomeData {
  today_income: number
}

export interface AccountQuotaData {
  quota: number
  usedQuota?: number // 历史总消耗
}

export interface AccountData extends TodayUsageData, TodayIncomeData {
  quota: number
  usedQuota?: number // 历史总消耗
  checkIn?: {
    enableDetection: boolean
    autoCheckInEnabled?: boolean
    isCheckedInToday?: boolean
    customCheckInUrl?: string
    customRedeemUrl?: string
    lastCheckInDate?: string
    openRedeemWithCheckIn?: boolean
  }
}

export interface SiteStatusInfo {
  price?: number
  stripe_unit_price?: number
  PaymentUSDRate?: number
  system_name?: string
  check_in_enabled?: boolean
}

/**
 * 获取用户基本信息
 */
export async function fetchUserInfo(
  baseUrl: string,
  userId?: number,
  cookie?: string
): Promise<{ id: number; username: string; access_token: string | null }> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  const apiUrl = `${normalizedBaseUrl}/api/user/self`
  
  const result = await proxyService.proxyRequest(
    apiUrl,
    {
      method: "GET"
    },
    userId?.toString(),
    undefined, // 不使用 AccessToken
    cookie, // 使用 Cookie 认证
    "Cookie" // 明确指定使用 Cookie 认证
  )

  if (result.status !== 200 || !result.data) {
    throw new Error("Failed to fetch user info")
  }

  checkResponseIsJson(result.data, apiUrl)

  const userData = result.data
  return {
    id: userData.id,
    username: userData.username,
    access_token: userData.access_token || null
  }
}

/**
 * 获取账号余额和历史总消耗
 */
export async function fetchAccountQuota(
  baseUrl: string,
  userId: number,
  accessToken: string,
  authType?: AuthTypeEnum,
  cookie?: string
): Promise<AccountQuotaData> {
  try {
    // 规范化 baseUrl：移除尾部斜杠
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
    const apiUrl = `${normalizedBaseUrl}/api/user/self`
    
    const result = await proxyService.proxyRequest(
      apiUrl,
      {
        method: "GET"
      },
      userId.toString(),
      accessToken,
      cookie,
      authType // 传递 authType 参数
    )

    if (result.status !== 200 || !result.data) {
      throw new Error(`Failed to fetch account quota: status ${result.status}`)
    }

    // 检查响应是否为 HTML
    checkResponseIsJson(result.data, apiUrl)

    // 尝试多种可能的字段名和数据结构
    const data = result.data
    let quota = 0
    let usedQuota: number | undefined = undefined
    
    if (data.quota !== undefined) {
      quota = data.quota
    } else if (data.data?.quota !== undefined) {
      quota = data.data.quota
    } else if (data.account_info?.quota !== undefined) {
      quota = data.account_info.quota
    } else if (data.balance !== undefined) {
      quota = data.balance
    } else if (data.remain_quota !== undefined) {
      quota = data.remain_quota
    } else {
      const numericFields: Array<{ key: string; value: number }> = Object.entries(data)
        .filter(([_, value]) => typeof value === 'number' && value >= 0)
        .map(([key, value]) => ({ key, value: value as number }))
      
      const quotaField = numericFields.find(f => 
        f.key.toLowerCase().includes('quota') || 
        f.key.toLowerCase().includes('balance')
      )
      
      if (quotaField) {
        quota = quotaField.value
      } else if (numericFields.length > 0) {
        const maxField = numericFields.reduce((max, curr) => 
          curr.value > max.value ? curr : max
        )
        quota = maxField.value
      }
    }
    if (data.used_quota !== undefined) {
      usedQuota = data.used_quota
    } else if (data.data?.used_quota !== undefined) {
      usedQuota = data.data.used_quota
    } else if (data.account_info?.used_quota !== undefined) {
      usedQuota = data.account_info.used_quota
    } else if (data.total_consumption !== undefined) {
      usedQuota = data.total_consumption
    } else if (data.data?.total_consumption !== undefined) {
      usedQuota = data.data.total_consumption
    }

    return { quota, usedQuota }
  } catch (error: any) {
    console.error("❌ Error fetching account quota:", error)
    throw error
  }
}

/**
 * 获取今日使用情况
 * 通过分页获取日志并聚合
 */
export async function fetchTodayUsage(
  baseUrl: string,
  userId: number,
  accessToken: string,
  authType?: AuthTypeEnum,
  cookie?: string
): Promise<TodayUsageData> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1)
  const startTimestamp = Math.floor(startOfDay.getTime() / 1000)
  const endTimestamp = Math.floor(endOfDay.getTime() / 1000)

  let totalConsumption = 0
  let totalPromptTokens = 0
  let totalCompletionTokens = 0
  let totalRequests = 0
  let currentPage = 1
  const pageSize = 100
  const maxPages = 10

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  
  while (currentPage <= maxPages) {
    const params = new URLSearchParams({
      p: currentPage.toString(),
      page_size: pageSize.toString(),
      type: "2", // 消费日志
      token_name: "",
      model_name: "",
      start_timestamp: startTimestamp.toString(),
      end_timestamp: endTimestamp.toString(),
      group: ""
    })

    const apiUrl = `${normalizedBaseUrl}/api/log/self?${params.toString()}`
    const result = await proxyService.proxyRequest(
      apiUrl,
      {
        method: "GET"
      },
      userId.toString(),
      accessToken,
      cookie,
      authType // 传递 authType 参数
    )

      if (result.status !== 200 || !result.data) {
        break
      }

      // 检查响应是否为 HTML
      checkResponseIsJson(result.data, apiUrl)

      const logData = result.data
      const items = logData.items || []

    // 聚合数据
    for (const item of items) {
      totalConsumption += item.quota || 0
      totalPromptTokens += item.prompt_tokens || 0
      totalCompletionTokens += item.completion_tokens || 0
      totalRequests += 1
    }

    // 检查是否还有更多页
    const totalPages = Math.ceil((logData.total || 0) / pageSize)
    if (currentPage >= totalPages) {
      break
    }

    currentPage++
  }

  return {
    today_quota_consumption: totalConsumption,
    today_prompt_tokens: totalPromptTokens,
    today_completion_tokens: totalCompletionTokens,
    today_requests_count: totalRequests
  }
}

/**
 * 获取今日收入
 * 通过分页获取充值/系统日志并聚合
 */
export async function fetchTodayIncome(
  baseUrl: string,
  userId: number,
  accessToken: string,
  exchangeRate: number,
  authType?: AuthTypeEnum,
  cookie?: string
): Promise<TodayIncomeData> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1)
  const startTimestamp = Math.floor(startOfDay.getTime() / 1000)
  const endTimestamp = Math.floor(endOfDay.getTime() / 1000)

  let totalIncome = 0
  let currentPage = 1
  const pageSize = 100
  const maxPages = 10

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  
  // 获取充值日志 (type=1) 和系统日志 (type=5)
  for (const logType of ["1", "5"]) {
    currentPage = 1
    while (currentPage <= maxPages) {
      const params = new URLSearchParams({
        p: currentPage.toString(),
        page_size: pageSize.toString(),
        type: logType,
        token_name: "",
        model_name: "",
        start_timestamp: startTimestamp.toString(),
        end_timestamp: endTimestamp.toString(),
        group: ""
      })

      const apiUrl = `${normalizedBaseUrl}/api/log/self?${params.toString()}`
      const result = await proxyService.proxyRequest(
        apiUrl,
        {
          method: "GET"
        },
        userId.toString(),
        accessToken,
        cookie
      )

      if (result.status !== 200 || !result.data) {
        break
      }

      // 检查响应是否为 HTML
      checkResponseIsJson(result.data, apiUrl)

      const logData = result.data
      const items = logData.items || []

      // 聚合收入
      for (const item of items) {
        if (item.quota) {
          totalIncome += item.quota
        } else if (item.content) {
          // 尝试从 content 中提取金额（如 "签到奖励 ＄10.586246 额度"）
          const match = item.content.match(/[＄$]?(\d+\.?\d*)/)
          if (match) {
            const amount = parseFloat(match[1])
            totalIncome += amount * 1000000 // 转换为内部单位
          }
        }
      }

      const totalPages = Math.ceil((logData.total || 0) / pageSize)
      if (currentPage >= totalPages) {
        break
      }

      currentPage++
    }
  }

  return {
    today_income: totalIncome
  }
}

/**
 * 获取签到状态
 */
export async function fetchCheckInStatus(
  baseUrl: string,
  userId: number,
  accessToken: string,
  authType?: AuthTypeEnum,
  cookie?: string
): Promise<boolean | undefined> {
  try {
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
    const apiUrl = `${normalizedBaseUrl}/api/user/check_in_status`
    
    const result = await proxyService.proxyRequest(
      apiUrl,
      {
        method: "GET"
      },
      userId.toString(),
      accessToken,
      cookie,
      authType // 传递 authType 参数
    )

    if (result.status === 200 && result.data) {
      return result.data.can_check_in
    }

    return undefined
  } catch (error) {
    // 如果接口不存在，返回 undefined
    return undefined
  }
}

/**
 * 获取站点状态信息
 */
export async function fetchSiteStatus(
  baseUrl: string,
  authType?: AuthTypeEnum
): Promise<SiteStatusInfo | null> {
  try {
    const result = await proxyService.proxyRequest(
      `${baseUrl}/api/status`,
      {
        method: "GET"
      },
      undefined,
      undefined,
      undefined,
      undefined // 获取站点状态不需要认证
    )

    if (result.status === 200 && result.data) {
      return result.data
    }

    return null
  } catch (error) {
    return null
  }
}

/**
 * 获取完整的账号数据
 */
export async function fetchAccountData(
  baseUrl: string,
  userId: number,
  accessToken: string,
  checkInConfig: any,
  exchangeRate: number,
  authType?: AuthTypeEnum,
  cookie?: string
): Promise<AccountData> {
  // 并行获取所有数据
  const [quotaData, todayUsage, todayIncome, canCheckIn] = await Promise.all([
    fetchAccountQuota(baseUrl, userId, accessToken, authType, cookie),
    fetchTodayUsage(baseUrl, userId, accessToken, authType, cookie),
    fetchTodayIncome(baseUrl, userId, accessToken, exchangeRate, authType, cookie),
    checkInConfig?.enableDetection && !checkInConfig.customCheckInUrl
      ? fetchCheckInStatus(baseUrl, userId, accessToken, authType, cookie)
      : Promise.resolve<boolean | undefined>(undefined)
  ])

  return {
    quota: quotaData.quota,
    usedQuota: quotaData.usedQuota,
    ...todayUsage,
    ...todayIncome,
    checkIn: {
      ...checkInConfig,
      isCheckedInToday: !(canCheckIn ?? true)
    }
  }
}

/**
 * 获取账号的可用模型列表
 */
export async function fetchAccountAvailableModels(
  baseUrl: string,
  userId: number,
  accessToken: string,
  authType?: AuthTypeEnum,
  cookie?: string
): Promise<string[]> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  const apiUrl = `${normalizedBaseUrl}/api/user/models`
  
  const result = await proxyService.proxyRequest(
    apiUrl,
    {
      method: "GET"
    },
    userId.toString(),
    accessToken,
    cookie,
    authType // 传递 authType 参数
  )

  if (result.status !== 200 || !result.data) {
    throw new Error("Failed to fetch available models")
  }

  checkResponseIsJson(result.data, apiUrl)

  return result.data || []
}

/**
 * 获取模型价格信息
 * 根据站点类型选择不同的 API 实现
 */
export async function fetchModelPricing(
  baseUrl: string,
  userId: number,
  accessToken: string,
  authType?: AuthTypeEnum,
  cookie?: string,
  siteType?: string
): Promise<any> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  
  // 如果是 oneHub 或 doneHub，使用特殊的 API
  if (siteType === "oneHub" || siteType === "doneHub") {
    return await fetchOneHubModelPricing(
      normalizedBaseUrl,
      userId,
      accessToken,
      authType,
      cookie
    )
  }
  
  // 其他站点使用标准的 /api/pricing 接口
  const apiUrl = `${normalizedBaseUrl}/api/pricing`
  
  const result = await proxyService.proxyRequest(
    apiUrl,
    {
      method: "GET"
    },
    userId.toString(),
    accessToken,
    cookie,
    authType // 传递 authType 参数
  )

  if (result.status !== 200 || !result.data) {
    throw new Error("Failed to fetch model pricing")
  }

  checkResponseIsJson(result.data, apiUrl)

  // 转换数据格式以适配前端
  return transformPricingResponse(result.data)
}

/**
 * 获取 OneHub 类型的模型定价
 * OneHub 需要调用两个接口并转换数据格式
 */
async function fetchOneHubModelPricing(
  baseUrl: string,
  userId: number,
  accessToken: string,
  authType?: AuthTypeEnum,
  cookie?: string
): Promise<any> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  
  // 并行获取两个接口的数据
  const [availableModelResult, userGroupMapResult] = await Promise.all([
    proxyService.proxyRequest(
      `${normalizedBaseUrl}/api/available_model`,
      { method: "GET" },
      userId.toString(),
      accessToken,
      cookie,
      authType // 传递 authType 参数
    ),
    proxyService.proxyRequest(
      `${normalizedBaseUrl}/api/user_group_map`,
      { method: "GET" },
      userId.toString(),
      accessToken,
      cookie,
      authType // 传递 authType 参数
    )
  ])

  if (availableModelResult.status !== 200 || !availableModelResult.data) {
    throw new Error("Failed to fetch available models")
  }

  if (userGroupMapResult.status !== 200 || !userGroupMapResult.data) {
    throw new Error("Failed to fetch user group map")
  }

  checkResponseIsJson(availableModelResult.data, `${normalizedBaseUrl}/api/available_model`)
  checkResponseIsJson(userGroupMapResult.data, `${normalizedBaseUrl}/api/user_group_map`)

  const availableModel = availableModelResult.data
  const userGroupMap = userGroupMapResult.data

  // 转换数据格式
  return transformOneHubModelPricing(availableModel, userGroupMap)
}

/**
 * 转换 OneHub 模型定价格式为标准格式
 */
function transformOneHubModelPricing(
  modelPricing: Record<string, any>,
  userGroupMap: Record<string, any> = {}
): any {
  const data: any[] = Object.entries(modelPricing).map(([modelName, model]: [string, any]) => {
    const enableGroups = model.groups && model.groups.length > 0 ? model.groups : ["default"]
    const modelPrice = model.price || {}
    const inputPrice = modelPrice.input || 0
    const outputPrice = modelPrice.output || 0

    return {
      model_name: modelName,
      model_description: model.description || undefined,
      quota_type: modelPrice.type === "tokens" ? 0 : 1,
      model_ratio: 1,
      input_price: inputPrice,
      output_price: outputPrice,
      owner_by: model.owned_by || "",
      completion_ratio: inputPrice > 0 ? outputPrice / inputPrice : 1,
      enable_groups: enableGroups,
      endpoint_types: [] // 前端使用 endpoint_types 而不是 supported_endpoint_types
    }
  })

  const group_ratio: Record<string, number> = {}
  for (const [key, group] of Object.entries(userGroupMap)) {
    if (group && typeof group === 'object' && 'ratio' in group) {
      group_ratio[key] = group.ratio || 1
    }
  }

  const usable_group: Record<string, string> = {}
  for (const [key, group] of Object.entries(userGroupMap)) {
    if (group && typeof group === 'object' && 'name' in group) {
      usable_group[key] = group.name || key
    }
  }

  return {
    data,
    group_ratio,
    success: true,
    usable_group
  }
}

/**
 * 转换定价响应格式以适配前端
 * 将插件版格式（model_price 对象）转换为 Web 版格式（input_price 和 output_price）
 * 
 * 插件版格式：
 * - model_price: number | { input: number, output: number }
 * - supported_endpoint_types: string[]
 * 
 * Web 版格式：
 * - input_price: number
 * - output_price: number
 * - endpoint_types: string[]
 */
function transformPricingResponse(response: any): any {
  if (!response || !response.data || !Array.isArray(response.data)) {
    return response
  }

  const transformedData = response.data.map((model: any) => {
    // 处理 model_price 字段
    let inputPrice = 0
    let outputPrice = 0

    if (model.model_price !== undefined && model.model_price !== null) {
      if (typeof model.model_price === 'number') {
        // 如果是数字，说明是按次计费，使用该数字作为价格
        inputPrice = model.model_price
        outputPrice = model.model_price
      } else if (typeof model.model_price === 'object') {
        // 如果是对象，提取 input 和 output
        inputPrice = model.model_price.input || 0
        outputPrice = model.model_price.output || 0
      }
    }

    // 如果没有 model_price，但存在 model_ratio 和 completion_ratio
    // 说明是按量计费，需要根据 model_ratio 计算
    // 注意：实际价格会在前端通过 calculateModelPrice 计算，这里只提供基础数据
    if (inputPrice === 0 && outputPrice === 0 && model.model_ratio) {
      // 使用 model_ratio 作为基础价格（前端会乘以 2 和 groupRatio）
      inputPrice = model.model_ratio
      outputPrice = model.model_ratio * (model.completion_ratio || 1)
    }

    return {
      model_name: model.model_name || "",
      model_description: model.model_description,
      quota_type: model.quota_type ?? 0,
      input_price: inputPrice,
      output_price: outputPrice,
      model_ratio: model.model_ratio || 1,
      completion_ratio: model.completion_ratio || (inputPrice > 0 ? outputPrice / inputPrice : 1), // 确保传递 completion_ratio
      enable_groups: model.enable_groups || [],
      endpoint_types: model.supported_endpoint_types || model.endpoint_types || [],
      owner_by: model.owner_by
    }
  })

  return {
    ...response,
    data: transformedData
  }
}

