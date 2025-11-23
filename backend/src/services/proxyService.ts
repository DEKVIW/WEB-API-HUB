import axios, { AxiosRequestConfig, AxiosResponse } from "axios"

/**
 * API 代理服务
 * 解决 CORS 问题：后端作为代理服务器，转发请求到目标站点
 */
export class ProxyService {
  /**
   * 代理请求到外部 API
   * @param url 目标 URL
   * @param options 请求选项（方法、headers、body 等）
   * @param userId 用户 ID（用于某些站点需要 User-ID header）
   * @param accessToken 访问令牌
   * @param cookie 可选的 Cookie（用于混合认证：某些站点需要 Cookie + AccessToken）
   * @param authType 认证类型（AccessToken | Cookie），用于决定使用哪种认证方式
   */
  async proxyRequest(
    url: string,
    options: {
      method?: string
      headers?: Record<string, string>
      body?: any
      params?: Record<string, any>
    } = {},
    userId?: string,
    accessToken?: string,
    cookie?: string,
    authType?: "AccessToken" | "Cookie" | "None" | "None"
  ): Promise<{
    status: number
    headers: Record<string, string>
    data: any
  }> {
    try {
      const authHeaders = this.buildAuthHeaders(userId, accessToken, cookie, authType)
      
      const config: AxiosRequestConfig = {
        method: options.method || "GET",
        url,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          ...authHeaders,
          ...options.headers
        },
        params: options.params,
        data: options.body,
        timeout: 30000,
        validateStatus: () => true,
        withCredentials: false
      }

      const response: AxiosResponse = await axios(config)
      const contentType = response.headers['content-type'] || ''
      
      if (!contentType.includes('application/json') && contentType.includes('text/html')) {
        console.error("❌ API returned HTML instead of JSON!")
        console.error("  Request URL:", url)
        console.error("  Response URL:", response.request?.responseURL || url)
        console.error("  Response status:", response.status)
        console.error("  Content-Type:", contentType)
        console.error("  Auth header present:", !!authHeaders["Authorization"])
        console.error("  Auth header value:", authHeaders["Authorization"]?.substring(0, 30) + "...")
        console.error("  This usually means:")
        console.error("  1. Authentication failed (AccessToken invalid or expired)")
        console.error("  2. URL is incorrect or endpoint doesn't exist")
        console.error("  3. Request was redirected to login page")
      }

      const responseHeaders: Record<string, string> = {}
      Object.keys(response.headers).forEach((key) => {
        responseHeaders[key] = String(response.headers[key])
      })

      return {
        status: response.status,
        headers: responseHeaders,
        data: response.data
      }
    } catch (error: any) {
      throw new Error(
        `Proxy request failed: ${error.message || "Unknown error"}`
      )
    }
  }

  /**
   * 构建认证头
   * @param userId 用户 ID
   * @param accessToken 访问令牌
   * @param cookie 可选的 Cookie（用于混合认证：某些站点需要 Cookie + AccessToken）
   * @param authType 认证类型（AccessToken | Cookie | None），用于决定使用哪种认证方式
   */
  private buildAuthHeaders(
    userId?: string,
    accessToken?: string,
    cookie?: string,
    authType?: "AccessToken" | "Cookie" | "None" | "None"
  ): Record<string, string> {
    const headers: Record<string, string> = {}

    if (userId) {
      headers["New-API-User"] = userId
      headers["Veloera-User"] = userId
      headers["voapi-user"] = userId
      headers["User-id"] = userId
      headers["Rix-Api-User"] = userId
      headers["neo-api-user"] = userId
    }

    if (authType === "Cookie") {
      if (cookie) {
        headers["Cookie"] = cookie
      }
    } else if (authType === "AccessToken") {
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`
      }
      headers["Cookie"] = cookie || ""
    } else if (authType === "None") {
      // 不使用任何认证
    } else {
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`
        if (!cookie) {
          headers["Cookie"] = ""
        }
      }
      if (cookie) {
        headers["Cookie"] = cookie
      }
    }

    return headers
  }

  /**
   * 使用 Cookie 认证的代理请求
   */
  async proxyRequestWithCookie(
    url: string,
    cookie: string,
    options: {
      method?: string
      headers?: Record<string, string>
      body?: any
      params?: Record<string, any>
    } = {}
  ): Promise<{
    status: number
    headers: Record<string, string>
    data: any
  }> {
    const config: AxiosRequestConfig = {
      method: options.method || "GET",
      url,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        Cookie: cookie,
        ...options.headers
      },
      params: options.params,
      data: options.body,
      timeout: 30000,
      validateStatus: () => true
    }

    try {
      const response: AxiosResponse = await axios(config)

      const responseHeaders: Record<string, string> = {}
      Object.keys(response.headers).forEach((key) => {
        responseHeaders[key] = String(response.headers[key])
      })

      return {
        status: response.status,
        headers: responseHeaders,
        data: response.data
      }
    } catch (error: any) {
      throw new Error(
        `Proxy request with cookie failed: ${error.message || "Unknown error"}`
      )
    }
  }
}

export const proxyService = new ProxyService()

