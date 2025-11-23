import express from "express"
import { proxyService } from "../services/proxyService.js"
import { authenticate, AuthRequest } from "../middleware/auth.js"

const router = express.Router()

/**
 * POST /api/proxy
 * 代理请求到外部 API（解决 CORS）
 * 
 * Body:
 * {
 *   url: string,           // 目标 URL
 *   method?: string,       // HTTP 方法 (GET, POST, etc.)
 *   headers?: object,     // 自定义 headers
 *   body?: any,           // 请求体
 *   params?: object,      // URL 参数
 *   userId?: string,      // 用户 ID（用于某些站点）
 *   accessToken?: string, // 访问令牌
 *   cookie?: string       // Cookie（如果使用 Cookie 认证）
 * }
 */
router.post("/", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const {
      url,
      method = "GET",
      headers = {},
      body,
      params,
      userId,
      accessToken,
      cookie
    } = req.body

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "URL is required"
      })
    }

    // 验证 URL 格式
    try {
      new URL(url)
    } catch {
      return res.status(400).json({
        success: false,
        error: "Invalid URL format"
      })
    }

    let result

    // 如果提供了 Cookie，使用 Cookie 认证
    if (cookie) {
      result = await proxyService.proxyRequestWithCookie(url, cookie, {
        method,
        headers,
        body,
        params
      })
    } else {
      // 使用 Access Token 或 User ID 认证
      result = await proxyService.proxyRequest(
        url,
        {
          method,
          headers,
          body,
          params
        },
        userId,
        accessToken
      )
    }

    res.json({
      success: result.status >= 200 && result.status < 300,
      status: result.status,
      headers: result.headers,
      data: result.data
    })
  } catch (error: any) {
    next(error)
  }
})

export { router as proxyRouter }

