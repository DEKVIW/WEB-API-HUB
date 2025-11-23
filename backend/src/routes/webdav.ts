import express from "express"
import { authenticate, AuthRequest } from "../middleware/auth.js"
import { webdavService } from "../services/webdavService.js"

const router = express.Router()

// 所有路由都需要认证
router.use(authenticate)

/**
 * POST /api/webdav/test
 * 测试 WebDAV 连接
 */
router.post("/test", async (req: AuthRequest, res, next) => {
  try {
    const { url, username, password } = req.body

    if (!url || !username || !password) {
      return res.status(400).json({
        success: false,
        error: "缺少必要参数"
      })
    }

    const result = await webdavService.testConnection(url, username, password)

    res.json({
      success: result.success,
      message: result.message
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/webdav/upload
 * 上传备份到 WebDAV
 */
router.post("/upload", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!
    const { url, username, password } = req.body

    if (!url || !username || !password) {
      return res.status(400).json({
        success: false,
        error: "缺少必要参数"
      })
    }

    const result = await webdavService.uploadBackup(userId, url, username, password)

    res.json({
      success: result.success,
      message: result.message
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/webdav/download
 * 从 WebDAV 下载并导入备份
 */
router.post("/download", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!
    const { url, username, password } = req.body

    if (!url || !username || !password) {
      return res.status(400).json({
        success: false,
        error: "缺少必要参数"
      })
    }

    const result = await webdavService.downloadAndImport(userId, url, username, password)

    res.json({
      success: result.success,
      message: result.message,
      imported: result.imported
    })
  } catch (error) {
    next(error)
  }
})

export { router as webdavRouter }

