import express from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import { accountsRouter } from "./routes/accounts.js"
import { tokensRouter } from "./routes/tokens.js"
import { modelsRouter } from "./routes/models.js"
import { proxyRouter } from "./routes/proxy.js"
import { authRouter } from "./routes/auth.js"
import { usersRouter } from "./routes/users.js"
import { preferencesRouter } from "./routes/preferences.js"
import { statsRouter } from "./routes/stats.js"
import { importExportRouter } from "./routes/importExport.js"
import { sortingRouter } from "./routes/sorting.js"
import { checkinRouter } from "./routes/checkin.js"
import { webdavRouter } from "./routes/webdav.js"
import { modelSyncRouter } from "./routes/modelSync.js"
import { errorHandler, AppError } from "./middleware/errorHandler.js"
import { autoRefreshService } from "./services/autoRefreshService.js"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

dotenv.config()

const prisma = new PrismaClient()

/**
 * 初始化默认管理员账户
 */
async function initializeAdminUser() {
  try {
    // 等待一小段时间确保数据库表已创建（prisma db push 在启动命令中执行）
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 检查是否已有用户
    const userCount = await prisma.user.count()
    if (userCount > 0) {
      console.log(`ℹ️  Users already exist (${userCount}), skipping admin initialization`)
      return
    }

    // 从环境变量读取管理员信息
    const adminUsername = process.env.ADMIN_USERNAME || "admin"
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com"
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123456"

    if (!adminPassword || adminPassword.length < 6) {
      console.warn("⚠️  ADMIN_PASSWORD is too short or not set, using default password")
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    // 创建管理员用户
    const adminUser = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword
      }
    })

    // 创建默认偏好设置
    await prisma.userPreferences.create({
      data: {
        userId: adminUser.id
      }
    })

    console.log(`✅ Admin user created: ${adminUsername} (${adminEmail})`)
    console.log(`⚠️  Please change the default password after first login!`)
  } catch (error: any) {
    // 如果是唯一约束错误，说明用户已存在，忽略
    if (error?.code === "P2002") {
      console.log(`ℹ️  Admin user already exists`)
    } else {
      console.error(`❌ Failed to initialize admin user:`, error)
    }
  }
}

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(helmet())
// CORS 配置 - 支持多个来源
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:5173"
app.use(
  cors({
    origin: (origin, callback) => {
      // 允许的源列表
      const allowedOrigins = [
        corsOrigin,
        "http://localhost:15173",
        "http://localhost:5173",
        "http://192.168.8.5:15173",
        "http://192.168.208.3:5173"
      ]
      
      // 如果没有 origin（例如同源请求或 Postman），允许
      if (!origin) {
        return callback(null, true)
      }
      
      // 检查是否在允许列表中，或者匹配 CORS_ORIGIN
      if (allowedOrigins.includes(origin) || origin.startsWith(corsOrigin.replace(/:\d+$/, ""))) {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true
  })
)
// 配置 JSON 序列化，支持 BigInt
app.use(express.json({
  reviver: (key, value) => {
    // 处理 BigInt（Prisma 返回的 ID 等可能是 BigInt）
    if (typeof value === 'bigint') {
      return value.toString()
    }
    return value
  }
}))

// 添加自定义 JSON 序列化器，处理 BigInt
const originalJson = express.response.json
express.response.json = function(body: any) {
  // 递归转换 BigInt 为字符串
  const convertBigInt = (obj: any): any => {
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
  
  const convertedBody = convertBigInt(body)
  return originalJson.call(this, convertedBody)
}

app.use(cookieParser())

// 健康检查
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// API 路由
app.get("/api", (req, res) => {
  res.json({ message: "All API Hub Backend API" })
})

// 认证路由
app.use("/api/auth", authRouter)
app.use("/api/users", usersRouter)

// 排序路由（必须在 /api/accounts/:id 之前注册，避免路由冲突）
app.use("/api/accounts/sorting", sortingRouter)

// 账号管理路由
app.use("/api/accounts", accountsRouter)

// Token 管理路由（嵌套在 accounts 下）
app.use("/api/accounts", tokensRouter)

// 模型管理路由（嵌套在 accounts 下）
app.use("/api/accounts", modelsRouter)

// API 代理路由（解决 CORS）
app.use("/api/proxy", proxyRouter)

// 用户偏好设置路由
app.use("/api/preferences", preferencesRouter)

// 统计信息路由
app.use("/api/stats", statsRouter)

// 导入导出路由
app.use("/api/import-export", importExportRouter)

// 签到路由
app.use("/api/checkin", checkinRouter)

// WebDAV 路由
app.use("/api/webdav", webdavRouter)

// 模型同步路由
app.use("/api/model-sync", modelSyncRouter)

// 404 处理
app.use((req, res, next) => {
  next(new AppError(404, "Route not found"))
})

// 错误处理
app.use(errorHandler)

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`🔗 API: http://localhost:${PORT}/api`)

  // 初始化默认管理员账户
  await initializeAdminUser()

  // 初始化自动刷新服务
  try {
    await autoRefreshService.initializeAllUsers()
    console.log(`✅ Auto refresh service initialized`)
  } catch (error) {
    console.error(`❌ Failed to initialize auto refresh service:`, error)
  }
})

