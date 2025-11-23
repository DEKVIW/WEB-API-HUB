import express, { Response, NextFunction } from "express"
import { accountStorageService } from "../services/accountStorageService.js"
import {
  fetchAccountTokens,
  fetchAllAccountTokens,
  fetchTokenById,
  createApiToken,
  updateApiToken,
  deleteApiToken
} from "../services/tokenService.js"
import { authenticate, AuthRequest } from "../middleware/auth.js"
import { AppError } from "../middleware/errorHandler.js"

const router = express.Router()

/**
 * 转换 Token 数据格式以匹配前端期望的格式
 * 将后端 snake_case 字段转换为前端 camelCase 字段
 * 将时间戳从秒转换为毫秒
 */
function transformTokenData(token: any): any {
  // 处理时间戳：如果已经是毫秒级（大于 1e12），直接使用；否则乘以 1000
  const convertTimestamp = (ts: any): number | null => {
    if (!ts) return null
    const num = typeof ts === "number" ? ts : Number(ts)
    if (isNaN(num)) return null
    // 如果时间戳小于 1e12，认为是秒级，需要转换为毫秒
    return num < 1e12 ? num * 1000 : num
  }

  return {
    id: token.id?.toString() || String(token.tokenId || Date.now()),
    tokenId: token.id || token.tokenId,
    userId: token.user_id || token.userId,
    name: token.name || "",
    key: token.key || "",
    status: token.status ?? 1,
    usedQuota: token.used_quota ?? token.usedQuota ?? 0,
    remainQuota: token.remain_quota ?? token.remainQuota ?? 0,
    unlimited: token.unlimited_quota ?? token.unlimited ?? false,
    expiredTime: convertTimestamp(token.expired_time || token.expiredTime),
    createdTime: convertTimestamp(token.created_time || token.createdTime),
    accessedTime: convertTimestamp(token.accessed_time || token.accessedTime),
    modelLimitsEnabled: token.model_limits_enabled ?? token.modelLimitsEnabled ?? false,
    modelLimits: token.model_limits ?? token.modelLimits ?? "",
    allowIps: token.allow_ips ?? token.allowIps ?? "",
    group: token.group ?? "",
    models: token.models ?? "",
    createdAt: token.created_time 
      ? new Date(convertTimestamp(token.created_time)!).toISOString() 
      : new Date().toISOString(),
    updatedAt: token.accessed_time 
      ? new Date(convertTimestamp(token.accessed_time)!).toISOString() 
      : new Date().toISOString()
  }
}

// 所有路由都需要认证
router.use(authenticate)

/**
 * GET /api/accounts/:accountId/tokens
 * 获取账号的所有 Token
 */
