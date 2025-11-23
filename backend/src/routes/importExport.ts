import express, { Response, NextFunction } from "express"
import { authenticate, AuthRequest } from "../middleware/auth.js"
import { exportAccounts, importAccounts, validateImportData } from "../services/importExportService.js"
import { AppError } from "../middleware/errorHandler.js"

const router = express.Router()

// 所有路由都需要认证
router.use(authenticate)

/**
 * GET /api/import-export/export
 * 导出所有账号数据
 */
router.get(
  "/export",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await exportAccounts(req.userId!)
      res.json({
        success: true,
        data
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/import-export/import
 * 导入账号数据
 */
router.post(
  "/import",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const importData = req.body

      // 验证数据格式
      const validation = validateImportData(importData)
      if (!validation.valid) {
        throw new AppError(400, `数据格式错误: ${validation.errors.join(", ")}`)
      }

      // 导入数据
      const result = await importAccounts(req.userId!, importData)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/import-export/validate
 * 验证导入数据格式
 */
router.post(
  "/validate",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validation = validateImportData(req.body)
      res.json({
        success: true,
        data: validation
      })
    } catch (error) {
      next(error)
    }
  }
)

export { router as importExportRouter }

