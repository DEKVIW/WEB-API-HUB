import { useState, useEffect } from "react"
import { Dialog, Button, Input, Label } from "../../../components/ui"
import { api } from "../../../services/api"
import toast from "react-hot-toast"

interface AccountDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  accountId?: string // 如果提供，则是编辑模式
}

export function AccountDialog({
  isOpen,
  onClose,
  onSuccess,
  accountId
}: AccountDialogProps) {
  const [formData, setFormData] = useState({
    baseUrl: "",
    siteName: "",
    userIdValue: "",
    accessToken: "",
    cookie: "",
    authType: "AccessToken" as "AccessToken" | "Cookie",
    notes: ""
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && accountId) {
      // 编辑模式：加载账号数据
      loadAccount()
    } else if (isOpen) {
      // 添加模式：重置表单
      setFormData({
        baseUrl: "",
        siteName: "",
        userIdValue: "",
        accessToken: "",
        cookie: "",
        authType: "AccessToken",
        notes: ""
      })
    }
  }, [isOpen, accountId])

  const loadAccount = async () => {
    if (!accountId) return
    try {
      const response = await api.getAccount(accountId)
      const account = response.data.data
      setFormData({
        baseUrl: account.baseUrl,
        siteName: account.siteName || "",
        userIdValue: account.userIdValue?.toString() || "",
        accessToken: account.accessToken || "",
        cookie: account.cookie || "",
        authType: account.authType || "AccessToken",
        notes: account.notes || ""
      })
    } catch (error: any) {
      toast.error(error.response?.data?.error || "加载账号失败")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 验证必填字段
      if (!formData.baseUrl.trim()) {
        toast.error("站点 URL 是必填项")
        setIsLoading(false)
        return
      }
      if (!formData.userIdValue) {
        toast.error("用户 ID 是必填项")
        setIsLoading(false)
        return
      }
      if (formData.authType === "AccessToken" && !formData.accessToken.trim()) {
        toast.error("访问令牌是必填项")
        setIsLoading(false)
        return
      }
      if (formData.authType === "Cookie" && !formData.cookie.trim()) {
        toast.error("Cookie 是必填项")
        setIsLoading(false)
        return
      }

      const data = {
        baseUrl: formData.baseUrl.trim(),
        siteName: formData.siteName.trim() || undefined,
        userIdValue: parseInt(formData.userIdValue),
        accessToken: formData.authType === "AccessToken" ? formData.accessToken.trim() : undefined,
        cookie: formData.authType === "Cookie" ? formData.cookie.trim() : (formData.cookie.trim() || undefined), // Cookie 在Cookie认证方式下是必填的，在AccessToken方式下是可选的（用于混合认证）
        authType: formData.authType,
        notes: formData.notes.trim() || undefined
      }

      if (accountId) {
        await api.updateAccount(accountId, data)
        toast.success("账号更新成功")
      } else {
        await api.createAccount(data)
        toast.success("账号添加成功")
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "操作失败")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={accountId ? "编辑账号" : "添加账号"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "保存中..." : accountId ? "更新" : "添加"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="baseUrl">站点 URL *</Label>
          <Input
            id="baseUrl"
            value={formData.baseUrl}
            onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
            placeholder="https://api.example.com"
            required
          />
        </div>

        <div>
          <Label htmlFor="siteName">站点名称</Label>
          <Input
            id="siteName"
            value={formData.siteName}
            onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
            placeholder="示例站点"
          />
        </div>

        <div>
          <Label htmlFor="userIdValue">用户 ID *</Label>
          <Input
            id="userIdValue"
            type="number"
            value={formData.userIdValue}
            onChange={(e) => setFormData({ ...formData, userIdValue: e.target.value })}
            placeholder="123"
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            需要在公益站后台的"用户信息"页面查看
          </p>
        </div>

        <div>
          <Label htmlFor="authType">认证方式</Label>
          <select
            id="authType"
            value={formData.authType}
            onChange={(e) =>
              setFormData({
                ...formData,
                authType: e.target.value as "AccessToken" | "Cookie"
              })
            }
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="AccessToken">Access Token</option>
            <option value="Cookie">Cookie</option>
          </select>
          {formData.authType === "Cookie" && (
            <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
              Cookie 认证使用您的当前登录账号，无法站点多账号，非必要请勿使用
            </p>
          )}
        </div>

        {formData.authType === "AccessToken" && (
          <>
            <div>
              <Label htmlFor="accessToken">访问令牌 *</Label>
              <Input
                id="accessToken"
                type="password"
                value={formData.accessToken}
                onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                placeholder="从账户后台获取"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                需要在公益站后台的"令牌管理"或"API密钥"页面获取
              </p>
            </div>

            <div>
              <Label htmlFor="cookie">Cookie（可选，用于混合认证）</Label>
              <Input
                id="cookie"
                type="password"
                value={formData.cookie}
                onChange={(e) => setFormData({ ...formData, cookie: e.target.value })}
                placeholder="从浏览器开发者工具中复制 Cookie 值"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                某些站点需要 Cookie（用户身份验证）+ AccessToken（指定密钥）的组合。
                <br />
                获取方法：在浏览器中登录目标站点 → 打开开发者工具（F12）→ Network → 找到任意请求 → Headers → 复制 Cookie 值
              </p>
            </div>
          </>
        )}

        {formData.authType === "Cookie" && (
          <div>
            <Label htmlFor="cookie">Cookie *</Label>
            <Input
              id="cookie"
              type="password"
              value={formData.cookie}
              onChange={(e) => setFormData({ ...formData, cookie: e.target.value })}
              placeholder="从浏览器开发者工具中复制 Cookie 值"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              获取方法：在浏览器中登录目标站点 → 打开开发者工具（F12）→ Network → 找到任意请求 → Headers → 复制 Cookie 值
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="notes">备注</Label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="备注信息..."
            rows={3}
            className="flex w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>
    </Dialog>
  )
}

