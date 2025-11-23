import express, { Response, NextFunction } from "express"
import { accountStorageService } from "../services/accountStorageService.js"
import {
  fetchAccountAvailableModels,
  fetchModelPricing
} from "../services/apiService.js"
import { authenticate, AuthRequest } from "../middleware/auth.js"
import { AppError } from "../middleware/errorHandler.js"

const router = express.Router()

// 所有路由都需要认证
router.use(authenticate)

/**
 * GET /api/accounts/:accountId/models
 * 获取账号的可用模型列表
 */
router.get(
  "/:accountId/models",
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

          const models = await fetchAccountAvailableModels(
            account.baseUrl,
            account.userIdValue,
            account.accessToken || "", // Cookie认证时可能为空，但函数需要这个参数
            account.authType as any,
            account.cookie || undefined
          )

      res.json({
        success: true,
        data: models
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/accounts/:accountId/models/pricing
 * 获取模型价格信息
 */
router.get(
  "/:accountId/models/pricing",
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

          const pricing = await fetchModelPricing(
            account.baseUrl,
            account.userIdValue,
            account.accessToken || "", // Cookie认证时可能为空，但函数需要这个参数
            account.authType as any,
            account.cookie || undefined,
            account.siteType || undefined
          )

      res.json({
        success: true,
        data: pricing
      })
    } catch (error) {
      next(error)
    }
  }
)

export { router as modelsRouter }

