import { useState, useEffect } from "react"
import { Dialog, Button, Input, Label, Select } from "../../../components/ui"
import { api } from "../../../services/api"
import toast from "react-hot-toast"
import type { ApiToken, DisplaySiteData } from "../../../types"

interface AddTokenDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  accountId: string | null
  accounts: DisplaySiteData[]
  editingToken?: ApiToken | null
}

export function AddTokenDialog({
  isOpen,
  onClose,
  onSuccess,
  accountId,
  accounts,
  editingToken
}: AddTokenDialogProps) {
  const [formData, setFormData] = useState({
    accountId: accountId || "",
    name: "",
    key: "",
    status: "1",
    unlimited: false,
    remainQuota: "",
    expiredTime: "",
    modelLimitsEnabled: false,
    modelLimits: "",
    allowIps: "",
    group: ""
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (editingToken) {
        // 编辑模式
        setFormData({
          accountId: editingToken.accountId,
          name: editingToken.name,
          key: editingToken.key,
          status: editingToken.status.toString(),
          unlimited: editingToken.unlimited,
          remainQuota: editingToken.remainQuota?.toString() || "",
          expiredTime: editingToken.expiredTime
            ? new Date(
                typeof editingToken.expiredTime === "number"
                  ? editingToken.expiredTime
                  : Number(editingToken.expiredTime)
              )
                .toISOString()
                .slice(0, 16)
            : "",
          modelLimitsEnabled: editingToken.modelLimitsEnabled || false,
          modelLimits: editingToken.modelLimits || "",
          allowIps: editingToken.allowIps || "",
          group: editingToken.group || ""
        })
      } else {
        // 添加模式
        setFormData({
          accountId: accountId || "",
          name: "",
          key: "",
          status: "1",
          unlimited: false,
          remainQuota: "",
          expiredTime: "",
          modelLimitsEnabled: false,
          modelLimits: "",
          allowIps: "",
          group: ""
        })
      }
    }
  }, [isOpen, editingToken, accountId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.accountId) {
      toast.error("请选择账号")
      return
    }

    setIsLoading(true)

    try {
      const data: any = {
        name: formData.name.trim(),
        key: formData.key.trim(),
        status: parseInt(formData.status),
        unlimited: formData.unlimited,
        remainQuota: formData.unlimited ? undefined : parseFloat(formData.remainQuota),
        expiredTime: formData.expiredTime
          ? new Date(formData.expiredTime).getTime()
          : undefined,
        modelLimitsEnabled: formData.modelLimitsEnabled,
        modelLimits: formData.modelLimits.trim() || undefined,
        allowIps: formData.allowIps.trim() || undefined,
        group: formData.group.trim() || undefined
      }

      if (editingToken) {
        await api.updateToken(formData.accountId, editingToken.id, data)
        toast.success("Token 更新成功")
      } else {
        await api.createToken(formData.accountId, data)
        toast.success("Token 添加成功")
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
      title={editingToken ? "编辑 Token" : "添加 Token"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "保存中..." : editingToken ? "更新" : "添加"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="accountId">账号 *</Label>
          <Select
            id="accountId"
            value={formData.accountId}
            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
            required
            disabled={!!editingToken}
          >
            <option value="">选择账号</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Token 名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Token"
              required
            />
          </div>

          <div>
            <Label htmlFor="status">状态</Label>
            <Select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="1">启用</option>
              <option value="0">禁用</option>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="key">Token Key *</Label>
          <Input
            id="key"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            placeholder="sk-..."
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="unlimited"
            checked={formData.unlimited}
            onChange={(e) => setFormData({ ...formData, unlimited: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="unlimited" className="cursor-pointer">
            无限制配额
          </Label>
        </div>

        {!formData.unlimited && (
          <div>
            <Label htmlFor="remainQuota">剩余配额</Label>
            <Input
              id="remainQuota"
              type="number"
              value={formData.remainQuota}
              onChange={(e) => setFormData({ ...formData, remainQuota: e.target.value })}
              placeholder="1000000"
            />
          </div>
        )}

        <div>
          <Label htmlFor="expiredTime">过期时间</Label>
          <Input
            id="expiredTime"
            type="datetime-local"
            value={formData.expiredTime}
            onChange={(e) => setFormData({ ...formData, expiredTime: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="group">分组</Label>
          <Input
            id="group"
            value={formData.group}
            onChange={(e) => setFormData({ ...formData, group: e.target.value })}
            placeholder="default"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="modelLimitsEnabled"
            checked={formData.modelLimitsEnabled}
            onChange={(e) =>
              setFormData({ ...formData, modelLimitsEnabled: e.target.checked })
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="modelLimitsEnabled" className="cursor-pointer">
            启用模型限制
          </Label>
        </div>

        {formData.modelLimitsEnabled && (
          <div>
            <Label htmlFor="modelLimits">模型限制（JSON 格式）</Label>
            <textarea
              id="modelLimits"
              value={formData.modelLimits}
              onChange={(e) => setFormData({ ...formData, modelLimits: e.target.value })}
              placeholder='["gpt-4", "gpt-3.5-turbo"]'
              rows={3}
              className="flex w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        )}

        <div>
          <Label htmlFor="allowIps">允许的 IP（逗号分隔）</Label>
          <Input
            id="allowIps"
            value={formData.allowIps}
            onChange={(e) => setFormData({ ...formData, allowIps: e.target.value })}
            placeholder="192.168.1.1, 10.0.0.1"
          />
        </div>
      </form>
    </Dialog>
  )
}

