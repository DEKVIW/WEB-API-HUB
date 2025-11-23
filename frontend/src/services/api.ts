import axios, { AxiosInstance } from "axios"

// 动态获取 API URL
// 如果 VITE_API_URL 是相对路径，使用当前页面的协议和主机
// 如果是绝对路径，直接使用
function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"
  
  // 如果是相对路径（以 / 开头），使用当前页面的协议和主机
  if (envUrl.startsWith("/")) {
    return envUrl
  }
  
  // 如果是绝对路径，检查是否包含 localhost
  // 如果包含 localhost，尝试替换为当前页面的主机
  if (envUrl.includes("localhost")) {
    const currentHost = window.location.hostname
    const currentPort = window.location.port || (window.location.protocol === "https:" ? "443" : "80")
    
    // 从 envUrl 中提取端口号
    const urlMatch = envUrl.match(/:\d+/)
    const envPort = urlMatch ? urlMatch[0].substring(1) : "3000"
    
    // 如果当前端口是 15173（前端端口），使用 62000（后端端口）
    const backendPort = currentPort === "15173" ? "62000" : envPort
    
    // 构建新的 URL
    const protocol = window.location.protocol
    return `${protocol}//${currentHost}:${backendPort}`
  }
  
  return envUrl
}

const API_URL = getApiUrl()

/**
 * API 客户端
 * 封装所有 API 请求
 */
class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      withCredentials: true, // 支持 cookie
      headers: {
        "Content-Type": "application/json"
      }
    })

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 可以在这里添加 token 等
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // 处理 401 未授权错误
        if (error.response?.status === 401) {
          // 可以在这里处理登录跳转
          console.error("Unauthorized, please login")
        }
        return Promise.reject(error)
      }
    )
  }

  // 认证相关
  async login(data: { username: string; password: string }) {
    return this.client.post("/api/auth/login", data)
  }

  async logout() {
    return this.client.post("/api/auth/logout")
  }

  async getCurrentUser() {
    return this.client.get("/api/auth/me")
  }

  // 账号管理
  async getAccounts(display: boolean = false) {
    return this.client.get("/api/accounts", {
      params: { display: display ? "true" : "false" }
    })
  }

  async getAccount(id: string, display: boolean = false) {
    return this.client.get(`/api/accounts/${id}`, {
      params: { display: display ? "true" : "false" }
    })
  }

  async createAccount(data: any) {
    return this.client.post("/api/accounts?display=true", data)
  }

  async updateAccount(id: string, data: any) {
    return this.client.put(`/api/accounts/${id}`, data)
  }

  async deleteAccount(id: string) {
    return this.client.delete(`/api/accounts/${id}`)
  }

  async refreshAccount(id: string) {
    return this.client.post(`/api/accounts/${id}/refresh`)
  }

  // API 代理（解决 CORS）
  async proxyRequest(config: {
    url: string
    method?: string
    headers?: Record<string, string>
    body?: any
    params?: Record<string, any>
    userId?: string
    accessToken?: string
    cookie?: string
  }) {
    return this.client.post("/api/proxy", config)
  }

  // 用户偏好设置
  async getPreferences() {
    return this.client.get("/api/preferences")
  }

  async updatePreferences(data: any) {
    return this.client.put("/api/preferences", data)
  }

  // Token 管理
  async getTokens(accountId: string, page?: number, pageSize?: number, all?: boolean) {
    return this.client.get(`/api/accounts/${accountId}/tokens`, {
      params: { page, pageSize, all: all ? "true" : "false" }
    })
  }

  async createToken(accountId: string, data: any) {
    return this.client.post(`/api/accounts/${accountId}/tokens`, data)
  }

  async updateToken(accountId: string, tokenId: string, data: any) {
    return this.client.put(`/api/accounts/${accountId}/tokens/${tokenId}`, data)
  }

  async deleteToken(accountId: string, tokenId: string) {
    return this.client.delete(`/api/accounts/${accountId}/tokens/${tokenId}`)
  }

  // 模型管理
  async getModels(accountId: string) {
    return this.client.get(`/api/accounts/${accountId}/models`)
  }

  async getModelPricing(accountId: string) {
    return this.client.get(`/api/accounts/${accountId}/models/pricing`)
  }

  // 统计信息
  async getStats() {
    return this.client.get("/api/stats")
  }

  // 导入导出
  async exportData() {
    return this.client.get("/api/import-export/export")
  }

  async importData(data: any) {
    return this.client.post("/api/import-export/import", data)
  }

  async validateImportData(data: any) {
    return this.client.post("/api/import-export/validate", data)
  }

  // 排序功能
  async getAccountSorting() {
    return this.client.get("/api/accounts/sorting")
  }

  async pinAccount(accountId: string) {
    return this.client.post(`/api/accounts/${accountId}/pin`)
  }

  async unpinAccount(accountId: string) {
    return this.client.post(`/api/accounts/${accountId}/unpin`)
  }

  async updateAccountAutoRefresh(data: {
    accountIds: string[]
    autoRefreshEnabled: boolean
    autoRefreshInterval?: number
  }) {
    return this.client.put("/api/accounts/auto-refresh", data)
  }

  async updateAccountSorting(accountIds: string[]) {
    return this.client.put("/api/accounts/sorting", { accountIds })
  }

  // 签到功能
  async getCheckinStatus() {
    return this.client.get("/api/checkin/status")
  }

  async getCheckinHistory(params?: {
    page?: number
    pageSize?: number
    accountId?: string
    status?: string
  }) {
    return this.client.get("/api/checkin/history", { params })
  }

  async runCheckin() {
    return this.client.post("/api/checkin/run")
  }

  // 模型同步功能
  async getModelSyncStatus() {
    return this.client.get("/api/model-sync/status")
  }

  async getModelSyncHistory(params?: {
    page?: number
    pageSize?: number
    accountId?: string
    status?: string
  }) {
    return this.client.get("/api/model-sync/history", { params })
  }

  async getModelSyncChannels() {
    return this.client.get("/api/model-sync/channels")
  }

  async runModelSync() {
    return this.client.post("/api/model-sync/run")
  }

  async runModelSyncSelected(accountIds: string[]) {
    return this.client.post("/api/model-sync/run-selected", { accountIds })
  }

  // WebDAV 功能
  async testWebdavConnection(data: { url: string; username: string; password: string }) {
    return this.client.post("/api/webdav/test", data)
  }

  async uploadWebdavBackup(data: { url: string; username: string; password: string }) {
    return this.client.post("/api/webdav/upload", data)
  }

  async downloadWebdavBackup(data: { url: string; username: string; password: string }) {
    return this.client.post("/api/webdav/download", data)
  }

  // 清空数据
  async clearAllAccounts() {
    return this.client.delete("/api/accounts/all")
  }

  // 用户管理
  async updateUserProfile(data: { username?: string; email?: string }) {
    return this.client.put("/api/users/profile", data)
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.client.put("/api/users/password", data)
  }
}

export const api = new ApiClient()