router.get(
  "/:accountId/tokens",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { accountId } = req.params
      const { all = "false", page, size } = req.query

      // 验证账号属于当前用户
      const account = await accountStorageService.getAccountById(
        accountId,
        req.userId!
      )

      if (!account) {
        throw new AppError(404, "Account not found")
      }

      if (!account.userIdValue) {
        throw new AppError(400, "Account missing userId")
      }
      if (account.authType === "AccessToken" && !account.accessToken) {
        throw new AppError(400, "Account missing accessToken")
      }
      if (account.authType === "Cookie" && !account.cookie) {
        throw new AppError(400, "Account missing cookie")
      }

      let tokens

      if (all === "true") {
        // 获取所有 Token（自动分页）
        tokens = await fetchAllAccountTokens(
          account.baseUrl,
          account.userIdValue,
          account.accessToken || "", // Cookie认证时可能为空，但函数需要这个参数
          account.authType as any,
          account.cookie || undefined
        )
      } else {
        // 分页获取
        const pageNum = page ? parseInt(page as string) : 0
        const pageSize = size ? parseInt(size as string) : 100

        tokens = await fetchAccountTokens(
          account.baseUrl,
          account.userIdValue,
          account.accessToken || "", // Cookie认证时可能为空，但函数需要这个参数
          pageNum,
          pageSize,
          account.authType as any,
          account.cookie || undefined
        )
      }

      // 转换 Token 数据格式以匹配前端期望的格式
      const transformedTokens = tokens.map(transformTokenData)

      res.json({
        success: true,
        data: transformedTokens
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/accounts/:accountId/tokens/:tokenId
 * 获取单个 Token
 */
router.get(
  "/:accountId/tokens/:tokenId",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { accountId, tokenId } = req.params

      const account = await accountStorageService.getAccountById(
        accountId,
        req.userId!
      )

      if (!account) {
        throw new AppError(404, "Account not found")
      }

      if (!account.userIdValue) {
        throw new AppError(400, "Account missing userId")
      }
      if (account.authType === "AccessToken" && !account.accessToken) {
        throw new AppError(400, "Account missing accessToken")
      }
      if (account.authType === "Cookie" && !account.cookie) {
        throw new AppError(400, "Account missing cookie")
      }

      const token = await fetchTokenById(
        account.baseUrl,
        account.userIdValue,
        account.accessToken || "", // Cookie认证时可能为空，但函数需要这个参数
        parseInt(tokenId),
        account.authType as any,
        account.cookie || undefined
      )

      if (!token) {
        throw new AppError(404, "Token not found")
      }

      // 转换 Token 数据格式
      const transformedToken = transformTokenData(token)

      res.json({
        success: true,
        data: transformedToken
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/accounts/:accountId/tokens
 * 创建新的 Token
 */
router.post(
  "/:accountId/tokens",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { accountId } = req.params

      const account = await accountStorageService.getAccountById(
        accountId,
        req.userId!
      )

      if (!account) {
        throw new AppError(404, "Account not found")
      }

      if (!account.userIdValue) {
        throw new AppError(400, "Account missing userId")
      }
      if (account.authType === "AccessToken" && !account.accessToken) {
        throw new AppError(400, "Account missing accessToken")
      }
      if (account.authType === "Cookie" && !account.cookie) {
        throw new AppError(400, "Account missing cookie")
      }

      const token = await createApiToken(
        account.baseUrl,
        account.userIdValue,
        account.accessToken || "", // Cookie认证时可能为空，但函数需要这个参数
        req.body,
        account.authType as any,
        account.cookie || undefined
      )

      // 转换 Token 数据格式
      const transformedToken = transformTokenData(token)

      res.status(201).json({
        success: true,
        data: transformedToken
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * PUT /api/accounts/:accountId/tokens/:tokenId
 * 更新 Token
 */
router.put(
  "/:accountId/tokens/:tokenId",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { accountId, tokenId } = req.params

      const account = await accountStorageService.getAccountById(
        accountId,
        req.userId!
      )

      if (!account) {
        throw new AppError(404, "Account not found")
      }

      if (!account.userIdValue) {
        throw new AppError(400, "Account missing userId")
      }
      if (account.authType === "AccessToken" && !account.accessToken) {
        throw new AppError(400, "Account missing accessToken")
      }
      if (account.authType === "Cookie" && !account.cookie) {
        throw new AppError(400, "Account missing cookie")
      }

      const token = await updateApiToken(
        account.baseUrl,
        account.userIdValue,
        account.accessToken || "", // Cookie认证时可能为空，但函数需要这个参数
        parseInt(tokenId),
        req.body,
        account.authType as any,
        account.cookie || undefined
      )

      // 转换 Token 数据格式
      const transformedToken = transformTokenData(token)

      res.json({
        success: true,
        data: transformedToken
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * DELETE /api/accounts/:accountId/tokens/:tokenId
 * 删除 Token
 */
router.delete(
  "/:accountId/tokens/:tokenId",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { accountId, tokenId } = req.params

      const account = await accountStorageService.getAccountById(
        accountId,
        req.userId!
      )

      if (!account) {
        throw new AppError(404, "Account not found")
      }

      if (!account.userIdValue) {
        throw new AppError(400, "Account missing userId")
      }
      if (account.authType === "AccessToken" && !account.accessToken) {
        throw new AppError(400, "Account missing accessToken")
      }
      if (account.authType === "Cookie" && !account.cookie) {
        throw new AppError(400, "Account missing cookie")
      }

      await deleteApiToken(
        account.baseUrl,
        account.userIdValue,
        account.accessToken || "", // Cookie认证时可能为空，但函数需要这个参数
        parseInt(tokenId),
        account.authType as any,
        account.cookie || undefined
      )

      res.json({
        success: true
      })
    } catch (error) {
      next(error)
    }
  }
)

export { router as tokensRouter }

