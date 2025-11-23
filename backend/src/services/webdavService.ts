import { PrismaClient } from "@prisma/client"
import axios from "axios"
import { importExportService } from "./importExportService.js"

const prisma = new PrismaClient()

/**
 * WebDAV 服务
 * 实现 WebDAV 备份和同步功能
 */
export class WebDAVService {
  /**
   * 构建 Basic Auth Header
   */
  private buildAuthHeader(username: string, password: string): string {
    const token = Buffer.from(`${username}:${password}`).toString("base64")
    return `Basic ${token}`
  }

  /**
   * 确保备份目录存在
   */
  private async ensureBackupDirectory(
    baseUrl: string,
    username: string,
    password: string
  ): Promise<boolean> {
    const backupDir = `${baseUrl.replace(/\/$/, "")}/all-api-hub-backup`
    
    try {
      // 尝试创建目录
      const response = await axios.request({
        method: "MKCOL",
        url: backupDir,
        headers: {
          Authorization: this.buildAuthHeader(username, password)
        },
        validateStatus: () => true // 不抛出错误
      })

      // 201 创建成功，405 已存在，其他 2xx 也视为成功
      if (
        response.status === 201 ||
        response.status === 405 ||
        (response.status >= 200 && response.status < 300)
      ) {
        return true
      }

      // 如果失败，尝试带斜杠的 URL
      if (!backupDir.endsWith("/")) {
        const response2 = await axios.request({
          method: "MKCOL",
          url: `${backupDir}/`,
          headers: {
            Authorization: this.buildAuthHeader(username, password)
          },
          validateStatus: () => true
        })

        if (
          response2.status === 201 ||
          response2.status === 405 ||
          (response2.status >= 200 && response2.status < 300)
        ) {
          return true
        }
      }

      return true // 容错处理，假设目录已存在
    } catch (error) {
      console.error("[WebDAV] Failed to ensure backup directory:", error)
      return true // 容错处理
    }
  }

  /**
   * 获取备份文件 URL
   */
  private getBackupFileUrl(baseUrl: string): string {
    const cleanUrl = baseUrl.replace(/\/$/, "")
    return `${cleanUrl}/all-api-hub-backup/all-api-hub-1-0.json`
  }

  /**
   * 测试 WebDAV 连接
   */
  async testConnection(
    url: string,
    username: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      if (!url || !username || !password) {
        return { success: false, message: "配置不完整" }
      }

      const testUrl = this.getBackupFileUrl(url)

      const response = await axios.request({
        method: "GET",
        url: testUrl,
        headers: {
          Authorization: this.buildAuthHeader(username, password)
        },
        validateStatus: () => true // 不抛出错误
      })

      // 200 文件存在，404 文件不存在但鉴权通过也视为连通
      if (response.status === 200 || response.status === 404) {
        return { success: true, message: "连接成功" }
      }

      if (response.status === 401 || response.status === 403) {
        return { success: false, message: "认证失败，请检查用户名和密码" }
      }

      return {
        success: false,
        message: `连接失败，状态码: ${response.status}`
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "连接失败"
      }
    }
  }

  /**
   * 上传备份
   */
  async uploadBackup(
    userId: string,
    url: string,
    username: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      if (!url || !username || !password) {
        return { success: false, message: "配置不完整" }
      }

      // 导出数据
      const exportData = await importExportService.exportData(userId)
      const content = JSON.stringify(exportData, null, 2)

      // 确保备份目录存在
      await this.ensureBackupDirectory(url, username, password)

      // 上传文件
      const fileUrl = this.getBackupFileUrl(url)
      const response = await axios.put(fileUrl, content, {
        headers: {
          Authorization: this.buildAuthHeader(username, password),
          "Content-Type": "application/json"
        },
        validateStatus: () => true
      })

      if (response.status >= 200 && response.status < 300) {
        return { success: true, message: "上传成功" }
      }

      if (response.status === 401 || response.status === 403) {
        return { success: false, message: "认证失败" }
      }

      return {
        success: false,
        message: `上传失败，状态码: ${response.status}`
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "上传失败"
      }
    }
  }

  /**
   * 下载并导入备份
   */
  async downloadAndImport(
    userId: string,
    url: string,
    username: string,
    password: string
  ): Promise<{ success: boolean; message?: string; imported?: number }> {
    try {
      if (!url || !username || !password) {
        return { success: false, message: "配置不完整" }
      }

      // 下载文件
      const fileUrl = this.getBackupFileUrl(url)
      const response = await axios.get(fileUrl, {
        headers: {
          Authorization: this.buildAuthHeader(username, password),
          Accept: "application/json"
        },
        validateStatus: () => true
      })

      if (response.status === 404) {
        return { success: false, message: "备份文件不存在" }
      }

      if (response.status !== 200) {
        if (response.status === 401 || response.status === 403) {
          return { success: false, message: "认证失败" }
        }
        return {
          success: false,
          message: `下载失败，状态码: ${response.status}`
        }
      }

      // 解析并导入数据
      const data = typeof response.data === "string" 
        ? JSON.parse(response.data) 
        : response.data

      const result = await importExportService.importData(userId, data)

      return {
        success: true,
        message: "导入成功",
        imported: result.migratedCount || 0
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { success: false, message: "备份文件不存在" }
      }
      return {
        success: false,
        message: error.message || "导入失败"
      }
    }
  }
}

export const webdavService = new WebDAVService()

